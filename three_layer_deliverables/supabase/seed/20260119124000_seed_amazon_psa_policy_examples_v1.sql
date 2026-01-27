-- 20260119124000_seed_amazon_psa_policy_examples_v1.sql
-- Amazon PSA/DSA v1: Policy Examples (Batch 1 - Core clauses)
-- ~70 examples across ACCEPTABLE/PASSABLE/UNACCEPTABLE for high-ROI clause types.
-- Idempotent: uses ON CONFLICT DO UPDATE.
-- Requires: 20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql executed first.

do $$
declare
  org_id uuid;
  bp_version_id uuid;
  mp_id uuid;
  ct_id uuid;
begin
  -- Get org + blueprint version
  select id into org_id
  from organizations
  order by created_at asc
  limit 1;

  select rbv.id into bp_version_id
  from review_blueprint_versions rbv
  join review_blueprints rb on rb.id = rbv.blueprint_id
  where rb.organization_id = org_id
    and rb.name = 'Amazon PSA/DSA Blueprint'
    and rbv.version_int = 1
  limit 1;

  if bp_version_id is null then
    raise exception 'Blueprint version not found. Run taxonomy seed first.';
  end if;

  -- ===========================================================================
  -- COMMERCIALS: FEES & CREDIT
  -- ===========================================================================

  -- fees_condition_not_in_uncured_material_breach
  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'commercials_fees_credit'
    and ct.code = 'fees_condition_not_in_uncured_material_breach';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'If ProdCo is not in uncured, material breach of this Agreement, subject to any other applicable terms and conditions, ProdCo will receive the fees specified in Exhibit A.', '{"doc":"PSA_Principal_Terms","section":"FEES"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'Fees payable provided ProdCo is not in uncured material breach; payment within 30 days of valid invoice.', '{"doc":"Counterparty_Markup","note":"Administrative timing acceptable"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Fees payable only upon final court adjudication that ProdCo is not in breach.', '{"doc":"Counterparty_Proposal","note":"Unacceptable qualifier - too restrictive"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Fees become unconditional and payable regardless of breach status (pay-or-play).', '{"doc":"Counterparty_Proposal","note":"Pay-or-play not permitted without approval"}'::jsonb)
  on conflict do nothing;

  -- credit_sole_discretion
  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'credit_sole_discretion';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'All aspects of credits (including, without limitation, placement, form, size, and duration) are at Amazon''s sole discretion except as specifically set forth in this Agreement.', '{"doc":"PSA_Principal_Terms","section":"ENTITLEMENTS_CREDIT"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Credit placement and size shall be mutually agreed by the parties.', '{"doc":"Counterparty_Proposal","note":"Removes Amazon discretion"}'::jsonb)
  on conflict do nothing;

  -- credit_inadvertent_failure_not_breach_prospective_cure
  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'credit_inadvertent_failure_not_breach_prospective_cure';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'Any inadvertent failure to provide credit will not constitute a breach; Amazon will use commercially reasonable efforts to correct on a prospective basis upon written notice.', '{"doc":"PSA_Principal_Terms","section":"ENTITLEMENTS_CREDIT"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'Inadvertent credit failure not a breach; Amazon to correct within 30 days of notice for future exhibitions.', '{"doc":"Counterparty_Markup","note":"Timing variant acceptable"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Any failure to provide credit constitutes a material breach entitling ProdCo to terminate.', '{"doc":"Counterparty_Proposal","note":"Unacceptable - makes credit failure material breach"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- THIRD-PARTY CREDIT
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'third_party_credit'
    and ct.code = 'third_party_credit_privity_reasonable_efforts_no_liability';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.', '{"doc":"PSA_Principal_Terms","section":"ENTITLEMENTS_CREDIT"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'Amazon will make reasonable efforts to notify distributors of credit requirements; Amazon not liable for third-party non-compliance.', '{"doc":"Counterparty_Markup","note":"Simplified but acceptable"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Amazon shall ensure all third parties comply with credit obligations and shall be liable for any third-party failure.', '{"doc":"Counterparty_Proposal","note":"Imposes liability for third parties"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'third_party_credit' and ct.code = 'third_party_credit_contractually_bind_no_police_no_liability';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'PASSABLE', 'Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply with the same.', '{"doc":"PSA_Fallbacks","section":"ENTITLEMENTS_CREDIT","approval":"AMAZON_LEGAL"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Amazon shall contractually bind third parties and actively monitor and enforce compliance with credit obligations.', '{"doc":"Counterparty_Proposal","note":"Police obligation unacceptable"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- RIGHTS & OWNERSHIP
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'rights_ownership'
    and ct.code = 'rights_exclusive_ownership_universe_perpetuity';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'The Program and all Materials are owned by Amazon exclusively, throughout the universe, in perpetuity or for the maximum period permitted by law.', '{"doc":"PSA_Principal_Terms","section":"RIGHTS"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'Amazon owns all rights in the Program exclusively worldwide for the full term of copyright.', '{"doc":"Counterparty_Markup","note":"Acceptable variant"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'ProdCo retains ownership of the Program; Amazon receives a limited license.', '{"doc":"Counterparty_Proposal","note":"Ownership must vest in Amazon"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'rights_ownership' and ct.code = 'rights_work_made_for_hire_and_assignment_backstop';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'The Program and all Materials are works made for hire; to the extent any are not works made for hire, ProdCo irrevocably grants and assigns all rights to Amazon.', '{"doc":"PSA_Principal_Terms","section":"RIGHTS"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Materials created by ProdCo remain ProdCo''s property subject to license.', '{"doc":"Counterparty_Proposal","note":"WMFH + assignment required"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- MORAL RIGHTS
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'moral_rights'
    and ct.code = 'moral_rights_waiver_or_non_exercise';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'ProdCo waives all moral rights (droit moral) in the Program and Materials; where waiver is not permitted, ProdCo agrees not to exercise such rights to hinder, burden, or stop Amazon''s exploitation.', '{"doc":"PSA_Principal_Terms","section":"RIGHTS"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'ProdCo waives moral rights to the fullest extent permitted by applicable law.', '{"doc":"Counterparty_Markup","note":"Acceptable jurisdiction variant"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'ProdCo reserves all moral rights and may object to modifications.', '{"doc":"Counterparty_Proposal","note":"Moral rights reservation unacceptable"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- CONFIDENTIALITY / NPI / AI
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'confidentiality_npi_ai'
    and ct.code = 'ai_restriction_no_input_npi_program_materials';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'ProdCo has not and will not input or permit others to input any NPI, the Program, or the Materials into any artificial intelligence service or tool unless and to the extent compliant with Amazon policy.', '{"doc":"PSA_Principal_Terms","section":"MISC"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'ProdCo will not use AI tools to process Program materials without Amazon''s prior written approval and compliance with Amazon''s AI policy.', '{"doc":"Counterparty_Markup","note":"Approval process acceptable"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'ProdCo may use industry-standard AI tools in the production process.', '{"doc":"Counterparty_Proposal","note":"Removes AI restriction entirely"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'confidentiality_npi_ai' and ct.code = 'confidentiality_npi_general_obligation';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'ProdCo shall keep confidential all non-public information (NPI) relating to the Program, Amazon, or any Amazon affiliate.', '{"doc":"PSA_Principal_Terms","section":"MISC"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- PRODCO REPS & WARRANTIES
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'prodco_reps_title_noninfringement'
    and ct.code = 'prodco_rw_originality_full_copyright';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'The Program and Materials are original and will qualify for full copyright protection (excepting materials in the public domain, Amazon-supplied materials, or materials created at Amazon''s explicit direction).', '{"doc":"PSA_Principal_Terms","section":"RW"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'prodco_reps_title_noninfringement' and ct.code = 'prodco_rw_no_knowledge_qualifiers';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'UNACCEPTABLE', 'To the best of ProdCo''s knowledge, the Materials do not infringe any third-party rights.', '{"doc":"Counterparty_Proposal","note":"Knowledge qualifier not acceptable"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- INDEMNITY PRODCO
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'indemnity_prodco'
    and ct.code = 'prodco_indemnity_indemnify_defend_option_hold_harmless';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'ProdCo will indemnify, defend (at Amazon''s option), and hold harmless Amazon and its affiliates from all Losses arising from third-party claims.', '{"doc":"PSA_Principal_Terms","section":"INDEMNITY"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_prodco' and ct.code = 'prodco_indemnity_alleged_breach_handling';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', '[DELETE ''alleged breach'' from ProdCo indemnity triggers]', '{"doc":"PSA_Fallbacks","section":"INDEMNITY","note":"Preferred: delete alleged breach"}'::jsonb),
    (mp_id, ct_id, 'PASSABLE', 'Including alleged breach of representations or warranties.', '{"doc":"PSA_Principal_Terms","section":"INDEMNITY","note":"Acceptable but prefer delete"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- INDEMNITY AMAZON
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'indemnity_amazon'
    and ct.code = 'amazon_indemnity_scope_distribution_marketing_advertising_exploitation_ancillary';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'Amazon will indemnify ProdCo for Losses arising from third-party claims related to Amazon''s distribution, marketing, advertising, exploitation, and exercise of ancillary rights.', '{"doc":"PSA_Principal_Terms","section":"INDEMNITY"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_amazon' and ct.code = 'amazon_indemnity_add_breach_trigger';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'PASSABLE', 'Including Amazon''s breach of this Agreement.', '{"doc":"PSA_Fallbacks","section":"INDEMNITY","approval":"AMAZON_LEGAL"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_amazon' and ct.code = 'amazon_indemnity_exclude_successors_assignees';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'UNACCEPTABLE', 'Including ProdCo''s successors and assignees as indemnitees.', '{"doc":"Counterparty_Proposal","note":"Do not add successors/assignees"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- DEFENSE & SETTLEMENT
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'defense_settlement'
    and ct.code = 'defense_control_by_amazon';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'Amazon will have the option to control the defense and settlement of any claim for which ProdCo must indemnify.', '{"doc":"PSA_Principal_Terms","section":"INDEMNITY"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'defense_settlement' and ct.code = 'settlement_prodco_approval_for_admissions_or_obligations';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'PASSABLE', 'Amazon may not settle any claim in a manner that imposes obligations or admissions on ProdCo without ProdCo''s prior written approval, not to be unreasonably withheld.', '{"doc":"PSA_Fallbacks","section":"INDEMNITY","note":"Possible give"}'::jsonb)
  on conflict do nothing;

  -- ===========================================================================
  -- MISC & LEGAL OPS
  -- ===========================================================================

  select mp.id, ct.id into mp_id, ct_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  join clause_types ct on ct.matter_id = m.id
  where mp.blueprint_version_id = bp_version_id
    and m.code = 'misc_legal_ops'
    and ct.code = 'damages_waiver_indirect_consequential_carveouts';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'Each party waives all claims for indirect, incidental, punitive, and consequential damages, except for claims arising from breach of confidentiality or indemnity obligations.', '{"doc":"PSA_Principal_Terms","section":"MISC"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'Amazon''s liability for consequential damages is unlimited.', '{"doc":"Counterparty_Proposal","note":"Unacceptable - removes waiver"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'remedies_monetary_only_waiver_injunctive_equitable_relief';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'ProdCo''s remedies are limited to monetary damages; ProdCo waives any right to injunctive or equitable relief to enjoin or restrain Amazon''s exploitation of the Program.', '{"doc":"PSA_Principal_Terms","section":"MISC"}'::jsonb),
    (mp_id, ct_id, 'UNACCEPTABLE', 'ProdCo may seek injunctive relief to prevent distribution of the Program.', '{"doc":"Counterparty_Proposal","note":"Injunctive relief not permitted"}'::jsonb)
  on conflict do nothing;

  select ct.id into ct_id
  from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'governing_law_ny_jurisdiction_nyc_jury_waiver';

  insert into policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
  values
    (mp_id, ct_id, 'ACCEPTABLE', 'This Agreement is governed by the laws of the State of New York; exclusive jurisdiction in New York, New York; parties waive any right to jury trial.', '{"doc":"PSA_Principal_Terms","section":"LAW"}'::jsonb)
  on conflict do nothing;

  raise notice 'Amazon PSA/DSA Policy Examples v1 seeded successfully.';

end $$;
