-- 20260119120400_3layer_run_layer.sql
-- Purpose: Execution layer: clause instances, findings per matter, and step audit.

-- Ensure enums exist (defensive)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_state') then
    create type public.client_state as enum ('OK','RECOMMENDED','REQUIRED','NEEDS_REVIEW','BLOCKED');
  end if;
  if not exists (select 1 from pg_type where typname = 'agent_step_type') then
    create type public.agent_step_type as enum (
      'INGEST','SEGMENT','ROUTER','RAG_RETRIEVE','PARANOID','VALUATOR','SANITIZER','CHANGESET','AGGREGATE','EXPORT'
    );
  end if;
end $$;

-- Clause instances: normalized representation of each clause extracted from the contract.
create table if not exists public.clause_instances (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(document_id) on delete cascade,
  run_id uuid references public.contract_runs(run_id) on delete set null,
  clause_index int not null,
  heading text,
  original_text text not null,
  normalized_text text,
  start_offset int,
  end_offset int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, clause_index)
);

create index if not exists clause_instances_document_idx on public.clause_instances(document_id);
create index if not exists clause_instances_run_idx on public.clause_instances(run_id);

create trigger clause_instances_set_updated_at
before update on public.clause_instances
for each row
execute function public.set_updated_at();

-- Extend contract_runs to reference the chosen Blueprint/Model versions.
-- This allows a run to be reproducible and auditable.
alter table public.contract_runs
  add column if not exists blueprint_version_id uuid references public.review_blueprint_versions(id),
  add column if not exists contract_model_version_id uuid references public.contract_model_versions(id),
  add column if not exists run_config jsonb not null default '{}'::jsonb;

create index if not exists contract_runs_blueprint_version_idx on public.contract_runs(blueprint_version_id);
create index if not exists contract_runs_contract_model_version_idx on public.contract_runs(contract_model_version_id);

-- Findings: per clause x matter (and optionally clause_type). This is the new canonical output.
create table if not exists public.review_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.contract_runs(run_id) on delete cascade,
  clause_instance_id uuid not null references public.clause_instances(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete restrict,
  clause_type_id uuid references public.clause_types(id) on delete set null,

  -- Classification outputs
  acceptance public.acceptance_level,
  client_state public.client_state not null,
  risk_score numeric(5,2),

  -- Explanation and redline proposal
  issue_summary text,
  rationale text,
  proposed_changes jsonb not null default '[]'::jsonb,

  -- Grounding/evidence (citations to policy_examples, fallback_clauses, contract_model_clauses, and/or KG paths)
  evidence jsonb not null default '{}'::jsonb,

  -- Escalation gates
  requires_approval boolean not null default false,
  approval_role text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (run_id, clause_instance_id, matter_id)
);

create index if not exists review_findings_run_idx on public.review_findings(run_id);
create index if not exists review_findings_clause_idx on public.review_findings(clause_instance_id);
create index if not exists review_findings_matter_idx on public.review_findings(matter_id);
create index if not exists review_findings_client_state_idx on public.review_findings(client_state);

create trigger review_findings_set_updated_at
before update on public.review_findings
for each row
execute function public.set_updated_at();

-- Run steps: detailed audit trail of each agent step (router/paranoid/valuator/sanitizer/changeset).
create table if not exists public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.contract_runs(run_id) on delete cascade,
  clause_instance_id uuid references public.clause_instances(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete set null,
  step_type public.agent_step_type not null,
  status text not null default 'COMPLETED',
  model text,
  prompt_version text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists run_steps_run_idx on public.run_steps(run_id);
create index if not exists run_steps_clause_idx on public.run_steps(clause_instance_id);
create index if not exists run_steps_matter_idx on public.run_steps(matter_id);
create index if not exists run_steps_step_type_idx on public.run_steps(step_type);
