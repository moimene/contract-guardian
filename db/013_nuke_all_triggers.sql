-- 013_nuke_all_triggers.sql
-- Purpose: NUKE OPTION. Drop ALL triggers on auth.users (Insert, Update, Delete).
-- Reason: Login fails with "Database error querying schema". Login updates 'last_sign_in_at',
--         so a broken UPDATE trigger could be the invisible cause.

DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
    LOOP
        -- Execute Drop
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE;', trg.tgname);
        RAISE NOTICE '🔥 DROPPED TRIGGER: %', trg.tgname;
    END LOOP;
END $$;
