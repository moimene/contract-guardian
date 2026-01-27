-- 20260119125000_seed_amazon_psa_fallback_clauses_v1.sql
-- Amazon PSA/DSA v1: Fallback Clauses (GIVE / ALTERNATE GIVE with approval gates)
-- These are the "preferred language" entries for the changeset agent to propose.
-- Idempotent: uses ON CONFLICT DO NOTHING.
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
  -- RIGHTS & OWNERSHIP
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'rights_ownership';

  -- Exclusive ownership
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'rights_ownership' and ct.code = 'rights_exclusive_ownership_universe_perpetuity';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'The Program and all Materials are owned by Amazon exclusively, throughout the universe, in perpetuity or for the maximum period permitted by law, in all media, means of distribution, and modes of exploitation now known or hereafter devised.',
    'PSA RIGHTS: Core ownership clause. Non-negotiable.',
    false, null)
  on conflict do nothing;

  -- WMFH + assignment backstop
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'rights_ownership' and ct.code = 'rights_work_made_for_hire_and_assignment_backstop';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'The Program and all Materials are works made for hire and/or commissioned works. To the extent that any Program or Materials are not deemed to be works made for hire or commissioned works under applicable law, ProdCo irrevocably grants and assigns all rights therein to Amazon.',
    'PSA RIGHTS: WMFH + assignment backstop. Non-negotiable.',
    false, null)
  on conflict do nothing;

  -- Further assurances
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'rights_ownership' and ct.code = 'rights_further_assurances_registration_assignment';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo will execute and deliver any documents reasonably necessary to establish, document, protect, or enforce Amazon''s rights hereunder, including registration and assignment of Materials.',
    'PSA RIGHTS: Further assurances.',
    false, null)
  on conflict do nothing;

  -- POA
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'rights_ownership' and ct.code = 'rights_power_of_attorney_recording';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo hereby appoints Amazon as attorney-in-fact with full power to execute, register, and record any such documents if ProdCo fails to do so within ten (10) business days of Amazon''s request.',
    'PSA RIGHTS: Limited POA for recording.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- MORAL RIGHTS
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'moral_rights';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'moral_rights' and ct.code = 'moral_rights_waiver_or_non_exercise';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo, on behalf of itself and all contributors, hereby waives all moral rights (droit moral) in and to the Program and Materials. To the extent moral rights are not waivable under applicable law, ProdCo agrees, and shall cause all contributors to agree, not to exercise such rights in any manner that would hinder, burden, or stop Amazon''s full exploitation of the Program.',
    'PSA RIGHTS: Moral rights waiver/non-exercise.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- COMMERCIALS: FEES & CREDIT
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'commercials_fees_credit';

  -- Fees condition
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'fees_condition_not_in_uncured_material_breach';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'If ProdCo is not in uncured, material breach of this Agreement, subject to any other applicable terms and conditions of this Agreement, ProdCo will receive the fees specified in Exhibit A.',
    'PSA FEES: Baseline. Only "uncured, material" breach qualifier acceptable.',
    false, null)
  on conflict do nothing;

  -- Entitlements/credit condition
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'entitlements_condition_completion_and_not_in_uncured_material_breach';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'If ProdCo timely completes its services hereunder and is not in uncured, material breach of this Agreement, ProdCo will receive the entitlements and credit specified in Exhibit A, subject to applicable guild/union requirements.',
    'PSA ENTITLEMENTS: Baseline with guild/union carveout.',
    false, null)
  on conflict do nothing;

  -- Credit sole discretion
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'credit_sole_discretion';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'All aspects of credits (including, without limitation, placement, form, size, and duration) are at Amazon''s sole discretion except as specifically set forth in this Agreement.',
    'PSA CREDIT: Amazon discretion.',
    false, null)
  on conflict do nothing;

  -- Credit inadvertent failure
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'commercials_fees_credit' and ct.code = 'credit_inadvertent_failure_not_breach_prospective_cure';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Any inadvertent failure by Amazon to provide any credit in accordance with this Agreement will not constitute a breach of this Agreement, provided that Amazon will use commercially reasonable efforts to correct such failure on a prospective basis upon written notice from ProdCo.',
    'PSA CREDIT: Inadvertent failure safe harbor.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- THIRD-PARTY CREDIT
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'third_party_credit';

  -- Standard (reasonable efforts)
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'third_party_credit' and ct.code = 'third_party_credit_privity_reasonable_efforts_no_liability';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.',
    'PSA GIVE: Standard third-party credit. Preferred.',
    false, null)
  on conflict do nothing;

  -- Alternate (contractually bind) - requires approval
  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'third_party_credit' and ct.code = 'third_party_credit_contractually_bind_no_police_no_liability';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply with the same.',
    'PSA ALTERNATE GIVE: Only with Amazon Legal approval. Still no police/no liability.',
    true, 'LEGAL')
  on conflict do nothing;

  -- ===========================================================================
  -- CONTROL / PUBLICITY / TRADEMARKS
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'control_publicity_trademarks';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'control_publicity_trademarks' and ct.code = 'program_control_sole_final_control';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Amazon has sole and final control over all aspects of the Program, including without limitation all creative, business, and operational decisions.',
    'PSA CONTROL: Non-negotiable.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'control_publicity_trademarks' and ct.code = 'publicity_marketing_no_release_without_approval';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo will not release or authorize any publicity or marketing related to the Program, Amazon, or any Amazon affiliate without Amazon''s prior written approval.',
    'PSA MISC: Publicity control.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'control_publicity_trademarks' and ct.code = 'trademark_use_prior_written_approval';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo will not use any Amazon trademark, service mark, or logo without Amazon''s prior written approval.',
    'PSA MISC: Trademark protection.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- CONFIDENTIALITY / NPI / AI
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'confidentiality_npi_ai';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'confidentiality_npi_ai' and ct.code = 'confidentiality_npi_general_obligation';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo shall keep confidential all non-public information ("NPI") relating to the Program, Amazon, or any Amazon affiliate, and shall not use such NPI except as necessary to perform its obligations hereunder.',
    'PSA MISC: NPI confidentiality.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'confidentiality_npi_ai' and ct.code = 'confidentiality_exceptions_need_to_know_affiliates_advisors';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Notwithstanding the foregoing, ProdCo may disclose NPI to its affiliates, employees, contractors, and professional service providers on a need-to-know basis, provided such persons are bound by confidentiality obligations no less protective than those set forth herein.',
    'PSA MISC: Need-to-know exception.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'confidentiality_npi_ai' and ct.code = 'ai_restriction_no_input_npi_program_materials';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo has not and will not input or permit others to input any NPI, the Program, or the Materials into any artificial intelligence service or tool unless and to the extent compliant with Amazon policy.',
    'PSA MISC: AI restriction. Hard requirement.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- PRODCO REPS & WARRANTIES
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'prodco_reps_title_noninfringement';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'prodco_reps_title_noninfringement' and ct.code = 'prodco_rw_originality_full_copyright';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'The Program and Materials (excepting materials in the public domain, Amazon-supplied materials, or materials created at Amazon''s explicit request and/or direction) are original and will qualify for full copyright protection.',
    'PSA RW: Originality with standard carveouts.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'prodco_reps_title_noninfringement' and ct.code = 'prodco_rw_no_infringement_defamation_privacy';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'The Program and Materials will not infringe any intellectual property right of any third party, will not defame any person, and will not violate any right of privacy or publicity.',
    'PSA RW: Non-infringement. No knowledge qualifiers.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- COMPLIANCE / POLICIES / LAWS
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'compliance_policies_laws';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'compliance_policies_laws' and ct.code = 'prodco_compliance_control_laws_sanctions_export_antiboycott_tax_evasion';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo will comply with all applicable control laws, including sanctions, anti-boycott laws, export and re-export laws, and will not take any action that would constitute or facilitate tax evasion.',
    'PSA RW: Control laws compliance.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'compliance_policies_laws' and ct.code = 'mutual_compliance_measures_or_material_compliance';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Each of Amazon and ProdCo has measures in place to materially comply with applicable laws.',
    'PSA ALTERNATE: Mutual compliance. Requires Amazon Legal approval.',
    true, 'LEGAL')
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'compliance_policies_laws' and ct.code = 'amazon_rw_right_and_power_to_perform';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Amazon represents and warrants that it has the full right and power to make and perform this Agreement.',
    'PSA ALTERNATE: Amazon RW capacity. Requires Amazon Legal approval.',
    true, 'LEGAL')
  on conflict do nothing;

  -- ===========================================================================
  -- INDEMNITY PRODCO
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'indemnity_prodco';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_prodco' and ct.code = 'prodco_indemnity_indemnify_defend_option_hold_harmless';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo will indemnify, defend (at Amazon''s option), and hold harmless Amazon, its affiliates, assignees, licensees, and their respective directors, officers, employees, and representatives from all Losses arising out of any third-party claim in connection with ProdCo''s development and production of the Program.',
    'PSA INDEMNITY: Core ProdCo indemnity with defend option.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- INDEMNITY AMAZON
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'indemnity_amazon';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_amazon' and ct.code = 'amazon_indemnity_scope_distribution_marketing_advertising_exploitation_ancillary';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Amazon will indemnify, defend, and hold harmless ProdCo, its affiliates, and their respective directors, officers, employees, and representatives from Losses arising out of any third-party claim in connection with Amazon''s distribution, marketing, advertising, exploitation, and exercise of ancillary rights in respect of the Program, other than Losses for which ProdCo is required to indemnify Amazon.',
    'PSA INDEMNITY: Amazon indemnity scope.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'indemnity_amazon' and ct.code = 'amazon_indemnity_add_breach_trigger';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Including Amazon''s breach of this Agreement.',
    'PSA ALTERNATE: Add Amazon breach trigger. Requires Amazon Legal approval.',
    true, 'LEGAL')
  on conflict do nothing;

  -- ===========================================================================
  -- DEFENSE & SETTLEMENT
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'defense_settlement';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'defense_settlement' and ct.code = 'defense_control_by_amazon';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Amazon will have the option to control the defense and settlement of any claim for which ProdCo is obligated to indemnify Amazon hereunder.',
    'PSA INDEMNITY: Amazon defense control.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'defense_settlement' and ct.code = 'defense_prodco_participation_own_expense_counsel';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'ProdCo may participate in the defense of any such claim at its own expense with counsel of its own choosing.',
    'PSA POSSIBLE GIVE: ProdCo participation right.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'defense_settlement' and ct.code = 'settlement_prodco_approval_for_admissions_or_obligations';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Amazon may not settle any claim in a manner that imposes any obligation on ProdCo or constitutes an admission by ProdCo without ProdCo''s prior written approval, which shall not be unreasonably withheld or delayed.',
    'PSA POSSIBLE GIVE: Settlement consent carveout.',
    false, null)
  on conflict do nothing;

  -- ===========================================================================
  -- MISC & LEGAL OPS
  -- ===========================================================================

  select mp.id into mp_id
  from matter_policies mp
  join matters m on m.id = mp.matter_id
  where mp.blueprint_version_id = bp_version_id and m.code = 'misc_legal_ops';

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'damages_waiver_indirect_consequential_carveouts';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Each party waives all claims for indirect, incidental, punitive, and consequential damages, except for claims arising from a party''s breach of confidentiality obligations or indemnity obligations hereunder.',
    'PSA MISC: Damages waiver with carveouts.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'remedies_monetary_only_waiver_injunctive_equitable_relief';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo''s sole and exclusive remedy for any breach or alleged breach of this Agreement shall be an action for monetary damages. ProdCo hereby waives any right to seek injunctive or equitable relief to enjoin or restrain Amazon''s exploitation of the Program or exercise of any rights granted hereunder.',
    'PSA MISC: Monetary remedies only; waiver of injunctive relief.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'assignment_prodco_restricted_amazon_free_assignment';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'ProdCo may not assign or transfer this Agreement or any rights hereunder without Amazon''s prior written consent. Amazon may freely assign this Agreement, in whole or in part, without ProdCo''s consent.',
    'PSA MISC: Assignment restrictions.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'assignment_notification_efforts';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'PASSABLE',
    'Amazon will make reasonable efforts to notify ProdCo of any assignment; provided, however, that any inadvertent failure to so notify ProdCo shall not be deemed a breach of this Agreement.',
    'PSA ALTERNATE: Assignment notification. Requires approval.',
    true, 'LEGAL')
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'governing_law_ny_jurisdiction_nyc_jury_waiver';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'This Agreement shall be governed by and construed in accordance with the laws of the State of New York without regard to conflicts of law principles. The parties submit to the exclusive jurisdiction of the state and federal courts located in New York, New York. Each party hereby irrevocably waives any right to a trial by jury.',
    'PSA LAW: NY law, NYC venue, jury waiver.',
    false, null)
  on conflict do nothing;

  select ct.id into ct_id from clause_types ct
  join matters m on m.id = ct.matter_id
  where m.code = 'misc_legal_ops' and ct.code = 'data_protection_independent_controllers';

  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  values (mp_id, ct_id, 'ACCEPTABLE',
    'Each party shall act as an independent data controller with respect to any personal data processed in connection with this Agreement and shall comply with applicable data protection legislation, including the GDPR where applicable.',
    'PSA DATA: Independent controllers.',
    false, null)
  on conflict do nothing;

  raise notice 'Amazon PSA/DSA Fallback Clauses v1 seeded successfully.';

end $$;
