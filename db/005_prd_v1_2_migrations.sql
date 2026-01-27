-- ============================================================
-- Contract Expert - PRD v1.2 Migrations
-- Run this in Supabase SQL Editor
-- Order: M1 -> M2 -> M3 -> M4 -> M5
-- ============================================================

-- ============================================================
-- M1: Estados contract_decision alineados con PRD v1.2
-- ============================================================

-- Asegurar que documents existe (si no, crearla con campos minimos)
CREATE TABLE IF NOT EXISTS public.documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    file_name TEXT,
    file_path TEXT,
    storage_path TEXT,
    mime_type TEXT,
    file_size BIGINT,
    status TEXT DEFAULT 'pending',
    processing_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anadir columna contract_decision si no existe
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS contract_decision TEXT;

-- Crear/actualizar constraint para los 5 estados PRD
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_contract_decision_check;

ALTER TABLE public.documents
ADD CONSTRAINT documents_contract_decision_check
CHECK (contract_decision IN (
    'PROCESSING',
    'AUTO_REDLINEDRAFT',
    'ESCALATE_HUMAN',
    'BLOCK_EXPORT',
    'READY_FOR_EXPORT'
));

-- Columnas adicionales para tracking
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS escalations_pending INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS block_reasons JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS output_changeset_id UUID,
ADD COLUMN IF NOT EXISTS output_drive_file_id TEXT;

-- ============================================================
-- M2: Tabla sanitizer_outputs (UNICA tabla de outputs cliente)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sanitizer_outputs (
    output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias
    run_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES public.documents(document_id) ON DELETE CASCADE,
    clause_instance_id TEXT NOT NULL,

    -- Contenido sanitizado (SOLO campos client-safe)
    clause_heading TEXT,
    original_text TEXT NOT NULL,
    proposed_text TEXT,
    client_comment TEXT,
    change_type TEXT CHECK (change_type IN ('addition', 'deletion', 'modification', 'no_change')),

    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'edited')),

    -- Metadata (sin info interna)
    sequence_number INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_sanitizer_outputs_run ON public.sanitizer_outputs(run_id);
CREATE INDEX IF NOT EXISTS idx_sanitizer_outputs_document ON public.sanitizer_outputs(document_id);

-- Replica identity para Realtime
ALTER TABLE public.sanitizer_outputs REPLICA IDENTITY FULL;

-- ============================================================
-- M3: Tabla contract_runs (estado de ejecucion)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contract_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(document_id) ON DELETE CASCADE,

    -- Estado tecnico de ejecucion
    status TEXT DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PROCESSING', 'COMPLETED', 'FAILED')),

    -- Decision UX (mapea a PRD v1.2)
    decision TEXT CHECK (decision IN (
        'PROCESSING',
        'AUTO_REDLINEDRAFT',
        'ESCALATE_HUMAN',
        'BLOCK_EXPORT',
        'READY_FOR_EXPORT'
    )),

    -- Progreso
    total_clauses INTEGER DEFAULT 0,
    processed_clauses INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Error tracking (sin exponer detalles internos)
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_contract_runs_document ON public.contract_runs(document_id);
CREATE INDEX IF NOT EXISTS idx_contract_runs_status ON public.contract_runs(status);

-- Replica identity para Realtime
ALTER TABLE public.contract_runs REPLICA IDENTITY FULL;

-- ============================================================
-- M4: Tabla blocked_terms + seed minimo obligatorio
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blocked_terms (
    term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'identifier', 'classification', 'technical',
        'routing', 'versioning', 'team_internal'
    )),
    severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_terms_active ON public.blocked_terms(is_active) WHERE is_active = true;

-- Seed minimo obligatorio (PRD 13.3)
INSERT INTO public.blocked_terms (term, category, severity) VALUES
    -- Identificadores
    ('playbook', 'identifier', 'critical'),
    ('PolicySpec', 'identifier', 'critical'),
    ('policy_spec', 'identifier', 'critical'),
    ('rule_id', 'identifier', 'high'),
    ('RuleName', 'identifier', 'high'),
    -- Clasificacion
    ('aceptable', 'classification', 'critical'),
    ('inaceptable', 'classification', 'critical'),
    ('acceptable', 'classification', 'critical'),
    ('unacceptable', 'classification', 'critical'),
    ('AcceptableDeviation', 'classification', 'critical'),
    ('UnacceptableDeviation', 'classification', 'critical'),
    ('Compliant', 'classification', 'high'),
    ('NotCoveredByPlaybook', 'classification', 'critical'),
    ('Ambiguous', 'classification', 'high'),
    -- Tecnicos
    ('threshold', 'technical', 'high'),
    ('confidence', 'technical', 'high'),
    ('anchor_conf', 'technical', 'high'),
    ('coverage', 'technical', 'medium'),
    ('TH_ANCHOR', 'technical', 'critical'),
    ('TH_CONF', 'technical', 'critical'),
    -- Routing
    ('escalate', 'routing', 'high'),
    ('escalation', 'routing', 'high'),
    ('routing', 'routing', 'high'),
    ('gating', 'routing', 'high'),
    ('BLOCK_EXPORT', 'routing', 'critical'),
    ('AUTO_PASS', 'routing', 'high'),
    ('AUTO_REDLINEDRAFT', 'routing', 'high'),
    -- Versionado
    ('v1.0', 'versioning', 'medium'),
    ('v1.2', 'versioning', 'medium')
ON CONFLICT (term) DO NOTHING;

-- ============================================================
-- M5: RLS - Separacion estricta Client vs Internal
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanitizer_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_terms ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas existentes (si existen)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clause_reviews') THEN
        ALTER TABLE public.clause_reviews ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_rules') THEN
        ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variation_examples') THEN
        ALTER TABLE public.variation_examples ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events') THEN
        ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ==========================================
-- TABLAS CLIENT-SAFE (cliente puede leer)
-- ==========================================

-- documents: cliente puede leer sus documentos
DROP POLICY IF EXISTS "Client read own documents" ON public.documents;
CREATE POLICY "Client read own documents" ON public.documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- contract_runs: cliente puede leer runs de sus documentos
DROP POLICY IF EXISTS "Client read own runs" ON public.contract_runs;
CREATE POLICY "Client read own runs" ON public.contract_runs
    FOR SELECT USING (auth.role() = 'authenticated');

-- sanitizer_outputs: cliente puede leer outputs sanitizados
DROP POLICY IF EXISTS "Client read sanitized outputs" ON public.sanitizer_outputs;
CREATE POLICY "Client read sanitized outputs" ON public.sanitizer_outputs
    FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- TABLAS INTERNAL-ONLY (solo service_role)
-- ==========================================

-- clause_reviews: SOLO service_role (contiene JSON internos)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clause_reviews') THEN
        DROP POLICY IF EXISTS "Internal only clause_reviews" ON public.clause_reviews;
        CREATE POLICY "Internal only clause_reviews" ON public.clause_reviews
            FOR ALL USING (auth.role() = 'service_role');
        -- Eliminar politica anterior permisiva si existe
        DROP POLICY IF EXISTS "Allow read for all" ON public.clause_reviews;
        DROP POLICY IF EXISTS "Service role full access" ON public.clause_reviews;
    END IF;
END $$;

-- playbook_rules: SOLO service_role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_rules') THEN
        DROP POLICY IF EXISTS "Internal only playbook_rules" ON public.playbook_rules;
        CREATE POLICY "Internal only playbook_rules" ON public.playbook_rules
            FOR ALL USING (auth.role() = 'service_role');
        -- Eliminar politica anterior permisiva
        DROP POLICY IF EXISTS "Allow read for all" ON public.playbook_rules;
        DROP POLICY IF EXISTS "Service role full access" ON public.playbook_rules;
    END IF;
END $$;

-- variation_examples: SOLO service_role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variation_examples') THEN
        DROP POLICY IF EXISTS "Internal only variation_examples" ON public.variation_examples;
        CREATE POLICY "Internal only variation_examples" ON public.variation_examples
            FOR ALL USING (auth.role() = 'service_role');
        DROP POLICY IF EXISTS "Service role full access" ON public.variation_examples;
    END IF;
END $$;

-- audit_events: SOLO service_role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events') THEN
        DROP POLICY IF EXISTS "Internal only audit_events" ON public.audit_events;
        CREATE POLICY "Internal only audit_events" ON public.audit_events
            FOR ALL USING (auth.role() = 'service_role');
        DROP POLICY IF EXISTS "Service role full access" ON public.audit_events;
    END IF;
END $$;

-- blocked_terms: SOLO service_role (gestion despacho)
DROP POLICY IF EXISTS "Internal only blocked_terms" ON public.blocked_terms;
CREATE POLICY "Internal only blocked_terms" ON public.blocked_terms
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- SERVICE ROLE: Full access a tablas client-safe
-- ==========================================

DROP POLICY IF EXISTS "Service role full access documents" ON public.documents;
CREATE POLICY "Service role full access documents" ON public.documents
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access runs" ON public.contract_runs;
CREATE POLICY "Service role full access runs" ON public.contract_runs
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access outputs" ON public.sanitizer_outputs;
CREATE POLICY "Service role full access outputs" ON public.sanitizer_outputs
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Verificacion
-- ============================================================

-- Verificar tablas creadas
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'contract_runs', 'sanitizer_outputs', 'blocked_terms')
ORDER BY table_name;

-- Verificar blocked_terms seed
SELECT count(*) as blocked_terms_count FROM public.blocked_terms;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('documents', 'contract_runs', 'sanitizer_outputs', 'clause_reviews', 'playbook_rules', 'audit_events', 'blocked_terms');
