-- ============================================================
-- Contract Expert - M15: Frontend Clause Review System
-- Para ejecutar en tu Supabase externo (hvlsuwdqtfiilvampxq)
--
-- ARQUITECTURA:
-- - amazon_redliner.clause_reviews = Backend (agentes, pipeline)
-- - public.clause_reviews = Frontend (UI Lovable, usuario final)
-- ============================================================

-- ============================================================
-- 1. TABLA public.clause_reviews (FRONTEND)
-- Versión simplificada para el UI de revisión cláusula por cláusula
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clause_reviews (
    clause_instance_id TEXT PRIMARY KEY,
    clause_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.documents(document_id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES public.contract_runs(run_id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL DEFAULT 0,

    -- Contenido visible al cliente
    heading TEXT,
    clause_text TEXT,
    detected_family TEXT,
    confidence_score NUMERIC DEFAULT 0,

    -- Estado del cliente (UI)
    client_state TEXT NOT NULL DEFAULT 'NEEDS_REVIEW'
        CHECK (client_state IN ('OK', 'RECOMMENDED', 'REQUIRED', 'NEEDS_REVIEW', 'BLOCKED')),
    client_comment TEXT,
    client_summary_line TEXT,

    -- Cambios propuestos (JSONB array)
    proposed_changes JSONB DEFAULT '[]'::jsonb,

    -- Escalación
    escalation_recommended BOOLEAN DEFAULT false,
    escalation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clause_reviews IS 'Frontend clause reviews for Lovable UI - client-facing view';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_clause_reviews_document ON public.clause_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_public_clause_reviews_run ON public.clause_reviews(run_id);
CREATE INDEX IF NOT EXISTS idx_public_clause_reviews_state ON public.clause_reviews(client_state);
CREATE INDEX IF NOT EXISTS idx_public_clause_reviews_family ON public.clause_reviews(detected_family);

-- ============================================================
-- 2. RLS para public.clause_reviews
-- ============================================================

ALTER TABLE public.clause_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: Miembros de org pueden ver
DROP POLICY IF EXISTS "Org members view clause reviews" ON public.clause_reviews;
CREATE POLICY "Org members view clause reviews" ON public.clause_reviews
    FOR SELECT USING (
        document_id IN (
            SELECT d.document_id
            FROM public.documents d
            WHERE d.tenant_id IN (
                SELECT om.organization_id
                FROM public.org_memberships om
                WHERE om.user_id = auth.uid() AND om.is_active = true
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- UPDATE: Miembros de org pueden actualizar
DROP POLICY IF EXISTS "Org members update clause reviews" ON public.clause_reviews;
CREATE POLICY "Org members update clause reviews" ON public.clause_reviews
    FOR UPDATE USING (
        document_id IN (
            SELECT d.document_id
            FROM public.documents d
            WHERE d.tenant_id IN (
                SELECT om.organization_id
                FROM public.org_memberships om
                WHERE om.user_id = auth.uid() AND om.is_active = true
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- INSERT: Service role y miembros de org
DROP POLICY IF EXISTS "Org members insert clause reviews" ON public.clause_reviews;
CREATE POLICY "Org members insert clause reviews" ON public.clause_reviews
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT d.document_id
            FROM public.documents d
            WHERE d.tenant_id IN (
                SELECT om.organization_id
                FROM public.org_memberships om
                WHERE om.user_id = auth.uid() AND om.is_active = true
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
        OR auth.role() = 'service_role'
    );

-- Service role full access
DROP POLICY IF EXISTS "Service role clause reviews" ON public.clause_reviews;
CREATE POLICY "Service role clause reviews" ON public.clause_reviews
    FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 3. MODIFICAR public.escalation_requests
-- Agregar columnas faltantes
-- ============================================================

-- Agregar columnas nuevas
ALTER TABLE public.escalation_requests
    ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(document_id),
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS context TEXT,
    ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS resolution TEXT CHECK (resolution IN ('approved', 'rejected', 'modified')),
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS escalation_id UUID DEFAULT gen_random_uuid();

-- Migrar datos existentes
UPDATE public.escalation_requests
    SET escalation_id = id WHERE escalation_id IS NULL;
UPDATE public.escalation_requests
    SET created_by = requested_by WHERE created_by IS NULL AND requested_by IS NOT NULL;
UPDATE public.escalation_requests
    SET reason = message WHERE reason IS NULL AND message IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON public.escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_urgency ON public.escalation_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_document ON public.escalation_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_assigned ON public.escalation_requests(assigned_to);

-- RLS adicional para UPDATE
DROP POLICY IF EXISTS "Org members update escalations" ON public.escalation_requests;
CREATE POLICY "Org members update escalations" ON public.escalation_requests
    FOR UPDATE USING (
        run_id IN (
            SELECT cr.run_id
            FROM public.contract_runs cr
            WHERE cr.document_id IN (
                SELECT d.document_id
                FROM public.documents d
                WHERE d.tenant_id IN (
                    SELECT om.organization_id
                    FROM public.org_memberships om
                    WHERE om.user_id = auth.uid() AND om.is_active = true
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );


-- ============================================================
-- 4. TABLA public.escalation_comments (NUEVA)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.escalation_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escalation_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.escalation_comments IS 'Comments on escalation requests';

-- Index
CREATE INDEX IF NOT EXISTS idx_escalation_comments_escalation ON public.escalation_comments(escalation_id);
CREATE INDEX IF NOT EXISTS idx_escalation_comments_author ON public.escalation_comments(author_id);

-- RLS
ALTER TABLE public.escalation_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: ver comentarios de escalaciones accesibles
DROP POLICY IF EXISTS "Org members view escalation comments" ON public.escalation_comments;
CREATE POLICY "Org members view escalation comments" ON public.escalation_comments
    FOR SELECT USING (
        escalation_id IN (
            SELECT er.id FROM public.escalation_requests er
            WHERE er.run_id IN (
                SELECT cr.run_id FROM public.contract_runs cr
                WHERE cr.document_id IN (
                    SELECT d.document_id FROM public.documents d
                    WHERE d.tenant_id IN (
                        SELECT om.organization_id FROM public.org_memberships om
                        WHERE om.user_id = auth.uid() AND om.is_active = true
                    )
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- INSERT: usuarios autenticados pueden comentar en escalaciones accesibles
DROP POLICY IF EXISTS "Users insert escalation comments" ON public.escalation_comments;
CREATE POLICY "Users insert escalation comments" ON public.escalation_comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid()
        AND (
            escalation_id IN (
                SELECT er.id FROM public.escalation_requests er
                WHERE er.run_id IN (
                    SELECT cr.run_id FROM public.contract_runs cr
                    WHERE cr.document_id IN (
                        SELECT d.document_id FROM public.documents d
                        WHERE d.tenant_id IN (
                            SELECT om.organization_id FROM public.org_memberships om
                            WHERE om.user_id = auth.uid() AND om.is_active = true
                        )
                    )
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.org_memberships
                WHERE user_id = auth.uid() AND role = 'firm_admin'
            )
        )
    );

-- Service role
DROP POLICY IF EXISTS "Service role escalation comments" ON public.escalation_comments;
CREATE POLICY "Service role escalation comments" ON public.escalation_comments
    FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 5. TRIGGER updated_at para clause_reviews
-- ============================================================

-- Crear función si no existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_public_clause_reviews_updated_at ON public.clause_reviews;
CREATE TRIGGER update_public_clause_reviews_updated_at
    BEFORE UPDATE ON public.clause_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 6. HABILITAR REALTIME
-- ============================================================

-- Habilitar realtime (ignorar error si ya está habilitado)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clause_reviews;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_requests;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_comments;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;


-- ============================================================
-- 7. VERIFICACIÓN
-- ============================================================

SELECT 'public.clause_reviews' as tabla, count(*) as registros FROM public.clause_reviews
UNION ALL
SELECT 'public.escalation_requests', count(*) FROM public.escalation_requests
UNION ALL
SELECT 'public.escalation_comments', count(*) FROM public.escalation_comments;

-- Verificar columnas de escalation_requests
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'escalation_requests'
ORDER BY ordinal_position;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
