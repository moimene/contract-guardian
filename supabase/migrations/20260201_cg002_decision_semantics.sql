-- ================================================================
-- CG-002: Decision Semantics Alignment - SQL Migration
-- ================================================================
-- 
-- Adds normalized decision values and updates views
-- Run AFTER existing schema is in place
--
-- Version: 1.0
-- Date: 2026-02-01
-- Track: CG-002
-- ================================================================

-- 1. Add normalized columns if not exist
DO $$
BEGIN
    -- Add decision_normalized if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clause_reviews' AND column_name = 'decision_normalized'
    ) THEN
        ALTER TABLE clause_reviews 
        ADD COLUMN decision_normalized text 
        CHECK (decision_normalized IN ('accept', 'modify', 'escalate', 'reject'));
    END IF;

    -- Add client_state if not exists (already exists per schema query)
    -- Just add constraint if missing
END $$;

-- 2. Create mapping function for normalization
CREATE OR REPLACE FUNCTION normalize_decision(raw_decision text)
RETURNS text AS $$
BEGIN
    RETURN CASE UPPER(COALESCE(raw_decision, ''))
        -- Accept category
        WHEN 'AUTO_PASS' THEN 'accept'
        WHEN 'ACCEPT' THEN 'accept'
        WHEN 'ACCEPT_AS_IS' THEN 'accept'
        WHEN 'APPROVE' THEN 'accept'
        WHEN 'APPROVE_WITH_NOTES' THEN 'accept'
        WHEN 'ACCEPT_WITH_NOTES' THEN 'accept'
        WHEN 'LOG_ONLY' THEN 'accept'
        -- Modify category
        WHEN 'SUGGEST_REDLINE' THEN 'modify'
        WHEN 'REDLINE' THEN 'modify'
        WHEN 'AUTO_REDLINE' THEN 'modify'
        -- Escalate category
        WHEN 'ESCALATE' THEN 'escalate'
        WHEN 'ESCALATE_HUMAN' THEN 'escalate'
        WHEN 'NEEDS_REVIEW' THEN 'escalate'
        WHEN 'FLAG' THEN 'escalate'
        -- Reject category
        WHEN 'BLOCK_EXPORT' THEN 'reject'
        WHEN 'REJECT' THEN 'reject'
        WHEN 'BLOCK' THEN 'reject'
        -- Default
        ELSE 'escalate'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create client_state derivation function
CREATE OR REPLACE FUNCTION derive_client_state(raw_decision text)
RETURNS text AS $$
BEGIN
    RETURN CASE UPPER(COALESCE(raw_decision, ''))
        -- Accepted (auto-approved)
        WHEN 'AUTO_PASS' THEN 'accepted'
        WHEN 'ACCEPT' THEN 'accepted'
        WHEN 'ACCEPT_AS_IS' THEN 'accepted'
        -- Pending review
        WHEN 'APPROVE_WITH_NOTES' THEN 'pending_review'
        WHEN 'ACCEPT_WITH_NOTES' THEN 'pending_review'
        WHEN 'LOG_ONLY' THEN 'pending_review'
        WHEN 'SUGGEST_REDLINE' THEN 'pending_review'
        WHEN 'ESCALATE' THEN 'pending_review'
        WHEN 'ESCALATE_HUMAN' THEN 'pending_review'
        WHEN 'NEEDS_REVIEW' THEN 'pending_review'
        WHEN 'FLAG' THEN 'pending_review'
        -- Rejected
        WHEN 'BLOCK_EXPORT' THEN 'rejected'
        WHEN 'REJECT' THEN 'rejected'
        WHEN 'BLOCK' THEN 'rejected'
        -- Default
        ELSE 'pending_review'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Update existing data with normalized values
UPDATE clause_reviews
SET 
    decision_normalized = normalize_decision(decision),
    client_state = COALESCE(
        CASE 
            WHEN client_state IN ('accepted', 'pending_review', 'rejected') THEN client_state
            ELSE NULL
        END,
        derive_client_state(decision)
    )
WHERE decision IS NOT NULL;

-- 5. Normalize legacy client_state values
UPDATE clause_reviews
SET client_state = CASE client_state
    WHEN 'OK' THEN 'accepted'
    WHEN 'RECOMMENDED' THEN 'pending_review'
    WHEN 'REQUIRED' THEN 'pending_review'
    WHEN 'NEEDS_REVIEW' THEN 'pending_review'
    ELSE 'pending_review'
END
WHERE client_state NOT IN ('accepted', 'pending_review', 'rejected');

-- 6. Create or replace the clause_reviews_ui view
CREATE OR REPLACE VIEW clause_reviews_ui AS
SELECT 
    cr.review_id,
    cr.run_id,
    cr.clause_instance_id,
    cr.document_id,
    cr.detected_family,
    cr.heading,
    cr.sequence_number,
    -- Normalized decision (uses function for null cases)
    COALESCE(cr.decision_normalized, normalize_decision(cr.decision)) as decision,
    -- Derived client_state
    CASE 
        WHEN cr.client_state IN ('accepted', 'pending_review', 'rejected') THEN cr.client_state
        ELSE derive_client_state(cr.decision)
    END as client_state,
    cr.client_summary_line,
    cr.confidence_score,
    cr.requires_approval,
    cr.approval_role,
    cr.created_at,
    cr.updated_at,
    -- UI-friendly flags
    (cr.client_state = 'accepted' OR derive_client_state(cr.decision) = 'accepted') as is_auto_approved,
    (cr.client_state = 'rejected' OR derive_client_state(cr.decision) = 'rejected') as is_blocked,
    (cr.requires_approval = true) as needs_legal_review
FROM clause_reviews cr;

-- 7. Grant access
GRANT SELECT ON clause_reviews_ui TO authenticated;
GRANT SELECT ON clause_reviews_ui TO anon;

-- 8. Add index for performance
CREATE INDEX IF NOT EXISTS idx_clause_reviews_client_state 
ON clause_reviews(client_state);

CREATE INDEX IF NOT EXISTS idx_clause_reviews_decision_normalized 
ON clause_reviews(decision_normalized);

-- ================================================================
-- VERIFICATION QUERIES (run manually to confirm)
-- ================================================================
/*
-- Check distinct values after migration
SELECT decision, decision_normalized, client_state, COUNT(*)
FROM clause_reviews
GROUP BY decision, decision_normalized, client_state
ORDER BY COUNT(*) DESC;

-- Verify no invalid client_state values
SELECT * FROM clause_reviews
WHERE client_state NOT IN ('accepted', 'pending_review', 'rejected');

-- Test the view
SELECT decision, client_state, is_auto_approved, is_blocked, COUNT(*)
FROM clause_reviews_ui
GROUP BY decision, client_state, is_auto_approved, is_blocked;
*/
