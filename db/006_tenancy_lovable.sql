-- ============================================================
-- Contract Expert - M6: Tenancy + Campos adicionales para Lovable
-- Run AFTER 005_prd_v1_2_migrations.sql
-- ============================================================

-- ============================================================
-- M6.1: Organizations (multi-tenant)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- M6.2: Organization Memberships (RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('client_user', 'inhouse_counsel', 'firm_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON public.org_memberships(organization_id);

-- ============================================================
-- M6.3: Contract Types (tipologias)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contract_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed SOLO tipologia activa (P0)
INSERT INTO public.contract_types (code, name, description, is_active, sort_order) VALUES
    ('dsa_streaming_v1', 'DSA - Streaming Platform', 'Digital Services Agreement for streaming platforms', true, 1)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- M6.4: User Registration Requests (self-registration)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    requested_role TEXT DEFAULT 'client_user' CHECK (requested_role IN ('client_user', 'inhouse_counsel')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.user_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.user_registration_requests(email);

-- ============================================================
-- M6.5: Campos adicionales sanitizer_outputs
-- ============================================================

ALTER TABLE public.sanitizer_outputs
ADD COLUMN IF NOT EXISTS client_state TEXT CHECK (client_state IN ('OK', 'RECOMMENDED', 'REQUIRED', 'NEEDS_REVIEW', 'BLOCKED')),
ADD COLUMN IF NOT EXISTS safety_pass BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS leak_score NUMERIC(5,4) DEFAULT 0;

-- ============================================================
-- M6.6: RLS para nuevas tablas
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;

-- Organizations: miembros ven su org, firm_admin ve todas
DROP POLICY IF EXISTS "Members view own org" ON public.organizations;
CREATE POLICY "Members view own org" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.org_memberships WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.org_memberships WHERE user_id = auth.uid() AND role = 'firm_admin')
    );

-- Org memberships: usuarios ven su membership
DROP POLICY IF EXISTS "Users view own membership" ON public.org_memberships;
CREATE POLICY "Users view own membership" ON public.org_memberships
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.org_memberships WHERE user_id = auth.uid() AND role = 'firm_admin')
    );

-- Contract types: todos ven tipologias activas
DROP POLICY IF EXISTS "Anyone can view active types" ON public.contract_types;
CREATE POLICY "Anyone can view active types" ON public.contract_types
    FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

-- Registration requests: firm_admin gestiona, usuarios ven la suya
DROP POLICY IF EXISTS "Firm admin manages requests" ON public.user_registration_requests;
CREATE POLICY "Firm admin manages requests" ON public.user_registration_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.org_memberships WHERE user_id = auth.uid() AND role = 'firm_admin')
    );

DROP POLICY IF EXISTS "Users view own request" ON public.user_registration_requests;
CREATE POLICY "Users view own request" ON public.user_registration_requests
    FOR SELECT USING (email = auth.jwt()->>'email');

-- Service role full access
DROP POLICY IF EXISTS "Service role orgs" ON public.organizations;
CREATE POLICY "Service role orgs" ON public.organizations
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role memberships" ON public.org_memberships;
CREATE POLICY "Service role memberships" ON public.org_memberships
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role types" ON public.contract_types;
CREATE POLICY "Service role types" ON public.contract_types
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role requests" ON public.user_registration_requests;
CREATE POLICY "Service role requests" ON public.user_registration_requests
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- M6.7: Actualizar RLS para usar org_memberships
-- ============================================================

-- Documents: miembros de la org pueden ver
DROP POLICY IF EXISTS "Client read own documents" ON public.documents;
DROP POLICY IF EXISTS "Org members read documents" ON public.documents;
CREATE POLICY "Org members read documents" ON public.documents
    FOR SELECT USING (
        tenant_id IN (
            SELECT organization_id FROM public.org_memberships
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- Contract runs: heredar de documents
DROP POLICY IF EXISTS "Client read own runs" ON public.contract_runs;
DROP POLICY IF EXISTS "Org members read runs" ON public.contract_runs;
CREATE POLICY "Org members read runs" ON public.contract_runs
    FOR SELECT USING (
        document_id IN (
            SELECT document_id FROM public.documents
            WHERE tenant_id IN (
                SELECT organization_id FROM public.org_memberships
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- Sanitizer outputs: heredar de documents
DROP POLICY IF EXISTS "Client read sanitized outputs" ON public.sanitizer_outputs;
DROP POLICY IF EXISTS "Org members read outputs" ON public.sanitizer_outputs;
CREATE POLICY "Org members read outputs" ON public.sanitizer_outputs
    FOR SELECT USING (
        document_id IN (
            SELECT document_id FROM public.documents
            WHERE tenant_id IN (
                SELECT organization_id FROM public.org_memberships
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE user_id = auth.uid() AND role = 'firm_admin'
        )
    );

-- ============================================================
-- M6.8: Datos de prueba (opcional)
-- ============================================================

-- Organizacion de prueba
INSERT INTO public.organizations (id, name, slug, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo-org', true)
ON CONFLICT (slug) DO NOTHING;

-- NOTA: Para crear un firm_admin, despues de crear un usuario en Supabase Auth:
-- INSERT INTO public.org_memberships (user_id, organization_id, role)
-- VALUES ('<user_id_from_auth>', NULL, 'firm_admin');

-- ============================================================
-- Verificacion
-- ============================================================

-- Verificar tablas creadas
SELECT 'organizations' as tabla, count(*) as registros FROM public.organizations
UNION ALL
SELECT 'org_memberships', count(*) FROM public.org_memberships
UNION ALL
SELECT 'contract_types', count(*) FROM public.contract_types
UNION ALL
SELECT 'user_registration_requests', count(*) FROM public.user_registration_requests;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'org_memberships', 'contract_types', 'user_registration_requests');

-- Verificar campos nuevos en sanitizer_outputs
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sanitizer_outputs'
  AND column_name IN ('client_state', 'safety_pass', 'leak_score');
