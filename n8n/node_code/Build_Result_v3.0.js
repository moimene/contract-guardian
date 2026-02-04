// =====================================================================
// BUILD RESULT v3.0 - Compatible with Paranoid Agent v3.0
// =====================================================================
// FIX: Error "Cannot read properties of undefined (reading 'decision')"
// Root cause: The node was trying to access data from "Decision Engine v2"
// but the v3.0 workflow may use a different node name or structure.
//
// This version:
// 1. Uses robust fallback chain for getting previous node data
// 2. Works with both Decision Engine v2 and v3.0
// 3. Handles missing or undefined properties gracefully
// =====================================================================

// =========================================================================
// ROBUST: Get data from upstream nodes
// Build Result comes AFTER Sanitizer Agent, which comes AFTER Decision Engine
// =========================================================================
let data;
try {
    // Primary: Get from Decision Engine v2 (most complete data)
    data = $('Decision Engine v2').first().json;
} catch (e1) {
    try {
        // Alternative: Decision Engine (if renamed)
        data = $('Decision Engine').first().json;
    } catch (e2) {
        try {
            // Fallback: ValidatorDeterministic
            data = $('ValidatorDeterministic').first().json;
        } catch (e3) {
            try {
                // Fallback: Parse Valuator
                data = $('Parse Valuator').first().json;
            } catch (e4) {
                try {
                    // Fallback: Parse Paranoid
                    data = $('Parse Paranoid').first().json;
                } catch (e5) {
                    // Last resort: use input directly (from Sanitizer Agent)
                    data = $input.first().json || {};
                }
            }
        }
    }
}

// Also get the Sanitizer Agent LLM output from current input
// (Build Result receives input from Sanitizer Agent)

// LLM Sanitizer output - also with fallback
let sanitizerOut = { client_comment: '', client_summary_line: '', safety: { pass: true, leaked_terms: [] } };
try {
    const content = $json?.choices?.[0]?.message?.content || '{}';
    sanitizerOut = JSON.parse(content);
} catch (e) {
    console.log('Sanitizer parse error', e);
    // Use fallback values
}

// =========================================================================
// LEAKAGE GUARD - Extended blocklist v2.1 (Gap 8 + CG-018)
// =========================================================================
const blocklist = [
    // === Base terms (v1.0 - existing) ===
    'playbook', 'policy', 'policyspec', 'rule_id', 'rulename',
    'aceptable', 'inaceptable', 'acceptable', 'unacceptable',
    'threshold', 'confidence', 'anchor_conf', 'coverage',
    'escalate', 'escalation', 'routing', 'gating',
    'policyowner', 'amazonlegal', 'legal team', 'despacho',
    'internal', 'guidance', 'standard_position',
    'variation', 'variationset', 'paranoid', 'valuator', 'sanitizer',
    'source_reference', 'exact_text', 'mode_strict', 'mode_enumerated',
    'block_export', 'auto_pass', 'auto_redline', 'observation',
    'evidence_span', 'anchor_confidence', 'confidence_overall',
    'rule_candidate', 'policy_judgment', 'family_pack', 'v2026',

    // === CG-018 New terms (v2.1) ===
    'rag', 'embedding', 'embeddings', 'similarity', 'vector', 'vectorstore',
    'semantic_search', 'lightrag', 'supabase', 'pinecone', 'openai',
    'agent', 'router', 'classifier', 'decisor', 'decision_engine',
    'keyword_v5', 'hybrid_router', 'family_pack',
    'AUTO_PASS', 'APPROVE_WITH_NOTES', 'ESCALATE_HUMAN', 'BLOCK_EXPORT',
    'NEEDS_REVIEW', 'Compliant', 'AcceptableDeviation', 'UnacceptableDeviation',
    'deviation', 'red_flag', 'red flag', 'pattern_matched',
    'must_have', 'must-have', 'keyword_match', 'tier1', 'tier2', 'tier3',
    'json_schema', 'validation_passed', 'processing_time', 'routing_method',
    'top_matches', 'coverage_confidence', 'leak_score',
    'few-shot', 'fewshot', 'grounding', 'semantic matching',
    '_internal', '_sanitized', 'clause_reviews_internal', 'paranoidOutput',
    'valuatorOutput', 'decisorOutput', 'playbookSpec', 'policySpec',
    'IndemnityProdCo', 'IndemnityAmazon', 'PaymentCredits', 'Insurance',
    'LiabilityLimitation', 'RepsProdCo', 'IndemnityProcedures'
];

const textToCheck = (
    (sanitizerOut.client_summary_line || '') + ' ' +
    (sanitizerOut.client_comment || '')
).toLowerCase();

const detectedTerms = blocklist.filter(term => textToCheck.includes(term.toLowerCase()));
const leakScore = detectedTerms.length / blocklist.length;
const safetyPass = detectedTerms.length === 0;

// =========================================================================
// SAFE ACCESS HELPERS - Prevents undefined errors
// =========================================================================
const safeGet = (obj, path, defaultValue = null) => {
    try {
        return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
        return defaultValue;
    }
};

// =========================================================================
// Extract decision with fallback chain
// =========================================================================
let decision = safeGet(data, 'decisorOutput.decision') ||
    safeGet(data, 'decision') ||
    safeGet(data, 'valuatorOutput.decision') ||
    'ESCALATE_HUMAN'; // Safe default

let blockExport = safeGet(data, 'decisorOutput.escalation.block_export', false) ||
    safeGet(data, 'block_export', false);

// Override decision if leakage detected
if (!safetyPass) {
    decision = 'BLOCK_EXPORT';
    blockExport = true;
}

// =========================================================================
// Build internal result for clause_reviews_internal table
// =========================================================================
const internalResult = {
    run_id: safeGet(data, 'run_id', ''),
    clause_instance_id: safeGet(data, 'clause_instance_id', ''),
    detected_family: safeGet(data, 'detected_family', 'OtherUnknown'),
    rule_id: safeGet(data, 'policySpec.rule_id', null),
    analysis_mode: safeGet(data, 'policySpec.analysis_mode', 'MODE_ENUMERATED_DEVIATIONS'),
    observations: safeGet(data, 'paranoidOutput', {}),
    observations_count: safeGet(data, 'paranoidOutput.observations.length', 0) ||
        safeGet(data, 'paranoidOutput.summary.counts.total', 0),
    final_status: safeGet(data, 'valuatorOutput.final_status', 'Unknown'),
    proposed_changes: safeGet(data, 'valuatorOutput.proposed_changes', []),
    anchor_confidence: safeGet(data, 'decisorOutput.anchor_confidence', 0) ||
        safeGet(data, 'min_anchor_confidence', 0),
    confidence_overall: safeGet(data, 'decisorOutput.confidence_overall', 0) ||
        safeGet(data, 'valuatorOutput.confidence_overall', 0),
    decision: decision,
    escalation_recommended: safeGet(data, 'decisorOutput.escalation.recommended', false) ||
        safeGet(data, 'valuatorOutput.escalation_recommended', false),
    escalation_reason: safeGet(data, 'decisorOutput.escalation.reason', null) ||
        safeGet(data, 'valuatorOutput.escalation_reason', null),
    block_export: blockExport,
    validation_passed: safeGet(data, 'validation_passed', true),
    processing_time_ms: 0,
    routing_method: safeGet(data, '_routing_method', null) ||
        safeGet(data, 'routing_method', null),
    routing_confidence: safeGet(data, '_keyword_confidence', 0) ||
        safeGet(data, 'routing_confidence', 0),
    keyword_confidence: safeGet(data, '_keyword_confidence', 0),
    top_matches: safeGet(data, '_matches', null),
    blocklist_version: 'v3.0',
    leaked_terms_count: detectedTerms.length,

    // v3.0 additions
    severity_breakdown: safeGet(data, 'paranoidOutput.severity_breakdown', null),
    operating_mode: safeGet(data, 'operating_mode', null),
    industry_carveouts_applied: safeGet(data, 'industry_carveouts_applied', false),
    rag_match_used: safeGet(data, 'rag_match_used', false)
};

// =========================================================================
// Build sanitized result for sanitizer_outputs table
// =========================================================================
const proposedChanges = safeGet(data, 'valuatorOutput.proposed_changes', []);
const sanitizedResult = {
    run_id: safeGet(data, 'run_id', ''),
    clause_instance_id: safeGet(data, 'clause_instance_id', ''),
    client_summary_line: sanitizerOut.client_summary_line || '',
    client_comment: sanitizerOut.client_comment || '',
    client_status: safeGet(data, 'decisorOutput.client_state', 'NEEDS_REVIEW') ||
        safeGet(data, 'client_state', 'NEEDS_REVIEW'),
    safety_pass: safetyPass,
    blocked_terms_detected: detectedTerms,
    leak_score: leakScore,
    proposed_changes_client: Array.isArray(proposedChanges)
        ? proposedChanges.map(c => ({
            op_type: c?.change_type || c?.op_type || 'unknown',
            original_text: c?.original_text || c?.target_text || '',
            replacement_text: c?.replacement_text || ''
        }))
        : []
};

// =========================================================================
// Combined response for webhook
// =========================================================================
const responseResult = {
    clause_instance_id: safeGet(data, 'clause_instance_id', ''),
    clause_id: safeGet(data, 'clause_id', ''),
    document_id: safeGet(data, 'document_id', ''),
    run_id: safeGet(data, 'run_id', ''),
    detected_family: safeGet(data, 'detected_family', 'OtherUnknown'),
    client_state: safeGet(data, 'decisorOutput.client_state', 'NEEDS_REVIEW'),
    client_comment: sanitizerOut.client_comment || '',
    client_summary_line: sanitizerOut.client_summary_line || '',
    decision: decision,
    safety_pass: safetyPass,
    completed_at: new Date().toISOString(),

    // v3.0 response additions
    risk_level: safeGet(data, 'paranoidOutput.risk_level', 'YELLOW'),
    observations_count: internalResult.observations_count,
    has_proposed_changes: proposedChanges.length > 0,

    // Internal data for database persistence
    _internal: internalResult,
    _sanitized: sanitizedResult
};

return [{ json: responseResult }];
