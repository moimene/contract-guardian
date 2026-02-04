-- ============================================
-- Contract Guardian - Observability & Self-Improvement Schema
-- Version: 1.0.0
-- Date: 2026-01-31
-- ============================================

-- ============================================
-- FASE 2: Pipeline Metrics - Observabilidad
-- ============================================

-- Tabla para tracking de métricas por ejecución
CREATE TABLE IF NOT EXISTS public.pipeline_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.contract_runs(run_id),
    
    -- Timing metrics (milliseconds)
    total_duration_ms INTEGER,
    extraction_duration_ms INTEGER,
    parsing_duration_ms INTEGER,
    review_duration_ms INTEGER,
    aggregation_duration_ms INTEGER,
    
    -- Token usage
    total_tokens_used INTEGER DEFAULT 0,
    tokens_by_agent JSONB DEFAULT '{}',  -- {"router": 100, "paranoid": 500, ...}
    
    -- Clause stats
    total_clauses INTEGER DEFAULT 0,
    clauses_auto_passed INTEGER DEFAULT 0,
    clauses_escalated INTEGER DEFAULT 0,
    clauses_blocked INTEGER DEFAULT 0,
    
    -- RAG stats
    avg_rag_score FLOAT,
    rag_hits_count INTEGER DEFAULT 0,
    rag_misses_count INTEGER DEFAULT 0,
    
    -- Metadata
    workflow_version TEXT DEFAULT 'v3.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_run_id ON public.pipeline_metrics(run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_created_at ON public.pipeline_metrics(created_at DESC);

-- ============================================
-- FASE 3: Agent Failures - Self-Improvement (FMA)
-- ============================================

CREATE TABLE IF NOT EXISTS public.agent_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.contract_runs(run_id),
    clause_instance_id UUID,
    
    -- Failure identification
    agent_name TEXT NOT NULL,
    failure_type TEXT NOT NULL,
    
    -- Context
    original_input TEXT,
    expected_output TEXT,
    actual_output TEXT,
    confidence_score FLOAT,
    
    -- Human feedback
    human_override BOOLEAN DEFAULT FALSE,
    human_correction TEXT,
    corrected_by UUID,
    corrected_at TIMESTAMPTZ,
    
    -- Pattern matching
    keywords_detected TEXT[],
    route_assigned TEXT,
    route_expected TEXT,
    
    -- Analysis
    root_cause TEXT,
    remediation TEXT,
    pattern_frequency INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_failures_agent ON public.agent_failures(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_failures_type ON public.agent_failures(failure_type);
CREATE INDEX IF NOT EXISTS idx_agent_failures_created ON public.agent_failures(created_at DESC);

-- ============================================
-- RPC Functions
-- ============================================

-- Log pipeline metrics
CREATE OR REPLACE FUNCTION public.log_pipeline_metrics(
    p_run_id UUID,
    p_total_duration_ms INTEGER DEFAULT NULL,
    p_extraction_duration_ms INTEGER DEFAULT NULL,
    p_parsing_duration_ms INTEGER DEFAULT NULL,
    p_review_duration_ms INTEGER DEFAULT NULL,
    p_aggregation_duration_ms INTEGER DEFAULT NULL,
    p_total_tokens INTEGER DEFAULT 0,
    p_tokens_by_agent JSONB DEFAULT '{}',
    p_total_clauses INTEGER DEFAULT 0,
    p_clauses_auto_passed INTEGER DEFAULT 0,
    p_clauses_escalated INTEGER DEFAULT 0,
    p_clauses_blocked INTEGER DEFAULT 0,
    p_avg_rag_score FLOAT DEFAULT NULL,
    p_rag_hits INTEGER DEFAULT 0,
    p_rag_misses INTEGER DEFAULT 0,
    p_workflow_version TEXT DEFAULT 'v3.0'
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    v_metrics_id UUID;
BEGIN
    INSERT INTO public.pipeline_metrics (
        run_id, total_duration_ms, extraction_duration_ms, parsing_duration_ms,
        review_duration_ms, aggregation_duration_ms, total_tokens_used,
        tokens_by_agent, total_clauses, clauses_auto_passed,
        clauses_escalated, clauses_blocked, avg_rag_score,
        rag_hits_count, rag_misses_count, workflow_version
    ) VALUES (
        p_run_id, p_total_duration_ms, p_extraction_duration_ms, p_parsing_duration_ms,
        p_review_duration_ms, p_aggregation_duration_ms, p_total_tokens,
        p_tokens_by_agent, p_total_clauses, p_clauses_auto_passed,
        p_clauses_escalated, p_clauses_blocked, p_avg_rag_score,
        p_rag_hits, p_rag_misses, p_workflow_version
    ) RETURNING id INTO v_metrics_id;
    
    RETURN v_metrics_id;
END;
$$;

-- Log agent failure
CREATE OR REPLACE FUNCTION public.log_agent_failure(
    p_run_id UUID,
    p_clause_instance_id UUID,
    p_agent_name TEXT,
    p_failure_type TEXT,
    p_original_input TEXT,
    p_actual_output TEXT,
    p_confidence FLOAT DEFAULT NULL,
    p_keywords TEXT[] DEFAULT NULL,
    p_route_assigned TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    v_failure_id UUID;
BEGIN
    INSERT INTO public.agent_failures (
        run_id, clause_instance_id, agent_name, failure_type,
        original_input, actual_output, confidence_score,
        keywords_detected, route_assigned
    ) VALUES (
        p_run_id, p_clause_instance_id, p_agent_name, p_failure_type,
        p_original_input, p_actual_output, p_confidence,
        p_keywords, p_route_assigned
    ) RETURNING id INTO v_failure_id;
    
    RETURN v_failure_id;
END;
$$;

-- Analyze failure patterns
CREATE OR REPLACE FUNCTION public.analyze_failure_patterns(days_ago INTEGER DEFAULT 30)
RETURNS TABLE (
    agent_name TEXT,
    failure_type TEXT,
    route_assigned TEXT,
    occurrence_count BIGINT,
    suggested_fix TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.agent_name,
        af.failure_type,
        af.route_assigned,
        COUNT(*) as occurrence_count,
        CASE 
            WHEN af.failure_type = 'misclassification' AND COUNT(*) > 5 
                THEN 'Add keywords to router priority tier'
            WHEN af.failure_type = 'low_confidence' AND COUNT(*) > 10 
                THEN 'Expand RAG examples for this category'
            WHEN af.failure_type = 'timeout' AND COUNT(*) > 3 
                THEN 'Optimize agent prompt length'
            ELSE 'Review individual cases'
        END as suggested_fix
    FROM public.agent_failures af
    WHERE af.created_at >= NOW() - (days_ago || ' days')::INTERVAL
    GROUP BY af.agent_name, af.failure_type, af.route_assigned
    HAVING COUNT(*) >= 3
    ORDER BY occurrence_count DESC;
END;
$$;

-- Get pipeline stats
CREATE OR REPLACE FUNCTION public.get_pipeline_stats(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
    avg_total_duration_ms FLOAT,
    avg_tokens_per_clause FLOAT,
    auto_pass_rate FLOAT,
    escalation_rate FLOAT,
    block_rate FLOAT,
    avg_rag_score FLOAT,
    total_runs INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(pm.total_duration_ms)::FLOAT,
        CASE WHEN SUM(pm.total_clauses) > 0 
             THEN SUM(pm.total_tokens_used)::FLOAT / SUM(pm.total_clauses)
             ELSE 0 END,
        CASE WHEN SUM(pm.total_clauses) > 0 
             THEN SUM(pm.clauses_auto_passed)::FLOAT / SUM(pm.total_clauses)
             ELSE 0 END,
        CASE WHEN SUM(pm.total_clauses) > 0 
             THEN SUM(pm.clauses_escalated)::FLOAT / SUM(pm.total_clauses)
             ELSE 0 END,
        CASE WHEN SUM(pm.total_clauses) > 0 
             THEN SUM(pm.clauses_blocked)::FLOAT / SUM(pm.total_clauses)
             ELSE 0 END,
        AVG(pm.avg_rag_score)::FLOAT,
        COUNT(DISTINCT pm.run_id)::INTEGER
    FROM public.pipeline_metrics pm
    WHERE pm.created_at >= NOW() - (days_ago || ' days')::INTERVAL;
END;
$$;

-- ============================================
-- FASE 3: Human Feedback Fields
-- ============================================

-- Add human feedback fields to clause_reviews_internal
ALTER TABLE public.clause_reviews_internal 
    ADD COLUMN IF NOT EXISTS human_override_decision TEXT,
    ADD COLUMN IF NOT EXISTS human_feedback TEXT,
    ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS feedback_submitted_by UUID;

COMMENT ON COLUMN public.clause_reviews_internal.human_override_decision IS 'Decision corrected by human reviewer';
COMMENT ON COLUMN public.clause_reviews_internal.human_feedback IS 'Free-text feedback from human reviewer';
COMMENT ON COLUMN public.clause_reviews_internal.feedback_submitted_at IS 'When feedback was submitted';
COMMENT ON COLUMN public.clause_reviews_internal.feedback_submitted_by IS 'UUID of user who submitted feedback';

-- ============================================
-- Views
-- ============================================

-- View for clauses pending human review
CREATE OR REPLACE VIEW public.pending_human_review AS
SELECT 
    cri.id,
    cri.run_id,
    cri.clause_instance_id,
    cri.detected_family,
    cri.final_status,
    cri.decision,
    cri.escalation_reason,
    cri.confidence_overall,
    cri.anchor_confidence,
    cri.created_at,
    cr.document_id,
    cr.status as run_status
FROM public.clause_reviews_internal cri
LEFT JOIN public.contract_runs cr ON cr.run_id = cri.run_id
WHERE cri.escalation_recommended = TRUE
  AND cri.human_override_decision IS NULL
ORDER BY cri.created_at DESC;

COMMENT ON VIEW public.pending_human_review IS 'Clauses awaiting human review (escalated but not yet resolved)';

-- View for failure dashboard
CREATE OR REPLACE VIEW public.failure_dashboard AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    agent_name,
    failure_type,
    COUNT(*) as failure_count,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN human_override THEN 1 END) as resolved_count
FROM public.agent_failures
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), agent_name, failure_type
ORDER BY date DESC, failure_count DESC;

COMMENT ON VIEW public.failure_dashboard IS 'Daily aggregation of agent failures for dashboarding';

-- ============================================
-- RLS Policies (Optional - enable as needed)
-- ============================================

-- ALTER TABLE public.pipeline_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agent_failures ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Service role full access to pipeline_metrics" ON public.pipeline_metrics
--     FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role full access to agent_failures" ON public.agent_failures
--     FOR ALL USING (auth.role() = 'service_role');
