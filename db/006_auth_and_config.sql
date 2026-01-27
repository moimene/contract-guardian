-- 006_auth_and_config.sql
-- Description: Create tables for User Management (Auth) and Configuration (Contract Types)
-- required for Lovable frontend integration.

-- 1. Profiles (Extends Supabase Auth)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update their own profile"
    on public.profiles for update
    using ( auth.uid() = id );

-- 2. User Roles (RBAC)
create table if not exists public.user_roles (
    user_id uuid references auth.users on delete cascade not null primary key,
    role text not null check (role in ('client', 'firm_admin')),
    created_at timestamp with time zone default now()
);

alter table public.user_roles enable row level security;

create policy "Firm Admins can manage all roles"
    on public.user_roles
    using (
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid() and role = 'firm_admin'
        )
    );

create policy "Users can read their own role"
    on public.user_roles for select
    using ( auth.uid() = user_id );

-- 3. User Registration Requests (Self-Service Workflow)
create table if not exists public.user_registration_requests (
    request_id uuid default gen_random_uuid() primary key,
    user_email text not null,
    full_name text,
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by uuid references auth.users(id),
    review_notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

alter table public.user_registration_requests enable row level security;

create policy "Authenticated users can create requests"
    on public.user_registration_requests for insert
    to authenticated
    with check ( true );

create policy "Users can view their own requests"
    on public.user_registration_requests for select
    using ( auth.email() = user_email ); -- Simple check via email matching

create policy "Firm Admins can manage requests"
    on public.user_registration_requests
    using (
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid() and role = 'firm_admin'
        )
    );

-- 4. Contract Types (Catalog)
create table if not exists public.contract_types (
    type_id text primary key, -- e.g. 'nda_v1'
    name text not null,
    description text,
    icon text, -- Lucide icon name or similar
    active boolean default true,
    created_at timestamp with time zone default now()
);

alter table public.contract_types enable row level security;

create policy "Everyone can view active contract types"
    on public.contract_types for select
    using ( active = true );

create policy "Firm Admins can manage contract types"
    on public.contract_types
    using (
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid() and role = 'firm_admin'
        )
    );

-- SEED DATA

-- Contract Types
insert into public.contract_types (type_id, name, description, icon)
values
    ('nda', 'Non-Disclosure Agreement', 'Estándar para confidencialidad bilateral o unilateral.', 'shield'),
    ('msa', 'Master Services Agreement', 'Contrato marco para prestación de servicios continuados.', 'briefcase'),
    ('dpa', 'Data Processing Agreement', 'Regulación de tratamiento de datos personales (GDPR).', 'database'),
    ('lease', 'Lease Agreement', 'Arrendamiento de inmuebles o equipos.', 'home'),
    ('employment', 'Employment Contract', 'Contrato laboral estándar.', 'users')
on conflict (type_id) do nothing;

-- Helper Trigger for Profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on recreation attempt
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
