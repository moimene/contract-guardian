-- 007_test_users_seed.sql
-- Purpose: Seed test users and sample documents for Lovable Frontend testing
-- METHOD: Automated (Checks for existing users by email, or creates them)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 0. Dependencies & Patches
-- ============================================================

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Patch documents table with missing columns
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS contract_type_id UUID REFERENCES public.contract_types(id);

-- ============================================================
-- 1. Create Test Organization
-- ============================================================
INSERT INTO public.organizations (id, name, slug, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'acme-corp', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Smart User Seeding Function
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_test_user(
    target_email text,
    target_password text,
    user_full_name text,
    user_role_legacy text, -- 'client' or 'firm_admin'
    org_id uuid,
    org_role text -- 'client_user' or 'firm_admin'
) RETURNS uuid AS $$
DECLARE
    found_id uuid;
    encrypted_pw text;
BEGIN
    -- 1. Check if user exists by email
    SELECT id INTO found_id FROM auth.users WHERE email = target_email;

    -- 2. If not found, create new user
    IF found_id IS NULL THEN
        found_id := gen_random_uuid();
        encrypted_pw := crypt(target_password, gen_salt('bf'));

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin
        )
        VALUES (
            found_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            target_email,
            encrypted_pw,
            now(), -- Auto confirmed
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', user_full_name),
            false
        );
    ELSE
        -- Update password if exists (optional, ensures test credentials work)
        UPDATE auth.users 
        SET encrypted_password = crypt(target_password, gen_salt('bf'))
        WHERE id = found_id;
    END IF;

    -- 3. Ensure Profile
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        found_id, 
        user_full_name, 
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || target_email
    )
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 4. Ensure Organization Membership
    INSERT INTO public.org_memberships (user_id, organization_id, role)
    VALUES (found_id, org_id, org_role::text) -- cast if necessary
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

    -- 5. Ensure Legacy Role
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (found_id, user_role_legacy)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Ignore
    END;

    RETURN found_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Execute Seeding
-- ============================================================

DO $$
DECLARE
    client_uuid UUID;
    admin_uuid UUID;
BEGIN
    -- 3.1 Client User
    client_uuid := get_or_create_test_user(
        'client@test.com',
        'test123456',
        'Carlos Cliente',
        'client',
        '11111111-1111-1111-1111-111111111111',
        'client_user'
    );
    
    RAISE NOTICE 'Client UUID: %', client_uuid;

    -- 3.2 Admin User
    admin_uuid := get_or_create_test_user(
        'admin@test.com',
        'test123456',
        'Ana Administradora',
        'firm_admin',
        '11111111-1111-1111-1111-111111111111',
        'firm_admin'
    );
    
    RAISE NOTICE 'Admin UUID: %', admin_uuid;

    -- ============================================================
    -- 4. Sample Documents (Linked to Client)
    -- ============================================================
    
    -- 4.1 PROCESSING State
    INSERT INTO public.documents (
        document_id, tenant_id, uploaded_by, file_name, file_path, contract_type_id, 
        contract_decision, status, created_at, processing_started_at
    )
    VALUES (
        '44444444-4444-4444-4444-444444444441',
        '11111111-1111-1111-1111-111111111111',
        client_uuid,
        'Contrato_Streaming_Netflix_2024.docx',
        '11111111-1111-1111-1111-111111111111/Contrato_Streaming_Netflix_2024.docx',
        (SELECT id FROM public.contract_types WHERE code = 'dsa_streaming_v1' LIMIT 1),
        'PROCESSING',
        'processing',
        now() - interval '20 minutes',
        now() - interval '19 minutes'
    ) ON CONFLICT (document_id) DO UPDATE SET uploaded_by = client_uuid;
    
    INSERT INTO public.contract_runs (run_id, document_id, decision, status, total_clauses, processed_clauses, created_at)
    VALUES (gen_random_uuid(), '44444444-4444-4444-4444-444444444441', 'PROCESSING', 'PROCESSING', 25, 12, now() - interval '19 minutes')
    ON CONFLICT DO NOTHING;

    -- 4.2 READY_FOR_EXPORT State
    INSERT INTO public.documents (
        document_id, tenant_id, uploaded_by, file_name, file_path, contract_type_id, contract_decision, status, created_at
    )
    VALUES (
        '44444444-4444-4444-4444-444444444442',
        '11111111-1111-1111-1111-111111111111',
        client_uuid,
        'DSA_Amazon_Prime_Q4.docx',
        '11111111-1111-1111-1111-111111111111/DSA_Amazon_Prime_Q4.docx',
        (SELECT id FROM public.contract_types WHERE code = 'dsa_streaming_v1' LIMIT 1),
        'READY_FOR_EXPORT',
        'analyzed',
        now() - interval '2 days'
    ) ON CONFLICT (document_id) DO UPDATE SET uploaded_by = client_uuid;
    
    INSERT INTO public.contract_runs (run_id, document_id, decision, status, total_clauses, processed_clauses, created_at)
    VALUES (gen_random_uuid(), '44444444-4444-4444-4444-444444444442', 'READY_FOR_EXPORT', 'COMPLETED', 40, 40, now() - interval '2 days')
    ON CONFLICT DO NOTHING;

    -- 4.3 ESCALATE_HUMAN State
    INSERT INTO public.documents (
        document_id, tenant_id, uploaded_by, file_name, file_path, contract_type_id, contract_decision, status, created_at, escalations_pending
    )
    VALUES (
        '44444444-4444-4444-4444-444444444443',
        '11111111-1111-1111-1111-111111111111',
        client_uuid,
        'Acuerdo_Disney_Plus_Revision.docx',
        '11111111-1111-1111-1111-111111111111/Acuerdo_Disney_Plus_Revision.docx',
        (SELECT id FROM public.contract_types WHERE code = 'dsa_streaming_v1' LIMIT 1),
        'ESCALATE_HUMAN',
        'analyzed',
        now() - interval '5 hours',
        1
    ) ON CONFLICT (document_id) DO UPDATE SET uploaded_by = client_uuid;
    
    INSERT INTO public.contract_runs (run_id, document_id, decision, status, total_clauses, processed_clauses, created_at)
    VALUES (gen_random_uuid(), '44444444-4444-4444-4444-444444444443', 'ESCALATE_HUMAN', 'COMPLETED', 15, 15, now() - interval '5 hours')
    ON CONFLICT DO NOTHING;

END $$;
