-- ============================================================
-- Migration 018: PRD v2.0 Critical Gaps - PolicySpec Governance
-- Contract Guardian - Legal Team Review Implementation
-- ============================================================
-- This migration addresses the critical gaps identified in PRDreviewlegalteam.md:
-- 1. PolicySpec governance structure (P0)
-- 2. VariationSet with categories (P0)
-- 3. Internal/Client table separation (P0)
-- 4. Blocklist enhancement (P1)
-- 5. System configuration (P1)

-- ============================================================
-- PART 1: ENUMS (if not exist)
-- ============================================================

DO $$ 
BEGIN
    -- Analysis mode enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_mode') THEN
        CREATE TYPE analysis_mode AS ENUM (
            'MODE_STRICT_NO_DEVIATIONS',
            'MODE_ENUMERATED_DEVIATIONS',
            'MODE_POLICY_JUDGMENT_REQUIRED'
        );
    END IF;

    -- Routing policy type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routing_policy_type') THEN
        CREATE TYPE routing_policy_type AS ENUM (
            'AUTO_ACCEPT',
            'ESCALATE',
            'ESCALATE_IF_CHANGE',
            'ESCALATE_IF_UNACCEPTABLE',
            'NONE'
        );
    END IF;

    -- Final status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'final_status_enum') THEN
        CREATE TYPE final_status_enum AS ENUM (
            'Compliant',
            'AcceptableDeviation',
            'UnacceptableDeviation',
            'NotCoveredByPlaybook',
            'Ambiguous'
        );
    END IF;

    -- Clause decision enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clause_decision_enum') THEN
        CREATE TYPE clause_decision_enum AS ENUM (
            'AUTO_PASS',
            'AUTO_REDLINEDRAFT',
            'ESCALATE_HUMAN',
            'BLOCK_EXPORT',
            'LOG_ONLY'
        );
    END IF;

    -- Escalation reason enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_reason_enum') THEN
        CREATE TYPE escalation_reason_enum AS ENUM (
            'WITH_LEGAL_APPROVAL_REQUIRED',
            'NOT_COVERED_BY_PLAYBOOK',
            'AMBIGUOUS_POLICY_JUDGMENT',
            'UNACCEPTABLE_DEVIATION_STRICT',
            'LOW_CONFIDENCE_ANCHOR',
            'LOW_CONFIDENCE_OVERALL',
            'MISSING_REQUIRED_CLAUSE',
            'VALIDATION_ERROR',
            'LEAKAGE_DETECTED'
        );
    END IF;

    -- Variation category enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variation_category') THEN
        CREATE TYPE variation_category AS ENUM (
            'STANDARD',
            'ACCEPTABLE',
            'UNACCEPTABLE',
            'NOT_COVERED'
        );
    END IF;

    -- Variation origin enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variation_origin') THEN
        CREATE TYPE variation_origin AS ENUM (
            'synthetic',
            'real_validated',
            'manual'
        );
    END IF;

    -- Client status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status_enum') THEN
        CREATE TYPE client_status_enum AS ENUM (
            'ok',
            'adjustment',
            'change_required',
            'review',
            'blocked'
        );
    END IF;
END $$;

-- ============================================================
-- PART 2: POLICY_SPECS TABLE (Core PolicySpec Governance)
-- ============================================================

CREATE TABLE IF NOT EXISTS policy_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Playbook reference (links to existing playbooks if exists, or use text)
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL DEFAULT '1.0',
    
    -- Rule identification
    rule_id TEXT NOT NULL UNIQUE,  -- e.g., 'PB:v2026-01:Indemnity-ProdCo-Core'
    clause_family TEXT NOT NULL,    -- e.g., 'IndemnityProdCo'
    
    -- Governance flags
    required BOOLEAN DEFAULT true,
    analysis_mode analysis_mode NOT NULL DEFAULT 'MODE_ENUMERATED_DEVIATIONS',
    
    -- Standard positions (INTERNAL ONLY - NEVER EXPOSE TO CLIENT)
    standard_position JSONB NOT NULL,           -- Array of canonical texts
    acceptable_variations JSONB DEFAULT '[]',   -- Array of allowed fallbacks
    unacceptable_variations JSONB DEFAULT '[]', -- Array of prohibited patterns
    
    -- Internal guidance (NEVER EXPOSE)
    guidance_internal TEXT,
    
    -- Retrieval configuration
    retrieval_profile JSONB DEFAULT '{
        "vector_top_k": 3,
        "coverage_threshold": 0.78,
        "examples_top_k": 6
    }',
    
    -- Routing policy (per-family configuration)
    routing_policy JSONB DEFAULT '{
        "type": "ESCALATE_IF_UNACCEPTABLE",
        "target_group": "LegalTeam",
        "block_export": true
    }',
    
    -- Decision policy (thresholds per-family)
    decision_policy JSONB DEFAULT '{
        "auto_redline_if_unacceptable": true,
        "anchor_conf_threshold": 0.85,
        "escalate_if_ambiguous": true,
        "block_export_if_escalated": true
    }',
    
    -- Model configuration per family
    models JSONB DEFAULT '{
        "paranoid": "gpt-4o",
        "valuator": "gpt-4o-mini",
        "sanitizer": "gpt-4o-mini"
    }',
    
    -- Semantic anchors for detection
    anchors JSONB DEFAULT '[]',
    
    -- GraphRAG dependencies
    definitions_scope JSONB DEFAULT '{
        "defined_terms": [],
        "cross_refs": []
    }',
    
    -- Family-specific extensions
    family_extensions JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for PolicySpec
CREATE INDEX IF NOT EXISTS idx_policy_specs_playbook ON policy_specs(playbook_id, playbook_version);
CREATE INDEX IF NOT EXISTS idx_policy_specs_family ON policy_specs(clause_family);
CREATE INDEX IF NOT EXISTS idx_policy_specs_active ON policy_specs(is_active) WHERE is_active = true;

-- ============================================================
-- PART 3: VARIATION_SET TABLE (Examples for RAG)
-- ============================================================

CREATE TABLE IF NOT EXISTS variation_set (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_spec_id UUID NOT NULL REFERENCES policy_specs(id) ON DELETE CASCADE,
    
    -- Category classification
    category variation_category NOT NULL,
    
    -- Content
    text TEXT NOT NULL,
    text_normalized TEXT,  -- For matching operations
    
    -- Source tracking
    origin variation_origin NOT NULL DEFAULT 'synthetic',
    
    -- Metadata (e.g., deviation type, approval info)
    metadata JSONB DEFAULT '{}',
    
    -- Vector embedding for semantic search
    embedding VECTOR(1536),
    
    -- Governance
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Indexes for VariationSet
CREATE INDEX IF NOT EXISTS idx_variation_set_policy ON variation_set(policy_spec_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_variation_set_embedding ON variation_set 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- PART 4: CLAUSE_REVIEWS_INTERNAL TABLE (Never expose to client)
-- ============================================================

CREATE TABLE IF NOT EXISTS clause_reviews_internal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    clause_instance_id TEXT NOT NULL,  -- References clause from document
    
    -- Classification results
    detected_family TEXT NOT NULL,
    rule_id TEXT,  -- Can be null if NotCovered
    rule_version TEXT,
    analysis_mode TEXT,
    
    -- Router output
    router_candidates JSONB,      -- [{rule_id, score}]
    coverage_confidence NUMERIC(4,3),
    
    -- Paranoid output (INTERNAL)
    observations JSONB,           -- Full array of observations
    observations_count INTEGER DEFAULT 0,
    
    -- Valuator output
    final_status TEXT NOT NULL,
    proposed_changes JSONB DEFAULT '[]',  -- WITH source_reference (internal)
    
    -- Confidence metrics
    anchor_confidence NUMERIC(4,3),
    confidence_overall NUMERIC(4,3),
    
    -- Decision
    decision TEXT NOT NULL,  -- clause_decision_enum value
    escalation_recommended BOOLEAN DEFAULT false,
    escalation_reason TEXT,  -- escalation_reason_enum value
    block_export BOOLEAN DEFAULT false,
    
    -- Dependencies (GraphRAG)
    dependencies JSONB DEFAULT '[]',
    
    -- Validation results
    validation_passed BOOLEAN,
    validation_errors JSONB,
    
    -- Evidence (for audit)
    evidence_spans JSONB,
    
    -- Performance tracking
    processing_time_ms INTEGER,
    token_usage JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for clause_reviews_internal
CREATE INDEX IF NOT EXISTS idx_reviews_internal_run ON clause_reviews_internal(run_id);
CREATE INDEX IF NOT EXISTS idx_reviews_internal_status ON clause_reviews_internal(run_id, final_status);
CREATE INDEX IF NOT EXISTS idx_reviews_internal_family ON clause_reviews_internal(detected_family);
CREATE INDEX IF NOT EXISTS idx_reviews_internal_escalated ON clause_reviews_internal(run_id) 
    WHERE escalation_recommended = true;

-- ============================================================
-- PART 5: SANITIZER_OUTPUTS TABLE (Client-facing only)
-- ============================================================

CREATE TABLE IF NOT EXISTS sanitizer_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_review_id UUID NOT NULL REFERENCES clause_reviews_internal(id) ON DELETE CASCADE,
    run_id UUID NOT NULL,
    clause_instance_id TEXT NOT NULL,
    
    -- Client-facing output
    client_summary_line TEXT,  -- One-line summary for list view
    client_comment TEXT,       -- Comment for DOCX (1-3 sentences)
    
    -- Status for UI semaphore
    client_status TEXT NOT NULL DEFAULT 'ok',  -- client_status_enum value
    
    -- Proposed changes (WITHOUT source_reference)
    proposed_changes_client JSONB DEFAULT '[]',
    
    -- Safety checks
    safety_pass BOOLEAN NOT NULL DEFAULT true,
    blocked_terms_detected JSONB DEFAULT '[]',
    leak_score NUMERIC(4,3) DEFAULT 0,
    policy_leak_flags JSONB DEFAULT '[]',
    redactions JSONB DEFAULT '[]',
    
    -- Locale
    locale TEXT DEFAULT 'es-ES',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sanitizer_outputs
CREATE INDEX IF NOT EXISTS idx_sanitizer_run ON sanitizer_outputs(run_id);
CREATE INDEX IF NOT EXISTS idx_sanitizer_safety ON sanitizer_outputs(run_id) WHERE safety_pass = false;

-- ============================================================
-- PART 6: BLOCKLIST_TERMS TABLE (Enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS blocklist_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL UNIQUE,
    category TEXT,  -- 'rule_name', 'technical', 'team', 'classification', 'internal'
    is_regex BOOLEAN DEFAULT false,
    severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default blocklist terms
INSERT INTO blocklist_terms (term, category, severity) VALUES
    ('playbook', 'technical', 'high'),
    ('policy', 'technical', 'high'),
    ('policyspec', 'technical', 'critical'),
    ('rule_id', 'technical', 'critical'),
    ('rulename', 'technical', 'critical'),
    ('standard_position', 'technical', 'critical'),
    ('aceptable', 'classification', 'high'),
    ('inaceptable', 'classification', 'high'),
    ('acceptable', 'classification', 'high'),
    ('unacceptable', 'classification', 'high'),
    ('threshold', 'technical', 'high'),
    ('confidence', 'technical', 'high'),
    ('anchor_conf', 'technical', 'critical'),
    ('anchor_confidence', 'technical', 'critical'),
    ('coverage', 'technical', 'high'),
    ('escalate', 'technical', 'high'),
    ('escalation', 'technical', 'high'),
    ('routing', 'technical', 'high'),
    ('gating', 'technical', 'high'),
    ('policyowner', 'team', 'critical'),
    ('amazonlegal', 'team', 'critical'),
    ('legal team', 'team', 'high'),
    ('despacho', 'team', 'high'),
    ('internal guidance', 'internal', 'critical'),
    ('guidance_internal', 'internal', 'critical')
ON CONFLICT (term) DO NOTHING;

-- ============================================================
-- PART 7: SYSTEM_CONFIG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
    ('TH_ANCHOR', '0.85', 'Minimum anchor confidence threshold for auto-redline'),
    ('TH_CONF_OVERALL', '0.80', 'Minimum overall confidence threshold for auto-pass'),
    ('TH_COVERAGE', '0.78', 'Minimum coverage confidence threshold for routing'),
    ('MAX_RETRIES', '3', 'Maximum retries for n8n webhook calls'),
    ('RETRY_DELAYS_MS', '[5000, 15000, 30000]', 'Delays between retries in milliseconds'),
    ('CONCURRENCY_PER_CONTRACT', '5', 'Maximum clauses processed in parallel per contract'),
    ('TIMEOUT_ROUTER_MS', '30000', 'Timeout for Router Agent'),
    ('TIMEOUT_PARANOID_MS', '60000', 'Timeout for Paranoid Agent'),
    ('TIMEOUT_VALUATOR_MS', '60000', 'Timeout for Valuator Agent'),
    ('TIMEOUT_SANITIZER_MS', '30000', 'Timeout for Sanitizer Agent'),
    ('MAX_CLAUSE_LENGTH', '50000', 'Maximum characters per clause'),
    ('MAX_CLAUSES_PER_DOC', '100', 'Maximum clauses per document'),
    ('LEAKAGE_THRESHOLD', '0.0', 'Maximum allowed leak_score (0 = zero tolerance)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PART 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE policy_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_reviews_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanitizer_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocklist_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access for n8n/backend)
CREATE POLICY "Service role full access policy_specs" ON policy_specs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access variation_set" ON variation_set
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access clause_reviews_internal" ON clause_reviews_internal
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sanitizer_outputs" ON sanitizer_outputs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access blocklist_terms" ON blocklist_terms
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access system_config" ON system_config
    FOR ALL USING (auth.role() = 'service_role');

-- CRITICAL: Client users can ONLY see sanitizer_outputs with safety_pass = true
-- They can NEVER access clause_reviews_internal, policy_specs, or variation_set

-- Authenticated users can read active blocklist (for display purposes only)
CREATE POLICY "Authenticated read blocklist" ON blocklist_terms
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Anon can read config (non-sensitive)
CREATE POLICY "Anon read config" ON system_config
    FOR SELECT USING (auth.role() = 'anon');

-- ============================================================
-- PART 9: HELPER FUNCTIONS
-- ============================================================

-- Function to retrieve PolicySpec by family
CREATE OR REPLACE FUNCTION get_policy_spec_for_family(
    p_playbook_id TEXT,
    p_clause_family TEXT
)
RETURNS SETOF policy_specs AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM policy_specs
    WHERE playbook_id = p_playbook_id
      AND clause_family = p_clause_family
      AND is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get VariationSet for a PolicySpec
CREATE OR REPLACE FUNCTION get_variations_for_policy(
    p_policy_spec_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    category variation_category,
    text TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT vs.category, vs.text, vs.metadata
    FROM variation_set vs
    WHERE vs.policy_spec_id = p_policy_spec_id
      AND vs.is_active = true
    ORDER BY vs.category
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check completeness for a run
CREATE OR REPLACE FUNCTION check_completeness(
    p_run_id UUID,
    p_playbook_id TEXT
)
RETURNS TABLE (
    is_complete BOOLEAN,
    missing_families TEXT[],
    missing_count INTEGER
) AS $$
DECLARE
    required_families TEXT[];
    covered_families TEXT[];
    missing_f TEXT[];
BEGIN
    -- Get required families from playbook
    SELECT ARRAY_AGG(DISTINCT clause_family) INTO required_families
    FROM policy_specs
    WHERE playbook_id = p_playbook_id 
      AND required = true 
      AND is_active = true;
    
    -- Get covered families from this run
    SELECT ARRAY_AGG(DISTINCT detected_family) INTO covered_families
    FROM clause_reviews_internal
    WHERE run_id = p_run_id 
      AND final_status != 'NotCoveredByPlaybook';
    
    -- Calculate missing
    SELECT ARRAY_AGG(f) INTO missing_f
    FROM UNNEST(required_families) f
    WHERE f != ALL(COALESCE(covered_families, ARRAY[]::TEXT[]));
    
    RETURN QUERY SELECT 
        (missing_f IS NULL OR ARRAY_LENGTH(missing_f, 1) IS NULL),
        COALESCE(missing_f, ARRAY[]::TEXT[]),
        COALESCE(ARRAY_LENGTH(missing_f, 1), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate leakage rate for a run
CREATE OR REPLACE FUNCTION calculate_leakage_rate(p_run_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_outputs INTEGER;
    leaked_outputs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_outputs
    FROM sanitizer_outputs WHERE run_id = p_run_id;
    
    IF total_outputs = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO leaked_outputs
    FROM sanitizer_outputs 
    WHERE run_id = p_run_id AND safety_pass = false;
    
    RETURN (leaked_outputs::NUMERIC / total_outputs) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 10: TRIGGERS
-- ============================================================

-- Updated_at trigger for policy_specs
CREATE OR REPLACE FUNCTION update_policy_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_policy_specs_timestamp ON policy_specs;
CREATE TRIGGER update_policy_specs_timestamp
    BEFORE UPDATE ON policy_specs
    FOR EACH ROW EXECUTE FUNCTION update_policy_specs_updated_at();

-- Updated_at trigger for clause_reviews_internal
DROP TRIGGER IF EXISTS update_reviews_internal_timestamp ON clause_reviews_internal;
CREATE TRIGGER update_reviews_internal_timestamp
    BEFORE UPDATE ON clause_reviews_internal
    FOR EACH ROW EXECUTE FUNCTION update_policy_specs_updated_at();

-- ============================================================
-- PART 11: CLIENT-FACING VIEW (Safe to expose)
-- ============================================================

CREATE OR REPLACE VIEW client_clause_reviews AS
SELECT 
    so.id,
    so.run_id,
    so.clause_instance_id,
    cri.detected_family,
    so.client_status,
    so.client_summary_line,
    so.client_comment,
    so.proposed_changes_client,
    so.created_at
FROM sanitizer_outputs so
JOIN clause_reviews_internal cri ON so.clause_review_id = cri.id
WHERE so.safety_pass = true;

-- Grant read access to authenticated users on the view
GRANT SELECT ON client_clause_reviews TO authenticated;

-- ============================================================
-- PART 12: COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE policy_specs IS 'PolicySpec governance - INTERNAL ONLY. Contains standard positions, thresholds, and routing policies per clause family.';
COMMENT ON TABLE variation_set IS 'Training examples for RAG - INTERNAL ONLY. Categorized as STANDARD/ACCEPTABLE/UNACCEPTABLE/NOT_COVERED.';
COMMENT ON TABLE clause_reviews_internal IS 'Full audit trail of clause reviews - INTERNAL ONLY. Contains all agent outputs, validations, and internal reasoning.';
COMMENT ON TABLE sanitizer_outputs IS 'Client-facing review outputs only. Sanitized comments without internal references.';
COMMENT ON TABLE blocklist_terms IS 'Terms that must never appear in client-facing outputs.';
COMMENT ON TABLE system_config IS 'Global system configuration and thresholds.';
COMMENT ON VIEW client_clause_reviews IS 'Safe view for client consumption. Only shows reviews that passed safety checks.';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
