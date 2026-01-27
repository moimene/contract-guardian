-- 20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql
-- Amazon PSA/DSA v1: Taxonomía completa (12 materias + ~50 clause_types) + Blueprint + Fallbacks
-- Basado en PSA Principal Terms/Fallback Guide (Oct 2025) y playbook Amazon.
-- Idempotente: safe to run multiple times.

do $$
declare
  org_id uuid;
  blueprint_id uuid;
  blueprint_version_id uuid;
begin
  -- 0) Tenant: usa la primera organization (ajusta si preferís otro criterio)
  select id into org_id
  from organizations
  order by created_at asc
  limit 1;

  if org_id is null then
    raise exception 'No organizations found. Create one organization first.';
  end if;

  -- 1) Materias (12)
  insert into matters (code, name, description, sort_order)
  values
    ('rights_ownership', 'Rights & Ownership', 'Titularidad exclusiva Amazon, works made for hire, assignment-backstop, further assurances/POA.', 10),
    ('moral_rights', 'Moral Rights', 'Waiver/no-ejercicio de moral rights según jurisdicción.', 20),
    ('commercials_fees_credit', 'Commercials: Fees & Entitlements/Credit', 'Triggers de fees/entitlements/credit; sole discretion; inadvertent failure not breach; cure prospectivo.', 30),
    ('third_party_credit', 'Third-Party Credit Obligations', 'Obligaciones de crédito frente a terceros: privity, no liability; alternate con approval.', 40),
    ('control_publicity_trademarks', 'Control, Publicity & Trademarks', 'Amazon sole and final control; approvals de publicity/marketing/trademarks.', 50),
    ('confidentiality_npi_ai', 'Confidentiality, NPI & AI Restrictions', 'Confidencialidad NPI + excepciones + prohibición de input a herramientas AI salvo compliance.', 60),
    ('prodco_reps_title_noninfringement', 'ProdCo Reps: Title/Non-Infringement', 'Originalidad/no infracción/defamación/privacidad/title/no encumbrances; sin knowledge qualifiers.', 70),
    ('compliance_policies_laws', 'Compliance: Control Laws & Amazon Policies', 'Sanciones/export/anti-boycott/tax evasion + Amazon policies/kickoff; alternates mutuos con approval.', 80),
    ('indemnity_prodco', 'Indemnity: ProdCo', 'ProdCo indemnify/defend (at Amazon option)/hold harmless; scope y triggers.', 90),
    ('indemnity_amazon', 'Indemnity: Amazon', 'Amazon indemnity limitada a explotación/marketing/ancillary; limits y approval gates.', 100),
    ('defense_settlement', 'Defense & Settlement', 'Notice, control defense/settlement, participación, consent carveouts.', 110),
    ('misc_legal_ops', 'Misc & Legal Ops', 'Conditions precedent, waiver daños indirectos, injunctive relief, assignment, suspension, data, tax, governing law.', 120)
  on conflict (code) do update
    set name = excluded.name,
        description = excluded.description,
        sort_order = excluded.sort_order;

  -- 2) Clause Types (por materia) con detection_hints (keywords)

  -- Rights & Ownership
  with m as (select id from matters where code='rights_ownership')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('rights_exclusive_ownership_universe_perpetuity', 'Exclusive ownership (universe/perpetuity)', 'Amazon owns all rights exclusively, universe, perpetuity/max term.', jsonb_build_object('keywords', jsonb_build_array('owned by Amazon exclusively','throughout the universe','in perpetuity'))),
    ('rights_work_made_for_hire_and_assignment_backstop', 'Works made for hire + assignment backstop', 'WMFH/commissioned works; assignment if WMFH not effective.', jsonb_build_object('keywords', jsonb_build_array('works made for hire','commissioned works','irrevocably grants','assigns'))),
    ('rights_all_media_now_known_future', 'All media now known or hereafter devised', 'All media/distribution modes now known or later devised.', jsonb_build_object('keywords', jsonb_build_array('all media','now known','hereafter devised','distribution modes'))),
    ('rights_further_assurances_registration_assignment', 'Further assurances', 'ProdCo executes documents to establish Amazon rights; registration/assignment.', jsonb_build_object('keywords', jsonb_build_array('execute and deliver','registration','assignment of the Materials'))),
    ('rights_power_of_attorney_recording', 'Power of attorney for recording', 'Limited POA to execute/register/record docs if ProdCo fails.', jsonb_build_object('keywords', jsonb_build_array('power of attorney','execute','register','record')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name,
        description=excluded.description,
        detection_hints=excluded.detection_hints;

  -- Moral rights
  with m as (select id from matters where code='moral_rights')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, 'moral_rights_waiver_or_non_exercise', 'Moral rights waiver / non-exercise',
         'Waiver of moral rights or agreement not to exercise to hinder exploitation.',
         jsonb_build_object('keywords', jsonb_build_array('moral rights','droit moral','waives','agrees not to exercise'))
  from m
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Commercials (fees/entitlements/credit)
  with m as (select id from matters where code='commercials_fees_credit')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('fees_condition_not_in_uncured_material_breach', 'Fees condition: not in uncured, material breach', 'Fees owed if ProdCo not in uncured, material breach; Exhibit A.', jsonb_build_object('keywords', jsonb_build_array('fees','uncured, material breach','Exhibit A'))),
    ('fees_subject_to_other_terms_and_conditions', 'Fees subject to other terms', 'Fees subject to any other applicable terms and conditions.', jsonb_build_object('keywords', jsonb_build_array('subject to any other applicable terms and conditions'))),
    ('entitlements_condition_completion_and_not_in_uncured_material_breach', 'Entitlements/Credit condition: completion + no uncured, material breach', 'Entitlements/credit if completion + no uncured, material breach; guild/union.', jsonb_build_object('keywords', jsonb_build_array('entitlements','credit','completes','guild/union','uncured, material'))),
    ('credit_sole_discretion', 'Credit: Amazon sole discretion', 'All aspects of credits at Amazon sole discretion except as specified.', jsonb_build_object('keywords', jsonb_build_array('sole discretion','credits'))),
    ('credit_inadvertent_failure_not_breach_prospective_cure', 'Credit: inadvertent failure not breach + prospective cure', 'Inadvertent failure not breach; commercially reasonable efforts to correct prospectively upon notice.', jsonb_build_object('keywords', jsonb_build_array('inadvertent failure','will not constitute a breach','commercially reasonable efforts','prospective basis')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Third-party credit
  with m as (select id from matters where code='third_party_credit')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('third_party_credit_privity_reasonable_efforts_no_liability', 'Third-party credits: privity + reasonable efforts + no liability', 'Inform privity third parties; no responsibility/liability for their failure.', jsonb_build_object('keywords', jsonb_build_array('contractual privity','reasonable efforts','not responsible','not liable','third parties'))),
    ('third_party_credit_contractually_bind_no_police_no_liability', 'Third-party credits: contractually bind (approval) + no police + no liability', 'Contractually bind privity third parties; no duty to police; no liability.', jsonb_build_object('keywords', jsonb_build_array('contractually bind','no obligation to police','contractual privity')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Control/Publicity/Trademarks
  with m as (select id from matters where code='control_publicity_trademarks')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('program_control_sole_final_control', 'Amazon sole and final control', 'Amazon has sole and final control over the Program.', jsonb_build_object('keywords', jsonb_build_array('sole and final control'))),
    ('publicity_marketing_no_release_without_approval', 'No publicity/marketing without approval', 'ProdCo may not release or authorize publicity/marketing without Amazon prior written approval.', jsonb_build_object('keywords', jsonb_build_array('publicity','marketing','prior written approval'))),
    ('trademark_use_prior_written_approval', 'No trademark use without approval', 'No Amazon trademark use without prior written approval.', jsonb_build_object('keywords', jsonb_build_array('Amazon trademark','prior written approval')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Confidentiality/NPI/AI
  with m as (select id from matters where code='confidentiality_npi_ai')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('confidentiality_npi_general_obligation', 'Confidentiality: NPI obligation', 'Keep confidential all non-public information (NPI) relating to the Program.', jsonb_build_object('keywords', jsonb_build_array('keep confidential','non-public information','NPI'))),
    ('confidentiality_exceptions_need_to_know_affiliates_advisors', 'Confidentiality: need-to-know exceptions', 'Need-to-know exceptions (affiliates/employees/contractors/advisors) under similar confidentiality terms.', jsonb_build_object('keywords', jsonb_build_array('need to know','affiliates','employees','contractors','professional service providers'))),
    ('confidentiality_required_by_law_notice', 'Confidentiality: disclosure required by law', 'Disclosure only if required by law/court order; notice to Amazon; seek confidential treatment.', jsonb_build_object('keywords', jsonb_build_array('required by law','valid order','notify Amazon','confidential treatment'))),
    ('ai_restriction_no_input_npi_program_materials', 'AI restriction: no input NPI/Program/Materials', 'No input of NPI/Program/Materials into AI tools unless compliant with Amazon policy.', jsonb_build_object('keywords', jsonb_build_array('artificial intelligence','input','Program','Materials','compliant with Amazon policy')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- ProdCo reps
  with m as (select id from matters where code='prodco_reps_title_noninfringement')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('prodco_rw_originality_full_copyright', 'ProdCo RW: originality/full copyright', 'Program/Materials original and qualify for full copyright protection (with listed exceptions).', jsonb_build_object('keywords', jsonb_build_array('original','full copyright protection'))),
    ('prodco_rw_no_infringement_defamation_privacy', 'ProdCo RW: no infringement/defamation/privacy violation', 'No infringement, no defamation, no privacy violation.', jsonb_build_object('keywords', jsonb_build_array('will not infringe','will not defame','privacy'))),
    ('prodco_rw_no_encumbrances_third_party_interest', 'ProdCo RW: no encumbrances/third-party interests', 'Not subject to any claim, encumbrance or third-party interest.', jsonb_build_object('keywords', jsonb_build_array('encumbrance','third-party interest','claim'))),
    ('prodco_rw_exceptions_amazon_supplied_or_requested', 'ProdCo RW: exceptions for Amazon supplied/requested materials', 'Carveouts for materials supplied by Amazon or at Amazon explicit request/direction.', jsonb_build_object('keywords', jsonb_build_array('materials supplied by Amazon','explicit request','direction'))),
    ('prodco_rw_no_knowledge_qualifiers', 'ProdCo RW: no knowledge qualifiers', 'Reject "to the best of knowledge" qualifiers in non-infringement etc.', jsonb_build_object('keywords', jsonb_build_array('to the best of','knowledge','aware')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Compliance/policies
  with m as (select id from matters where code='compliance_policies_laws')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('prodco_compliance_control_laws_sanctions_export_antiboycott_tax_evasion', 'ProdCo compliance: control laws & tax evasion', 'Compliance with control laws incl sanctions/anti-boycott/export and tax evasion facilitation.', jsonb_build_object('keywords', jsonb_build_array('sanctions','anti-boycott','export','re-export','tax evasion'))),
    ('prodco_compliance_amazon_policies_kickoff_packet', 'ProdCo compliance: Amazon policies/guidelines', 'Compliance with Amazon policies/guidelines made aware in advance (Kickoff Packet).', jsonb_build_object('keywords', jsonb_build_array('policies','guidelines','Development Kickoff Packet'))),
    ('mutual_compliance_measures_or_material_compliance', 'Mutual compliance measures (approval)', 'Alternate mutual "measures in place" or "materially comply" with applicable laws.', jsonb_build_object('keywords', jsonb_build_array('Each of Amazon and ProdCo','measures in place','materially comply'))),
    ('amazon_rw_right_and_power_to_perform', 'Amazon RW: right and power to perform (approval)', 'Alternate Amazon RW of right/power to make and perform.', jsonb_build_object('keywords', jsonb_build_array('Amazon represents and warrants','full right and power')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Indemnity ProdCo
  with m as (select id from matters where code='indemnity_prodco')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('prodco_indemnity_indemnify_defend_option_hold_harmless', 'ProdCo indemnity: indemnify/defend (option)/hold harmless', 'Core indemnity with defend at Amazon option.', jsonb_build_object('keywords', jsonb_build_array('indemnify','defend (at Amazon','hold harmless'))),
    ('prodco_indemnity_scope_third_party_claim_development_production', 'ProdCo indemnity: third-party claim scope', 'Losses arising out of any third-party claim in connection with development/production.', jsonb_build_object('keywords', jsonb_build_array('third-party claim','development','production'))),
    ('prodco_indemnity_triggers_breach_reps_warranties_negligence_willful_misconduct', 'ProdCo indemnity: triggers breach/RW/negligence', 'Triggers include breach of agreements/RWs and negligence/willful misconduct.', jsonb_build_object('keywords', jsonb_build_array('breach','representations','warranties','negligence','willful misconduct'))),
    ('prodco_indemnity_indemnitees_amazon_assignees_licensees_affiliates', 'ProdCo indemnity: Amazon assignees/licensees/affiliates', 'Indemnitees include Amazon assignees/licensees/affiliates.', jsonb_build_object('keywords', jsonb_build_array('assignees','licensees','affiliates'))),
    ('prodco_indemnity_alleged_breach_handling', 'ProdCo indemnity: alleged breach handling', 'Preference to delete "alleged breach" in ProdCo indemnity trigger.', jsonb_build_object('keywords', jsonb_build_array('alleged breach')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Indemnity Amazon
  with m as (select id from matters where code='indemnity_amazon')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('amazon_indemnity_scope_distribution_marketing_advertising_exploitation_ancillary', 'Amazon indemnity: exploitation/marketing/ancillary scope', 'Third-party claims from distribution/marketing/advertising/exploitation + ancillary rights.', jsonb_build_object('keywords', jsonb_build_array('distribution','marketing','advertising','exploitation','ancillary rights'))),
    ('amazon_indemnity_exclusion_losses_prodco_indemnifies', 'Amazon indemnity: carveout for Losses ProdCo indemnifies', 'Exclude Losses for which ProdCo must indemnify Amazon.', jsonb_build_object('keywords', jsonb_build_array('other than','Losses for which ProdCo is required to indemnify'))),
    ('amazon_indemnity_indemnitees_prodco_affiliates_optional_persons', 'Amazon indemnity: indemnitees ProdCo + affiliates/persons', 'Indemnitees may include ProdCo affiliates and specified persons.', jsonb_build_object('keywords', jsonb_build_array('ProdCo and its affiliates','directors','officers','employees','representatives'))),
    ('amazon_indemnity_add_breach_trigger', 'Amazon indemnity: add breach trigger (approval)', 'Add Amazon breach trigger only with approval.', jsonb_build_object('keywords', jsonb_build_array('Amazon''s breach','with Amazon legal approval'))),
    ('amazon_indemnity_exclude_successors_assignees', 'Amazon indemnity: exclude successors/assignees', 'Reject adding successors/assignees of ProdCo as indemnitees.', jsonb_build_object('keywords', jsonb_build_array('successors','assignees')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Defense/Settlement
  with m as (select id from matters where code='defense_settlement')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('defense_notice_prompt_delay_only_material_impairment', 'Defense: prompt notice; delay only if materially impairs', 'Delay does not relieve obligations except to extent materially impairs defense.', jsonb_build_object('keywords', jsonb_build_array('prompt written notice','delay','materially impairs'))),
    ('defense_control_by_amazon', 'Defense: Amazon controls defense and settlement', 'Amazon has option to control defense and settlement.', jsonb_build_object('keywords', jsonb_build_array('option to control','defense and settlement'))),
    ('defense_prodco_cooperation_info_assistance', 'Defense: ProdCo cooperation', 'ProdCo cooperates and provides information/assistance.', jsonb_build_object('keywords', jsonb_build_array('cooperate reasonably','information and assistance'))),
    ('defense_prodco_participation_own_expense_counsel', 'Defense: ProdCo participation at own expense', 'ProdCo may participate at own expense with chosen counsel.', jsonb_build_object('keywords', jsonb_build_array('right to participate','own expense','counsel of its own choosing'))),
    ('settlement_prodco_approval_for_admissions_or_obligations', 'Settlement: ProdCo approval for admissions/obligations', 'No settlement imposing obligations/admissions on ProdCo without approval not unreasonably withheld.', jsonb_build_object('keywords', jsonb_build_array('may not','prior written approval','not unreasonably withheld','admission','obligations')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- Misc / Legal Ops
  with m as (select id from matters where code='misc_legal_ops')
  insert into clause_types (matter_id, code, name, description, detection_hints)
  select m.id, v.code, v.name, v.description, v.hints
  from m
  cross join (values
    ('conditions_precedent_exhibit_a', 'Conditions precedent (Exhibit A)', 'Amazon obligations subject to conditions precedent in Exhibit A.', jsonb_build_object('keywords', jsonb_build_array('conditions precedent','Exhibit A'))),
    ('damages_waiver_indirect_consequential_carveouts', 'Waiver of indirect/consequential damages + carveouts', 'Mutual waiver of indirect/incidental/punitive/consequential damages except indemnity/confidentiality carveouts.', jsonb_build_object('keywords', jsonb_build_array('waives all claims','indirect','punitive','consequential','breach of confidentiality','indemnity'))),
    ('remedies_monetary_only_waiver_injunctive_equitable_relief', 'Remedies: monetary only + waiver injunctive relief', 'Remedies limited to monetary damages; waive injunctive/equitable relief to enjoin exploitation.', jsonb_build_object('keywords', jsonb_build_array('monetary damages','waives any right','injunctive','equitable relief','enjoin'))),
    ('assignment_prodco_restricted_amazon_free_assignment', 'Assignment: ProdCo restricted; Amazon free assignment', 'ProdCo may not assign without consent; Amazon may freely assign (with conditions/alternates).', jsonb_build_object('keywords', jsonb_build_array('may not assign','freely assigned by Amazon','prior written consent'))),
    ('assignment_notification_efforts', 'Assignment: reasonable efforts to notify (approval)', 'Possible obligation to make reasonable efforts to notify of assignment; inadvertent failure not breach.', jsonb_build_object('keywords', jsonb_build_array('reasonable efforts to notify','inadvertent failure','not be deemed a breach'))),
    ('suspension_force_majeure_extension', 'Suspension/extension (force majeure, claims/litigation)', 'Amazon may suspend; dates extend for force majeure/unavailability/claims/litigation with caps/notes.', jsonb_build_object('keywords', jsonb_build_array('suspend','force majeure','pandemic','extend','claims or litigation'))),
    ('no_partnership_joint_venture_agency', 'No partnership/joint venture/agency', 'No partnership/joint venture/agency relationship.', jsonb_build_object('keywords', jsonb_build_array('does not create any partnership','joint venture','agency relationship'))),
    ('data_protection_independent_controllers', 'Data protection: independent controllers', 'Each party acts as independent controller; separate GDPR compliance.', jsonb_build_object('keywords', jsonb_build_array('independent data controllers','GDPR','data protection legislation'))),
    ('tax_transaction_taxes_inclusive_exclusive', 'Tax: transaction taxes inclusive/exclusive (approval)', 'Amounts paid by Amazon inclusive/exclusive of transaction taxes; invoice requirements; approvals.', jsonb_build_object('keywords', jsonb_build_array('inclusive','exclusive','transaction taxes','valid tax invoice'))),
    ('tax_withholding_and_reporting_forms', 'Tax: withholding + documentation (e.g., 1042-S)', 'Amazon may withhold; reduced payment is full settlement; provide documentation/forms.', jsonb_build_object('keywords', jsonb_build_array('deduct or withhold','full payment and settlement','1042-S'))),
    ('governing_law_ny_jurisdiction_nyc_jury_waiver', 'Governing law: NY + NYC venue + jury waiver', 'NY law; exclusive jurisdiction NYC; waive jury trial.', jsonb_build_object('keywords', jsonb_build_array('State of New York','exclusive jurisdiction','New York, New York','waive any right','jury trial')))
  ) as v(code,name,description,hints)
  on conflict (matter_id, code) do update
    set name=excluded.name, description=excluded.description, detection_hints=excluded.detection_hints;

  -- 3) Blueprint Amazon PSA/DSA (crear si no existe)
  select id into blueprint_id
  from review_blueprints
  where organization_id = org_id
    and name = 'Amazon PSA/DSA Blueprint'
  order by created_at desc
  limit 1;

  if blueprint_id is null then
    insert into review_blueprints (organization_id, name, description, status)
    values (org_id, 'Amazon PSA/DSA Blueprint', 'Blueprint v1 basado en PSA Principal Terms/Fallbacks (Oct 2025) y playbook Amazon.', 'PUBLISHED')
    returning id into blueprint_id;
  end if;

  -- 4) Blueprint version 1
  select id into blueprint_version_id
  from review_blueprint_versions
  where blueprint_id = blueprint_id
    and version_int = 1
  limit 1;

  if blueprint_version_id is null then
    insert into review_blueprint_versions (blueprint_id, version_int, changelog, published_at, config)
    values (
      blueprint_id,
      1,
      'Initial Amazon PSA/DSA v1 taxonomy + fallbacks + approval gates.',
      now(),
      jsonb_build_object(
        'grounding', jsonb_build_object('require_evidence', true, 'min_policy_refs', 1),
        'routing', jsonb_build_object('use_detection_hints', true)
      )
    )
    returning id into blueprint_version_id;
  end if;

  -- 5) Matter policies (una por materia)
  insert into matter_policies (blueprint_version_id, matter_id, policy_config, agent_config)
  select
    blueprint_version_id,
    m.id,
    jsonb_build_object(
      'acceptance_levels', jsonb_build_array('ACCEPTABLE','PASSABLE','UNACCEPTABLE'),
      'escalation', jsonb_build_object('default_role', 'LEGAL'),
      'notes', 'Amazon PSA/DSA v1 policy config (starter).'
    ),
    jsonb_build_object(
      'router', jsonb_build_object('use_detection_hints', true),
      'sanitizer', jsonb_build_object('enforce_no_new_obligations', true),
      'valuator', jsonb_build_object('require_policy_refs', true),
      'changeset', jsonb_build_object('prefer_fallback_clauses', true)
    )
  from matters m
  where m.code in (
    'rights_ownership','moral_rights','commercials_fees_credit','third_party_credit',
    'control_publicity_trademarks','confidentiality_npi_ai','prodco_reps_title_noninfringement',
    'compliance_policies_laws','indemnity_prodco','indemnity_amazon','defense_settlement','misc_legal_ops'
  )
  on conflict (blueprint_version_id, matter_id) do update
    set policy_config = excluded.policy_config,
        agent_config  = excluded.agent_config;

  -- 6) Fallback clauses (corpus RAG + grounding)

  -- Third-party credits (standard)
  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  select
    mp.id,
    ct.id,
    'ACCEPTABLE',
    'Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.',
    'Standard GIVE per PSA Principal Terms.',
    false,
    null
  from matter_policies mp
  join matters m on m.id = mp.matter_id and m.code='third_party_credit'
  join clause_types ct on ct.matter_id = m.id and ct.code='third_party_credit_privity_reasonable_efforts_no_liability'
  where mp.blueprint_version_id = blueprint_version_id
  on conflict do nothing;

  -- Third-party credits (alternate with approval)
  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  select
    mp.id,
    ct.id,
    'PASSABLE',
    'Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply with the same.',
    'ALTERNATE GIVE (WITH AMAZON LEGAL APPROVAL).',
    true,
    'LEGAL'
  from matter_policies mp
  join matters m on m.id = mp.matter_id and m.code='third_party_credit'
  join clause_types ct on ct.matter_id = m.id and ct.code='third_party_credit_contractually_bind_no_police_no_liability'
  where mp.blueprint_version_id = blueprint_version_id
  on conflict do nothing;

  -- Fees (core line)
  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  select
    mp.id,
    ct.id,
    'ACCEPTABLE',
    'If ProdCo is not in uncured, material breach of this Agreement, subject to any other applicable terms and conditions, ProdCo will receive the fees specified in Exhibit A.',
    'PSA FEES baseline.',
    false,
    null
  from matter_policies mp
  join matters m on m.id = mp.matter_id and m.code='commercials_fees_credit'
  join clause_types ct on ct.matter_id = m.id and ct.code='fees_condition_not_in_uncured_material_breach'
  where mp.blueprint_version_id = blueprint_version_id
  on conflict do nothing;

  -- AI restriction line (core)
  insert into fallback_clauses (matter_policy_id, clause_type_id, acceptance, fallback_text, usage_notes, requires_approval, approval_role)
  select
    mp.id,
    ct.id,
    'ACCEPTABLE',
    'ProdCo has not and will not input or permit others to input any NPI, the Program, or the Materials into any artificial intelligence service or tool unless and to the extent compliant with Amazon policy.',
    'PSA MISC: AI restriction.',
    false,
    null
  from matter_policies mp
  join matters m on m.id = mp.matter_id and m.code='confidentiality_npi_ai'
  join clause_types ct on ct.matter_id = m.id and ct.code='ai_restriction_no_input_npi_program_materials'
  where mp.blueprint_version_id = blueprint_version_id
  on conflict do nothing;

  raise notice 'Amazon PSA/DSA Taxonomy + Blueprint v1 seeded successfully for org_id=%', org_id;

end $$;
