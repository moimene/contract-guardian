-- ============================================================================
-- MIGRACIÓN COMPLETA 3-LAYER PARA SUPABASE EXTERNO
-- Ejecutar en una sola sesión en Supabase SQL Editor
-- Fecha: 2026-01-20
-- Proyecto: hvlsuwdqtffiilvampxq
-- ============================================================================

-- ============================================================================
-- PASO 1: EXTENSIONES Y FUNCIONES BASE
-- ============================================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector (puede fallar si no está habilitado - continuar de todas formas)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector not available - continuing without it';
END $$;

-- Función set_updated_at para triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PASO 2: ENUMS NECESARIOS
-- ============================================================================

-- blueprint_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_status') THEN
    CREATE TYPE public.blueprint_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

-- acceptance_level
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acceptance_level') THEN
    CREATE TYPE public.acceptance_level AS ENUM ('ACCEPTABLE', 'PASSABLE', 'UNACCEPTABLE');
  END IF;
END $$;

-- fallback_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fallback_type') THEN
    CREATE TYPE public.fallback_type AS ENUM ('GIVE', 'ALTERNATE_GIVE');
  END IF;
END $$;

-- approval_gate
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_gate') THEN
    CREATE TYPE public.approval_gate AS ENUM ('LEGAL', 'TAX_FINANCE', 'BUSINESS_AFFAIRS');
  END IF;
END $$;

-- run_step_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_step_status') THEN
    CREATE TYPE public.run_step_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');
  END IF;
END $$;

-- ============================================================================
-- PASO 3: MATTERS Y CLAUSE_TYPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS matters_set_updated_at ON public.matters;
CREATE TRIGGER matters_set_updated_at
BEFORE UPDATE ON public.matters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.clause_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  detection_hints TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (matter_id, code)
);

CREATE INDEX IF NOT EXISTS clause_types_matter_id_idx ON public.clause_types(matter_id);

DROP TRIGGER IF EXISTS clause_types_set_updated_at ON public.clause_types;
CREATE TRIGGER clause_types_set_updated_at
BEFORE UPDATE ON public.clause_types
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PASO 4: BLUEPRINTS (Layer 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  status public.blueprint_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_blueprints_org_idx ON public.review_blueprints(organization_id);

DROP TRIGGER IF EXISTS review_blueprints_set_updated_at ON public.review_blueprints;
CREATE TRIGGER review_blueprints_set_updated_at
BEFORE UPDATE ON public.review_blueprints
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.blueprint_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.review_blueprints(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (blueprint_id, version_label)
);

CREATE INDEX IF NOT EXISTS blueprint_versions_blueprint_idx ON public.blueprint_versions(blueprint_id);

CREATE TABLE IF NOT EXISTS public.matter_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_version_id UUID NOT NULL REFERENCES public.blueprint_versions(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  policy_summary TEXT,
  default_acceptance public.acceptance_level NOT NULL DEFAULT 'PASSABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blueprint_version_id, matter_id)
);

CREATE INDEX IF NOT EXISTS matter_policies_blueprint_idx ON public.matter_policies(blueprint_version_id);
CREATE INDEX IF NOT EXISTS matter_policies_matter_idx ON public.matter_policies(matter_id);

DROP TRIGGER IF EXISTS matter_policies_set_updated_at ON public.matter_policies;
CREATE TRIGGER matter_policies_set_updated_at
BEFORE UPDATE ON public.matter_policies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.policy_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_policy_id UUID NOT NULL REFERENCES public.matter_policies(id) ON DELETE CASCADE,
  clause_type_id UUID REFERENCES public.clause_types(id) ON DELETE SET NULL,
  acceptance public.acceptance_level NOT NULL,
  example_text TEXT NOT NULL,
  normalized_terms TEXT[] NOT NULL DEFAULT '{}',
  source_ref JSONB NOT NULL DEFAULT '{}',
  embedding extensions.vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_examples_mp_idx ON public.policy_examples(matter_policy_id);
CREATE INDEX IF NOT EXISTS policy_examples_ct_idx ON public.policy_examples(clause_type_id);
CREATE INDEX IF NOT EXISTS policy_examples_acceptance_idx ON public.policy_examples(acceptance);

CREATE TABLE IF NOT EXISTS public.fallback_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_policy_id UUID NOT NULL REFERENCES public.matter_policies(id) ON DELETE CASCADE,
  clause_type_id UUID REFERENCES public.clause_types(id) ON DELETE SET NULL,
  fallback_type public.fallback_type NOT NULL DEFAULT 'GIVE',
  clause_text TEXT NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_gate public.approval_gate,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fallback_clauses_mp_idx ON public.fallback_clauses(matter_policy_id);

-- ============================================================================
-- PASO 5: CONTRACT MODELS (Layer 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  base_document_path TEXT,
  status public.blueprint_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_models_org_idx ON public.contract_models(organization_id);

DROP TRIGGER IF EXISTS contract_models_set_updated_at ON public.contract_models;
CREATE TRIGGER contract_models_set_updated_at
BEFORE UPDATE ON public.contract_models
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contract_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_model_id UUID NOT NULL REFERENCES public.contract_models(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (contract_model_id, version_label)
);

CREATE INDEX IF NOT EXISTS contract_model_versions_model_idx ON public.contract_model_versions(contract_model_id);

CREATE TABLE IF NOT EXISTS public.contract_model_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_model_version_id UUID NOT NULL REFERENCES public.contract_model_versions(id) ON DELETE CASCADE,
  clause_type_id UUID REFERENCES public.clause_types(id) ON DELETE SET NULL,
  section_ref TEXT,
  canonical_text TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_model_clauses_version_idx ON public.contract_model_clauses(contract_model_version_id);

CREATE TABLE IF NOT EXISTS public.contract_model_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_model_version_id UUID NOT NULL REFERENCES public.contract_model_versions(id) ON DELETE CASCADE,
  param_key TEXT NOT NULL,
  param_label TEXT NOT NULL,
  param_type TEXT NOT NULL DEFAULT 'text',
  default_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_model_version_id, param_key)
);

-- ============================================================================
-- PASO 6: CONTRACT TYPE DEFAULTS (Resolver)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_type_review_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type_id TEXT NOT NULL UNIQUE,
  blueprint_version_id UUID NOT NULL REFERENCES public.blueprint_versions(id) ON DELETE CASCADE,
  contract_model_version_id UUID REFERENCES public.contract_model_versions(id) ON DELETE SET NULL,
  knowledge_graph_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ctrd_contract_type_idx ON public.contract_type_review_defaults(contract_type_id);

DROP TRIGGER IF EXISTS contract_type_review_defaults_set_updated_at ON public.contract_type_review_defaults;
CREATE TRIGGER contract_type_review_defaults_set_updated_at
BEFORE UPDATE ON public.contract_type_review_defaults
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PASO 7: RUN LAYER (Layer 0)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clause_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  clause_type_id UUID REFERENCES public.clause_types(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  section_ref TEXT,
  start_offset INT,
  end_offset INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clause_instances_run_idx ON public.clause_instances(run_id);
CREATE INDEX IF NOT EXISTS clause_instances_clause_type_idx ON public.clause_instances(clause_type_id);

CREATE TABLE IF NOT EXISTS public.review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_instance_id UUID NOT NULL REFERENCES public.clause_instances(id) ON DELETE CASCADE,
  matter_policy_id UUID REFERENCES public.matter_policies(id) ON DELETE SET NULL,
  acceptance public.acceptance_level NOT NULL,
  confidence_score NUMERIC(4,3),
  agent_reasoning TEXT,
  grounding JSONB NOT NULL DEFAULT '{}',
  proposed_fallback_id UUID REFERENCES public.fallback_clauses(id) ON DELETE SET NULL,
  client_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_findings_ci_idx ON public.review_findings(clause_instance_id);
CREATE INDEX IF NOT EXISTS review_findings_acceptance_idx ON public.review_findings(acceptance);

DROP TRIGGER IF EXISTS review_findings_set_updated_at ON public.review_findings;
CREATE TRIGGER review_findings_set_updated_at
BEFORE UPDATE ON public.review_findings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  status public.run_step_status NOT NULL DEFAULT 'PENDING',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_snapshot JSONB,
  output_snapshot JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS run_steps_run_idx ON public.run_steps(run_id);

-- ============================================================================
-- PASO 8: GRAPHRAG (Opcional)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  status public.blueprint_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_graph_id UUID NOT NULL REFERENCES public.knowledge_graphs(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  embedding extensions.vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kg_nodes_graph_idx ON public.kg_nodes(knowledge_graph_id);
CREATE INDEX IF NOT EXISTS kg_nodes_type_idx ON public.kg_nodes(node_type);

CREATE TABLE IF NOT EXISTS public.kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_graph_id UUID NOT NULL REFERENCES public.knowledge_graphs(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  weight NUMERIC(5,4) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kg_edges_graph_idx ON public.kg_edges(knowledge_graph_id);
CREATE INDEX IF NOT EXISTS kg_edges_source_idx ON public.kg_edges(source_node_id);
CREATE INDEX IF NOT EXISTS kg_edges_target_idx ON public.kg_edges(target_node_id);

-- ============================================================================
-- PASO 9: AÑADIR knowledge_graph_id A DEFAULTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contract_type_review_defaults'
    AND column_name = 'knowledge_graph_id'
  ) THEN
    ALTER TABLE public.contract_type_review_defaults
    ADD COLUMN knowledge_graph_id UUID REFERENCES public.knowledge_graphs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- PASO 10: COMPATIBILIDAD clause_reviews (dual-write)
-- ============================================================================

-- Añadir columnas 3-layer a clause_reviews si existen
DO $$
BEGIN
  -- matter_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clause_reviews') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clause_reviews' AND column_name = 'matter_id'
    ) THEN
      ALTER TABLE public.clause_reviews ADD COLUMN matter_id UUID;
    END IF;

    -- clause_type_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clause_reviews' AND column_name = 'clause_type_id'
    ) THEN
      ALTER TABLE public.clause_reviews ADD COLUMN clause_type_id UUID;
    END IF;

    -- finding_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clause_reviews' AND column_name = 'finding_id'
    ) THEN
      ALTER TABLE public.clause_reviews ADD COLUMN finding_id UUID;
    END IF;

    -- grounding
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clause_reviews' AND column_name = 'grounding'
    ) THEN
      ALTER TABLE public.clause_reviews ADD COLUMN grounding JSONB;
    END IF;
  END IF;
END $$;

-- Añadir columnas 3-layer a contract_runs si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_runs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contract_runs' AND column_name = 'blueprint_version_id'
    ) THEN
      ALTER TABLE public.contract_runs ADD COLUMN blueprint_version_id UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contract_runs' AND column_name = 'contract_model_version_id'
    ) THEN
      ALTER TABLE public.contract_runs ADD COLUMN contract_model_version_id UUID;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'matters', 'clause_types',
  'review_blueprints', 'blueprint_versions', 'matter_policies',
  'policy_examples', 'fallback_clauses',
  'contract_models', 'contract_model_versions', 'contract_model_clauses',
  'contract_type_review_defaults',
  'clause_instances', 'review_findings', 'run_steps',
  'knowledge_graphs', 'kg_nodes', 'kg_edges'
)
ORDER BY table_name;

-- ============================================================================
-- FIN DE MIGRACIÓN DE ESQUEMA
-- ============================================================================
