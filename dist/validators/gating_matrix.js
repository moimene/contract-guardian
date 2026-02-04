"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGatingMatrix = applyGatingMatrix;
exports.aggregateContractDecision = aggregateContractDecision;
// Configurable thresholds
const TH_ANCHOR = 0.85;
const TH_CONF_OVERALL = 0.80;
/**
 * Apply deterministic gating matrix
 */
function applyGatingMatrix(input) {
    const { required, routing_policy, final_status, confidence_overall, anchor_confidence, analysis_mode } = input;
    // Initialize result
    let decision = 'LOG_ONLY';
    let escalation_reason;
    let escalation_queue;
    let block_export = false;
    let needs_human_review = false;
    // RULE 1: NotCoveredByPlaybook or Ambiguous → Always escalate
    if (final_status === 'NotCoveredByPlaybook' || final_status === 'Ambiguous') {
        decision = 'ESCALATE_HUMAN';
        escalation_reason = final_status === 'NotCoveredByPlaybook'
            ? 'NOT_COVERED_BY_PLAYBOOK'
            : 'AMBIGUOUS_POLICY_JUDGMENT';
        escalation_queue = routing_policy.target_group || 'SeniorCounsel';
        needs_human_review = true;
        if (routing_policy.block_export) {
            block_export = true;
        }
        return {
            decision,
            escalation_queue,
            escalation_reason,
            contract_level_flags: { block_export, needs_human_review }
        };
    }
    // RULE 2: UnacceptableDeviation
    if (final_status === 'UnacceptableDeviation') {
        // Check confidence thresholds
        if (anchor_confidence < TH_ANCHOR) {
            decision = 'ESCALATE_HUMAN';
            escalation_reason = 'LOW_CONFIDENCE_ANCHOR';
            escalation_queue = routing_policy.target_group || 'AmazonLegal';
            needs_human_review = true;
            if (required && routing_policy.block_export) {
                block_export = true;
            }
        }
        else if (confidence_overall < TH_CONF_OVERALL) {
            decision = 'ESCALATE_HUMAN';
            escalation_reason = 'LOW_CONFIDENCE_OVERALL';
            escalation_queue = routing_policy.target_group || 'AmazonLegal';
            needs_human_review = true;
            if (required && routing_policy.block_export) {
                block_export = true;
            }
        }
        else {
            // Confident unacceptable deviation
            if (routing_policy.type === 'ESCALATE' || routing_policy.type === 'ESCALATE_IF_UNACCEPTABLE') {
                decision = 'ESCALATE_HUMAN';
                escalation_reason = analysis_mode === 'MODE_STRICT_NO_DEVIATIONS'
                    ? 'UNACCEPTABLE_DEVIATION_STRICT'
                    : 'WITH_LEGAL_APPROVAL_REQUIRED';
                escalation_queue = routing_policy.target_group || 'AmazonLegal';
                needs_human_review = true;
                if (routing_policy.block_export) {
                    block_export = true;
                }
            }
            else {
                // Auto-redline allowed
                decision = 'AUTO_REDLINEDRAFT';
            }
        }
        return {
            decision,
            escalation_queue,
            escalation_reason,
            contract_level_flags: { block_export, needs_human_review }
        };
    }
    // RULE 3: AcceptableDeviation
    if (final_status === 'AcceptableDeviation') {
        if (routing_policy.type === 'ESCALATE' || routing_policy.type === 'ESCALATE_IF_CHANGE') {
            decision = 'ESCALATE_HUMAN';
            escalation_reason = 'WITH_LEGAL_APPROVAL_REQUIRED';
            escalation_queue = routing_policy.target_group || 'PolicyOwner';
            needs_human_review = true;
        }
        else {
            decision = 'AUTO_PASS';
        }
        return {
            decision,
            escalation_queue,
            escalation_reason,
            contract_level_flags: { block_export, needs_human_review }
        };
    }
    // RULE 4: Compliant
    if (final_status === 'Compliant') {
        if (routing_policy.type === 'ESCALATE') {
            // Special case: even compliant needs escalation
            decision = 'ESCALATE_HUMAN';
            escalation_queue = routing_policy.target_group;
            needs_human_review = true;
        }
        else {
            decision = 'AUTO_PASS';
        }
        return {
            decision,
            escalation_queue,
            escalation_reason,
            contract_level_flags: { block_export, needs_human_review }
        };
    }
    // Default fallback
    return {
        decision: 'LOG_ONLY',
        contract_level_flags: { block_export: false, needs_human_review: false }
    };
}
/**
 * Aggregate decisions at contract level
 */
function aggregateContractDecision(clauseDecisions) {
    const hasBlock = clauseDecisions.some(d => d.contract_level_flags.block_export);
    const needsReview = clauseDecisions.some(d => d.contract_level_flags.needs_human_review);
    const escalationsPending = clauseDecisions.filter(d => d.decision === 'ESCALATE_HUMAN' && d.contract_level_flags.needs_human_review).length;
    const blockReasons = clauseDecisions
        .filter(d => d.contract_level_flags.block_export)
        .map(d => d.escalation_reason || 'UNKNOWN')
        .filter((v, i, a) => a.indexOf(v) === i); // unique
    if (hasBlock) {
        return {
            contract_decision: 'BLOCKED',
            escalations_pending: escalationsPending,
            block_reasons: blockReasons
        };
    }
    if (needsReview) {
        return {
            contract_decision: 'NEEDS_REVIEW',
            escalations_pending: escalationsPending,
            block_reasons: []
        };
    }
    return {
        contract_decision: 'READY_FOR_EXPORT',
        escalations_pending: 0,
        block_reasons: []
    };
}
//# sourceMappingURL=gating_matrix.js.map