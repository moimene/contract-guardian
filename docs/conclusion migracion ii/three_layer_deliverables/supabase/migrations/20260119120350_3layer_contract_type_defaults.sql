-- 20260119120350_3layer_contract_type_defaults.sql
-- Purpose: Replace frontend playbookMap with DB-resolved defaults per org + contract_type.

create table if not exists public.contract_type_review_defaults (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_type_id text not null,
  blueprint_version_id uuid not null references public.review_blueprint_versions(id) on delete restrict,
  contract_model_version_id uuid not null references public.contract_model_versions(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, contract_type_id)
);

create index if not exists contract_type_review_defaults_blueprint_idx
  on public.contract_type_review_defaults(blueprint_version_id);

create index if not exists contract_type_review_defaults_model_idx
  on public.contract_type_review_defaults(contract_model_version_id);

create trigger contract_type_review_defaults_set_updated_at
before update on public.contract_type_review_defaults
for each row
execute function public.set_updated_at();
