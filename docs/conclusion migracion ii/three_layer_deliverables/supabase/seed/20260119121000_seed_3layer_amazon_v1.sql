-- 20260119121000_seed_3layer_amazon_v1.sql
-- Seeds for E2E testing of 3-layer architecture:
--   - 12 base matters
--   - Amazon Blueprint v1 (policy)
--   - Amazon PSA Contract Model v1 (canonical clauses)
--   - contract_type_review_defaults mapping
--   - stub knowledge_graph
--
-- Safe to run multiple times (idempotent patterns used).

-- -----------------------------------------------------------------------------
-- 0) Base Org (Dev) + Contract Type seeds (best-effort)
-- -----------------------------------------------------------------------------

insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Dev Org', 'dev-org')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug;

-- Contract type used for this seed pack
-- NOTE: If your contract_types schema differs, adjust these columns.
insert into public.contract_types (type_id, name, description, icon)
values ('amazon-psa', 'Amazon PSA (Program Services Agreement)', 'Amazon Program Services Agreement principal terms / fallbacks', 'file-text')
on conflict (type_id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

-- -----------------------------------------------------------------------------
-- 1) Matters (12)
-- -----------------------------------------------------------------------------

insert into public.matters (code, name, description, sort_order)
values
  ('rights_ownership', 'Rights & Ownership', 'Ownership of Program/Materials, work-made-for-hire, assignment, moral rights', 10),
  ('fees', 'Fees & Payment Conditions', 'Payment triggers, conditions precedent, exhibit dependencies', 20),
  ('credit_entitlements', 'Entitlements & Credits', 'Entitlements, credits, third-party credit obligations', 30),
  ('rw_prodco', 'ProdCo Representations & Warranties', 'Originality, non-infringement, no encumbrances, compliance with laws/policies', 40),
  ('rw_amazon', 'Amazon Representations & Warranties', 'Limited authority/capacity and narrow mutual compliance alternatives', 50),
  ('indemnity_prodco', 'Indemnity by ProdCo', 'Indemnify/defend/hold harmless for third-party claims; alleged breach handling', 60),
  ('indemnity_amazon', 'Indemnity by Amazon', 'Indemnity scope for distribution/marketing/advertising/exploitation', 70),
  ('defense_settlement', 'Defense & Settlement', 'Control of defense and settlement, notice/prejudice, participation', 80),
  ('confidentiality_npi_ai', 'Confidentiality, NPI & AI Restrictions', 'NPI protection, publicity/trademarks, restrictions on AI tools', 90),
  ('limitation_liability_injunctive', 'Limitation of Liability & Injunctive Relief', 'Waiver of indirect damages, waiver of injunctive relief', 100),
  ('assignment', 'Assignment', 'Amazon assignment freedom; ProdCo restrictions; notification variants', 110),
  ('data_tax_govlaw', 'Data Protection, Tax, Governing Law & Forum', 'Data controllers, withholding, NY law/forum, jury waiver', 120)
 on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- 2) Clause Types (minimal set)
-- -----------------------------------------------------------------------------

-- Rights & Ownership
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'ownership_assignment', 'Ownership / Assignment / Work-made-for-hire', 'Amazon exclusive ownership, work-made-for-hire, assignment language',
       '{"keywords": ["works made for hire","owned by Amazon","assign"], "signals": ["perpetuity","universe"]}'::jsonb
from public.matters m where m.code = 'rights_ownership'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'moral_rights', 'Moral Rights / Droit Moral', 'Waiver / non-exercise of moral rights where not waivable',
       '{"keywords": ["moral rights","droit moral","waive"], "signals": ["non-exercise"]}'::jsonb
from public.matters m where m.code = 'rights_ownership'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- Fees
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'fees_condition', 'Fees Conditional on No Material Uncured Breach', 'Payment subject to no (uncured, material) breach and other terms',
       '{"keywords": ["Fees","uncured","material breach","Exhibit A"], "signals": ["subject to"]}'::jsonb
from public.matters m where m.code = 'fees'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- Credits
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'credit_third_party', 'Third-party Credit Obligations', 'Reasonable efforts / privity limitation and no liability for third parties',
       '{"keywords": ["credit","privity","reasonable efforts"], "signals": ["not responsible"]}'::jsonb
from public.matters m where m.code = 'credit_entitlements'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- R&Ws ProdCo
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'prodco_originality', 'ProdCo Originality / Non-infringement', 'Originality, no infringement/defamation/privacy violation, no encumbrances',
       '{"keywords": ["original","infringe","defame","privacy","encumbrance"], "signals": ["no knowledge qualifier"]}'::jsonb
from public.matters m where m.code = 'rw_prodco'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- Indemnity ProdCo
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'prodco_indemnity', 'ProdCo Indemnity / Defense Option', 'Indemnify, defend (at Amazon option), hold harmless for third-party claims',
       '{"keywords": ["indemnify","defend","hold harmless","third-party"], "signals": ["at Amazon\u2019s option"]}'::jsonb
from public.matters m where m.code = 'indemnity_prodco'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- Confidentiality / NPI / AI
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'npi_ai_restriction', 'NPI + AI Restriction', 'NPI confidentiality and no input of NPI/Program/Materials into AI tools unless compliant',
       '{"keywords": ["NPI","confidential","artificial intelligence"], "signals": ["unless compliant"]}'::jsonb
from public.matters m where m.code = 'confidentiality_npi_ai'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- Limitation of liability
insert into public.clause_types (matter_id, code, name, description, detection_hints)
select m.id, 'waiver_indirect_damages', 'Waiver of Indirect/Consequential Damages', 'Mutual waiver with carve-outs for indemnity third-party claims and confidentiality breach',
       '{"keywords": ["indirect","consequential","punitive","incidental"], "signals": ["except"]}'::jsonb
from public.matters m where m.code = 'limitation_liability_injunctive'
on conflict (matter_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  detection_hints = excluded.detection_hints;

-- -----------------------------------------------------------------------------
-- 3) Amazon Blueprint v1
-- -----------------------------------------------------------------------------

-- Stable IDs to simplify E2E references
-- (If you prefer random, replace with gen_random_uuid() and update references.)
insert into public.review_blueprints (id, organization_id, name, description, status)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Amazon PSA/DSA Review Blueprint',
  'Baseline Amazon positions and fallbacks (seeded for E2E).',
  'PUBLISHED'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  organization_id = excluded.organization_id;

insert into public.review_blueprint_versions (id, blueprint_id, version_int, changelog, config, published_at)
values (
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111111',
  1,
  'Seed v1 for E2E',
  '{"notes": "Seed blueprint. Replace/extend with full playbook content."}'::jsonb,
  now()
)
on conflict (id) do update set
  blueprint_id = excluded.blueprint_id,
  version_int = excluded.version_int,
  changelog = excluded.changelog,
  config = excluded.config,
  published_at = excluded.published_at;

-- Matter policies (one per matter)
insert into public.matter_policies (blueprint_version_id, matter_id, policy_config, agent_config)
select
  '11111111-1111-1111-1111-111111111112',
  m.id,
  jsonb_build_object(
    'strictness', 'amazon_standard',
    'escalation', jsonb_build_object('default', 'NEEDS_REVIEW')
  ),
  jsonb_build_object(
    'agents', jsonb_build_object(
      'paranoid', jsonb_build_object('enabled', true),
      'valuator', jsonb_build_object('enabled', true),
      'sanitizer', jsonb_build_object('enabled', true),
      'changeset', jsonb_build_object('enabled', true)
    )
  )
from public.matters m
on conflict (blueprint_version_id, matter_id) do update set
  policy_config = excluded.policy_config,
  agent_config = excluded.agent_config;

-- Policy examples (minimal, illustrative)
-- Fees examples: ACCEPTABLE / PASSABLE / UNACCEPTABLE
insert into public.policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
select
  mp.id,
  ct.id,
  'ACCEPTABLE'::public.acceptance_level,
  'Fees payable if ProdCo is not in uncured, material breach, subject to other applicable terms and conditions.',
  '{"source": "PSA Fallbacks", "anchor": "FEES"}'::jsonb
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'fees'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'fees_condition'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

insert into public.policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
select
  mp.id,
  ct.id,
  'PASSABLE'::public.acceptance_level,
  'Allow only the qualifier "uncured, material" before breach; do not accept additional qualifiers (e.g., final adjudication).',
  '{"source": "PSA/DSA Playbook", "note": "Legal nuance"}'::jsonb
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'fees'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'fees_condition'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

insert into public.policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
select
  mp.id,
  ct.id,
  'UNACCEPTABLE'::public.acceptance_level,
  'Fees become unconditional unless breach is confirmed by a final court award (unacceptable qualifier).',
  '{"source": "Playbook reasoning", "anchor": "fees qualifiers"}'::jsonb
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'fees'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'fees_condition'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

-- Fallback clauses: Third-party credit obligations (standard + legal-approval alternate)
insert into public.fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
select
  mp.id,
  ct.id,
  'ACCEPTABLE'::public.acceptance_level,
  'Amazon shall use reasonable efforts to inform third parties in contractual privity of credit obligations; Amazon is not liable for third-party failure.',
  'Preferred fallback. Do not impose liability on Amazon for third-party non-compliance.',
  false,
  null
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'credit_entitlements'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'credit_third_party'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

insert into public.fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
select
  mp.id,
  ct.id,
  'PASSABLE'::public.acceptance_level,
  'With Amazon Legal approval: Amazon shall contractually bind third parties in privity to credit obligations; no duty to police; no liability for third-party failure.',
  'Use only when explicitly approved by Amazon Legal.',
  true,
  'amazon_legal'
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'credit_entitlements'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'credit_third_party'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

-- Confidentiality / NPI / AI restriction fallback
insert into public.fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes)
select
  mp.id,
  ct.id,
  'ACCEPTABLE'::public.acceptance_level,
  'ProdCo must keep NPI confidential and must not input NPI/Program/Materials into any AI tool unless compliant with Amazon policy.',
  'Treat as hard requirement; escalate if counterparty refuses.'
from public.matter_policies mp
join public.matters m on m.id = mp.matter_id and m.code = 'confidentiality_npi_ai'
join public.clause_types ct on ct.matter_id = m.id and ct.code = 'npi_ai_restriction'
where mp.blueprint_version_id = '11111111-1111-1111-1111-111111111112'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 4) Contract Model PSA v1
-- -----------------------------------------------------------------------------

insert into public.contract_models (id, organization_id, contract_type_id, name, description, status)
values (
  '22222222-2222-2222-2222-222222222221',
  '00000000-0000-0000-0000-000000000001',
  'amazon-psa',
  'Amazon PSA Principal Terms (Model)',
  'Canonical model clauses (seeded). Replace with full template ingestion.',
  'PUBLISHED'
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  contract_type_id = excluded.contract_type_id,
  name = excluded.name,
  description = excluded.description,
  status = excluded.status;

insert into public.contract_model_versions (id, contract_model_id, version_int, changelog, parameters_schema, template_meta, published_at)
values (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222221',
  1,
  'Seed v1 for E2E',
  '{"placeholders": ["PROGRAM","ProdCo"], "exhibits": ["Exhibit A"]}'::jsonb,
  '{"source": "PSA fallbacks 2025-10-20"}'::jsonb,
  now()
)
on conflict (id) do update set
  contract_model_id = excluded.contract_model_id,
  version_int = excluded.version_int,
  changelog = excluded.changelog,
  parameters_schema = excluded.parameters_schema,
  template_meta = excluded.template_meta,
  published_at = excluded.published_at;

-- Canonical model clauses (shortened for seed purposes)
insert into public.contract_model_clauses (contract_model_version_id, clause_type_id, label, clause_text, source_ref)
select
  '22222222-2222-2222-2222-222222222222',
  ct.id,
  'FEES',
  'If ProdCo is not in uncured, material breach (and subject to other terms), ProdCo will receive fees in Exhibit A.',
  '{"source": "PSA Principal Terms", "anchor": "FEES"}'::jsonb
from public.clause_types ct
join public.matters m on m.id = ct.matter_id
where m.code = 'fees' and ct.code = 'fees_condition'
on conflict do nothing;

insert into public.contract_model_clauses (contract_model_version_id, clause_type_id, label, clause_text, source_ref)
select
  '22222222-2222-2222-2222-222222222222',
  ct.id,
  'CREDIT',
  'Credits are at Amazon sole discretion; inadvertent failure is not breach; Amazon will make reasonable efforts to correct prospectively.',
  '{"source": "PSA Principal Terms", "anchor": "ENTITLEMENTS; CREDIT"}'::jsonb
from public.clause_types ct
join public.matters m on m.id = ct.matter_id
where m.code = 'credit_entitlements' and ct.code = 'credit_third_party'
on conflict do nothing;

insert into public.contract_model_clauses (contract_model_version_id, clause_type_id, label, clause_text, source_ref)
select
  '22222222-2222-2222-2222-222222222222',
  ct.id,
  'NPI_AI',
  'ProdCo must keep non-public Program information confidential and must not input NPI/Program/Materials into AI tools unless compliant with Amazon policy.',
  '{"source": "PSA Principal Terms", "anchor": "NPI + AI"}'::jsonb
from public.clause_types ct
join public.matters m on m.id = ct.matter_id
where m.code = 'confidentiality_npi_ai' and ct.code = 'npi_ai_restriction'
on conflict do nothing;

insert into public.contract_model_clauses (contract_model_version_id, clause_type_id, label, clause_text, source_ref)
select
  '22222222-2222-2222-2222-222222222222',
  ct.id,
  'WAIVER',
  'Except for third-party indemnity claims (and confidentiality breach), each party waives indirect, incidental, punitive and consequential damages.',
  '{"source": "PSA Principal Terms", "anchor": "DAMAGES"}'::jsonb
from public.clause_types ct
join public.matters m on m.id = ct.matter_id
where m.code = 'limitation_liability_injunctive' and ct.code = 'waiver_indirect_damages'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 5) Knowledge Graph stub + contract type defaults mapping
-- -----------------------------------------------------------------------------

insert into public.knowledge_graphs (id, organization_id, name, description, blueprint_version_id, contract_model_version_id, build_status)
values (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'Amazon PSA Graph (stub)',
  'Empty graph created by seed; build process will populate nodes/edges.',
  '11111111-1111-1111-1111-111111111112',
  '22222222-2222-2222-2222-222222222222',
  'NOT_BUILT'
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  blueprint_version_id = excluded.blueprint_version_id,
  contract_model_version_id = excluded.contract_model_version_id,
  build_status = excluded.build_status;

insert into public.contract_type_review_defaults (
  organization_id,
  contract_type_id,
  blueprint_version_id,
  contract_model_version_id,
  knowledge_graph_id,
  is_active
)
values (
  '00000000-0000-0000-0000-000000000001',
  'amazon-psa',
  '11111111-1111-1111-1111-111111111112',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  true
)
on conflict (organization_id, contract_type_id) do update set
  blueprint_version_id = excluded.blueprint_version_id,
  contract_model_version_id = excluded.contract_model_version_id,
  knowledge_graph_id = excluded.knowledge_graph_id,
  is_active = excluded.is_active;

