// Sanitizer Agent v2.1 - CG-018 Extended Blocklist
// ================================================================================
// This node validates and sanitizes LLM output before sending to client.
// v2.1 additions: RAG/embedding terms, agent names, decision codes, legal patterns
// ================================================================================

const data = $('Decision Engine v2').first().json;
let sanitizerOut = { client_comment: '', client_summary_line: '', safety: { pass: true, leaked_terms: [] } };

try {
    const content = $json.choices?.[0]?.message?.content || '{}';
    sanitizerOut = JSON.parse(content);
} catch (e) {
    console.log('Sanitizer parse error', e);
}

// LEAKAGE GUARD - Extended blocklist v2.1 (Gap 8 + CG-018)
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
    // RAG/Embedding system
    'rag', 'embedding', 'embeddings', 'similarity', 'vector', 'vectorstore',
    'semantic_search', 'lightrag', 'supabase', 'pinecone', 'openai',

    // Agent names and components
    'agent', 'router', 'classifier', 'decisor', 'decision_engine',
    'keyword_v5', 'hybrid_router', 'family_pack',

    // Decision codes (internal)
    'AUTO_PASS', 'APPROVE_WITH_NOTES', 'ESCALATE_HUMAN', 'BLOCK_EXPORT',
    'NEEDS_REVIEW', 'Compliant', 'AcceptableDeviation', 'UnacceptableDeviation',

    // Pattern matching terms
    'deviation', 'red_flag', 'red flag', 'pattern_matched',
    'must_have', 'must-have', 'keyword_match', 'tier1', 'tier2', 'tier3',

    // Technical/System terms
    'json_schema', 'validation_passed', 'processing_time', 'routing_method',
    'top_matches', 'coverage_confidence', 'leak_score',

    // Legal analysis terms (should not leak)
    'few-shot', 'fewshot', 'grounding', 'semantic matching',
    'mode_enumerated_deviations', 'mode_strict', 'priority_critical',

    // Internal references
    '_internal', '_sanitized', 'clause_reviews_internal', 'paranoidOutput',
    'valuatorOutput', 'decisorOutput', 'playbookSpec', 'policySpec',

    // Specific family/pattern IDs
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

// Override decision if leakage detected
let decision = data.decisorOutput.decision;
let blockExport = data.decisorOutput.escalation?.block_export || false;
if (!safetyPass) {
    decision = 'BLOCK_EXPORT';
    blockExport = true;
}

// Build internal result for clause_reviews_internal table
const internalResult = {
    run_id: data.run_id,
    clause_instance_id: data.clause_instance_id,
    detected_family: data.detected_family,
    rule_id: data.policySpec?.rule_id || null,
    analysis_mode: data.policySpec?.analysis_mode || 'MODE_ENUMERATED_DEVIATIONS',
    observations: data.paranoidOutput || {},
    observations_count: data.paranoidOutput?.observations?.length || data.paranoidOutput?.summary?.counts?.total || 0,
    final_status: data.valuatorOutput?.final_status || 'Unknown',
    proposed_changes: data.valuatorOutput?.proposed_changes || [],
    anchor_confidence: data.decisorOutput?.anchor_confidence || 0,
    confidence_overall: data.decisorOutput?.confidence_overall || 0,
    decision: decision,
    escalation_recommended: data.decisorOutput?.escalation?.recommended || false,
    escalation_reason: data.decisorOutput?.escalation?.reason || null,
    block_export: blockExport,
    validation_passed: true,
    processing_time_ms: 0,
    routing_method: data._routing_method || data.routing_method || null,
    routing_confidence: data._keyword_confidence || data.routing_confidence || 0,
    keyword_confidence: data._keyword_confidence || 0,
    top_matches: data._matches || null,
    // CG-018: Track blocklist version and leakage
    blocklist_version: 'v2.1',
    leaked_terms_count: detectedTerms.length
};

// Build sanitized result for sanitizer_outputs table
const sanitizedResult = {
    run_id: data.run_id,
    clause_instance_id: data.clause_instance_id,
    client_summary_line: sanitizerOut.client_summary_line || '',
    client_comment: sanitizerOut.client_comment || '',
    client_status: data.decisorOutput?.client_state || 'NEEDS_REVIEW',
    safety_pass: safetyPass,
    blocked_terms_detected: detectedTerms,
    leak_score: leakScore,
    proposed_changes_client: (data.valuatorOutput?.proposed_changes || []).map(c => ({
        op_type: c.change_type || c.op_type,
        original_text: c.original_text,
        replacement_text: c.replacement_text
    }))
};

// Combined for response
const responseResult = {
    clause_instance_id: data.clause_instance_id,
    clause_id: data.clause_id,
    document_id: data.document_id,
    run_id: data.run_id,
    detected_family: data.detected_family,
    client_state: data.decisorOutput?.client_state,
    client_comment: sanitizerOut.client_comment,
    client_summary_line: sanitizerOut.client_summary_line,
    decision: decision,
    safety_pass: safetyPass,
    completed_at: new Date().toISOString(),
    _internal: internalResult,
    _sanitized: sanitizedResult
};

return [{ json: responseResult }];
