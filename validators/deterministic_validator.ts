/**
 * Deterministic Validator
 * Enforces:
 * 1. No new text - all replacement text must match source_reference
 * 2. Anchor confidence threshold checking
 * 3. Leak pre-check on internal comments
 */

import {
    ValuatorOutput,
    ProposedChange,
    PolicySpec
} from '../playbook/PolicySpec';
import { checkLeakage } from './leakage_guard';

// Blocked terms for internal comment pre-check
export const BLOCKED_TERMS = [
    'playbook', 'rule_id', 'rule_name', 'policyspec',
    'acceptable', 'unacceptable', 'deviation',
    'threshold', 'confidence', 'anchor_conf',
    'escalate', 'escalation', 'block_export',
    'guidance', 'internal note', 'with legal approval'
];

export interface ValidatorResult {
    pass: boolean;
    violations: Violation[];
    warnings: string[];
}

export interface Violation {
    type: 'NO_SOURCE_REFERENCE' | 'NEW_TEXT_DETECTED' | 'LOW_ANCHOR_CONFIDENCE' | 'LEAK_DETECTED';
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

/**
 * Validate that all proposed changes reference approved text
 */
export function validateNoNewText(
    proposedChanges: ProposedChange[],
    policySpec: PolicySpec
): Violation[] {
    const violations: Violation[] = [];

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
            const isAcceptable = policySpec.acceptable_variations.some(
                v => v.trim() === replacementText.trim()
            );

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
export function validateAnchorConfidence(
    proposedChanges: ProposedChange[],
    threshold: number
): Violation[] {
    const violations: Violation[] = [];

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
export function validateNoLeaks(internalComment: string): Violation[] {
    const violations: Violation[] = [];

    const lowercaseComment = internalComment.toLowerCase();

    for (const term of BLOCKED_TERMS) {
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
export function runDeterministicValidator(
    valuatorOutput: ValuatorOutput,
    policySpec: PolicySpec
): ValidatorResult {
    const violations: Violation[] = [];
    const warnings: string[] = [];

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
export function validateForN8n(
    valuatorOutput: any,
    policySpec: any
): { pass: boolean; violations: any[]; warnings: string[] } {
    return runDeterministicValidator(valuatorOutput as ValuatorOutput, policySpec as PolicySpec);
}
