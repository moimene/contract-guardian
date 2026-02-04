/**
 * Deterministic Validator
 * Enforces:
 * 1. No new text - all replacement text must match source_reference
 * 2. Anchor confidence threshold checking
 * 3. Leak pre-check on internal comments
 */
import { ValuatorOutput, ProposedChange, PolicySpec } from '../playbook/PolicySpec';
export declare const BLOCKED_TERMS: string[];
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
export declare function validateNoNewText(proposedChanges: ProposedChange[], policySpec: PolicySpec): Violation[];
/**
 * Validate anchor confidence thresholds
 */
export declare function validateAnchorConfidence(proposedChanges: ProposedChange[], threshold: number): Violation[];
/**
 * Check for internal term leaks in internal_comment
 */
export declare function validateNoLeaks(internalComment: string): Violation[];
/**
 * Main validator function
 */
export declare function runDeterministicValidator(valuatorOutput: ValuatorOutput, policySpec: PolicySpec): ValidatorResult;
export declare function validateForN8n(valuatorOutput: any, policySpec: any): {
    pass: boolean;
    violations: any[];
    warnings: string[];
};
//# sourceMappingURL=deterministic_validator.d.ts.map