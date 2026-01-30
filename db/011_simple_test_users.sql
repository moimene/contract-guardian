-- ===========================================
-- 011_simple_test_users.sql
-- Contract Guardian - Simple Test Users
-- ===========================================
-- Credentials:
--   demo@demo.com / demo1234
--   test@test.com / test1234
-- ===========================================

-- Ensure extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    demo_uid UUID;
    test_uid UUID;
    org_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Ensure organization exists
    INSERT INTO public.organizations (id, name, slug, is_active)
    VALUES (org_id, 'Demo Organization', 'demo-org', true)
    ON CONFLICT (id) DO NOTHING;

    -- ===========================================
    -- User 1: demo@demo.com / demo1234
    -- ===========================================
    SELECT id INTO demo_uid FROM auth.users WHERE email = 'demo@demo.com';
    
    IF demo_uid IS NULL THEN
        demo_uid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin
        ) VALUES (
            demo_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'demo@demo.com',
            crypt('demo1234', gen_salt('bf')),
            now(), now(), now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Demo User"}',
            false
        );
        
        RAISE NOTICE 'Created demo@demo.com with ID: %', demo_uid;
    ELSE
        -- Update password
        UPDATE auth.users SET encrypted_password = crypt('demo1234', gen_salt('bf')) WHERE id = demo_uid;
        RAISE NOTICE 'Updated password for demo@demo.com (ID: %)', demo_uid;
    END IF;
    
    -- Profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (demo_uid, 'Demo User')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    
    -- Org membership
    INSERT INTO public.org_memberships (user_id, organization_id, role)
    VALUES (demo_uid, org_id, 'client_user')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    -- ===========================================
    -- User 2: test@test.com / test1234
    -- ===========================================
    SELECT id INTO test_uid FROM auth.users WHERE email = 'test@test.com';
    
    IF test_uid IS NULL THEN
        test_uid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin
        ) VALUES (
            test_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'test@test.com',
            crypt('test1234', gen_salt('bf')),
            now(), now(), now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Test User"}',
            false
        );
        
        RAISE NOTICE 'Created test@test.com with ID: %', test_uid;
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('test1234', gen_salt('bf')) WHERE id = test_uid;
        RAISE NOTICE 'Updated password for test@test.com (ID: %)', test_uid;
    END IF;
    
    -- Profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (test_uid, 'Test User')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    
    -- Org membership
    INSERT INTO public.org_memberships (user_id, organization_id, role)
    VALUES (test_uid, org_id, 'firm_admin')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Test users ready:';
    RAISE NOTICE '  demo@demo.com / demo1234';
    RAISE NOTICE '  test@test.com / test1234';
    RAISE NOTICE '=================================';
END $$;

-- Verify users
SELECT email, confirmed_at IS NOT NULL as confirmed FROM auth.users 
WHERE email IN ('demo@demo.com', 'test@test.com');
