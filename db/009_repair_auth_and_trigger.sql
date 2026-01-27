-- 009_repair_auth_and_trigger.sql
-- Purpose: Fix 'handle_new_user' to create ALL required dependencies (Profile, Role, Membership)
--          and REPAIR existing test users who might be missing this data.

-- 1. DROP existing trigger/function to update logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE OR REPLACE the enhanced function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id uuid;
BEGIN
  -- A. Create Profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  -- B. Assign Legacy Role (Default to 'client' for self-signups)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- C. Add to Default Organization (if exists)
  -- Try to find the 'Acme Corporation' or ANY active organization
  SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'acme-corp' OR name = 'Acme Corporation' LIMIT 1;
  IF default_org_id IS NULL THEN
     SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
  END IF;
  
  IF default_org_id IS NOT NULL THEN
    INSERT INTO public.org_memberships (user_id, organization_id, role)
    VALUES (NEW.id, default_org_id, 'client_user')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation if possible (or do block, depending on strictness)
  RAISE NOTICE 'handle_new_user auto-setup failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- 4. REPAIR EXISTING TEST USERS (The specific "Fix" requested)
-- ============================================================
DO $$
DECLARE
    client_uid UUID;
    admin_uid UUID;
    org_uid UUID;
BEGIN
    -- Get Org ID (Acme)
    SELECT id INTO org_uid FROM public.organizations WHERE slug = 'acme-corp' LIMIT 1;
    -- Fallback to any org if Acme missing
    IF org_uid IS NULL THEN
        SELECT id INTO org_uid FROM public.organizations LIMIT 1;
    END IF;

    -- REPAIR CLIENT ------------------------------------------
    SELECT id INTO client_uid FROM auth.users WHERE email = 'client@test.com';
    
    IF client_uid IS NOT NULL THEN
        -- Profile
        INSERT INTO public.profiles (id, full_name, avatar_url)
        VALUES (client_uid, 'Carlos Cliente', 'https://api.dicebear.com/7.x/avataaars/svg?seed=client')
        ON CONFLICT (id) DO NOTHING;
        
        -- Role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (client_uid, 'client'::app_role)
        ON CONFLICT DO NOTHING;
        
        -- Membership
        IF org_uid IS NOT NULL THEN
            INSERT INTO public.org_memberships (user_id, organization_id, role)
            VALUES (client_uid, org_uid, 'client_user')
            ON CONFLICT DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Repaired client@test.com data.';
    END IF;

    -- REPAIR ADMIN -------------------------------------------
    SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@test.com';
    
    IF admin_uid IS NOT NULL THEN
        -- Profile
        INSERT INTO public.profiles (id, full_name, avatar_url)
        VALUES (admin_uid, 'Ana Administradora', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin')
        ON CONFLICT (id) DO NOTHING;
        
        -- Role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_uid, 'firm_admin'::app_role)
        ON CONFLICT DO NOTHING;
        
        -- Membership
        IF org_uid IS NOT NULL THEN
            INSERT INTO public.org_memberships (user_id, organization_id, role)
            VALUES (admin_uid, org_uid, 'firm_admin')
            ON CONFLICT DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Repaired admin@test.com data.';
    END IF;
END $$;
