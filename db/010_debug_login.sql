-- 010_debug_login.sql
-- Purpose: Debug Login Failure (Database error querying schema)
-- Actions: 
-- 1. Checks if 'client@test.com' has all required rows (Profile, Role, Membership).
-- 2. Resets RLS policies to ensure they are not blocking the frontend.

DO $$
DECLARE
    target_email text := 'client@test.com';
    u_id uuid;
    p_exists boolean;
    r_exists boolean;
    om_exists boolean;
BEGIN
    -- 1. Get User UUID
    SELECT id INTO u_id FROM auth.users WHERE email = target_email;
    
    IF u_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: User % NOT FOUND in auth.users. Please create the user first.', target_email;
        RETURN;
    END IF;

    -- 2. Check Tables
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = u_id) INTO p_exists;
    SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = u_id) INTO r_exists;
    SELECT EXISTS(SELECT 1 FROM public.org_memberships WHERE user_id = u_id) INTO om_exists;

    -- 3. Report Status
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'DEBUG REPORT FOR: % (UUID: %)', target_email, u_id;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE '1. Profile Table:       %', CASE WHEN p_exists THEN 'OK ✅' ELSE 'MISSING ❌' END;
    RAISE NOTICE '2. User Roles Table:    %', CASE WHEN r_exists THEN 'OK ✅' ELSE 'MISSING ❌' END;
    RAISE NOTICE '3. Org Memberships:     %', CASE WHEN om_exists THEN 'OK ✅' ELSE 'MISSING ❌' END;
    RAISE NOTICE '==================================================';

    -- 4. Auto-Repair if Missing
    IF NOT p_exists THEN
        INSERT INTO public.profiles (id, full_name, avatar_url) VALUES (u_id, 'Repaired Client', '') ON CONFLICT DO NOTHING;
        RAISE NOTICE '🔧 Repaired Profile.';
    END IF;
    
    IF NOT r_exists THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (u_id, 'client') ON CONFLICT DO NOTHING;
        RAISE NOTICE '🔧 Repaired User Role.';
    END IF;
    
    IF NOT om_exists THEN
        -- Find any org
        INSERT INTO public.org_memberships (user_id, organization_id, role) 
        SELECT u_id, id, 'client_user' FROM public.organizations LIMIT 1
        ON CONFLICT DO NOTHING;
        RAISE NOTICE '🔧 Repaired Org Membership.';
    END IF;

END $$;

-- ============================================================
-- 5. FORCE RESET RLS POLICIES (To rule out permissions)
-- ============================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- USER ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ORG MEMBERSHIPS
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own membership" ON public.org_memberships;
CREATE POLICY "Users can view own membership" ON public.org_memberships FOR SELECT USING (auth.uid() = user_id);

-- ORGANIZATIONS (Public read for members)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization" ON public.organizations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_memberships 
        WHERE organization_id = organizations.id 
        AND user_id = auth.uid()
    )
);

RAISE NOTICE '✅ RLS Policies has been RESET to ensure access.';
