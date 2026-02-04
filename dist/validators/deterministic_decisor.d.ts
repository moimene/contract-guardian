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
import { FinalStatus, GatingDecision, ValuatorOutput, PolicySpec, Escalation } from '../playbook/PolicySpec';
import { ValidatorResult } from './deterministic_validator';
export interface DecisorInput {
    valuatorOutput: ValuatorOutput;
    validatorResult: ValidatorResult;
    policySpec: PolicySpec;
}
export interface DecisorOutput {
    decision: GatingDecision;
    escalation: Escalation;
    reasoning: string;
}
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
export declare function applyGatingMatrix(input: DecisorInput): DecisorOutput;
/**
 * For n8n Code node usage
 */
export declare function runDecisor(valuatorOutput: any, validatorResult: any, policySpec: any): DecisorOutput;
/**
 * Quick decision helper for simple cases
 */
export declare function quickDecision(finalStatus: FinalStatus, required: boolean, anchorConf: number, threshold?: number): GatingDecision;
//# sourceMappingURL=deterministic_decisor.d.ts.map