-- Amazon Redliner - Setup playbook_rules table with initial data
-- Run this in Supabase SQL Editor

-- ============================================================
-- Step 1: Create playbook_rules table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playbook_rules (
    rule_id TEXT PRIMARY KEY,
    clause_family TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    required BOOLEAN DEFAULT false,
    analysis_mode TEXT NOT NULL CHECK (analysis_mode IN (
        'MODE_STRICT_NO_DEVIATIONS',
        'MODE_ENUMERATED_DEVIATIONS',
        'MODE_POLICY_JUDGMENT_REQUIRED'
    )),
    standard_position JSONB NOT NULL,
    acceptable_variations JSONB DEFAULT '[]',
    unacceptable_patterns JSONB DEFAULT '[]',
    guidance_internal TEXT,
    anchors JSONB DEFAULT '[]',
    definitions_scope JSONB DEFAULT '[]',
    retrieval_profile JSONB DEFAULT '{"vector_top_k": 5, "coverage_threshold": 0.78, "examples_top_k": 6}',
    routing_policy JSONB DEFAULT '{"block_export_if_escalated": true}',
    decision_policy JSONB DEFAULT '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true}',
    models JSONB DEFAULT '{"paranoid": "gpt-4o", "valuator": "gpt-4o-mini", "sanitizer": "gpt-4o-mini"}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS "Service role full access" ON public.playbook_rules;
CREATE POLICY "Service role full access" ON public.playbook_rules
    FOR ALL USING (auth.role() = 'service_role');

-- Also allow anon access for testing (remove in production)
DROP POLICY IF EXISTS "Allow read for all" ON public.playbook_rules;
CREATE POLICY "Allow read for all" ON public.playbook_rules
    FOR SELECT USING (true);

-- ============================================================
-- Step 2: Insert IndemnityProdCo rule
-- ============================================================

INSERT INTO public.playbook_rules (
    rule_id,
    clause_family,
    version,
    required,
    analysis_mode,
    standard_position,
    acceptable_variations,
    unacceptable_patterns,
    guidance_internal,
    anchors,
    definitions_scope,
    retrieval_profile,
    routing_policy,
    decision_policy,
    models
) VALUES (
    'IndemnityProdCo',
    'IndemnityProdCo',
    '1.0.0',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "title": "ProdCo Indemnification Obligations",
        "text": "ProdCo will indemnify, defend and hold harmless Amazon and its Affiliates from any losses, costs or damages arising from any third party claims alleging breach of ProdCo representations or warranties.",
        "text_fragment_id": "indemnity_prodco_std_001"
    }'::jsonb,
    '["ProdCo shall defend, indemnify and hold harmless Amazon", "ProdCo agrees to indemnify and defend Amazon", "ProdCo will indemnify Amazon against third party claims"]'::jsonb,
    '["ProdCo waives all indemnification obligations", "ProdCo''s indemnification is limited to direct damages only", "ProdCo shall not be required to indemnify", "Amazon shall indemnify ProdCo for ProdCo''s breaches"]'::jsonb,
    'This is a REQUIRED clause. ProdCo must provide indemnification for their representations and warranties. Any attempt to limit, cap, or eliminate this indemnification should be flagged as UnacceptableDeviation.',
    '["indemnify", "defend", "hold harmless", "third party claims", "representations or warranties"]'::jsonb,
    '["Affiliates", "Losses", "Claims"]'::jsonb,
    '{"vector_top_k": 5, "coverage_threshold": 0.78, "examples_top_k": 6}'::jsonb,
    '{"default_route": "IndemnityProdCo", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_required_violated": true}'::jsonb,
    '{"paranoid": "gpt-4o", "valuator": "gpt-4o-mini", "sanitizer": "gpt-4o-mini"}'::jsonb
)
ON CONFLICT (rule_id) DO UPDATE SET
    clause_family = EXCLUDED.clause_family,
    version = EXCLUDED.version,
    required = EXCLUDED.required,
    analysis_mode = EXCLUDED.analysis_mode,
    standard_position = EXCLUDED.standard_position,
    acceptable_variations = EXCLUDED.acceptable_variations,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    guidance_internal = EXCLUDED.guidance_internal,
    anchors = EXCLUDED.anchors,
    definitions_scope = EXCLUDED.definitions_scope,
    retrieval_profile = EXCLUDED.retrieval_profile,
    routing_policy = EXCLUDED.routing_policy,
    decision_policy = EXCLUDED.decision_policy,
    models = EXCLUDED.models,
    updated_at = NOW();

-- ============================================================
-- Step 3: Insert Termination rule
-- ============================================================

INSERT INTO public.playbook_rules (
    rule_id,
    clause_family,
    version,
    required,
    analysis_mode,
    standard_position,
    acceptable_variations,
    unacceptable_patterns,
    guidance_internal,
    anchors,
    definitions_scope,
    retrieval_profile,
    routing_policy,
    decision_policy,
    models
) VALUES (
    'Termination',
    'Termination',
    '1.0.0',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "title": "Termination Rights and Procedures",
        "text": "Either party may terminate this Agreement upon 30 days prior written notice if the other party breaches any material term and fails to cure such breach within 30 days after receiving written notice of the breach.",
        "text_fragment_id": "termination_std_001"
    }'::jsonb,
    '["upon 30 days written notice with a 30-day cure period", "terminate for material breach with opportunity to cure", "30-day notice and 30-day cure period for material breaches"]'::jsonb,
    '["terminate immediately without notice", "terminate without cause at any time", "terminate immediately upon written notice if ProdCo breaches", "no obligation to pay fees accrued but unpaid at termination", "waive all claims upon termination"]'::jsonb,
    'Standard Amazon PSA/DSA termination requires: 1) 30-day prior written notice, 2) 30-day cure period for material breaches, 3) Payment of accrued fees upon termination.',
    '["terminate", "termination", "written notice", "cure period", "material breach", "accrued fees"]'::jsonb,
    '["Material Breach", "Cure Period", "Effective Date of Termination"]'::jsonb,
    '{"vector_top_k": 5, "coverage_threshold": 0.80, "examples_top_k": 6}'::jsonb,
    '{"default_route": "Termination", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_required_violated": true}'::jsonb,
    '{"paranoid": "gpt-4o", "valuator": "gpt-4o-mini", "sanitizer": "gpt-4o-mini"}'::jsonb
)
ON CONFLICT (rule_id) DO UPDATE SET
    clause_family = EXCLUDED.clause_family,
    version = EXCLUDED.version,
    required = EXCLUDED.required,
    analysis_mode = EXCLUDED.analysis_mode,
    standard_position = EXCLUDED.standard_position,
    acceptable_variations = EXCLUDED.acceptable_variations,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    guidance_internal = EXCLUDED.guidance_internal,
    anchors = EXCLUDED.anchors,
    definitions_scope = EXCLUDED.definitions_scope,
    retrieval_profile = EXCLUDED.retrieval_profile,
    routing_policy = EXCLUDED.routing_policy,
    decision_policy = EXCLUDED.decision_policy,
    models = EXCLUDED.models,
    updated_at = NOW();

-- ============================================================
-- Step 4: Add placeholder rules for other clause families
-- ============================================================

-- PaymentCredits
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('PaymentCredits', 'PaymentCredits', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Payment and Credits", "text": "Standard payment terms placeholder.", "text_fragment_id": "payment_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- ThirdPartyCredits
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('ThirdPartyCredits', 'ThirdPartyCredits', '1.0.0', false, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Third Party Credits", "text": "Standard third party credit terms placeholder.", "text_fragment_id": "tpc_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- RepsProdCo
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('RepsProdCo', 'RepsProdCo', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "ProdCo Representations", "text": "Standard ProdCo representations placeholder.", "text_fragment_id": "reps_prodco_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- RepsAmazon
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('RepsAmazon', 'RepsAmazon', '1.0.0', false, 'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"title": "Amazon Representations", "text": "Standard Amazon representations placeholder.", "text_fragment_id": "reps_amazon_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- RepsTruthTerm
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('RepsTruthTerm', 'RepsTruthTerm', '1.0.0', false, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Truth During Term", "text": "Representations truth during term placeholder.", "text_fragment_id": "reps_truth_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- IndemnityAmazon
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('IndemnityAmazon', 'IndemnityAmazon', '1.0.0', false, 'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"title": "Amazon Indemnification", "text": "Amazon indemnification obligations placeholder.", "text_fragment_id": "indem_amazon_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- DefenseSettlement
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('DefenseSettlement', 'DefenseSettlement', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Defense and Settlement", "text": "Defense and settlement control placeholder.", "text_fragment_id": "defense_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- SurvivalRemedies
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('SurvivalRemedies', 'SurvivalRemedies', '1.0.0', true, 'MODE_ENUMERATED_DEVIATIONS',
    '{"title": "Survival and Remedies", "text": "Survival and remedies placeholder.", "text_fragment_id": "survival_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- OtherUnknown (catch-all)
INSERT INTO public.playbook_rules (rule_id, clause_family, version, required, analysis_mode, standard_position)
VALUES ('OtherUnknown', 'OtherUnknown', '1.0.0', false, 'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"title": "Other/Unknown Clause", "text": "This clause does not match known categories. Escalate for human review.", "text_fragment_id": "other_std_001"}'::jsonb)
ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================
-- Step 5: Verify data
-- ============================================================

SELECT rule_id, clause_family, required, analysis_mode, created_at
FROM public.playbook_rules
ORDER BY rule_id;
