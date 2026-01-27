-- 008_fix_auth_trigger.sql
-- Purpose: Fix 'handle_new_user' trigger stability and security
-- Context: Resolves Lovable Cloud 'Database error querying schema' (HTTP 500)

-- 1. Drop existing trigger and function to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Validate Profile Table Exists (Safety check)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Re-create robust, idempotent function
-- Added: SET search_path = public (Security Best Practice)
-- Added: ON CONFLICT DO UPDATE (Prevents race conditions with seeding scripts)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Re-attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Verification: Grant permissions explicitly
GRANT ALL ON public.profiles TO postgres, service_role, authenticated, anon;
grant usage on schema public to postgres, anon, authenticated, service_role;
