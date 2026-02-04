-- ================================================================
-- CG-003: Run Lifecycle & Stuck Processing - SQL Migration
-- ================================================================
-- 
-- Implements:
-- 1. Extended status values (FAILED, TIMEOUT, COMPLETED_WITH_ERRORS)
-- 2. pg_cron watchdog to kill zombie PROCESSING runs
-- 3. Completion tracking with error handling
--
-- Version: 1.0
-- Date: 2026-02-01
-- Track: CG-003
-- ================================================================

-- 1. Check current status values and validate
DO $$
BEGIN
    -- Log current state (for debugging)
    RAISE NOTICE 'Migrating contract_runs lifecycle states...';
END $$;

-- 2. Add constraint for valid status values
-- First remove old constraint if exists
ALTER TABLE contract_runs 
DROP CONSTRAINT IF EXISTS contract_runs_status_check;

-- Add new constraint with extended states
ALTER TABLE contract_runs 
ADD CONSTRAINT contract_runs_status_check 
CHECK (status IN (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'COMPLETED_WITH_ERRORS',  -- NEW: Some clauses failed but run finished
    'FAILED',                  -- NEW: Run failed completely
    'TIMEOUT',                 -- NEW: Run exceeded time limit
    'CANCELLED'                -- NEW: User cancelled
));

-- 3. Add error tracking columns if not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contract_runs' AND column_name = 'failed_clauses'
    ) THEN
        ALTER TABLE contract_runs ADD COLUMN failed_clauses integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contract_runs' AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE contract_runs ADD COLUMN last_activity_at timestamptz;
    END IF;
END $$;

-- 4. Create watchdog function
CREATE OR REPLACE FUNCTION watchdog_kill_zombie_runs()
RETURNS integer AS $$
DECLARE
    killed_count integer := 0;
    zombie_run record;
BEGIN
    -- Find runs stuck in PROCESSING for more than 1 hour
    FOR zombie_run IN 
        SELECT run_id, started_at
        FROM contract_runs
        WHERE status = 'PROCESSING'
          AND started_at < NOW() - INTERVAL '1 hour'
    LOOP
        -- Mark as TIMEOUT
        UPDATE contract_runs
        SET 
            status = 'TIMEOUT',
            error_message = COALESCE(error_message, '') || ' | WATCHDOG: Run exceeded 1 hour limit at ' || NOW()::text,
            completed_at = NOW()
        WHERE run_id = zombie_run.run_id;
        
        killed_count := killed_count + 1;
        
        RAISE NOTICE 'Killed zombie run: %', zombie_run.run_id;
    END LOOP;
    
    RETURN killed_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create pg_cron job (runs every 15 minutes)
-- NOTE: pg_cron must be enabled in Supabase project settings

-- Check if pg_cron is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove existing job if exists
        PERFORM cron.unschedule('watchdog_zombie_runs');
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'pg_cron not enabled - skipping cron job creation';
END $$;

-- Schedule the job
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'watchdog_zombie_runs',           -- job name
            '*/15 * * * *',                   -- every 15 minutes
            'SELECT watchdog_kill_zombie_runs()'
        );
        RAISE NOTICE 'Scheduled watchdog_zombie_runs cron job';
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'pg_cron not available - run watchdog manually';
END $$;

-- 6. Create helper function to safely complete runs
CREATE OR REPLACE FUNCTION complete_run_safely(
    p_run_id uuid,
    p_processed_clauses integer DEFAULT NULL,
    p_failed_clauses integer DEFAULT 0
)
RETURNS text AS $$
DECLARE
    v_total_clauses integer;
    v_new_status text;
BEGIN
    -- Get total clauses
    SELECT total_clauses INTO v_total_clauses
    FROM contract_runs
    WHERE run_id = p_run_id;
    
    IF NOT FOUND THEN
        RETURN 'ERROR: Run not found';
    END IF;
    
    -- Determine final status
    IF p_failed_clauses > 0 THEN
        v_new_status := 'COMPLETED_WITH_ERRORS';
    ELSE
        v_new_status := 'COMPLETED';
    END IF;
    
    -- Update run
    UPDATE contract_runs
    SET 
        status = v_new_status,
        processed_clauses = COALESCE(p_processed_clauses, total_clauses),
        failed_clauses = p_failed_clauses,
        completed_at = NOW()
    WHERE run_id = p_run_id
      AND status = 'PROCESSING';  -- Only complete if still processing
    
    IF NOT FOUND THEN
        RETURN 'WARNING: Run was not in PROCESSING state';
    END IF;
    
    RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to fail a run
CREATE OR REPLACE FUNCTION fail_run(
    p_run_id uuid,
    p_error_message text DEFAULT 'Unknown error'
)
RETURNS void AS $$
BEGIN
    UPDATE contract_runs
    SET 
        status = 'FAILED',
        error_message = p_error_message,
        completed_at = NOW()
    WHERE run_id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Migrate existing PROCESSING runs that are stuck (older than 2 hours)
UPDATE contract_runs
SET 
    status = 'TIMEOUT',
    error_message = 'MIGRATION: Run was stuck from before CG-003 deployment',
    completed_at = NOW()
WHERE status = 'PROCESSING'
  AND started_at < NOW() - INTERVAL '2 hours';

-- 9. Create index for performance
CREATE INDEX IF NOT EXISTS idx_contract_runs_status_started 
ON contract_runs(status, started_at);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
/*
-- Check status distribution after migration
SELECT status, COUNT(*) FROM contract_runs GROUP BY status;

-- Verify watchdog can be called
SELECT watchdog_kill_zombie_runs();

-- Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'watchdog_zombie_runs';
*/
