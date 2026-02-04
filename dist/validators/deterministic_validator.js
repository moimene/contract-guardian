"use strict";
/**
 * Deterministic Validator
 * Enforces:
 * 1. No new text - all replacement text must match source_reference
 * 2. Anchor confidence threshold checking
 * 3. Leak pre-check on internal comments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_TERMS = void 0;
exports.validateNoNewText = validateNoNewText;
exports.validateAnchorConfidence = validateAnchorConfidence;
exports.validateNoLeaks = validateNoLeaks;
exports.runDeterministicValidator = runDeterministicValidator;
exports.validateForN8n = validateForN8n;
// Blocked terms for internal comment pre-check
exports.BLOCKED_TERMS = [
    'playbook', 'rule_id', 'rule_name', 'policyspec',
    'acceptable', 'unacceptable', 'deviation',
    'threshold', 'confidence', 'anchor_conf',
    'escalate', 'escalation', 'block_export',
    'guidance', 'internal note', 'with legal approval'
];
/**
 * Validate that all proposed changes reference approved text
 */
function validateNoNewText(proposedChanges, policySpec) {
    const violations = [];
    for (let i = 0; i < proposedChanges.length; i++) {
        const change = proposedChanges[i];
        // Check source_reference exists
        if (!change.source_reference) {
            violations.push({
                type: 'NO_SOURCE_REFERENCE',
                field: `proposed_changes[${i}].source_reference`,
                message: 'Proposed change has no source_reference',
                severity: 'error'
            });
            continue;
        }
        // Get the replacement text
        const replacementText = change.action.replace_with_text || change.action.insert_text || '';
        if (!replacementText) {
            continue; // DELETE actions don't need source_reference validation
        }
        // Check if text matches source_reference exactly
        const sourceText = change.source_reference.exact_text;
        if (replacementText.trim() !== sourceText.trim()) {
            // Check if it's in acceptable_variations
            const isAcceptable = policySpec.acceptable_variations.some(v => v.trim() === replacementText.trim());
            if (!isAcceptable) {
                // Check if it matches standard_position
                const isStandard = policySpec.standard_position.text.includes(replacementText.trim());
                if (!isStandard) {
                    violations.push({
                        type: 'NEW_TEXT_DETECTED',
                        field: `proposed_changes[${i}].action.replace_with_text`,
                        message: `Text not found in PolicySpec: "${replacementText.substring(0, 50)}..."`,
                        severity: 'error'
                    });
                }
            }
        }
    }
    return violations;
}
/**
 * Validate anchor confidence thresholds
 */
function validateAnchorConfidence(proposedChanges, threshold) {
    const violations = [];
    for (let i = 0; i < proposedChanges.length; i++) {
        const change = proposedChanges[i];
        if (!change.anchor) {
            violations.push({
                type: 'LOW_ANCHOR_CONFIDENCE',
                field: `proposed_changes[${i}].anchor`,
                message: 'Proposed change has no anchor',
                severity: 'warning'
            });
            continue;
        }
        if (change.anchor.anchor_confidence < threshold) {
            violations.push({
                type: 'LOW_ANCHOR_CONFIDENCE',
                field: `proposed_changes[${i}].anchor.anchor_confidence`,
                message: `Anchor confidence ${change.anchor.anchor_confidence} below threshold ${threshold}`,
                severity: 'warning'
            });
        }
    }
    return violations;
}
/**
 * Check for internal term leaks in internal_comment
 */
function validateNoLeaks(internalComment) {
    const violations = [];
    const lowercaseComment = internalComment.toLowerCase();
    for (const term of exports.BLOCKED_TERMS) {
        if (lowercaseComment.includes(term.toLowerCase())) {
            violations.push({
                type: 'LEAK_DETECTED',
                field: 'internal_comment',
                message: `Blocked term detected: "${term}"`,
                severity: 'error'
            });
        }
    }
    return violations;
}
/**
 * Main validator function
 */
function runDeterministicValidator(valuatorOutput, policySpec) {
    const violations = [];
    const warnings = [];
    // 1. Validate no new text
    const textViolations = validateNoNewText(valuatorOutput.proposed_changes, policySpec);
    violations.push(...textViolations);
    // 2. Validate anchor confidence
    const anchorThreshold = policySpec.decision_policy.anchor_conf_threshold;
    const anchorViolations = validateAnchorConfidence(valuatorOutput.proposed_changes, anchorThreshold);
    violations.push(...anchorViolations);
    // 3. Check for leaks in internal comment
    if (valuatorOutput.internal_comment) {
        const leakViolations = validateNoLeaks(valuatorOutput.internal_comment);
        violations.push(...leakViolations);
    }
    // Separate errors from warnings
    const errors = violations.filter(v => v.severity === 'error');
    const warns = violations.filter(v => v.severity === 'warning');
    warns.forEach(w => warnings.push(w.message));
    return {
        pass: errors.length === 0,
        violations: errors,
        warnings
    };
}
// For n8n Code node usage
function validateForN8n(valuatorOutput, policySpec) {
    return runDeterministicValidator(valuatorOutput, policySpec);
}
//# sourceMappingURL=deterministic_validator.js.map