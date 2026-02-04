// =====================================================
// Parse Valuator (CG-012-FIX) - Deterministic Status Override
// =====================================================
// COPIA ESTE CÓDIGO EN EL NODO "Parse Valuator" DE n8n
// Este fix resuelve:
// 1. Status override: si hay red flags → UnacceptableDeviation
// 2. Escalation automática para cláusulas críticas
// =====================================================

const prevData = $('Parse Paranoid').first().json;
let valuatorOutput = {
    decision: 'ACCEPT',
    final_status: 'Compliant',
    needs_review: false,
    proposed_changes: [],
    internal_comment: '',
    client_state: 'OK',
    confidence_overall: 0.5,
    confidences: { anchor_confidence: 0.5 }
};
let validationErrors = prevData.paranoidValidationErrors || [];

try {
    const content = $json.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    // SCHEMA VALIDATION
    const validStatuses = ['Compliant', 'AcceptableDeviation', 'UnacceptableDeviation', 'NotCoveredByPlaybook', 'Ambiguous'];
    if (!validStatuses.includes(parsed.final_status)) {
        validationErrors.push(`Invalid final_status: ${parsed.final_status}, defaulting to Ambiguous`);
        parsed.final_status = 'Ambiguous';
    }

    // Ensure proposed_changes is array
    if (!Array.isArray(parsed.proposed_changes)) {
        parsed.proposed_changes = [];
    }

    // Validate each proposed change has source_reference for no-new-text
    for (let i = 0; i < parsed.proposed_changes.length; i++) {
        const change = parsed.proposed_changes[i];
        if (!change.source_reference && change.replacement_text) {
            validationErrors.push(`Change ${i}: missing source_reference`);
            change.source_reference = {
                source_type: 'STANDARD_POSITION',
                exact_text: change.replacement_text
            };
        }
        if (!change.anchor || !change.anchor.offsets) {
            change.anchor = {
                quote: change.original_text || '',
                offsets: { start: 0, end: 0 },
                anchor_confidence: parsed.confidences?.anchor_confidence || 0.7
            };
        }
    }

    // Ensure confidences object
    if (!parsed.confidences) {
        parsed.confidences = { anchor_confidence: 0.7 };
    }
    parsed.confidence_overall = parsed.confidence_overall || parsed.confidences.anchor_confidence || 0.7;

    valuatorOutput = parsed;
} catch (e) {
    console.log('Valuator parse error:', e.message);
    validationErrors.push('JSON parse error: ' + e.message);
    valuatorOutput.final_status = 'Ambiguous';
}

// =====================================================
// CG-012-FIX: DETERMINISTIC STATUS OVERRIDE
// =====================================================
// Extract critical signals from Paranoid output
const observations = prevData.paranoidOutput?.observations || [];
const redFlagsFound = prevData.paranoidOutput?.summary?.red_flags_found || 0;
const mustHaveMissing = prevData.paranoidOutput?.summary?.must_have_missing || 0;
const unacceptableFound = prevData.paranoidOutput?.summary?.unacceptable_patterns_found || 0;
const riskLevel = prevData.paranoidOutput?.risk_level || 'GREEN';

// Check observation categories
const hasMatchesUnacceptable = observations.some(o => o.possible_category === 'MatchesUnacceptable');
const hasMissingRequired = observations.some(o => o.possible_category === 'MissingRequired');
const hasHighSeverity = observations.some(o => o.severity === 'high');

// DETERMINISTIC STATUS OVERRIDE
// If ANY critical condition is true, FORCE UnacceptableDeviation
if (hasMatchesUnacceptable || hasMissingRequired || redFlagsFound > 0 || mustHaveMissing > 0 || unacceptableFound > 0) {
    const originalStatus = valuatorOutput.final_status;
    valuatorOutput.final_status = 'UnacceptableDeviation';
    valuatorOutput.internal_comment =
        `[CG-012-FIX] GUARDRAIL OVERRIDE: Status forced from '${originalStatus}' to 'UnacceptableDeviation'. ` +
        `Red flags: ${redFlagsFound}, Unacceptable patterns: ${unacceptableFound}, Missing anchors: ${mustHaveMissing}. ` +
        (valuatorOutput.internal_comment || '');
    valuatorOutput.needs_review = true;
    valuatorOutput.client_state = 'REQUIRED';
    valuatorOutput.escalation_recommended = true;
    valuatorOutput.escalation_reason = 'GUARDRAIL_OVERRIDE_RED_FLAG';
}
// Also escalate on high severity observations
else if (hasHighSeverity || riskLevel === 'RED') {
    if (valuatorOutput.final_status === 'Compliant') {
        valuatorOutput.final_status = 'AcceptableDeviation';
    }
    valuatorOutput.needs_review = true;
    valuatorOutput.internal_comment =
        `[CG-012-FIX] High severity observation detected. Review recommended. ` +
        (valuatorOutput.internal_comment || '');
}

return [{ json: { ...prevData, valuatorOutput, valuatorValidationErrors: validationErrors } }];
