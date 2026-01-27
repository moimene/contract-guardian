-- 20260119120100_3layer_matters_clause_types.sql
-- Purpose: Introduce Matter taxonomy (10-12 materias) and Clause Types.

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger matters_set_updated_at
before update on public.matters
for each row
execute function public.set_updated_at();

create table if not exists public.clause_types (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  detection_hints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matter_id, code)
);

create index if not exists clause_types_matter_id_idx on public.clause_types(matter_id);

create trigger clause_types_set_updated_at
before update on public.clause_types
for each row
execute function public.set_updated_at();
