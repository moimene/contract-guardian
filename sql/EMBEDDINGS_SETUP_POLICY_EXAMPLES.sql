-- ============================================================================
-- EMBEDDINGS SETUP FOR POLICY_EXAMPLES
-- Amazon Redliner - RAG Semantic Search
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure pgvector extension is enabled
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 2. Add embedding column to policy_examples (if not exists)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'policy_examples' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE policy_examples 
    ADD COLUMN embedding vector(1536);
    
    RAISE NOTICE 'Added embedding column to policy_examples';
  ELSE
    RAISE NOTICE 'embedding column already exists';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Create HNSW index for fast similarity search
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_policy_examples_embedding_hnsw;

CREATE INDEX idx_policy_examples_embedding_hnsw 
ON policy_examples 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_policy_examples_embedding_hnsw IS 
  'HNSW index for fast cosine similarity search on policy example embeddings';

-- -----------------------------------------------------------------------------
-- 4. View to track embedding progress
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW policy_examples_embedding_stats AS
SELECT 
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
  COUNT(*) FILTER (WHERE embedding IS NULL) as pending_embedding,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE embedding IS NOT NULL)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 2
  ) as percent_complete
FROM policy_examples;

-- -----------------------------------------------------------------------------
-- 5. Function: Get pending examples for embedding generation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_embeddings(batch_size INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  example_text TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, example_text
  FROM policy_examples
  WHERE embedding IS NULL
  ORDER BY created_at ASC
  LIMIT batch_size;
$$;

-- -----------------------------------------------------------------------------
-- 6. Function: Update embedding for a policy example
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_policy_example_embedding(
  p_id UUID,
  p_embedding vector(1536)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE policy_examples
  SET embedding = p_embedding
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Function: Semantic search for similar policy examples
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_policy_examples(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_matter_policy_id UUID DEFAULT NULL,
  filter_acceptance acceptance_level DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  example_text TEXT,
  acceptance acceptance_level,
  similarity FLOAT,
  clause_type_name TEXT,
  matter_policy_name TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pe.id,
    pe.example_text,
    pe.acceptance,
    1 - (pe.embedding <=> query_embedding) as similarity,
    ct.name as clause_type_name,
    mp.name as matter_policy_name
  FROM policy_examples pe
  LEFT JOIN clause_types ct ON pe.clause_type_id = ct.id
  LEFT JOIN matter_policies mp ON pe.matter_policy_id = mp.id
  WHERE 
    pe.embedding IS NOT NULL
    AND 1 - (pe.embedding <=> query_embedding) >= match_threshold
    AND (filter_matter_policy_id IS NULL OR pe.matter_policy_id = filter_matter_policy_id)
    AND (filter_acceptance IS NULL OR pe.acceptance = filter_acceptance)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- -----------------------------------------------------------------------------
-- 8. Function: Get examples by clause type with similarity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_similar_examples_by_clause_type(
  query_embedding vector(1536),
  p_clause_type_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  example_text TEXT,
  acceptance acceptance_level,
  similarity FLOAT,
  normalized_terms TEXT[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pe.id,
    pe.example_text,
    pe.acceptance,
    1 - (pe.embedding <=> query_embedding) as similarity,
    pe.normalized_terms
  FROM policy_examples pe
  WHERE 
    pe.clause_type_id = p_clause_type_id
    AND pe.embedding IS NOT NULL
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- -----------------------------------------------------------------------------
-- 9. Stats function for dashboard
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_policy_examples_stats()
RETURNS TABLE (
  matter_policy_name TEXT,
  total_examples BIGINT,
  acceptable_count BIGINT,
  passable_count BIGINT,
  unacceptable_count BIGINT,
  with_embedding BIGINT,
  pending_embedding BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    mp.name as matter_policy_name,
    COUNT(*) as total_examples,
    COUNT(*) FILTER (WHERE pe.acceptance = 'ACCEPTABLE') as acceptable_count,
    COUNT(*) FILTER (WHERE pe.acceptance = 'PASSABLE') as passable_count,
    COUNT(*) FILTER (WHERE pe.acceptance = 'UNACCEPTABLE') as unacceptable_count,
    COUNT(*) FILTER (WHERE pe.embedding IS NOT NULL) as with_embedding,
    COUNT(*) FILTER (WHERE pe.embedding IS NULL) as pending_embedding
  FROM policy_examples pe
  LEFT JOIN matter_policies mp ON pe.matter_policy_id = mp.id
  GROUP BY mp.name
  ORDER BY total_examples DESC;
$$;

-- -----------------------------------------------------------------------------
-- 10. Test the stats view
-- -----------------------------------------------------------------------------
SELECT * FROM policy_examples_embedding_stats;
