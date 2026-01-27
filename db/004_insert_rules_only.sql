-- Amazon Redliner - Insert playbook rules ONLY
-- Run this after the schema is created
-- This script is idempotent (safe to run multiple times)

-- ============================================================
-- Step 1: Ensure playbook_rules table exists (idempotent)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playbook_rules (
    rule_id TEXT PRIMARY KEY,
    clause_family TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    required BOOLEAN DEFAULT false,
    analysis_mode TEXT NOT NULL,
    standard_position JSONB NOT NULL,
    acceptable_variations JSONB DEFAULT '[]',
    unacceptable_patterns JSONB DEFAULT '[]',
    guidance_internal TEXT,
    anchors JSONB DEFAULT '[]',
    definitions_scope JSONB DEFAULT '[]',
    retrieval_profile JSONB DEFAULT '{}',
    routing_policy JSONB DEFAULT '{}',
    decision_policy JSONB DEFAULT '{}',
    models JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 2: Insert rules (upsert - won't fail if exists)
-- ============================================================

-- IndemnityProdCo (complete rule)
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position, acceptable_variations, unacceptable_patterns, decision_policy)
VALUES (
    'IndemnityProdCo',
    'IndemnityProdCo',
    '1.0.0',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "ProdCo Indemnification", "text": "ProdCo will indemnify, defend and hold harmless Amazon and its Affiliates from any losses, costs or damages arising from any third party claims alleging breach of ProdCo representations or warranties."}'::jsonb,
    '["ProdCo shall defend, indemnify and hold harmless Amazon", "ProdCo agrees to indemnify and defend Amazon", "ProdCo will indemnify Amazon against third party claims"]'::jsonb,
    '["ProdCo waives all indemnification obligations", "indemnification is limited to direct damages only", "ProdCo shall not be required to indemnify"]'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85}'::jsonb
)
ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    acceptable_variations = EXCLUDED.acceptable_variations,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- Termination (complete rule)
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position, acceptable_variations, unacceptable_patterns, decision_policy)
VALUES (
    'Termination',
    'Termination',
    '1.0.0',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Termination Rights", "text": "Either party may terminate this Agreement upon 30 days prior written notice if the other party breaches any material term and fails to cure such breach within 30 days."}'::jsonb,
    '["upon 30 days written notice with a 30-day cure period", "terminate for material breach with opportunity to cure"]'::jsonb,
    '["terminate immediately without notice", "terminate without cause at any time", "no obligation to pay fees accrued"]'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85}'::jsonb
)
ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    acceptable_variations = EXCLUDED.acceptable_variations,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- OtherUnknown (catch-all for unrecognized clauses)
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES (
    'OtherUnknown',
    'OtherUnknown',
    '1.0.0',
    false,
    'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"title": "Unknown/Other Clause", "text": "This clause does not match known categories. Requires human review."}'::jsonb
)
ON CONFLICT (rule_id) DO NOTHING;

-- PaymentCredits
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('PaymentCredits', 'PaymentCredits', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Payment Terms", "text": "Standard payment and credit terms."}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- RepsProdCo
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('RepsProdCo', 'RepsProdCo', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "ProdCo Representations", "text": "ProdCo representations and warranties."}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- RepsAmazon
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('RepsAmazon', 'RepsAmazon', '1.0.0', false, 'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"title": "Amazon Representations", "text": "Amazon representations and warranties."}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- DefenseSettlement
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('DefenseSettlement', 'DefenseSettlement', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Defense and Settlement", "text": "Defense and settlement control provisions."}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- SurvivalRemedies
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('SurvivalRemedies', 'SurvivalRemedies', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Survival and Remedies", "text": "Survival provisions and available remedies."}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================
-- Step 3: Verify
-- ============================================================

SELECT rule_id, clause_family, required, analysis_mode
FROM public.playbook_rules
ORDER BY rule_id;
