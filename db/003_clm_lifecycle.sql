-- Contract Guardian PRD v2.3 - CLM Lifecycle Extension
-- Adds Contract Lifecycle Management states and Redline Set tracking

-- ============================================================
-- Contract Lifecycle Status Type
-- ============================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_lifecycle_status') THEN
        CREATE TYPE contract_lifecycle_status AS ENUM (
            'DRAFT_REVIEW',
            'REDLINE_READY', 
            'SENT_FOR_NEGOTIATION',
            'UNDER_NEGOTIATION',
            'READY_FOR_SIGNATURE',
            'ARCHIVED'
        );
    END IF;
END $$;

-- ============================================================
-- Extend contract_runs with lifecycle status
-- ============================================================

ALTER TABLE public.contract_runs 
ADD COLUMN IF NOT EXISTS lifecycle_status contract_lifecycle_status DEFAULT 'DRAFT_REVIEW';

-- ============================================================
-- Redline Set aggregation fields (computed on update)
-- ============================================================

ALTER TABLE public.contract_runs
ADD COLUMN IF NOT EXISTS redline_accepted_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS redline_rejected_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS redline_pending_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifecycle_updated_at TIMESTAMPTZ;

-- ============================================================
-- CLM Events Log (for audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clm_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clm_events_run_id ON public.clm_events(run_id);
CREATE INDEX IF NOT EXISTS idx_clm_events_document_id ON public.clm_events(document_id);

-- RLS for clm_events
ALTER TABLE public.clm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.clm_events 
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Function to update redline counts (can be called via trigger or RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION update_redline_counts(p_run_id TEXT)
RETURNS void AS $$
DECLARE
    v_accepted INTEGER;
    v_rejected INTEGER;
    v_pending INTEGER;
BEGIN
    -- Count from clause_reviews_internal proposed_changes JSONB
    SELECT 
        COALESCE(SUM(
            (SELECT COUNT(*) FROM jsonb_array_elements(proposed_changes) AS c 
             WHERE (c->>'accepted')::boolean = true)
        ), 0),
        COALESCE(SUM(
            (SELECT COUNT(*) FROM jsonb_array_elements(proposed_changes) AS c 
             WHERE (c->>'rejected')::boolean = true)
        ), 0),
        COALESCE(SUM(
            (SELECT COUNT(*) FROM jsonb_array_elements(proposed_changes) AS c 
             WHERE (c->>'accepted')::boolean IS NOT TRUE 
               AND (c->>'rejected')::boolean IS NOT TRUE)
        ), 0)
    INTO v_accepted, v_rejected, v_pending
    FROM public.clause_reviews_internal
    WHERE run_id = p_run_id;

    UPDATE public.contract_runs
    SET 
        redline_accepted_count = v_accepted,
        redline_rejected_count = v_rejected,
        redline_pending_count = v_pending,
        lifecycle_updated_at = NOW()
    WHERE run_id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RPC to transition lifecycle status
-- ============================================================

CREATE OR REPLACE FUNCTION transition_lifecycle_status(
    p_run_id TEXT,
    p_new_status TEXT,
    p_actor_email TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_current_status TEXT;
    v_valid_transitions jsonb := '{
        "DRAFT_REVIEW": ["REDLINE_READY"],
        "REDLINE_READY": ["SENT_FOR_NEGOTIATION", "DRAFT_REVIEW"],
        "SENT_FOR_NEGOTIATION": ["UNDER_NEGOTIATION", "REDLINE_READY"],
        "UNDER_NEGOTIATION": ["READY_FOR_SIGNATURE", "SENT_FOR_NEGOTIATION"],
        "READY_FOR_SIGNATURE": ["ARCHIVED", "UNDER_NEGOTIATION"],
        "ARCHIVED": []
    }'::jsonb;
BEGIN
    -- Get current status
    SELECT lifecycle_status::text INTO v_current_status
    FROM public.contract_runs
    WHERE run_id = p_run_id;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Run not found');
    END IF;

    -- Validate transition
    IF NOT (v_valid_transitions->v_current_status ? p_new_status) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', format('Invalid transition from %s to %s', v_current_status, p_new_status)
        );
    END IF;

    -- Update status
    UPDATE public.contract_runs
    SET 
        lifecycle_status = p_new_status::contract_lifecycle_status,
        lifecycle_updated_at = NOW()
    WHERE run_id = p_run_id;

    -- Log event
    INSERT INTO public.clm_events (run_id, document_id, from_status, to_status, action, actor_email, notes)
    SELECT p_run_id, document_id, v_current_status, p_new_status, 'TRANSITION', p_actor_email, p_notes
    FROM public.contract_runs WHERE run_id = p_run_id;

    RETURN jsonb_build_object(
        'success', true, 
        'from', v_current_status, 
        'to', p_new_status
    );
END;
$$ LANGUAGE plpgsql;
