-- 20260119120000_3layer_extensions.sql
-- Purpose: Ensure required extensions and common utility functions for 3-layer architecture.

-- Extensions commonly present in Supabase; included defensively.
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- pgvector (Supabase installs in schema "extensions" by convention)
create extension if not exists vector with schema extensions;

-- Common updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Optional helper: check org membership in RLS policies.
-- Note: requires org_memberships table (already present in current project).
create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.user_id = auth.uid()
      and m.organization_id = _org_id
  );
$$;
