/**
 * ================================================================
 * DECISION NORMALIZER v4.2 - CG-002 Semantics Alignment
 * ================================================================
 * 
 * Ensures consistent mapping between:
 * - Agent internal decisions (AUTO_PASS, ESCALATE_HUMAN, etc.)
 * - Database enum values (accept, modify, escalate, reject)
 * - UI client_state values (accepted, pending_review, rejected)
 * 
 * Place this in the Sanitizer Parse node AFTER Decision Engine v2
 * 
 * Version: 4.2
 * Last Updated: 2026-02-01
 * Track: CG-002
 * ================================================================
 */

// ================================================================
// CG-002: CANONICAL DECISION MAPPINGS
// ================================================================

/**
 * Maps agent internal decisions to database values
 * Agent Output → DB `decision` column
 */
const DECISION_TO_DB = {
    // Accept category
    'AUTO_PASS': 'accept',
    'ACCEPT': 'accept',
    'ACCEPT_AS_IS': 'accept',
    'APPROVE': 'accept',

    // Accept with review
    'APPROVE_WITH_NOTES': 'accept',  // Note: client_state will be 'pending_review'
    'ACCEPT_WITH_NOTES': 'accept',
    'LOG_ONLY': 'accept',

    // Modify category
    'SUGGEST_REDLINE': 'modify',
    'REDLINE': 'modify',
    'AUTO_REDLINE': 'modify',

    // Escalate category
    'ESCALATE': 'escalate',
    'ESCALATE_HUMAN': 'escalate',
    'NEEDS_REVIEW': 'escalate',
    'FLAG': 'escalate',

    // Reject category
    'BLOCK_EXPORT': 'reject',
    'REJECT': 'reject',
    'BLOCK': 'reject'
};

/**
 * Maps DB decision + context to UI client_state
 * Decision + Context → UI `client_state` column
 */
const DECISION_TO_CLIENT_STATE = {
    // Pure accepts show as accepted
    'AUTO_PASS': 'accepted',
    'ACCEPT': 'accepted',
    'ACCEPT_AS_IS': 'accepted',

    // Notes/review required
    'APPROVE_WITH_NOTES': 'pending_review',
    'ACCEPT_WITH_NOTES': 'pending_review',
    'LOG_ONLY': 'pending_review',
    'SUGGEST_REDLINE': 'pending_review',

    // Escalations always need review
    'ESCALATE': 'pending_review',
    'ESCALATE_HUMAN': 'pending_review',
    'NEEDS_REVIEW': 'pending_review',
    'FLAG': 'pending_review',

    // Blocks/rejects
    'BLOCK_EXPORT': 'rejected',
    'REJECT': 'rejected',
    'BLOCK': 'rejected'
};

/**
 * Valid values for persistence
 */
const VALID_DB_DECISIONS = ['accept', 'modify', 'escalate', 'reject'];
const VALID_CLIENT_STATES = ['accepted', 'pending_review', 'rejected'];

/**
 * Normalizes a decision value for persistence
 * @param {string} rawDecision - The raw decision from agent
 * @returns {object} - { db_decision, client_state, original, normalized }
 */
function normalizeDecision(rawDecision) {
    const upper = (rawDecision || '').toUpperCase().trim();

    const db_decision = DECISION_TO_DB[upper] || 'escalate';  // Default to escalate for safety
    const client_state = DECISION_TO_CLIENT_STATE[upper] || 'pending_review';

    return {
        db_decision,
        client_state,
        original: rawDecision,
        normalized: true,
        is_auto_approved: client_state === 'accepted',
        requires_review: client_state === 'pending_review',
        is_rejected: client_state === 'rejected'
    };
}

// ================================================================
// INTEGRATION CODE FOR n8n
// ================================================================

const data = $('Decision Engine v2').first().json;
const decResult = data.decisorOutput || {};
const rawDecision = decResult.decision || 'ESCALATE_HUMAN';

// Apply normalization
const normalized = normalizeDecision(rawDecision);

// Build sanitizerOut from LLM response
let sanitizerOut = {
    client_comment: '',
    client_summary_line: '',
    safety: { pass: true, leaked_terms: [] }
};

try {
    const content = $json.choices?.[0]?.message?.content || '{}';
    sanitizerOut = JSON.parse(content);
} catch (e) {
    console.log('Sanitizer parse error', e);
}

// LEAKAGE GUARD - Extended blocklist
const blocklist = [
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
    'rule_candidate', 'policy_judgment', 'family_pack', 'v2026'
];

const textToCheck = (
    (sanitizerOut.client_summary_line || '') + ' ' +
    (sanitizerOut.client_comment || '')
).toLowerCase();

const detectedTerms = blocklist.filter(term => textToCheck.includes(term.toLowerCase()));
const leakScore = detectedTerms.length / blocklist.length;
const safetyPass = detectedTerms.length === 0;

// Override decision if leakage detected
let finalDecision = normalized.db_decision;
let finalClientState = normalized.client_state;
let blockExport = decResult.escalation?.block_export || false;

if (!safetyPass) {
    finalDecision = 'reject';
    finalClientState = 'rejected';
    blockExport = true;
}

// ================================================================
// BUILD OUTPUT PAYLOADS
// ================================================================

// Internal result for clause_reviews table
const internalResult = {
    run_id: data.run_id,
    clause_instance_id: data.clause_instance_id,
    detected_family: data.routerOutput?.route || 'OtherUnknown',
    rule_id: data.policySpec?.rule_id || null,
    analysis_mode: data.policySpec?.analysis_mode || 'MODE_ENUMERATED_DEVIATIONS',
    observations: data.paranoidOutput || {},
    observations_count: data.paranoidOutput?.evidence_spans?.length || 0,
    final_status: data.valuatorOutput?.final_status || 'Unknown',
    proposed_changes: data.valuatorOutput?.proposed_changes || [],
    anchor_confidence: decResult.anchor_confidence || 0,
    confidence_overall: decResult.confidence_overall || 0,
    // CG-002: Normalized values
    decision: finalDecision,  // Now uses DB enum: accept/modify/escalate/reject
    client_state: finalClientState,  // Now uses UI enum: accepted/pending_review/rejected
    escalation_recommended: decResult.escalation?.recommended || false,
    escalation_reason: decResult.escalation?.reason || null,
    block_export: blockExport,
    validation_passed: data.validation_passed !== false,
    processing_time_ms: Date.now() - (data._processing_start || Date.now()),
    // Normalization metadata
    _decision_normalized: normalized,
    _original_decision: rawDecision
};

// Sanitized result for sanitizer_outputs table
const sanitizedResult = {
    run_id: data.run_id,
    clause_instance_id: data.clause_instance_id,
    client_summary_line: sanitizerOut.client_summary_line || '',
    client_comment: sanitizerOut.client_comment || '',
    client_status: finalClientState,
    safety_pass: safetyPass,
    blocked_terms_detected: detectedTerms,
    leak_score: leakScore,
    proposed_changes_client: (data.valuatorOutput?.proposed_changes || []).map(c => ({
        op_type: c.op_type,
        original_text: c.original_text,
        replacement_text: c.replacement_text
    }))
};

// Combined response
const responseResult = {
    clause_instance_id: data.clause_instance_id,
    clause_id: data.clause_id,
    document_id: data.document_id,
    run_id: data.run_id,
    detected_family: data.routerOutput?.route,
    // CG-002: Normalized outputs
    decision: finalDecision,
    client_state: finalClientState,
    client_comment: sanitizerOut.client_comment,
    client_summary_line: sanitizerOut.client_summary_line,
    safety_pass: safetyPass,
    completed_at: new Date().toISOString(),
    _internal: internalResult,
    _sanitized: sanitizedResult
};

return [{ json: responseResult }];
