-- ============================================================================
-- MIGRACIÓN: Sistema de Revisión de Cláusulas para Contract Guardian
-- Ejecutar en: Tu Supabase externo (hvlsuwdqtfiilvampxq)
-- Fecha: 2026-01-17
-- ============================================================================

-- ============================================================================
-- 1. CREATE CLAUSE_REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clause_reviews (
  clause_instance_id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  document_id UUID NOT NULL,
  run_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  heading TEXT,
  clause_text TEXT,
  detected_family TEXT,
  confidence_score NUMERIC DEFAULT 0,
  client_state TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  client_comment TEXT,
  client_summary_line TEXT,
  proposed_changes JSONB DEFAULT '[]'::jsonb,
  escalation_recommended BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on clause_reviews
ALTER TABLE public.clause_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for viewing clause_reviews
DROP POLICY IF EXISTS "Users can view org clause reviews" ON public.clause_reviews;
CREATE POLICY "Users can view org clause reviews" ON public.clause_reviews
  FOR SELECT
  USING (document_id IN (
    SELECT documents.document_id
    FROM documents
    WHERE documents.tenant_id IN (
      SELECT org_memberships.organization_id
      FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
    )
  ));

-- Create RLS policy for updating clause_reviews
DROP POLICY IF EXISTS "Users can update org clause reviews" ON public.clause_reviews;
CREATE POLICY "Users can update org clause reviews" ON public.clause_reviews
  FOR UPDATE
  USING (document_id IN (
    SELECT documents.document_id
    FROM documents
    WHERE documents.tenant_id IN (
      SELECT org_memberships.organization_id
      FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
    )
  ));

-- Create RLS policy for inserting clause_reviews
DROP POLICY IF EXISTS "Users can insert org clause reviews" ON public.clause_reviews;
CREATE POLICY "Users can insert org clause reviews" ON public.clause_reviews
  FOR INSERT
  WITH CHECK (document_id IN (
    SELECT documents.document_id
    FROM documents
    WHERE documents.tenant_id IN (
      SELECT org_memberships.organization_id
      FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
    )
  ));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clause_reviews_document_id ON public.clause_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_run_id ON public.clause_reviews(run_id);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_client_state ON public.clause_reviews(client_state);

-- Add trigger for automatic updated_at (create function first if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clause_reviews_updated_at ON public.clause_reviews;
CREATE TRIGGER update_clause_reviews_updated_at
  BEFORE UPDATE ON public.clause_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for clause_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.clause_reviews;


-- ============================================================================
-- 2. MODIFY ESCALATION_REQUESTS TABLE
-- ============================================================================

-- Add new columns to escalation_requests
ALTER TABLE public.escalation_requests
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS context TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add escalation_id column (create new column and migrate data)
ALTER TABLE public.escalation_requests
  ADD COLUMN IF NOT EXISTS escalation_id UUID DEFAULT gen_random_uuid();

-- Update escalation_id with existing id values
UPDATE public.escalation_requests
  SET escalation_id = id
  WHERE escalation_id IS NULL;

-- Migrate requested_by to created_by
UPDATE public.escalation_requests
  SET created_by = requested_by
  WHERE created_by IS NULL;

-- Migrate message to reason
UPDATE public.escalation_requests
  SET reason = message
  WHERE reason IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON public.escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_urgency ON public.escalation_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_document_id ON public.escalation_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_assigned_to ON public.escalation_requests(assigned_to);

-- Enable realtime for escalation_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_requests;


-- ============================================================================
-- 3. CREATE ESCALATION_COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escalation_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalation_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on escalation_comments
ALTER TABLE public.escalation_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for viewing escalation comments
DROP POLICY IF EXISTS "Users can view org escalation comments" ON public.escalation_comments;
CREATE POLICY "Users can view org escalation comments" ON public.escalation_comments
  FOR SELECT
  USING (escalation_id IN (
    SELECT er.escalation_id
    FROM escalation_requests er
    WHERE er.run_id IN (
      SELECT contract_runs.run_id
      FROM contract_runs
      WHERE contract_runs.document_id IN (
        SELECT documents.document_id
        FROM documents
        WHERE documents.tenant_id IN (
          SELECT org_memberships.organization_id
          FROM org_memberships
          WHERE org_memberships.user_id = auth.uid()
        )
      )
    )
  ));

-- Create RLS policy for inserting escalation comments
DROP POLICY IF EXISTS "Users can insert escalation comments" ON public.escalation_comments;
CREATE POLICY "Users can insert escalation comments" ON public.escalation_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND escalation_id IN (
      SELECT er.escalation_id
      FROM escalation_requests er
      WHERE er.run_id IN (
        SELECT contract_runs.run_id
        FROM contract_runs
        WHERE contract_runs.document_id IN (
          SELECT documents.document_id
          FROM documents
          WHERE documents.tenant_id IN (
            SELECT org_memberships.organization_id
            FROM org_memberships
            WHERE org_memberships.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_escalation_comments_escalation_id ON public.escalation_comments(escalation_id);

-- Enable realtime for escalation_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_comments;


-- ============================================================================
-- 4. UPDATE RLS POLICIES FOR ESCALATION_REQUESTS
-- ============================================================================

-- Add policy for updating escalation requests
DROP POLICY IF EXISTS "Users can update org escalation requests" ON public.escalation_requests;
CREATE POLICY "Users can update org escalation requests" ON public.escalation_requests
  FOR UPDATE
  USING (run_id IN (
    SELECT contract_runs.run_id
    FROM contract_runs
    WHERE contract_runs.document_id IN (
      SELECT documents.document_id
      FROM documents
      WHERE documents.tenant_id IN (
        SELECT org_memberships.organization_id
        FROM org_memberships
        WHERE org_memberships.user_id = auth.uid()
      )
    )
  ));

-- Add policy for inserting escalation requests
DROP POLICY IF EXISTS "Users can insert escalation requests" ON public.escalation_requests;
CREATE POLICY "Users can insert escalation requests" ON public.escalation_requests
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() OR requested_by = auth.uid()
  );


-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
