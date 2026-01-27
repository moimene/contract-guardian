-- 20260119120300_3layer_contract_models.sql
-- Purpose: Contract Model layer (Capa 3) - versioned model templates per contract type.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'contract_model_status') then
    create type public.contract_model_status as enum ('DRAFT','PUBLISHED','ARCHIVED');
  end if;
end $$;

create table if not exists public.contract_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_type_id text not null,
  name text not null,
  description text,
  status public.contract_model_status not null default 'DRAFT',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_models_org_idx on public.contract_models(organization_id);
create index if not exists contract_models_contract_type_idx on public.contract_models(contract_type_id);

create trigger contract_models_set_updated_at
before update on public.contract_models
for each row
execute function public.set_updated_at();

create table if not exists public.contract_model_versions (
  id uuid primary key default gen_random_uuid(),
  contract_model_id uuid not null references public.contract_models(id) on delete cascade,
  version_int int not null,
  changelog text,
  parameters_schema jsonb not null default '{}'::jsonb,
  template_meta jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_model_id, version_int)
);

create index if not exists contract_model_versions_model_idx on public.contract_model_versions(contract_model_id);

create trigger contract_model_versions_set_updated_at
before update on public.contract_model_versions
for each row
execute function public.set_updated_at();

-- Optional: store canonical clauses from the model (used for grounding and suggested redlines)
create table if not exists public.contract_model_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_model_version_id uuid not null references public.contract_model_versions(id) on delete cascade,
  clause_type_id uuid references public.clause_types(id) on delete set null,
  label text,
  clause_text text not null,
  embedding vector(1536),
  source_ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contract_model_clauses_version_idx on public.contract_model_clauses(contract_model_version_id);
create index if not exists contract_model_clauses_clause_type_idx on public.contract_model_clauses(clause_type_id);

-- Optional: store resolved parameters per version (defaults) for templating
create table if not exists public.contract_model_parameters (
  id uuid primary key default gen_random_uuid(),
  contract_model_version_id uuid not null references public.contract_model_versions(id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (contract_model_version_id, key)
);

create index if not exists contract_model_parameters_version_idx on public.contract_model_parameters(contract_model_version_id);
