-- 20260119120200_3layer_blueprints.sql
-- Purpose: Blueprint layer (Capa 1) - versioned policy per matter.

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'blueprint_status') then
    create type public.blueprint_status as enum ('DRAFT','PUBLISHED','ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'acceptance_level') then
    create type public.acceptance_level as enum ('ACCEPTABLE','PASSABLE','UNACCEPTABLE');
  end if;
end $$;

create table if not exists public.review_blueprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status public.blueprint_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_blueprints_org_idx on public.review_blueprints(organization_id);

create trigger review_blueprints_set_updated_at
before update on public.review_blueprints
for each row
execute function public.set_updated_at();

create table if not exists public.review_blueprint_versions (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.review_blueprints(id) on delete cascade,
  version_int int not null,
  changelog text,
  config jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blueprint_id, version_int)
);

create index if not exists review_blueprint_versions_blueprint_idx on public.review_blueprint_versions(blueprint_id);

create trigger review_blueprint_versions_set_updated_at
before update on public.review_blueprint_versions
for each row
execute function public.set_updated_at();

create table if not exists public.matter_policies (
  id uuid primary key default gen_random_uuid(),
  blueprint_version_id uuid not null references public.review_blueprint_versions(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  policy_config jsonb not null default '{}'::jsonb,
  agent_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blueprint_version_id, matter_id)
);

create index if not exists matter_policies_blueprint_version_idx on public.matter_policies(blueprint_version_id);
create index if not exists matter_policies_matter_idx on public.matter_policies(matter_id);

create trigger matter_policies_set_updated_at
before update on public.matter_policies
for each row
execute function public.set_updated_at();

-- Examples used to ground valuation/classification (RAG retrieval)
create table if not exists public.policy_examples (
  id uuid primary key default gen_random_uuid(),
  matter_policy_id uuid not null references public.matter_policies(id) on delete cascade,
  clause_type_id uuid references public.clause_types(id) on delete set null,
  acceptance public.acceptance_level not null,
  example_text text not null,
  normalized_terms text[] not null default '{}'::text[],
  source_ref jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists policy_examples_policy_idx on public.policy_examples(matter_policy_id);
create index if not exists policy_examples_clause_type_idx on public.policy_examples(clause_type_id);

-- Fallback clauses used to propose redlines (RAG retrieval)
create table if not exists public.fallback_clauses (
  id uuid primary key default gen_random_uuid(),
  matter_policy_id uuid not null references public.matter_policies(id) on delete cascade,
  clause_type_id uuid references public.clause_types(id) on delete set null,
  acceptance public.acceptance_level not null,
  fallback_text text not null,
  usage_notes text,
  requires_approval boolean not null default false,
  approval_role text,
  created_at timestamptz not null default now()
);

create index if not exists fallback_clauses_policy_idx on public.fallback_clauses(matter_policy_id);
create index if not exists fallback_clauses_clause_type_idx on public.fallback_clauses(clause_type_id);
