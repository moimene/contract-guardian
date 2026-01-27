-- Amazon Redliner V2 - Database Schema Extension
-- Run this in Supabase SQL Editor to extend clause_reviews with full traceability

-- ============================================================
-- Extend clause_reviews table
-- ============================================================

-- Rule and policy governance
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS rule_id TEXT;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS clause_family TEXT;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS analysis_mode TEXT;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT false;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS routing_policy JSONB;

-- Enhanced status and decision
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS final_status TEXT;
-- decision column already exists, but ensure it can hold new values

-- Observations and evidence
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS observations JSONB;

-- Confidences
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS anchor_confidence NUMERIC;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS confidence_overall NUMERIC;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS coverage_confidence NUMERIC;

-- Escalation tracking
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS escalation_recommended BOOLEAN DEFAULT false;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS block_export BOOLEAN DEFAULT false;

-- Validator results
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS validator_pass BOOLEAN DEFAULT true;
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS validator_violations JSONB DEFAULT '[]';

-- Sanitizer safety details
ALTER TABLE public.clause_reviews ADD COLUMN IF NOT EXISTS safety_details JSONB;

-- ============================================================
-- Create audit_events table for step-by-step traceability
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL,
    document_id TEXT,
    clause_instance_id TEXT NOT NULL,
    step TEXT NOT NULL CHECK (step IN ('router', 'context_retriever', 'paranoid', 'valuator', 'validator', 'decisor', 'sanitizer', 'persist')),
    action TEXT NOT NULL,
    payload JSONB NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'agent' CHECK (actor_type IN ('system', 'agent', 'human', 'validator')),
    actor_id TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_events_run_id ON public.audit_events(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_clause_instance_id ON public.audit_events(clause_instance_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_step ON public.audit_events(step);

-- RLS for audit_events
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.audit_events 
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Create playbook_rules table for PolicySpec storage
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playbook_rules (
    rule_id TEXT PRIMARY KEY,
    clause_family TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    required BOOLEAN DEFAULT false,
    analysis_mode TEXT NOT NULL CHECK (analysis_mode IN (
        'MODE_STRICT_NO_DEVIATIONS',
        'MODE_ENUMERATED_DEVIATIONS',
        'MODE_POLICY_JUDGMENT_REQUIRED'
    )),
    standard_position JSONB NOT NULL,
    acceptable_variations JSONB DEFAULT '[]',
    unacceptable_patterns JSONB DEFAULT '[]',
    guidance_internal TEXT,
    anchors JSONB DEFAULT '[]',
    definitions_scope JSONB DEFAULT '[]',
    retrieval_profile JSONB DEFAULT '{"vector_top_k": 5, "coverage_threshold": 0.78, "examples_top_k": 6}',
    routing_policy JSONB DEFAULT '{"block_export_if_escalated": true}',
    decision_policy JSONB DEFAULT '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true}',
    models JSONB DEFAULT '{"paranoid": "gpt-4o", "valuator": "gpt-4o-mini", "sanitizer": "gpt-4o-mini"}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for playbook_rules
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.playbook_rules 
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Create variation_examples table for VariationSet storage
-- ============================================================

CREATE TABLE IF NOT EXISTS public.variation_examples (
    example_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT NOT NULL REFERENCES public.playbook_rules(rule_id) ON DELETE CASCADE,
    label TEXT NOT NULL CHECK (label IN ('STANDARD', 'ACCEPTABLE', 'UNACCEPTABLE', 'NOT_COVERED')),
    text TEXT NOT NULL,
    text_hash TEXT,
    source TEXT NOT NULL CHECK (source IN ('synthetic', 'human', 'contract')),
    source_document_id TEXT,
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for variation retrieval
CREATE INDEX IF NOT EXISTS idx_variation_examples_rule_id ON public.variation_examples(rule_id);
CREATE INDEX IF NOT EXISTS idx_variation_examples_label ON public.variation_examples(label);

-- HNSW index for vector similarity search (if pgvector is enabled)
-- CREATE INDEX IF NOT EXISTS idx_variation_examples_embedding ON public.variation_examples 
--     USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- RLS for variation_examples
ALTER TABLE public.variation_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.variation_examples 
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Verification queries
-- ============================================================

-- Check that all columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'clause_reviews' 
-- ORDER BY ordinal_position;

-- Check new tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
