-- HARVEY_1_taxonomy_extension.sql
-- Extends taxonomy with 6 new matters and 33+ new clause_types
-- ADAPTED: Uses blueprint_versions (not review_blueprint_versions)
-- Idempotent: safe to run multiple times

-- ===========================================================================
-- 1) NEW MATTERS (6)
-- ===========================================================================

INSERT INTO matters (code, name, description, sort_order)
VALUES
  ('termination_and_remedies', 'Termination & Remedies', 'Amazon/ProdCo termination rights, suspension, consequences, rights reversion, payment on termination.', 130),
  ('dispute_resolution', 'Dispute Resolution', 'Governing law, jurisdiction, arbitration vs litigation, escalation procedures, injunctive relief preservation.', 140),
  ('miscellaneous_provisions', 'Miscellaneous Provisions', 'Assignment restrictions, entire agreement, amendments, force majeure, notices, severability, survival.', 150),
  ('limitation_of_liability', 'Limitation of Liability', 'Exclusion of consequential damages, liability caps, exceptions for fraud/willful/IP, mutual vs one-sided application.', 160),
  ('confidentiality_and_publicity', 'Confidentiality & Publicity', 'NPI obligations, program confidentiality, publicity restrictions, social media restrictions for cast/crew.', 170),
  ('insurance_requirements', 'Insurance Requirements', 'ProdCo insurance obligations, coverage types, limits, Amazon as additional insured, certificate delivery.', 180)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- 2) NEW CLAUSE_TYPES FOR: termination_and_remedies
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'termination_and_remedies')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('amazon_termination_for_convenience',
   'Amazon Termination for Convenience',
   'Amazon right to terminate without cause/breach, typically with payment for work completed.',
   jsonb_build_object('keywords', jsonb_build_array('terminate for convenience', 'terminate at any time', 'without cause', 'sole discretion'))),
  ('amazon_termination_for_cause_prodco_breach',
   'Amazon Termination for Cause (ProdCo Breach)',
   'Amazon termination rights upon ProdCo breach, material default, bankruptcy, force majeure prolonged.',
   jsonb_build_object('keywords', jsonb_build_array('terminate for cause', 'material breach', 'default', 'bankruptcy', 'insolvency'))),
  ('prodco_termination_rights_limited_or_none',
   'ProdCo Termination Rights (Limited/None)',
   'ProdCo termination rights typically limited to Amazon material breach with cure period.',
   jsonb_build_object('keywords', jsonb_build_array('ProdCo terminate', 'ProdCo termination', 'material breach by Amazon', 'cure period'))),
  ('termination_consequences_rights_reversion_payment',
   'Termination Consequences: Rights Reversion & Payment',
   'Consequences of termination including rights reversion (if any), payment obligations, deliverable handover.',
   jsonb_build_object('keywords', jsonb_build_array('upon termination', 'rights revert', 'payment upon termination', 'deliver all materials', 'work completed'))),
  ('suspension_rights_pending_cure_or_investigation',
   'Suspension Rights Pending Cure/Investigation',
   'Amazon right to suspend performance pending cure of breach or investigation.',
   jsonb_build_object('keywords', jsonb_build_array('suspend', 'pending cure', 'pending investigation', 'halt production')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 3) NEW CLAUSE_TYPES FOR: dispute_resolution
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'dispute_resolution')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('governing_law_jurisdiction_venue',
   'Governing Law, Jurisdiction & Venue',
   'Choice of law, exclusive jurisdiction, venue selection (typically NY for Amazon).',
   jsonb_build_object('keywords', jsonb_build_array('governing law', 'jurisdiction', 'venue', 'State of New York', 'exclusive jurisdiction'))),
  ('arbitration_vs_litigation_election',
   'Arbitration vs Litigation Election',
   'Choice between arbitration and litigation, conditions for each, binding nature.',
   jsonb_build_object('keywords', jsonb_build_array('arbitration', 'litigation', 'binding arbitration', 'JAMS', 'AAA'))),
  ('arbitration_procedures_rules_location',
   'Arbitration Procedures, Rules & Location',
   'Arbitration rules (JAMS/AAA), location, number of arbitrators, discovery limits.',
   jsonb_build_object('keywords', jsonb_build_array('arbitration rules', 'JAMS', 'AAA', 'arbitrator', 'discovery', 'arbitration location'))),
  ('escalation_and_informal_resolution',
   'Escalation & Informal Resolution',
   'Pre-dispute escalation procedures, good faith negotiation, executive involvement.',
   jsonb_build_object('keywords', jsonb_build_array('escalation', 'good faith', 'negotiate', 'informal resolution', 'senior executives'))),
  ('injunctive_relief_preservation',
   'Injunctive Relief Preservation',
   'Preservation of right to seek injunctive relief for IP/confidentiality despite arbitration.',
   jsonb_build_object('keywords', jsonb_build_array('injunctive relief', 'preliminary injunction', 'specific performance', 'irreparable harm', 'notwithstanding arbitration')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 4) NEW CLAUSE_TYPES FOR: miscellaneous_provisions
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'miscellaneous_provisions')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('assignment_and_transfer_restrictions',
   'Assignment & Transfer Restrictions',
   'ProdCo assignment restrictions, Amazon free assignment rights, consent requirements.',
   jsonb_build_object('keywords', jsonb_build_array('assign', 'transfer', 'prior written consent', 'freely assign', 'successors'))),
  ('entire_agreement_amendments_waivers',
   'Entire Agreement, Amendments & Waivers',
   'Integration clause, requirement for written amendments, waiver limitations.',
   jsonb_build_object('keywords', jsonb_build_array('entire agreement', 'amendment', 'written amendment', 'waiver', 'supersedes'))),
  ('force_majeure',
   'Force Majeure',
   'Force majeure events, suspension of obligations, extension of deadlines, termination if prolonged.',
   jsonb_build_object('keywords', jsonb_build_array('force majeure', 'act of God', 'pandemic', 'government action', 'beyond reasonable control'))),
  ('notices_and_communications',
   'Notices & Communications',
   'Requirements for formal notices, addresses, methods (email, courier), effectiveness.',
   jsonb_build_object('keywords', jsonb_build_array('notice', 'written notice', 'email', 'overnight courier', 'deemed received'))),
  ('severability_and_survival',
   'Severability & Survival',
   'Severability of invalid provisions, survival of certain provisions post-termination.',
   jsonb_build_object('keywords', jsonb_build_array('severability', 'invalid', 'unenforceable', 'survival', 'survive termination')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 5) NEW CLAUSE_TYPES FOR: limitation_of_liability
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'limitation_of_liability')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('amazon_exclusion_consequential_indirect_special_punitive',
   'Amazon Exclusion: Consequential/Indirect/Special/Punitive Damages',
   'Amazon exclusion of liability for consequential, indirect, special, punitive damages.',
   jsonb_build_object('keywords', jsonb_build_array('consequential', 'indirect', 'special', 'punitive', 'incidental', 'exclude'))),
  ('amazon_liability_cap_fees_paid_or_fixed_amount',
   'Amazon Liability Cap (Fees Paid or Fixed Amount)',
   'Cap on Amazon total liability, typically to fees paid or a fixed monetary amount.',
   jsonb_build_object('keywords', jsonb_build_array('liability cap', 'aggregate liability', 'not exceed', 'fees paid', 'maximum liability'))),
  ('prodco_liability_no_limitation_or_carved_out',
   'ProdCo Liability: No Limitation or Carved Out',
   'ProdCo liability unlimited or carved out from caps (indemnity, IP, confidentiality).',
   jsonb_build_object('keywords', jsonb_build_array('ProdCo liability', 'unlimited', 'no cap', 'carved out', 'shall not apply'))),
  ('limitation_of_liability_exceptions_fraud_willful_indemnification_confidentiality_ip',
   'Limitation Exceptions: Fraud/Willful/Indemnification/Confidentiality/IP',
   'Carveouts from liability limitations for fraud, willful misconduct, indemnification, confidentiality breach, IP infringement.',
   jsonb_build_object('keywords', jsonb_build_array('except', 'excluding', 'fraud', 'willful misconduct', 'gross negligence', 'indemnification', 'confidentiality', 'intellectual property'))),
  ('limitation_mutual_vs_one_sided_application',
   'Limitation: Mutual vs One-Sided Application',
   'Whether liability limitations apply mutually or only to one party.',
   jsonb_build_object('keywords', jsonb_build_array('mutual', 'each party', 'neither party', 'one-sided', 'ProdCo only')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 6) NEW CLAUSE_TYPES FOR: confidentiality_and_publicity
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'confidentiality_and_publicity')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('prodco_confidentiality_obligations_npi_amazon_information',
   'ProdCo Confidentiality: NPI & Amazon Information',
   'ProdCo obligations to keep Amazon NPI and business information confidential.',
   jsonb_build_object('keywords', jsonb_build_array('confidential', 'NPI', 'non-public', 'Amazon information', 'not disclose'))),
  ('prodco_program_confidentiality_scripts_plotlines_creative',
   'ProdCo Program Confidentiality: Scripts/Plotlines/Creative',
   'Confidentiality of program creative elements including scripts, plotlines, casting.',
   jsonb_build_object('keywords', jsonb_build_array('script', 'plotline', 'creative', 'casting', 'program details', 'storyline'))),
  ('publicity_restrictions_amazon_approval_required',
   'Publicity Restrictions: Amazon Approval Required',
   'ProdCo prohibition on publicity without Amazon prior written approval.',
   jsonb_build_object('keywords', jsonb_build_array('publicity', 'press release', 'announcement', 'prior written approval', 'marketing'))),
  ('social_media_restrictions_cast_crew_prodco',
   'Social Media Restrictions: Cast/Crew/ProdCo',
   'Restrictions on social media posts by cast, crew, and ProdCo regarding the program.',
   jsonb_build_object('keywords', jsonb_build_array('social media', 'cast', 'crew', 'posting', 'Instagram', 'Twitter', 'behind the scenes'))),
  ('confidentiality_survival_and_return_of_materials',
   'Confidentiality Survival & Return of Materials',
   'Survival of confidentiality obligations post-termination and obligation to return/destroy materials.',
   jsonb_build_object('keywords', jsonb_build_array('survival', 'survive termination', 'return', 'destroy', 'confidential materials')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 7) NEW CLAUSE_TYPES FOR: insurance_requirements
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'insurance_requirements')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('prodco_insurance_types_cgl_eo_workers_comp_auto',
   'ProdCo Insurance Types: CGL/E&O/Workers Comp/Auto',
   'Required insurance coverage types including CGL, E&O, Workers Comp, Auto liability.',
   jsonb_build_object('keywords', jsonb_build_array('commercial general liability', 'CGL', 'errors and omissions', 'E&O', 'workers compensation', 'auto liability'))),
  ('prodco_insurance_amazon_additional_insured_primary_noncontributory',
   'ProdCo Insurance: Amazon Additional Insured (Primary/Non-Contributory)',
   'Amazon named as additional insured with primary and non-contributory coverage.',
   jsonb_build_object('keywords', jsonb_build_array('additional insured', 'primary', 'non-contributory', 'Amazon named', 'endorsement'))),
  ('prodco_insurance_minimum_limits_appropriate_for_production_scope',
   'ProdCo Insurance: Minimum Limits (Production Scope)',
   'Minimum coverage limits appropriate for production scope and budget.',
   jsonb_build_object('keywords', jsonb_build_array('minimum limit', 'coverage limit', 'per occurrence', 'aggregate', 'million'))),
  ('prodco_insurance_certificate_and_policy_delivery',
   'ProdCo Insurance: Certificate & Policy Delivery',
   'Obligation to deliver insurance certificates and policy copies to Amazon.',
   jsonb_build_object('keywords', jsonb_build_array('certificate of insurance', 'COI', 'policy copy', 'deliver', 'evidence of insurance')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 8) NEW CLAUSE_TYPES FOR EXISTING MATTER: indemnity_amazon (extensions)
-- ===========================================================================

WITH m AS (SELECT id FROM matters WHERE code = 'indemnity_amazon')
INSERT INTO clause_types (matter_id, code, name, description, detection_hints)
SELECT m.id, v.code, v.name, v.description, v.hints
FROM m
CROSS JOIN (VALUES
  ('amazon_indemnity_scope_limited_to_amazon_breach',
   'Amazon Indemnity: Scope Limited to Amazon Breach',
   'Amazon indemnity triggered only by Amazon breach, not general third-party claims.',
   jsonb_build_object('keywords', jsonb_build_array('Amazon indemnify', 'Amazon breach', 'arising from Amazon', 'Amazon''s breach'))),
  ('amazon_indemnity_exclusions_program_content_prodco_actions',
   'Amazon Indemnity: Exclusions for Program Content/ProdCo Actions',
   'Carveouts from Amazon indemnity for claims related to program content or ProdCo actions.',
   jsonb_build_object('keywords', jsonb_build_array('excluding', 'except', 'Program content', 'ProdCo action', 'ProdCo negligence'))),
  ('amazon_indemnity_procedure_notice_cooperation_defense_control',
   'Amazon Indemnity: Procedure (Notice/Cooperation/Defense Control)',
   'Procedural requirements for Amazon indemnity: notice, cooperation, defense control.',
   jsonb_build_object('keywords', jsonb_build_array('prompt notice', 'cooperate', 'defense', 'control', 'settlement'))),
  ('amazon_indemnity_caps_or_absence_of_caps',
   'Amazon Indemnity: Caps or Absence of Caps',
   'Whether Amazon indemnity is subject to caps or unlimited.',
   jsonb_build_object('keywords', jsonb_build_array('indemnity cap', 'unlimited indemnity', 'no cap', 'aggregate indemnity')))
) AS v(code, name, description, hints)
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- ===========================================================================
-- 9) Create matter_policies for new matters (link to existing blueprint)
-- ADAPTED: Uses blueprint_versions (not review_blueprint_versions)
-- ===========================================================================

DO $$
DECLARE
  bp_version_id uuid;
BEGIN
  -- Get the Amazon Blueprint version (ADAPTED: uses blueprint_versions)
  SELECT bv.id INTO bp_version_id
  FROM blueprint_versions bv
  JOIN review_blueprints rb ON rb.id = bv.blueprint_id
  WHERE rb.name LIKE '%Amazon%'
    AND bv.is_active = true
  ORDER BY bv.created_at DESC
  LIMIT 1;

  IF bp_version_id IS NOT NULL THEN
    -- Create matter_policies for new matters
    INSERT INTO matter_policies (blueprint_version_id, matter_id, policy_config, agent_config)
    SELECT
      bp_version_id,
      m.id,
      jsonb_build_object(
        'acceptance_levels', jsonb_build_array('ACCEPTABLE','PASSABLE','UNACCEPTABLE'),
        'escalation', jsonb_build_object('default_role', 'LEGAL'),
        'notes', 'Auto-generated for Harvey dataset expansion.'
      ),
      jsonb_build_object(
        'router', jsonb_build_object('use_detection_hints', true),
        'sanitizer', jsonb_build_object('enforce_no_new_obligations', true),
        'valuator', jsonb_build_object('require_policy_refs', true),
        'changeset', jsonb_build_object('prefer_fallback_clauses', true)
      )
    FROM matters m
    WHERE m.code IN (
      'termination_and_remedies',
      'dispute_resolution',
      'miscellaneous_provisions',
      'limitation_of_liability',
      'confidentiality_and_publicity',
      'insurance_requirements'
    )
    ON CONFLICT (blueprint_version_id, matter_id) DO UPDATE SET
      policy_config = EXCLUDED.policy_config,
      agent_config = EXCLUDED.agent_config;

    RAISE NOTICE 'matter_policies created for new matters (blueprint_version_id: %)', bp_version_id;
  ELSE
    RAISE NOTICE 'No Amazon Blueprint found - skipping matter_policies creation';
  END IF;
END $$;

-- ===========================================================================
-- VERIFICATION
-- ===========================================================================

SELECT 'MATTERS' as entity, COUNT(*) as count FROM matters
UNION ALL
SELECT 'CLAUSE_TYPES', COUNT(*) FROM clause_types
UNION ALL
SELECT 'MATTER_POLICIES', COUNT(*) FROM matter_policies;
