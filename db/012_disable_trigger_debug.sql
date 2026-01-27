-- 012_disable_trigger_debug.sql
-- Purpose: Temporarily DROP the trigger to confirm if it is the blocking cause.
-- Context: 'Database error querying schema' usually implies a trigger failure on auth.users.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Also try to drop the function to be sure no dependencies remain active
-- DROP FUNCTION IF EXISTS public.handle_new_user(); 
-- Commented out the function drop just in case we want to re-attach it easily later,
-- but dropping the trigger is enough to stop it from firing.
