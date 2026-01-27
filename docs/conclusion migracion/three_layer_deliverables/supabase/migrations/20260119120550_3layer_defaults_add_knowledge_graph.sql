-- 20260119120550_3layer_defaults_add_knowledge_graph.sql
-- Purpose: Link contract type defaults to an optional knowledge graph.

alter table public.contract_type_review_defaults
  add column if not exists knowledge_graph_id uuid references public.knowledge_graphs(id) on delete set null;

create index if not exists contract_type_review_defaults_kg_idx
  on public.contract_type_review_defaults(knowledge_graph_id);
