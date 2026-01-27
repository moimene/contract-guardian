-- ============================================================================
-- PREPARACIÓN SUPABASE EXTERNO: Tablas Core + Storage
-- Ejecutar ANTES de la migración de Lovable
-- Fecha: 2026-01-20
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "vector";  -- Habilitar si se va a usar RAG semántico

-- ============================================================================
-- PARTE 2: ENUMS (si no existen)
-- ============================================================================

DO $$
BEGIN
  -- contract_decision
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_decision') THEN
    CREATE TYPE contract_decision AS ENUM (
      'PROCESSING',
      'AUTO_REDLINEDRAFT',
      'ESCALATE_HUMAN',
      'BLOCK_EXPORT',
      'READY_FOR_EXPORT'
    );
  END IF;

  -- client_state
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_state') THEN
    CREATE TYPE client_state AS ENUM (
      'OK',
      'RECOMMENDED',
      'REQUIRED',
      'NEEDS_REVIEW',
      'BLOCKED'
    );
  END IF;

  -- clause_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clause_status') THEN
    CREATE TYPE clause_status AS ENUM ('SAFE', 'RISK');
  END IF;

  -- anonymization_mode
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anonymization_mode') THEN
    CREATE TYPE anonymization_mode AS ENUM ('OFF', 'DISPLAY_ONLY', 'FULL');
  END IF;

  -- document_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE document_status AS ENUM (
      'UPLOADING',
      'UPLOADED',
      'PROCESSING',
      'PROCESSED',
      'ERROR'
    );
  END IF;

  -- run_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_status') THEN
    CREATE TYPE run_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
  END IF;

  -- app_role
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('client', 'firm_admin', 'legal_ops', 'blueprint_admin', 'model_admin', 'super_admin');
  END IF;

  -- escalation_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_status') THEN
    CREATE TYPE escalation_status AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
  END IF;

  -- urgency_level
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
    CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: TABLAS CORE (Organizaciones y Usuarios)
-- ============================================================================

-- organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- profiles (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- org_memberships
CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- ============================================================================
-- PARTE 4: TABLAS CORE (Contratos)
-- ============================================================================

-- contract_types (catálogo)
CREATE TABLE IF NOT EXISTS contract_types (
  type_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'file-text',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
  document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  uploaded_by UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  contract_type_id TEXT REFERENCES contract_types(type_id),
  status document_status DEFAULT 'UPLOADING',
  contract_decision contract_decision,
  anonymization_mode anonymization_mode DEFAULT 'OFF',
  party_aliases JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contract_runs
CREATE TABLE IF NOT EXISTS contract_runs (
  run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  status run_status DEFAULT 'PENDING',
  decision contract_decision,
  playbook_id TEXT,
  -- Campos 3-layer (opcionales para compatibilidad)
  blueprint_version_id UUID,
  contract_model_version_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- clause_reviews
CREATE TABLE IF NOT EXISTS clause_reviews (
  clause_instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES contract_runs(run_id) ON DELETE CASCADE,
  clause_family TEXT,
  clause_type TEXT,
  original_text TEXT NOT NULL,
  status clause_status DEFAULT 'SAFE',
  client_state client_state DEFAULT 'OK',
  risk_score NUMERIC(3,2),
  proposed_changes JSONB,
  accepted_changes JSONB,
  rejected_changes JSONB,
  agent_reasoning TEXT,
  -- Campos 3-layer (opcionales para dual-write)
  matter_id UUID,
  clause_type_id UUID,
  finding_id UUID,
  grounding JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- sanitizer_outputs
CREATE TABLE IF NOT EXISTS sanitizer_outputs (
  output_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_id UUID REFERENCES clause_reviews(clause_instance_id) ON DELETE CASCADE,
  sanitized_text TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 5: TABLAS CORE (Escalaciones)
-- ============================================================================

-- escalation_requests
CREATE TABLE IF NOT EXISTS escalation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES contract_runs(run_id) ON DELETE CASCADE,
  clause_instance_id UUID REFERENCES clause_reviews(clause_instance_id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status escalation_status DEFAULT 'PENDING',
  urgency urgency_level DEFAULT 'MEDIUM',
  reason TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- escalation_comments
CREATE TABLE IF NOT EXISTS escalation_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id UUID NOT NULL REFERENCES escalation_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 6: ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_contract_type ON documents(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_runs_document ON contract_runs(document_id);
CREATE INDEX IF NOT EXISTS idx_contract_runs_status ON contract_runs(status);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_run ON clause_reviews(run_id);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_status ON clause_reviews(status);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_client_state ON clause_reviews(client_state);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_run ON escalation_requests(run_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON org_memberships(organization_id);

-- ============================================================================
-- PARTE 7: SEED DE DATOS INICIALES
-- ============================================================================

-- Organización de desarrollo
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Amazon Studios Dev', 'amazon-studios-dev')
ON CONFLICT (id) DO NOTHING;

-- Tipologías de contrato
INSERT INTO contract_types (type_id, name, description, icon) VALUES
  ('nda_standard', 'NDA - Estándar', 'Acuerdo de confidencialidad estándar bilateral', 'shield'),
  ('nda_unilateral', 'NDA - Unilateral', 'Acuerdo de confidencialidad unilateral', 'shield-alert'),
  ('dsa_streaming', 'DSA - Plataforma Streaming', 'Acuerdo de servicios digitales para streaming', 'tv'),
  ('dsa_ecommerce', 'DSA - E-commerce', 'Acuerdo de servicios digitales para e-commerce', 'shopping-cart'),
  ('service_agreement', 'Contrato de Servicios', 'Acuerdo de prestación de servicios profesionales', 'briefcase'),
  ('supply_agreement', 'Contrato de Suministro', 'Acuerdo de suministro de bienes', 'package'),
  ('lease_commercial', 'Arrendamiento Comercial', 'Contrato de arrendamiento de local comercial', 'building'),
  ('lease_residential', 'Arrendamiento Residencial', 'Contrato de arrendamiento de vivienda', 'home'),
  ('license_software', 'Licencia de Software', 'Contrato de licencia de uso de software', 'code'),
  ('employment_standard', 'Contrato Laboral', 'Contrato de trabajo estándar', 'user'),
  ('amazon-psa', 'Amazon PSA', 'Amazon Production Service Agreement', 'film'),
  ('amazon-dsa', 'Amazon DSA', 'Amazon Digital Services Agreement', 'play-circle')
ON CONFLICT (type_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- PARTE 8: STORAGE BUCKET
-- ============================================================================

-- Crear bucket para contratos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  52428800,  -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTE 9: RLS POLICIES BÁSICAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_comments ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (CAMBIAR EN PRODUCCIÓN)
CREATE POLICY "dev_allow_all_organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "dev_allow_all_profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "dev_allow_all_user_roles" ON user_roles FOR ALL USING (true);
CREATE POLICY "dev_allow_all_org_memberships" ON org_memberships FOR ALL USING (true);
CREATE POLICY "dev_allow_all_documents" ON documents FOR ALL USING (true);
CREATE POLICY "dev_allow_all_contract_runs" ON contract_runs FOR ALL USING (true);
CREATE POLICY "dev_allow_all_clause_reviews" ON clause_reviews FOR ALL USING (true);
CREATE POLICY "dev_allow_all_escalation_requests" ON escalation_requests FOR ALL USING (true);
CREATE POLICY "dev_allow_all_escalation_comments" ON escalation_comments FOR ALL USING (true);

-- Storage policies
CREATE POLICY "dev_allow_all_storage" ON storage.objects FOR ALL USING (true);

-- ============================================================================
-- PARTE 10: REALTIME
-- ============================================================================

-- Habilitar realtime para tablas clave
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE clause_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE escalation_requests;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'organizations', 'profiles', 'user_roles', 'org_memberships',
  'contract_types', 'documents', 'contract_runs', 'clause_reviews',
  'sanitizer_outputs', 'escalation_requests', 'escalation_comments'
)
ORDER BY table_name;

-- Verificar organización de desarrollo
SELECT * FROM organizations WHERE slug = 'amazon-studios-dev';

-- Verificar tipologías
SELECT type_id, name FROM contract_types ORDER BY type_id;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'contracts';

-- ============================================================================
-- FIN
-- ============================================================================
