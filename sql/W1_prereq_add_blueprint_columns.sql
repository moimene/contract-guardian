-- W1_prereq_add_blueprint_columns.sql
-- Adds blueprint_version_id to documents and contract_runs tables
-- Run this BEFORE deploying W1_FileUpload_3Layer workflow
-- Idempotent: safe to run multiple times

-- ===========================================================================
-- 1) Add blueprint_version_id to documents table
-- ===========================================================================

DO $$
BEGIN
  -- Add blueprint_version_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'documents'
    AND column_name = 'blueprint_version_id'
  ) THEN
    ALTER TABLE public.documents
    ADD COLUMN blueprint_version_id UUID REFERENCES public.blueprint_versions(id);

    RAISE NOTICE 'Added blueprint_version_id to documents table';
  ELSE
    RAISE NOTICE 'blueprint_version_id already exists in documents table';
  END IF;

  -- Remove old playbook columns if they exist (cleanup)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'documents'
    AND column_name = 'playbook_id'
  ) THEN
    -- Keep for backward compatibility, but mark as deprecated
    COMMENT ON COLUMN public.documents.playbook_id IS 'DEPRECATED: Use blueprint_version_id instead';
    RAISE NOTICE 'Marked playbook_id as deprecated in documents table';
  END IF;
END $$;

-- ===========================================================================
-- 2) Add blueprint columns to contract_runs table
-- ===========================================================================

DO $$
BEGIN
  -- Add blueprint_version_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contract_runs'
    AND column_name = 'blueprint_version_id'
  ) THEN
    ALTER TABLE public.contract_runs
    ADD COLUMN blueprint_version_id UUID REFERENCES public.blueprint_versions(id);

    RAISE NOTICE 'Added blueprint_version_id to contract_runs table';
  ELSE
    RAISE NOTICE 'blueprint_version_id already exists in contract_runs table';
  END IF;

  -- Add contract_model_version_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contract_runs'
    AND column_name = 'contract_model_version_id'
  ) THEN
    ALTER TABLE public.contract_runs
    ADD COLUMN contract_model_version_id UUID REFERENCES public.contract_model_versions(id);

    RAISE NOTICE 'Added contract_model_version_id to contract_runs table';
  ELSE
    RAISE NOTICE 'contract_model_version_id already exists in contract_runs table';
  END IF;
END $$;

-- ===========================================================================
-- 3) Create contract_type_review_defaults entry for nueva_planta
-- ===========================================================================

DO $$
DECLARE
  bp_version_id uuid;
BEGIN
  -- Get the active Amazon blueprint version
  SELECT bv.id INTO bp_version_id
  FROM blueprint_versions bv
  JOIN review_blueprints rb ON rb.id = bv.blueprint_id
  WHERE rb.name LIKE '%Amazon%'
    AND bv.is_active = true
  ORDER BY bv.created_at DESC
  LIMIT 1;

  IF bp_version_id IS NOT NULL THEN
    -- Insert or update default for nueva_planta
    INSERT INTO contract_type_review_defaults (
      contract_type_code,
      default_blueprint_version_id,
      effective_from
    ) VALUES (
      'nueva_planta',
      bp_version_id,
      NOW()
    )
    ON CONFLICT (contract_type_code)
    WHERE effective_until IS NULL
    DO UPDATE SET
      default_blueprint_version_id = EXCLUDED.default_blueprint_version_id,
      updated_at = NOW();

    RAISE NOTICE 'contract_type_review_defaults configured for nueva_planta (blueprint: %)', bp_version_id;
  ELSE
    RAISE NOTICE 'No active Amazon blueprint found. Create one first.';
  END IF;
END $$;

-- ===========================================================================
-- 4) Verification
-- ===========================================================================

SELECT
  'documents' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
  AND column_name IN ('blueprint_version_id', 'playbook_id', 'contract_type')

UNION ALL

SELECT
  'contract_runs' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contract_runs'
  AND column_name IN ('blueprint_version_id', 'contract_model_version_id')

ORDER BY table_name, column_name;

-- Check contract_type_review_defaults
SELECT
  contract_type_code,
  default_blueprint_version_id,
  effective_from,
  effective_until
FROM contract_type_review_defaults
WHERE contract_type_code = 'nueva_planta';
