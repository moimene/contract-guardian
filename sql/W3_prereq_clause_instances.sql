-- W3_prereq_clause_instances.sql
-- Creates clause_instances table to store extracted clauses
-- Run BEFORE deploying W3_ContractReview_3Layer workflow

-- ===========================================================================
-- 1) Create clause_instances table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.clause_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(document_id) ON DELETE CASCADE,
  run_id UUID,
  sequence_number INT NOT NULL DEFAULT 0,
  clause_number TEXT,
  heading TEXT,
  clause_text TEXT NOT NULL,
  probable_category TEXT,
  -- Extraction metadata
  extraction_method TEXT DEFAULT 'llm',  -- 'llm', 'manual', 'regex', 'sample'
  extraction_confidence NUMERIC(4,3),
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clause_instances_document
  ON public.clause_instances(document_id);

CREATE INDEX IF NOT EXISTS idx_clause_instances_run
  ON public.clause_instances(run_id);

CREATE INDEX IF NOT EXISTS idx_clause_instances_category
  ON public.clause_instances(probable_category);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS clause_instances_set_updated_at ON public.clause_instances;
CREATE TRIGGER clause_instances_set_updated_at
  BEFORE UPDATE ON public.clause_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================================
-- 2) Add raw_content column to documents (if not exists)
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'documents'
    AND column_name = 'raw_content'
  ) THEN
    ALTER TABLE public.documents
    ADD COLUMN raw_content TEXT;

    COMMENT ON COLUMN public.documents.raw_content IS
      'Raw text content extracted from the uploaded document (PDF/DOCX)';

    RAISE NOTICE 'Added raw_content column to documents table';
  ELSE
    RAISE NOTICE 'raw_content column already exists';
  END IF;
END $$;

-- ===========================================================================
-- 3) View: Clauses with review status
-- ===========================================================================

CREATE OR REPLACE VIEW public.clause_instances_with_reviews AS
SELECT
  ci.id,
  ci.document_id,
  ci.run_id,
  ci.sequence_number,
  ci.clause_number,
  ci.heading,
  ci.clause_text,
  ci.probable_category,
  cr.client_state,
  cr.acceptance,
  cr.client_comment,
  cr.escalation_recommended
FROM clause_instances ci
LEFT JOIN clause_reviews cr ON cr.clause_instance_id = ci.id::text;

-- ===========================================================================
-- 4) Function: Get document clauses with reviews
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.get_document_clauses(p_document_id UUID)
RETURNS TABLE (
  clause_id UUID,
  sequence_number INT,
  clause_number TEXT,
  heading TEXT,
  clause_text TEXT,
  probable_category TEXT,
  review_status TEXT,
  acceptance TEXT,
  client_comment TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ci.id as clause_id,
    ci.sequence_number,
    ci.clause_number,
    ci.heading,
    ci.clause_text,
    ci.probable_category,
    cr.client_state as review_status,
    cr.acceptance::text,
    cr.client_comment
  FROM clause_instances ci
  LEFT JOIN clause_reviews cr ON cr.clause_instance_id = ci.id::text
  WHERE ci.document_id = p_document_id
  ORDER BY ci.sequence_number;
$$;

-- ===========================================================================
-- 5) Verification
-- ===========================================================================

SELECT
  'clause_instances' as table_name,
  COUNT(*) as row_count
FROM clause_instances

UNION ALL

SELECT
  'documents_with_content',
  COUNT(*)
FROM documents
WHERE raw_content IS NOT NULL;
