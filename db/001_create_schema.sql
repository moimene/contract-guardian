-- ============================================================
-- Amazon Redliner Multi-Agent RAGGraph Pipeline
-- Database Migration - Supabase/PostgreSQL with pgvector
-- ============================================================
-- Run this migration after enabling pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schema
CREATE SCHEMA IF NOT EXISTS amazon_redliner;

-- ============================================================
-- Table: documents
-- Stores document metadata and processing status
-- ============================================================
CREATE TABLE amazon_redliner.documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Source info
    drive_file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('docx', 'pdf')),
    file_size_bytes BIGINT,
    
    -- Storage
    storage_path TEXT NOT NULL,
    original_hash TEXT NOT NULL,
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'blocked')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    
    -- Contract-level decision
    contract_decision TEXT CHECK (contract_decision IN ('READY_FOR_EXPORT', 'NEEDS_REVIEW', 'BLOCKED')),
    escalations_pending INTEGER DEFAULT 0,
    block_reasons JSONB DEFAULT '[]',
    
    -- Output references
    output_changeset_id UUID,
    output_drive_file_id TEXT,
    output_report_path TEXT,
    
    -- Metadata
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant ON amazon_redliner.documents(tenant_id);
CREATE INDEX idx_documents_status ON amazon_redliner.documents(status);
CREATE INDEX idx_documents_drive_file ON amazon_redliner.documents(drive_file_id);

-- ============================================================
-- Table: clauses
-- Extracted clause instances with offsets and paragraph mapping
-- ============================================================
CREATE TABLE amazon_redliner.clauses (
    clause_instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES amazon_redliner.documents(document_id) ON DELETE CASCADE,
    
    -- Clause identity
    clause_id TEXT NOT NULL, -- Normalized ID within document
    sequence_number INTEGER NOT NULL,
    
    -- Content
    heading TEXT,
    clause_text TEXT NOT NULL,
    
    -- Offsets (for reproducibility)
    offsets JSONB NOT NULL, -- {start: int, end: int, paragraph_ids: [...]}
    paragraph_ids JSONB, -- OOXML paragraph references
    
    -- Processing
    detected_family TEXT,
    active_rule_id TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clauses_document ON amazon_redliner.clauses(document_id);
CREATE INDEX idx_clauses_family ON amazon_redliner.clauses(detected_family);

-- ============================================================
-- Table: embeddings
-- Vector embeddings with namespace governance
-- ============================================================
CREATE TABLE amazon_redliner.embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Namespace governance
    tenant_id UUID NOT NULL,
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL,
    rule_id TEXT, -- Optional: for rule-specific embeddings
    doc_type TEXT NOT NULL CHECK (doc_type IN ('standard', 'acceptable', 'unacceptable', 'example', 'clause')),
    
    -- Reference
    source_id UUID NOT NULL, -- clause_instance_id or variation_example_id
    source_type TEXT NOT NULL CHECK (source_type IN ('clause', 'variation_example', 'standard_position')),
    
    -- Vector (dimension configurable: 1536 for OpenAI, 768 for Cohere)
    embedding vector(1536), -- Change dimension as needed
    
    -- Metadata
    text_hash TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast vector search
CREATE INDEX idx_embeddings_hnsw ON amazon_redliner.embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_embeddings_namespace ON amazon_redliner.embeddings(tenant_id, playbook_id, rule_id, doc_type);

-- ============================================================
-- Table: playbook_rules
-- Compiled PolicySpec objects (source of truth)
-- ============================================================
CREATE TABLE amazon_redliner.playbook_rules (
    rule_id TEXT PRIMARY KEY, -- Format: PlaybookId:Version:RuleName
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL,
    
    -- Classification
    rule_name TEXT NOT NULL,
    clause_family TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    
    -- Analysis configuration
    analysis_mode TEXT NOT NULL CHECK (analysis_mode IN ('MODE_STRICT_NO_DEVIATIONS', 'MODE_ENUMERATED_DEVIATIONS', 'MODE_POLICY_JUDGMENT_REQUIRED')),
    
    -- Positions (stored as JSON for flexibility)
    standard_position JSONB NOT NULL, -- {text, text_hash}
    fallback_acceptable_fragments JSONB DEFAULT '[]',
    unacceptable_patterns JSONB DEFAULT '[]',
    
    -- Internal guidance (never exposed to client)
    guidance_internal TEXT,
    anchors JSONB DEFAULT '[]', -- Semantic anchor terms
    definitions_scope JSONB, -- {defined_terms: [], cross_refs: []}
    
    -- Retrieval profile
    retrieval_profile JSONB DEFAULT '{"vector_top_k": 3, "coverage_threshold": 0.78, "examples_top_k": 6}',
    
    -- Routing policy
    routing_policy JSONB NOT NULL, -- {type, target_group, block_export}
    
    -- Decision policy
    decision_policy JSONB DEFAULT '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}',
    
    -- Model configuration
    models JSONB DEFAULT '{"paranoid": "gpt-4o", "valuator": "gpt-4o", "sanitizer": "gpt-4o-mini"}',
    
    -- Versioning
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbook_rules_family ON amazon_redliner.playbook_rules(clause_family);
CREATE INDEX idx_playbook_rules_playbook ON amazon_redliner.playbook_rules(playbook_id, playbook_version);

-- ============================================================
-- Table: variation_examples
-- Training examples for RAG (STANDARD/ACCEPTABLE/UNACCEPTABLE/NOT_COVERED)
-- ============================================================
CREATE TABLE amazon_redliner.variation_examples (
    example_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT NOT NULL REFERENCES amazon_redliner.playbook_rules(rule_id) ON DELETE CASCADE,
    
    -- Classification
    label TEXT NOT NULL CHECK (label IN ('STANDARD', 'ACCEPTABLE', 'UNACCEPTABLE', 'NOT_COVERED')),
    
    -- Content
    text TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    
    -- Vector embedding
    embedding vector(1536), -- Change dimension as needed
    
    -- Source tracking
    source TEXT NOT NULL CHECK (source IN ('synthetic', 'human', 'contract')),
    source_document_id UUID,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variation_examples_rule ON amazon_redliner.variation_examples(rule_id, label);
CREATE INDEX idx_variation_examples_hnsw ON amazon_redliner.variation_examples 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================
-- Table: clause_reviews
-- Full review results per clause (internal JSONs)
-- ============================================================
CREATE TABLE amazon_redliner.clause_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL, -- Groups all reviews for a document run
    clause_instance_id UUID NOT NULL REFERENCES amazon_redliner.clauses(clause_instance_id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES amazon_redliner.documents(document_id) ON DELETE CASCADE,
    
    -- Agent outputs (internal, never exposed to client)
    router_json JSONB,
    paranoid_json JSONB,
    valuator_json JSONB,
    sanitizer_json JSONB,
    
    -- Decision
    decision_json JSONB, -- Gating matrix output
    final_decision TEXT CHECK (final_decision IN ('AUTO_PASS', 'AUTO_REDLINEDRAFT', 'ESCALATE_HUMAN', 'BLOCK_EXPORT', 'LOG_ONLY')),
    
    -- Escalation tracking
    escalation_status TEXT CHECK (escalation_status IN ('none', 'pending', 'approved', 'rejected')),
    escalation_resolved_by TEXT,
    escalation_resolved_at TIMESTAMPTZ,
    
    -- Timing
    processing_started_at TIMESTAMPTZ DEFAULT NOW(),
    processing_completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clause_reviews_run ON amazon_redliner.clause_reviews(run_id);
CREATE INDEX idx_clause_reviews_document ON amazon_redliner.clause_reviews(document_id);
CREATE INDEX idx_clause_reviews_escalation ON amazon_redliner.clause_reviews(escalation_status) WHERE escalation_status != 'none';

-- ============================================================
-- Table: changesets
-- Approved changesets for documents
-- ============================================================
CREATE TABLE amazon_redliner.changesets (
    changeset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES amazon_redliner.documents(document_id) ON DELETE CASCADE,
    version_id TEXT NOT NULL,
    
    -- Full changeset JSON
    changeset_json JSONB NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'applied', 'rejected')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_changesets_document ON amazon_redliner.changesets(document_id);

-- ============================================================
-- Table: audit_events
-- Full audit trail for compliance
-- ============================================================
CREATE TABLE amazon_redliner.audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    run_id UUID,
    document_id UUID,
    clause_instance_id UUID,
    
    -- Event info
    step TEXT NOT NULL, -- 'router', 'paranoid', 'valuator', 'sanitizer', 'gating', 'export'
    action TEXT NOT NULL,
    
    -- Full payload (for reproducibility)
    payload_json JSONB NOT NULL,
    
    -- Actor
    actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'agent', 'human')),
    actor_id TEXT,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_events_run ON amazon_redliner.audit_events(run_id);
CREATE INDEX idx_audit_events_document ON amazon_redliner.audit_events(document_id);
CREATE INDEX idx_audit_events_time ON amazon_redliner.audit_events(created_at);

-- ============================================================
-- Table: blocked_terms
-- Blocklist for Sanitizer/LeakageGuard
-- ============================================================
CREATE TABLE amazon_redliner.blocked_terms (
    term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    
    term TEXT NOT NULL,
    severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT, -- 'rule_id', 'team_name', 'technical', 'classification'
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_terms_tenant ON amazon_redliner.blocked_terms(tenant_id);
CREATE INDEX idx_blocked_terms_active ON amazon_redliner.blocked_terms(is_active) WHERE is_active = true;

-- ============================================================
-- Table: dependencies
-- ContractGraph edges (DefinedTerms, CrossReferences, etc.)
-- ============================================================
CREATE TABLE amazon_redliner.dependencies (
    dependency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES amazon_redliner.documents(document_id) ON DELETE CASCADE,
    
    -- Edge definition
    source_clause_id UUID NOT NULL REFERENCES amazon_redliner.clauses(clause_instance_id) ON DELETE CASCADE,
    target_clause_id UUID REFERENCES amazon_redliner.clauses(clause_instance_id) ON DELETE SET NULL,
    
    -- Dependency type
    dep_type TEXT NOT NULL CHECK (dep_type IN ('DefinedTerm', 'CrossReference', 'Exhibit', 'ClauseDependency')),
    
    -- Content
    text_snippet TEXT NOT NULL,
    term_name TEXT, -- For DefinedTerm type
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dependencies_document ON amazon_redliner.dependencies(document_id);
CREATE INDEX idx_dependencies_source ON amazon_redliner.dependencies(source_clause_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE amazon_redliner.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.variation_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.clause_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.changesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.blocked_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_redliner.dependencies ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON amazon_redliner.documents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.clauses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.playbook_rules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.variation_examples
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.clause_reviews
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.changesets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.audit_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.blocked_terms
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON amazon_redliner.dependencies
    FOR ALL USING (auth.role() = 'service_role');

-- Anon role read-only on reference tables
CREATE POLICY "Anon read playbook rules" ON amazon_redliner.playbook_rules
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Anon read variation examples" ON amazon_redliner.variation_examples
    FOR SELECT USING (auth.role() = 'anon');

-- ============================================================
-- Triggers for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION amazon_redliner.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON amazon_redliner.documents
    FOR EACH ROW EXECUTE FUNCTION amazon_redliner.update_updated_at();

CREATE TRIGGER update_playbook_rules_updated_at
    BEFORE UPDATE ON amazon_redliner.playbook_rules
    FOR EACH ROW EXECUTE FUNCTION amazon_redliner.update_updated_at();

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to search embeddings by vector with namespace filtering
CREATE OR REPLACE FUNCTION amazon_redliner.search_embeddings(
    query_embedding vector(1536),
    p_tenant_id UUID,
    p_playbook_id TEXT,
    p_rule_id TEXT DEFAULT NULL,
    p_doc_type TEXT DEFAULT NULL,
    p_top_k INTEGER DEFAULT 5
)
RETURNS TABLE (
    embedding_id UUID,
    source_id UUID,
    source_type TEXT,
    doc_type TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.embedding_id,
        e.source_id,
        e.source_type,
        e.doc_type,
        1 - (e.embedding <=> query_embedding) as similarity
    FROM amazon_redliner.embeddings e
    WHERE e.tenant_id = p_tenant_id
        AND e.playbook_id = p_playbook_id
        AND (p_rule_id IS NULL OR e.rule_id = p_rule_id)
        AND (p_doc_type IS NULL OR e.doc_type = p_doc_type)
    ORDER BY e.embedding <=> query_embedding
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql;
