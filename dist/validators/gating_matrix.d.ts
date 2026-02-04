/**
 * Gating Matrix - Deterministic Decider
 *
 * Decision matrix based on:
 * - required (from PolicySpec)
 * - routing_policy.type
 * - routing_policy.block_export
 * - final_status
 * - confidence_overall
 * - anchor_confidence
 */
type FinalStatus = 'Compliant' | 'AcceptableDeviation' | 'UnacceptableDeviation' | 'NotCoveredByPlaybook' | 'Ambiguous';
type RoutingPolicyType = 'AUTO_ACCEPT' | 'ESCALATE' | 'ESCALATE_IF_CHANGE' | 'ESCALATE_IF_UNACCEPTABLE' | 'NONE';
type Decision = 'AUTO_PASS' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'LOG_ONLY';
type EscalationReason = 'WITH_LEGAL_APPROVAL_REQUIRED' | 'NOT_COVERED_BY_PLAYBOOK' | 'AMBIGUOUS_POLICY_JUDGMENT' | 'UNACCEPTABLE_DEVIATION_STRICT' | 'LOW_CONFIDENCE_ANCHOR' | 'LOW_CONFIDENCE_OVERALL';
interface GatingInput {
    required: boolean;
    routing_policy: {
        type: RoutingPolicyType;
        target_group?: string;
        block_export: boolean;
    };
    final_status: FinalStatus;
    confidence_overall: number;
    anchor_confidence: number;
    analysis_mode: 'MODE_STRICT_NO_DEVIATIONS' | 'MODE_ENUMERATED_DEVIATIONS' | 'MODE_POLICY_JUDGMENT_REQUIRED';
}
interface GatingOutput {
    decision: Decision;
    escalation_queue?: string;
    escalation_reason?: EscalationReason;
    contract_level_flags: {
        block_export: boolean;
        needs_human_review: boolean;
    };
}
/**
 * Apply deterministic gating matrix
 */
export declare function applyGatingMatrix(input: GatingInput): GatingOutput;
/**
 * Aggregate decisions at contract level
 */
export declare function aggregateContractDecision(clauseDecisions: GatingOutput[]): {
    contract_decision: 'READY_FOR_EXPORT' | 'NEEDS_REVIEW' | 'BLOCKED';
    escalations_pending: number;
    block_reasons: string[];
};
export {};
//# sourceMappingURL=gating_matrix.d.ts.map