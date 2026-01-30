-- ================================================================
-- Migration: Add 20 Amazon Playbook Specs (Phase 1 Complete)
-- Date: 2026-01-30
-- Description: Full playbook specification set for PSA contract review
-- ================================================================

-- ================================================================
-- BATCH 1: CRITICAL FINANCIAL (Fees, Credits)
-- ================================================================

-- 1. PaymentCredits (Fees.yaml)
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'PaymentCredits',
  'Payment Terms & Credits',
  'CRITICAL',
  true,
  '{
    "summary": "All payments are Netflix 100% (fully contingent on delivery). Amazon does not make advance payments. ProdCo funded entirely by Production Budget defined in Exhibit A.",
    "core_requirements": [
      "All payments contingent on delivery and acceptance",
      "No advance payments under any circumstances",
      "Budget defined exclusively in Exhibit A",
      "Amazon retains right to audit production costs"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard payment terms per Exhibit A",
      "required_elements": ["contingent on delivery", "Exhibit A reference"]
    },
    "passable": {
      "description": "Minor timing variations",
      "variations": ["Payment within 45 days vs 30 days"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["advance payment", "upfront payment", "signing bonus", "guaranteed minimum"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon 100% financing model is non-negotiable"],
    "fallback_positions": ["Can discuss payment timing within reason"],
    "escalation_triggers": ["Any request for advance payment"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["advance", "upfront", "guaranteed minimum"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["payment", "fees", "compensation"],
    "strong_indicators": ["Exhibit A", "budget", "contingent"],
    "red_flags": ["advance", "upfront", "guaranteed"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 2. ThirdPartyCredits (EntitlementsCredit.yaml)
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'ThirdPartyCredits',
  'Third Party Credits & Entitlements',
  'CRITICAL',
  true,
  '{
    "summary": "Amazon has sole discretion over credits placement. ProdCo gets EP credit per Exhibit A but Amazon controls on-screen positioning, size, and prominence.",
    "core_requirements": [
      "Amazon sole discretion over credit placement",
      "No most-favored-nations for credits",
      "Credit size/position controlled by Amazon",
      "Title card placement at Amazon discretion"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Credits per Exhibit A, placement at Amazon discretion",
      "required_elements": ["Amazon discretion", "Exhibit A"]
    },
    "passable": {
      "description": "Credit type specified but placement flexible",
      "variations": ["Specified card type with Amazon positioning control"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["most favored nations", "MFN", "guaranteed placement", "first position"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon controls platform presentation"],
    "fallback_positions": ["Can confirm credit type per Exhibit A"],
    "escalation_triggers": ["MFN requests", "guaranteed positioning"]
  }'::jsonb,
  '{
    "inherent_risk": "HIGH",
    "escalation_triggers": ["MFN", "most favored", "first position", "guaranteed"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["credit", "entitlement"],
    "strong_indicators": ["screen credit", "title card", "placement"],
    "red_flags": ["most favored", "MFN", "guaranteed position"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- ================================================================
-- BATCH 2: SECTION 7 - REPRESENTATIONS & INDEMNITY
-- ================================================================

-- 3. RepsProdCo
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'RepsProdCo',
  'ProdCo Representations & Warranties',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo provides comprehensive reps/warranties covering: (a) authority to contract, (b) non-infringement of IP, (c) no violations of law, (d) accuracy of materials, (e) compliance with all laws and guild requirements.",
    "core_requirements": [
      "Full right and authority to enter agreement",
      "Non-infringement of third party IP rights",
      "No violation of any law or regulation",
      "Accuracy of all submitted materials",
      "Compliance with guild and union requirements"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Comprehensive reps covering all core requirements",
      "required_elements": ["authority", "non-infringement", "compliance"]
    },
    "passable": {
      "description": "Knowledge qualifier on certain reps",
      "variations": ["to ProdCo knowledge for third party IP"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["blanket knowledge qualifier", "material breach only", "no reps"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Standard entertainment industry practice"],
    "fallback_positions": ["Knowledge qualifier acceptable for 3P IP with diligence requirement"],
    "escalation_triggers": ["Attempt to delete or significantly water down reps"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["delete rep", "remove warranty", "blanket knowledge"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["represents", "warrants", "ProdCo"],
    "strong_indicators": ["authority", "infringement", "compliance", "laws"],
    "red_flags": ["delete", "remove", "waive"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 4. IndemnityProdCo
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'IndemnityProdCo',
  'ProdCo Indemnification Obligations',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo provides broad indemnification for: breach of reps/warranties, third party claims arising from production, IP infringement claims, and claims from ProdCo personnel.",
    "core_requirements": [
      "Indemnify, defend, and hold harmless Amazon",
      "Cover all third party claims from production",
      "Cover IP infringement claims",
      "Cover claims from ProdCo personnel",
      "Cover breach of reps/warranties"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Full indemnification with defend and hold harmless",
      "required_elements": ["indemnify", "defend", "hold harmless"]
    },
    "passable": {
      "description": "Minor procedural adjustments",
      "variations": ["Reasonable cooperation vs full cooperation"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["cap on indemnity", "material breach only", "gross negligence only"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon 100% financing requires full protection"],
    "fallback_positions": ["Can adjust procedural elements only"],
    "escalation_triggers": ["Any cap or limitation on indemnity"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["cap", "limit", "material only", "gross negligence"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["ProdCo", "indemnify"],
    "strong_indicators": ["defend", "hold harmless", "third party", "claim"],
    "red_flags": ["cap", "limit", "maximum"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 5. IndemnityAmazon
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'IndemnityAmazon',
  'Amazon Indemnification Obligations',
  'CRITICAL',
  true,
  '{
    "summary": "Amazon provides LIMITED indemnification only for claims arising from Amazon distribution/exploitation that do NOT arise from ProdCo materials or actions. This is narrow by design.",
    "core_requirements": [
      "Indemnity limited to Amazon exploitation activities",
      "Excludes anything arising from ProdCo or Materials",
      "Excludes claims from Amazon direction if ProdCo warned",
      "Amazon controls defense of such claims"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Narrow Amazon indemnity per standard form",
      "required_elements": ["distribution claims only", "excludes ProdCo materials"]
    },
    "passable": {
      "description": "No expansion beyond standard",
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["symmetric with ProdCo", "broad Amazon indemnity", "Amazon indemnifies for all"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon only responsible for its own exploitation activities"],
    "fallback_positions": ["Hold to form - Amazon indemnity is intentionally narrow"],
    "escalation_triggers": ["Any expansion of Amazon indemnity scope"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["expand", "symmetric", "mutual", "same as ProdCo"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["Amazon", "indemnify"],
    "strong_indicators": ["distribution", "exploitation", "excluding"],
    "red_flags": ["symmetric", "mutual", "same terms"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 6. IndemnityProcedures
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'IndemnityProcedures',
  'Indemnification Procedures',
  'CRITICAL',
  false,
  '{
    "summary": "Procedures for indemnification claims: notice requirements, defense control, cooperation obligations, settlement approval rights.",
    "core_requirements": [
      "Prompt written notice of claims",
      "Indemnitor controls defense",
      "Reasonable cooperation required",
      "No settlement without consent"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard procedural terms",
      "required_elements": ["notice", "defense control", "cooperation"]
    },
    "passable": {
      "description": "Reasonable procedural variations",
      "variations": ["10 days notice vs 5 days"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["no procedures", "waive notice requirement"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Standard commercial practice"],
    "fallback_positions": ["Minor timing adjustments acceptable"],
    "escalation_triggers": ["Deletion of procedures"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["delete procedures", "no notice"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["entitled to indemnification", "notice"],
    "strong_indicators": ["defense", "settlement", "cooperate"],
    "red_flags": ["delete", "remove procedure"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- ================================================================
-- BATCH 3: RIGHTS & LIABILITY
-- ================================================================

-- 7. RightsGrant
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'RightsGrant',
  'Rights Grant',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo grants Amazon all rights necessary to exploit the Program worldwide in perpetuity across all media now known or hereafter devised.",
    "core_requirements": [
      "Worldwide rights",
      "In perpetuity",
      "All media now known or hereafter devised",
      "Exclusive during license period"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Full worldwide, perpetual rights grant",
      "required_elements": ["worldwide", "perpetuity", "all media"]
    },
    "passable": {
      "description": "Territory carved per Exhibit A",
      "variations": ["Territory limitations per Exhibit A"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["limited media rights", "time-limited", "reversion clause"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon 100% financing requires full rights"],
    "fallback_positions": ["Territory only negotiated in Exhibit A"],
    "escalation_triggers": ["Any limitation on core rights grant"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["limited", "reversion", "holdback", "carve out"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["rights", "grant", "Amazon"],
    "strong_indicators": ["worldwide", "perpetuity", "all media", "exclusive"],
    "red_flags": ["limited", "reversion", "holdback"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 8. LiabilityLimitation
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'LiabilityLimitation',
  'Liability Limitation / Damages Waiver',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo WAIVES ALL CLAIMS for consequential, indirect, incidental, punitive damages EXCEPT for Amazon payment obligations. Asymmetric waiver favoring Amazon.",
    "core_requirements": [
      "ProdCo waives consequential damages claims",
      "ProdCo waives indirect damages claims",
      "ProdCo waives punitive damages claims",
      "Exception only for Amazon payment obligations"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Asymmetric waiver per standard form",
      "required_elements": ["ProdCo waives", "consequential", "indirect", "punitive"]
    },
    "passable": {
      "description": "No passable variations - hold to form",
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["mutual waiver", "symmetric waiver", "Amazon waives", "delete waiver"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Industry standard for production agreements"],
    "fallback_positions": ["No fallback - hold to form"],
    "escalation_triggers": ["Any attempt to make symmetric or delete"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["mutual", "symmetric", "Amazon waives", "delete"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["waives", "damages"],
    "strong_indicators": ["consequential", "indirect", "incidental", "punitive"],
    "red_flags": ["mutual", "symmetric", "Amazon waives"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 9. InjunctiveReliefWaiver
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'InjunctiveReliefWaiver',
  'Injunctive Relief Waiver',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo waives any right to seek injunctive relief that would enjoin or restrain development, production, or exploitation of the Program. Remedies limited to monetary damages.",
    "core_requirements": [
      "ProdCo waives right to injunctive relief",
      "Cannot enjoin Program development",
      "Cannot restrain Program production",
      "Cannot restrain Program exploitation",
      "Remedies limited to monetary damages"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Full injunctive relief waiver",
      "required_elements": ["waives", "injunctive", "monetary damages only"]
    },
    "passable": {
      "description": "No passable variations - hold to form",
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["delete waiver", "mutual waiver", "preserve injunctive rights"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Critical for business continuity"],
    "fallback_positions": ["No fallback - hold to form"],
    "escalation_triggers": ["Any attempt to delete or modify"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["delete", "remove", "preserve rights", "mutual"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["waives", "injunctive"],
    "strong_indicators": ["enjoin", "restrain", "monetary damages"],
    "red_flags": ["delete", "remove", "preserve"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- ================================================================
-- BATCH 4: MISCELLANEOUS (Section 8)
-- ================================================================

-- 10. Confidentiality
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'Confidentiality',
  'Confidentiality / NPI',
  'SUPPORT',
  false,
  '{
    "summary": "ProdCo must keep confidential all non-public Amazon information. Special carve-out for AI tools - cannot input confidential info without written approval.",
    "core_requirements": [
      "Keep all NPI confidential",
      "No publicity without Amazon approval",
      "No AI tool use with confidential info without approval",
      "Survives termination"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard confidentiality with AI carve-out",
      "required_elements": ["confidential", "NPI", "AI restriction"]
    },
    "passable": {
      "description": "Standard confidentiality without explicit AI restriction",
      "variations": ["General confidentiality covers AI implicitly"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["carve out AI from restrictions", "permit AI input", "no confidentiality"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Standard commercial practice"],
    "fallback_positions": ["Implicit AI coverage acceptable"],
    "escalation_triggers": ["AI carve out request"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["AI exemption", "remove restriction"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["confidential"],
    "strong_indicators": ["NPI", "non-public", "AI", "artificial intelligence"],
    "red_flags": ["permit disclosure", "exempt AI"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 11. Assignment
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'Assignment',
  'Assignment',
  'CRITICAL',
  true,
  '{
    "summary": "ProdCo may not assign without Amazon consent. Amazon may freely assign. Asymmetric assignment rights.",
    "core_requirements": [
      "ProdCo requires Amazon consent to assign",
      "Amazon may freely assign",
      "Assignment binding on ProdCo",
      "Inures to benefit of assignee"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Asymmetric assignment per form",
      "required_elements": ["ProdCo no assign", "Amazon free assign"]
    },
    "passable": {
      "description": "Amazon secondary liability for financially responsible assignee",
      "variations": ["Amazon remains liable unless assignee is major studio"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["ProdCo free assign", "mutual consent", "remove Amazon free assign"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon needs flexibility for corporate transactions"],
    "fallback_positions": ["Secondary liability option available"],
    "escalation_triggers": ["Limit Amazon assignment right"]
  }'::jsonb,
  '{
    "inherent_risk": "HIGH",
    "escalation_triggers": ["ProdCo assign", "mutual", "both parties consent"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["assign"],
    "strong_indicators": ["may not assign", "freely assigned", "consent"],
    "red_flags": ["ProdCo may assign", "mutual consent"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 12. ForceMajeure  
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'ForceMajeure',
  'Suspension / Force Majeure',
  'CRITICAL',
  true,
  '{
    "summary": "Amazon may suspend services and extend dates during force majeure events (pandemic, war, disaster) plus 30 days after cessation.",
    "core_requirements": [
      "Amazon may suspend during FM events",
      "Dates automatically extend",
      "30 days after cessation to resume",
      "FM includes pandemic, natural disaster, war"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Full suspension rights with 30 day resumption",
      "required_elements": ["suspend", "extend", "force majeure"]
    },
    "passable": {
      "description": "Reduce resumption period to 15 days",
      "variations": ["15 days resumption period"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["limit suspension for ProdCo breach", "remove Amazon suspension right"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Events beyond Amazon control"],
    "fallback_positions": ["15 days resumption acceptable"],
    "escalation_triggers": ["Limit suspension for breach"]
  }'::jsonb,
  '{
    "inherent_risk": "HIGH",
    "escalation_triggers": ["limit breach suspension", "remove suspension"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["force majeure"],
    "strong_indicators": ["suspend", "pandemic", "earthquake", "war"],
    "red_flags": ["limit suspension", "cap extension"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 13. PowerOfAttorney
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'PowerOfAttorney',
  'Power of Attorney / Further Documents',
  'SUPPORT',
  false,
  '{
    "summary": "ProdCo must execute documents Amazon requests within 5 business days. Amazon gets POA to sign on ProdCo behalf if ProdCo fails.",
    "core_requirements": [
      "Execute requested documents within 5 days",
      "POA granted if ProdCo fails",
      "Coupled with an interest"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard POA with 5 day deadline",
      "required_elements": ["execute documents", "power of attorney"]
    },
    "passable": {
      "description": "Extended deadline acceptable",
      "variations": ["7 days for non-US ProdCo", "10 days maximum"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["remove POA", "beyond 10 days"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Need timely document execution"],
    "fallback_positions": ["Up to 10 days acceptable"],
    "escalation_triggers": ["Remove POA entirely"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["remove POA", "delete", "beyond 10 days"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["power of attorney"],
    "strong_indicators": ["execute", "documents", "business days"],
    "red_flags": ["remove", "delete POA"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 14. DataProtection
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'DataProtection',
  'Data Protection',
  'SUPPORT',
  false,
  '{
    "summary": "Both parties are independent data controllers under GDPR and applicable laws. ProdCo must provide Amazon privacy notices to data subjects.",
    "core_requirements": [
      "Independent data controllers",
      "Separate compliance responsibility",
      "GDPR compliance where applicable",
      "ProdCo provides Amazon privacy notice"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Independent controller structure",
      "required_elements": ["independent controllers", "separate compliance"]
    },
    "passable": {
      "description": "Standard form with country variations",
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["Amazon as processor", "Amazon processes for ProdCo"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Standard data protection practice"],
    "fallback_positions": ["Hold to form"],
    "escalation_triggers": ["Change controller relationship"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["Amazon processor", "change relationship"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["data protection", "personal data"],
    "strong_indicators": ["GDPR", "controller", "privacy"],
    "red_flags": ["processor", "on behalf of"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 15. DisputeResolution
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'DisputeResolution',
  'Tax; Governing Law; Jurisdiction',
  'CRITICAL',
  true,
  '{
    "summary": "California law governs. JAMS binding arbitration in Los Angeles. Parties waive jury trial. Each party pays own fees.",
    "core_requirements": [
      "California or New York law",
      "JAMS binding arbitration",
      "Jury trial waiver",
      "Each party pays own fees"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "US governing law with arbitration",
      "required_elements": ["California or New York", "arbitration", "jury waiver"]
    },
    "passable": {
      "description": "New York alternative to California",
      "variations": ["New York law if foreign judgment enforceable"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["non-US law", "local law", "neutral law", "remove arbitration"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon is US entity - requires US law"],
    "fallback_positions": ["New York acceptable alternative"],
    "escalation_triggers": ["Non-US governing law request"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["non-US", "local law", "English law", "Swiss law"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["governing law"],
    "strong_indicators": ["California", "arbitration", "JAMS", "jury"],
    "red_flags": ["English law", "local law", "Swiss law"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 16. AmazonControl
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'AmazonControl',
  'Amazon Control',
  'CRITICAL',
  true,
  '{
    "summary": "Amazon has sole and final control over the Program. Non-negotiable.",
    "core_requirements": [
      "Amazon has sole and final control",
      "Not subject to ProdCo approval",
      "Amazon is commissioner/financier"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Sole and final control language",
      "required_elements": ["sole and final control", "Amazon"]
    },
    "passable": {
      "description": "No passable variations",
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["subject to ProdCo approval", "mutual control", "ProdCo consent"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Amazon is 100% financier"],
    "fallback_positions": ["None - hold to form"],
    "escalation_triggers": ["Any limitation on Amazon control"]
  }'::jsonb,
  '{
    "inherent_risk": "CRITICAL",
    "escalation_triggers": ["ProdCo approval", "mutual", "consent required"],
    "requires_legal_review": true
  }'::jsonb,
  '{
    "must_have": ["sole and final control"],
    "strong_indicators": ["Amazon has sole", "final control"],
    "red_flags": ["subject to approval", "consent"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 17. ConditionsPrecedent
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'ConditionsPrecedent',
  'Conditions Precedent',
  'SUPPORT',
  false,
  '{
    "summary": "Amazon obligations subject to conditions in Exhibit A.",
    "core_requirements": [
      "Reference to Exhibit A conditions",
      "Amazon obligations conditional"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard reference to Exhibit A",
      "required_elements": ["conditions precedent", "Exhibit A"]
    },
    "passable": {
      "description": "Acknowledge conditions satisfied",
      "variations": ["Conditions acknowledged as satisfied via email"],
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["delete conditions"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Conditions protect closing"],
    "fallback_positions": ["Can acknowledge via email"],
    "escalation_triggers": ["Remove conditions requirement"]
  }'::jsonb,
  '{
    "inherent_risk": "LOW",
    "escalation_triggers": ["delete", "remove conditions"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["conditions precedent"],
    "strong_indicators": ["Exhibit A", "subject to"],
    "red_flags": ["delete", "remove"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 18. Insurance
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'Insurance',
  'Insurance',
  'SUPPORT',
  false,
  '{
    "summary": "Insurance requirements per Standard Terms. E&O insurance funded by Amazon in budget.",
    "core_requirements": [
      "Insurance per Standard Terms",
      "E&O insurance",
      "Amazon named as additional insured"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard insurance requirements",
      "required_elements": ["insurance", "E&O"]
    },
    "passable": {
      "description": "Per Standard Terms",
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["no insurance", "remove insurance requirement"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Industry standard requirement"],
    "fallback_positions": ["Per STCs"],
    "escalation_triggers": ["Remove insurance"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["remove insurance", "no insurance"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["insurance"],
    "strong_indicators": ["E&O", "errors and omissions", "liability"],
    "red_flags": ["remove", "waive", "no insurance"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 19. StandardTerms
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'StandardTerms',
  'Standard Terms',
  'SUPPORT',
  false,
  '{
    "summary": "Agreement incorporates industry custom standard terms and conditions. STCs to be formalized at Amazon request.",
    "core_requirements": [
      "Incorporates industry custom STCs",
      "STCs formalized at Amazon request",
      "Good faith negotiation within Amazon parameters"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Industry custom STCs incorporated",
      "required_elements": ["standard terms", "industry custom"]
    },
    "passable": {
      "description": "Trigger STCs after option exercise",
      "variations": ["STCs negotiated after option exercise"],
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["remove industry custom prevails", "no STCs"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Affects both parties equally"],
    "fallback_positions": ["Can use industry parameters"],
    "escalation_triggers": ["Remove industry custom clause"]
  }'::jsonb,
  '{
    "inherent_risk": "LOW",
    "escalation_triggers": ["remove", "delete STCs"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["standard terms"],
    "strong_indicators": ["industry custom", "STCs"],
    "red_flags": ["remove", "delete"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- 20. ServicesScope (may already exist from previous migration)
INSERT INTO playbook_specs (
  family_id, display_name, priority, requires_legal_review,
  amazon_position, acceptability_matrix, negotiation_guidance, risk_assessment, detection_patterns
) VALUES (
  'ServicesScope',
  'Scope of Services',
  'SUPPORT',
  false,
  '{
    "summary": "ProdCo renders comprehensive production services as defined in agreement and exhibits.",
    "core_requirements": [
      "ProdCo renders services",
      "Per agreement and exhibits",
      "Entire agreement clause"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Standard services scope",
      "required_elements": ["render services", "exhibits"]
    },
    "passable": {
      "description": "General scope acceptable",
      "approval_level": "NTD"
    },
    "unacceptable": {
      "patterns": ["limited services", "best efforts"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Foundational clause"],
    "fallback_positions": ["Accept if exhibits comprehensive"],
    "escalation_triggers": ["Limited services"]
  }'::jsonb,
  '{
    "inherent_risk": "LOW",
    "escalation_triggers": ["limited", "best efforts"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["services", "render"],
    "strong_indicators": ["exhibits", "Program"],
    "red_flags": ["limited", "best efforts"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT 
  family_id, 
  display_name, 
  priority, 
  requires_legal_review,
  updated_at
FROM playbook_specs 
ORDER BY priority DESC, display_name;
