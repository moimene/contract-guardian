-- 20260119120600_3layer_compat_clause_reviews.sql
-- Purpose: Non-breaking additive columns to support dual-write / gradual UI migration.
-- Safe: guarded by existence checks.

do $$
begin
  if to_regclass('public.clause_reviews') is not null then
    -- Link each clause review to its run and configuration versions
    execute 'alter table public.clause_reviews add column if not exists run_id uuid references public.contract_runs(run_id) on delete set null';
    execute 'alter table public.clause_reviews add column if not exists blueprint_version_id uuid references public.review_blueprint_versions(id)';
    execute 'alter table public.clause_reviews add column if not exists contract_model_version_id uuid references public.contract_model_versions(id)';

    -- Optional alignment to 3-layer outputs
    execute 'alter table public.clause_reviews add column if not exists matter_id uuid references public.matters(id)';
    execute 'alter table public.clause_reviews add column if not exists acceptance public.acceptance_level';
    execute 'alter table public.clause_reviews add column if not exists evidence jsonb not null default ''{}''::jsonb';
    execute 'alter table public.clause_reviews add column if not exists requires_approval boolean not null default false';
    execute 'alter table public.clause_reviews add column if not exists approval_role text';
    execute 'alter table public.clause_reviews add column if not exists source_finding_ids uuid[] not null default ''{}''::uuid[]';
  end if;
end $$;

-- Indexes (also guarded)
do $$
begin
  if to_regclass('public.clause_reviews') is not null then
    execute 'create index if not exists clause_reviews_run_idx on public.clause_reviews(run_id)';
    execute 'create index if not exists clause_reviews_blueprint_version_idx on public.clause_reviews(blueprint_version_id)';
    execute 'create index if not exists clause_reviews_contract_model_version_idx on public.clause_reviews(contract_model_version_id)';
    execute 'create index if not exists clause_reviews_matter_idx on public.clause_reviews(matter_id)';
  end if;
end $$;
