"use strict";
/**
 * Deterministic Decisor / Gating Matrix
 * Applies the gating matrix based on:
 * - final_status
 * - analysis_mode
 * - required flag
 * - confidence thresholds
 *
 * Produces: GatingDecision ∈ {AUTO_PASS, AUTO_REDLINEDRAFT, ESCALATE_HUMAN, BLOCK_EXPORT, LOG_ONLY}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGatingMatrix = applyGatingMatrix;
exports.runDecisor = runDecisor;
exports.quickDecision = quickDecision;
/**
 * Gating Matrix Implementation
 *
 * | final_status           | analysis_mode              | required | anchor_conf | validator_pass | → decision         |
 * |------------------------|---------------------------|----------|-------------|----------------|-------------------|
 * | Compliant              | any                       | any      | any         | any            | AUTO_PASS         |
 * | AcceptableDeviation    | MODE_STRICT               | any      | any         | any            | ESCALATE_HUMAN    |
 * | AcceptableDeviation    | MODE_ENUMERATED           | any      | ≥TH         | true           | AUTO_PASS         |
 * | AcceptableDeviation    | MODE_ENUMERATED           | any      | <TH         | any            | ESCALATE_HUMAN    |
 * | AcceptableDeviation    | MODE_POLICY_JUDGMENT      | any      | ≥TH         | true           | AUTO_REDLINEDRAFT |
 * | UnacceptableDeviation  | any                       | true     | any         | any            | BLOCK_EXPORT      |
 * | UnacceptableDeviation  | any                       | false    | ≥TH         | true           | AUTO_REDLINEDRAFT |
 * | UnacceptableDeviation  | any                       | false    | <TH         | any            | ESCALATE_HUMAN    |
 * | NotCoveredByPlaybook   | any                       | any      | any         | any            | ESCALATE_HUMAN    |
 * | Ambiguous              | any                       | any      | any         | any            | ESCALATE_HUMAN    |
 * | any                    | any                       | any      | any         | false (errors) | ESCALATE_HUMAN    |
 */
function applyGatingMatrix(input) {
    const { valuatorOutput, validatorResult, policySpec } = input;
    const finalStatus = valuatorOutput.final_status;
    const analysisMode = policySpec.analysis_mode;
    const required = policySpec.required;
    const anchorThreshold = policySpec.decision_policy.anchor_conf_threshold;
    const anchorConf = valuatorOutput.confidences.anchor_confidence;
    const validatorPass = validatorResult.pass;
    let decision;
    let escalation = {
        recommended: false,
        block_export: false
    };
    let reasoning;
    // 1. Validator failures always escalate
    if (!validatorPass) {
        decision = 'ESCALATE_HUMAN';
        escalation = {
            recommended: true,
            reason: 'NO_SOURCE_REFERENCE',
            block_export: required
        };
        reasoning = `Validator failed with ${validatorResult.violations.length} error(s)`;
        return { decision, escalation, reasoning };
    }
    // 2. Apply gating matrix based on final_status
    switch (finalStatus) {
        case 'Compliant':
            decision = 'AUTO_PASS';
            reasoning = 'Clause is compliant with standard terms';
            break;
        case 'AcceptableDeviation':
            if (analysisMode === 'MODE_STRICT_NO_DEVIATIONS') {
                decision = 'ESCALATE_HUMAN';
                escalation = {
                    recommended: true,
                    reason: 'WITH_LEGAL_APPROVAL_REQUIRED',
                    block_export: policySpec.routing_policy.block_export_if_escalated
                };
                reasoning = 'Strict mode: any deviation requires human review';
            }
            else if (anchorConf >= anchorThreshold) {
                decision = analysisMode === 'MODE_ENUMERATED_DEVIATIONS' ? 'AUTO_PASS' : 'AUTO_REDLINEDRAFT';
                reasoning = `Acceptable deviation with high confidence (${anchorConf} ≥ ${anchorThreshold})`;
            }
            else {
                decision = 'ESCALATE_HUMAN';
                escalation = {
                    recommended: true,
                    reason: 'LOW_CONFIDENCE_ANCHOR',
                    block_export: false
                };
                reasoning = `Low anchor confidence (${anchorConf} < ${anchorThreshold})`;
            }
            break;
        case 'UnacceptableDeviation':
            if (required) {
                decision = 'BLOCK_EXPORT';
                escalation = {
                    recommended: true,
                    reason: 'REQUIRED_CLAUSE_VIOLATION',
                    block_export: true
                };
                reasoning = 'Required clause has unacceptable deviation - blocking export';
            }
            else if (anchorConf >= anchorThreshold && validatorPass) {
                decision = 'AUTO_REDLINEDRAFT';
                reasoning = `Non-required clause with unacceptable deviation - auto-redline proposed`;
            }
            else {
                decision = 'ESCALATE_HUMAN';
                escalation = {
                    recommended: true,
                    reason: 'LOW_CONFIDENCE_ANCHOR',
                    block_export: false
                };
                reasoning = `Unacceptable deviation with low confidence - needs human review`;
            }
            break;
        case 'NotCoveredByPlaybook':
            decision = 'ESCALATE_HUMAN';
            escalation = {
                recommended: true,
                reason: 'NOT_COVERED_BY_PLAYBOOK',
                block_export: false
            };
            reasoning = 'Clause type not covered by playbook - needs human assessment';
            break;
        case 'Ambiguous':
            decision = 'ESCALATE_HUMAN';
            escalation = {
                recommended: true,
                reason: 'AMBIGUOUS_DEVIATION',
                block_export: policySpec.decision_policy.escalate_if_ambiguous
            };
            reasoning = 'Ambiguous classification - needs human judgment';
            break;
        default:
            decision = 'ESCALATE_HUMAN';
            escalation = {
                recommended: true,
                reason: 'AMBIGUOUS_DEVIATION',
                block_export: false
            };
            reasoning = `Unknown final_status: ${finalStatus}`;
    }
    return { decision, escalation, reasoning };
}
/**
 * For n8n Code node usage
 */
function runDecisor(valuatorOutput, validatorResult, policySpec) {
    return applyGatingMatrix({
        valuatorOutput: valuatorOutput,
        validatorResult: validatorResult,
        policySpec: policySpec
    });
}
/**
 * Quick decision helper for simple cases
 */
function quickDecision(finalStatus, required, anchorConf, threshold = 0.85) {
    if (finalStatus === 'Compliant')
        return 'AUTO_PASS';
    if (finalStatus === 'NotCoveredByPlaybook' || finalStatus === 'Ambiguous')
        return 'ESCALATE_HUMAN';
    if (finalStatus === 'UnacceptableDeviation' && required)
        return 'BLOCK_EXPORT';
    if (anchorConf < threshold)
        return 'ESCALATE_HUMAN';
    if (finalStatus === 'UnacceptableDeviation')
        return 'AUTO_REDLINEDRAFT';
    if (finalStatus === 'AcceptableDeviation')
        return 'AUTO_PASS';
    return 'ESCALATE_HUMAN';
}
//# sourceMappingURL=deterministic_decisor.js.map