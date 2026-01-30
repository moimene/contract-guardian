-- ============================================================
-- Migration 020: RPC Functions for PolicySpec Retrieval
-- Contract Guardian - Context Retriever Support
-- ============================================================
-- These functions support the n8n Context Retriever node by providing
-- efficient access to PolicySpecs and VariationSet data.

-- ============================================================
-- FUNCTION: search_policy_examples
-- Used by RAG to find similar examples in VariationSet
-- ============================================================
CREATE OR REPLACE FUNCTION search_policy_examples(
    query_embedding VECTOR(1536),
    p_policy_spec_id UUID DEFAULT NULL,
    p_playbook_id TEXT DEFAULT NULL,
    p_clause_family TEXT DEFAULT NULL,
    p_categories TEXT[] DEFAULT ARRAY['STANDARD', 'ACCEPTABLE', 'UNACCEPTABLE', 'NOT_COVERED'],
    p_limit INTEGER DEFAULT 10,
    p_similarity_threshold NUMERIC DEFAULT 0.70
)
RETURNS TABLE (
    id UUID,
    policy_spec_id UUID,
    category TEXT,
    text TEXT,
    metadata JSONB,
    similarity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.id,
        vs.policy_spec_id,
        vs.category::TEXT,
        vs.text,
        vs.metadata,
        (1 - (vs.embedding <=> query_embedding))::NUMERIC as similarity
    FROM variation_set vs
    JOIN policy_specs ps ON vs.policy_spec_id = ps.id
    WHERE vs.is_active = true
      AND ps.is_active = true
      AND vs.embedding IS NOT NULL
      AND (p_policy_spec_id IS NULL OR vs.policy_spec_id = p_policy_spec_id)
      AND (p_playbook_id IS NULL OR ps.playbook_id = p_playbook_id)
      AND (p_clause_family IS NULL OR ps.clause_family = p_clause_family)
      AND vs.category::TEXT = ANY(p_categories)
      AND (1 - (vs.embedding <=> query_embedding)) >= p_similarity_threshold
    ORDER BY vs.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_context_for_clause
-- Main function called by n8n Context Retriever
-- Returns PolicySpec + VariationSet in a single call
-- ============================================================
CREATE OR REPLACE FUNCTION get_context_for_clause(
    p_playbook_id TEXT,
    p_clause_family TEXT,
    p_clause_embedding VECTOR(1536) DEFAULT NULL,
    p_examples_limit INTEGER DEFAULT 6
)
RETURNS JSON AS $$
DECLARE
    v_policy_spec RECORD;
    v_variations JSONB;
    v_similar_examples JSONB;
    v_result JSON;
BEGIN
    -- 1. Get PolicySpec for this family
    SELECT * INTO v_policy_spec
    FROM policy_specs
    WHERE playbook_id = p_playbook_id
      AND clause_family = p_clause_family
      AND is_active = true
    LIMIT 1;
    
    -- If no PolicySpec found, return null (NotCoveredByPlaybook)
    IF v_policy_spec IS NULL THEN
        RETURN json_build_object(
            'has_policy_spec', false,
            'clause_family', p_clause_family,
            'skip_to_decisor', true,
            'final_status', 'NotCoveredByPlaybook',
            'escalation_reason', 'NOT_COVERED_BY_PLAYBOOK'
        );
    END IF;
    
    -- 2. Get VariationSet grouped by category
    SELECT jsonb_object_agg(
        category,
        examples
    ) INTO v_variations
    FROM (
        SELECT 
            category::TEXT,
            jsonb_agg(
                jsonb_build_object(
                    'text', text,
                    'metadata', metadata
                )
            ) as examples
        FROM variation_set
        WHERE policy_spec_id = v_policy_spec.id
          AND is_active = true
        GROUP BY category
    ) sub;
    
    -- 3. If embedding provided, get similar examples
    IF p_clause_embedding IS NOT NULL THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'text', text,
                'category', category,
                'similarity', similarity,
                'metadata', metadata
            )
        ) INTO v_similar_examples
        FROM (
            SELECT 
                vs.text,
                vs.category::TEXT,
                (1 - (vs.embedding <=> p_clause_embedding))::NUMERIC(4,3) as similarity,
                vs.metadata
            FROM variation_set vs
            WHERE vs.policy_spec_id = v_policy_spec.id
              AND vs.is_active = true
              AND vs.embedding IS NOT NULL
            ORDER BY vs.embedding <=> p_clause_embedding
            LIMIT p_examples_limit
        ) ranked;
    ELSE
        v_similar_examples := '[]'::jsonb;
    END IF;
    
    -- 4. Build complete context object
    v_result := json_build_object(
        'has_policy_spec', true,
        'policy_spec', json_build_object(
            'id', v_policy_spec.id,
            'rule_id', v_policy_spec.rule_id,
            'clause_family', v_policy_spec.clause_family,
            'required', v_policy_spec.required,
            'analysis_mode', v_policy_spec.analysis_mode,
            'standard_position', v_policy_spec.standard_position,
            'acceptable_variations', v_policy_spec.acceptable_variations,
            'unacceptable_variations', v_policy_spec.unacceptable_variations,
            'guidance_internal', v_policy_spec.guidance_internal,
            'anchors', v_policy_spec.anchors,
            'routing_policy', v_policy_spec.routing_policy,
            'decision_policy', v_policy_spec.decision_policy,
            'retrieval_profile', v_policy_spec.retrieval_profile
        ),
        'variations_by_category', COALESCE(v_variations, '{}'::jsonb),
        'similar_examples', COALESCE(v_similar_examples, '[]'::jsonb)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_router_candidates
-- Returns all possible families for a playbook (for Router Agent)
-- ============================================================
CREATE OR REPLACE FUNCTION get_router_candidates(
    p_playbook_id TEXT
)
RETURNS JSON AS $$
DECLARE
    v_families JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'clause_family', clause_family,
            'rule_id', rule_id,
            'required', required,
            'analysis_mode', analysis_mode,
            'anchors', anchors
        )
    ) INTO v_families
    FROM policy_specs
    WHERE playbook_id = p_playbook_id
      AND is_active = true
    ORDER BY required DESC, clause_family;
    
    RETURN COALESCE(v_families, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: save_clause_review_internal
-- Persists the internal clause review (called after Decisor)
-- ============================================================
CREATE OR REPLACE FUNCTION save_clause_review_internal(
    p_run_id UUID,
    p_clause_instance_id TEXT,
    p_detected_family TEXT,
    p_rule_id TEXT,
    p_analysis_mode TEXT,
    p_observations JSONB,
    p_final_status TEXT,
    p_proposed_changes JSONB,
    p_anchor_confidence NUMERIC,
    p_confidence_overall NUMERIC,
    p_decision TEXT,
    p_escalation_recommended BOOLEAN,
    p_escalation_reason TEXT,
    p_block_export BOOLEAN,
    p_validation_passed BOOLEAN,
    p_validation_errors JSONB,
    p_processing_time_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO clause_reviews_internal (
        run_id, clause_instance_id, detected_family, rule_id, analysis_mode,
        observations, observations_count, final_status, proposed_changes,
        anchor_confidence, confidence_overall, decision, escalation_recommended,
        escalation_reason, block_export, validation_passed, validation_errors,
        processing_time_ms
    ) VALUES (
        p_run_id, p_clause_instance_id, p_detected_family, p_rule_id, p_analysis_mode,
        p_observations, COALESCE(jsonb_array_length(p_observations), 0),
        p_final_status, p_proposed_changes, p_anchor_confidence, p_confidence_overall,
        p_decision, p_escalation_recommended, p_escalation_reason, p_block_export,
        p_validation_passed, p_validation_errors, p_processing_time_ms
    )
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: save_sanitizer_output
-- Persists the sanitized output (called after LeakageGuard)
-- ============================================================
CREATE OR REPLACE FUNCTION save_sanitizer_output(
    p_clause_review_id UUID,
    p_run_id UUID,
    p_clause_instance_id TEXT,
    p_client_summary_line TEXT,
    p_client_comment TEXT,
    p_client_status TEXT,
    p_proposed_changes_client JSONB,
    p_safety_pass BOOLEAN,
    p_blocked_terms_detected JSONB,
    p_leak_score NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_output_id UUID;
BEGIN
    INSERT INTO sanitizer_outputs (
        clause_review_id, run_id, clause_instance_id,
        client_summary_line, client_comment, client_status,
        proposed_changes_client, safety_pass, blocked_terms_detected, leak_score
    ) VALUES (
        p_clause_review_id, p_run_id, p_clause_instance_id,
        p_client_summary_line, p_client_comment, p_client_status,
        p_proposed_changes_client, p_safety_pass, p_blocked_terms_detected, p_leak_score
    )
    RETURNING id INTO v_output_id;
    
    RETURN v_output_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_blocklist
-- Returns active blocklist terms for LeakageGuard
-- ============================================================
CREATE OR REPLACE FUNCTION get_blocklist()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT term
        FROM blocklist_terms
        WHERE is_active = true
        ORDER BY severity DESC, term
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_system_config_value
-- Returns a specific config value
-- ============================================================
CREATE OR REPLACE FUNCTION get_system_config_value(
    p_key TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT value INTO v_value
    FROM system_config
    WHERE key = p_key;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_run_statistics
-- Returns statistics for a contract run (for Contract Decisor)
-- ============================================================
CREATE OR REPLACE FUNCTION get_run_statistics(
    p_run_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_clauses,
        COUNT(*) FILTER (WHERE decision = 'AUTO_PASS') as clauses_passed,
        COUNT(*) FILTER (WHERE decision = 'AUTO_REDLINEDRAFT') as clauses_redline,
        COUNT(*) FILTER (WHERE decision = 'ESCALATE_HUMAN') as clauses_escalated,
        COUNT(*) FILTER (WHERE decision = 'BLOCK_EXPORT') as clauses_blocked,
        COUNT(*) FILTER (WHERE block_export = true) as clauses_blocking_export,
        COUNT(*) FILTER (WHERE final_status = 'NotCoveredByPlaybook') as clauses_not_covered,
        COUNT(*) FILTER (WHERE final_status = 'Ambiguous') as clauses_ambiguous,
        AVG(anchor_confidence) as avg_anchor_confidence,
        AVG(confidence_overall) as avg_confidence_overall,
        SUM(processing_time_ms) as total_processing_time_ms
    INTO v_stats
    FROM clause_reviews_internal
    WHERE run_id = p_run_id;
    
    RETURN json_build_object(
        'run_id', p_run_id,
        'total_clauses', COALESCE(v_stats.total_clauses, 0),
        'clauses_passed', COALESCE(v_stats.clauses_passed, 0),
        'clauses_redline', COALESCE(v_stats.clauses_redline, 0),
        'clauses_escalated', COALESCE(v_stats.clauses_escalated, 0),
        'clauses_blocked', COALESCE(v_stats.clauses_blocked, 0),
        'clauses_blocking_export', COALESCE(v_stats.clauses_blocking_export, 0),
        'clauses_not_covered', COALESCE(v_stats.clauses_not_covered, 0),
        'clauses_ambiguous', COALESCE(v_stats.clauses_ambiguous, 0),
        'avg_anchor_confidence', COALESCE(v_stats.avg_anchor_confidence, 0),
        'avg_confidence_overall', COALESCE(v_stats.avg_confidence_overall, 0),
        'total_processing_time_ms', COALESCE(v_stats.total_processing_time_ms, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: calculate_contract_decision
-- Determines final contract decision based on clause outcomes
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_contract_decision(
    p_run_id UUID,
    p_playbook_id TEXT
)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
    v_completeness RECORD;
    v_leakage_rate NUMERIC;
    v_decision TEXT;
    v_block_reasons JSONB := '[]'::jsonb;
    v_escalation_reasons JSONB := '[]'::jsonb;
BEGIN
    -- Get run statistics
    v_stats := get_run_statistics(p_run_id);
    
    -- Check completeness
    SELECT * INTO v_completeness
    FROM check_completeness(p_run_id, p_playbook_id);
    
    -- Check leakage rate
    v_leakage_rate := calculate_leakage_rate(p_run_id);
    
    -- Decision logic
    -- Priority 1: Any blocked clause → BLOCK_EXPORT
    IF (v_stats->>'clauses_blocked')::INTEGER > 0 THEN
        v_decision := 'BLOCK_EXPORT';
        v_block_reasons := v_block_reasons || jsonb_build_array('CLAUSE_BLOCKED');
    
    -- Priority 2: Leakage detected → BLOCK_EXPORT
    ELSIF v_leakage_rate > 0 THEN
        v_decision := 'BLOCK_EXPORT';
        v_block_reasons := v_block_reasons || jsonb_build_array('LEAKAGE_DETECTED');
    
    -- Priority 3: Missing required clauses → ESCALATE
    ELSIF NOT v_completeness.is_complete THEN
        v_decision := 'ESCALATE_HUMAN';
        v_escalation_reasons := v_escalation_reasons || jsonb_build_array(
            jsonb_build_object('reason', 'MISSING_REQUIRED_CLAUSE', 'missing', v_completeness.missing_families)
        );
    
    -- Priority 4: Any escalated clause → ESCALATE
    ELSIF (v_stats->>'clauses_escalated')::INTEGER > 0 THEN
        v_decision := 'ESCALATE_HUMAN';
        v_escalation_reasons := v_escalation_reasons || jsonb_build_array('CLAUSES_NEED_REVIEW');
    
    -- Priority 5: Any redline needed → AUTO_REDLINEDRAFT
    ELSIF (v_stats->>'clauses_redline')::INTEGER > 0 THEN
        v_decision := 'AUTO_REDLINEDRAFT';
    
    -- All passed → READY_FOR_EXPORT
    ELSE
        v_decision := 'READY_FOR_EXPORT';
    END IF;
    
    RETURN json_build_object(
        'run_id', p_run_id,
        'decision', v_decision,
        'statistics', v_stats,
        'completeness', json_build_object(
            'is_complete', v_completeness.is_complete,
            'missing_families', v_completeness.missing_families,
            'missing_count', v_completeness.missing_count
        ),
        'leakage_rate', v_leakage_rate,
        'block_reasons', v_block_reasons,
        'escalation_reasons', v_escalation_reasons
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANTS (for REST API access via PostgREST)
-- ============================================================
GRANT EXECUTE ON FUNCTION search_policy_examples TO service_role;
GRANT EXECUTE ON FUNCTION get_context_for_clause TO service_role;
GRANT EXECUTE ON FUNCTION get_router_candidates TO service_role;
GRANT EXECUTE ON FUNCTION save_clause_review_internal TO service_role;
GRANT EXECUTE ON FUNCTION save_sanitizer_output TO service_role;
GRANT EXECUTE ON FUNCTION get_blocklist TO service_role;
GRANT EXECUTE ON FUNCTION get_system_config_value TO service_role;
GRANT EXECUTE ON FUNCTION get_run_statistics TO service_role;
GRANT EXECUTE ON FUNCTION calculate_contract_decision TO service_role;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
