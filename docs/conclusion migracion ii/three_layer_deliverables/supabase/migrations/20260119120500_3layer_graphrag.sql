-- 20260119120500_3layer_graphrag.sql
-- Purpose: GraphRAG groundwork (optional but enabled from day 0).

-- Knowledge graphs are scoped to an org and typically built from:
--  - Blueprint version (policy examples + fallbacks)
--  - Contract model version (canonical clauses)
--  - additional internal sources (future)

create table if not exists public.knowledge_graphs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  blueprint_version_id uuid references public.review_blueprint_versions(id) on delete set null,
  contract_model_version_id uuid references public.contract_model_versions(id) on delete set null,
  build_status text not null default 'NOT_BUILT',
  build_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_graphs_org_idx on public.knowledge_graphs(organization_id);
create index if not exists knowledge_graphs_blueprint_version_idx on public.knowledge_graphs(blueprint_version_id);
create index if not exists knowledge_graphs_model_version_idx on public.knowledge_graphs(contract_model_version_id);

create trigger knowledge_graphs_set_updated_at
before update on public.knowledge_graphs
for each row
execute function public.set_updated_at();

create table if not exists public.kg_nodes (
  id uuid primary key default gen_random_uuid(),
  knowledge_graph_id uuid not null references public.knowledge_graphs(id) on delete cascade,
  node_type text not null,
  label text not null,
  properties jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists kg_nodes_graph_idx on public.kg_nodes(knowledge_graph_id);
create index if not exists kg_nodes_type_idx on public.kg_nodes(node_type);

create table if not exists public.kg_edges (
  id uuid primary key default gen_random_uuid(),
  knowledge_graph_id uuid not null references public.knowledge_graphs(id) on delete cascade,
  from_node_id uuid not null references public.kg_nodes(id) on delete cascade,
  to_node_id uuid not null references public.kg_nodes(id) on delete cascade,
  edge_type text not null,
  weight numeric(6,3),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kg_edges_graph_idx on public.kg_edges(knowledge_graph_id);
create index if not exists kg_edges_from_idx on public.kg_edges(from_node_id);
create index if not exists kg_edges_to_idx on public.kg_edges(to_node_id);
create index if not exists kg_edges_type_idx on public.kg_edges(edge_type);
