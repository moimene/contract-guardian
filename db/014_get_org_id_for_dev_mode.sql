-- 014_get_org_id_for_dev_mode.sql
-- Purpose: Retrieve a valid Organization ID to configure the frontend DEV_USER bypass.
-- Usage: Run this in Supabase SQL Editor and copy the 'id' to use in useAuth.tsx

SELECT id, name, slug 
FROM public.organizations 
ORDER BY created_at ASC 
LIMIT 1;
