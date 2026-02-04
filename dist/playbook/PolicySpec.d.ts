/**
 * PolicySpec - Playbook Rule Specification
 * Defines the governance structure for each clause family/rule
 */
export type AnalysisMode = 'MODE_STRICT_NO_DEVIATIONS' | 'MODE_ENUMERATED_DEVIATIONS' | 'MODE_POLICY_JUDGMENT_REQUIRED';
export type FinalStatus = 'Compliant' | 'AcceptableDeviation' | 'UnacceptableDeviation' | 'NotCoveredByPlaybook' | 'Ambiguous';
export type GatingDecision = 'AUTO_PASS' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'LOG_ONLY';
export type EscalationReason = 'LOW_CONFIDENCE_ANCHOR' | 'NO_SOURCE_REFERENCE' | 'AMBIGUOUS_DEVIATION' | 'NOT_COVERED_BY_PLAYBOOK' | 'REQUIRED_CLAUSE_VIOLATION' | 'WITH_LEGAL_APPROVAL_REQUIRED' | 'MULTIPLE_HIGH_SEVERITY_ISSUES';
export interface StandardPosition {
    title: string;
    text: string;
    text_fragment_id: string;
}
export interface RetrievalProfile {
    vector_top_k: number;
    coverage_threshold: number;
    examples_top_k: number;
}
export interface RoutingPolicy {
    default_route: string;
    block_export_if_escalated: boolean;
}
export interface DecisionPolicy {
    auto_redline_if_unacceptable: boolean;
    anchor_conf_threshold: number;
    escalate_if_ambiguous: boolean;
    block_export_if_required_violated: boolean;
}
export interface AgentModels {
    paranoid: string;
    valuator: string;
    sanitizer: string;
}
export interface PolicySpec {
    rule_id: string;
    clause_family: string;
    version: string;
    required: boolean;
    analysis_mode: AnalysisMode;
    standard_position: StandardPosition;
    acceptable_variations: string[];
    unacceptable_patterns: string[];
    guidance_internal: string;
    anchors: string[];
    definitions_scope: string[];
    retrieval_profile: RetrievalProfile;
    routing_policy: RoutingPolicy;
    decision_policy: DecisionPolicy;
    models: AgentModels;
}
export interface RouterOutput {
    detected_family: string;
    rule_candidates: Array<{
        rule_id: string;
        score: number;
    }>;
    coverage_confidence: number;
    not_covered: boolean;
}
export interface Observation {
    quote: string;
    offsets: {
        start: number;
        end: number;
    };
    change_type: string;
    possible_category: 'STANDARD' | 'ACCEPTABLE' | 'UNACCEPTABLE' | 'NOT_COVERED';
    signal_terms: string[];
    confidence: number;
    linked_rule_ids: string[];
}
export interface ParanoidOutput {
    observations: Observation[];
    summary: {
        counts: {
            high: number;
            medium: number;
            low: number;
        };
        coverage_confidence: number;
    };
}
export interface SourceReference {
    source_type: 'STANDARD_POSITION' | 'ACCEPTABLE_VARIATION' | 'FALLBACK';
    text_fragment_id: string;
    exact_text: string;
}
export interface Anchor {
    quote: string;
    offsets: {
        start: number;
        end: number;
    };
    anchor_confidence: number;
}
export interface ProposedChange {
    action: {
        type: 'INSERT' | 'DELETE' | 'REPLACE';
        original_text?: string;
        insert_text?: string;
        replace_with_text?: string;
    };
    anchor: Anchor;
    source_reference: SourceReference;
}
export interface Escalation {
    recommended: boolean;
    reason?: EscalationReason;
    block_export: boolean;
}
export interface Confidences {
    anchor_confidence: number;
    confidence_overall: number;
    coverage_confidence?: number;
}
export interface ValuatorOutput {
    final_status: FinalStatus;
    decision: GatingDecision;
    needs_review: boolean;
    proposed_changes: ProposedChange[];
    escalation: Escalation;
    confidences: Confidences;
    internal_comment: string;
}
export interface SafetyCheck {
    blocked_terms_detected: string[];
    leak_score: number;
    policy_leak_flags: string[];
    pass: boolean;
}
export interface SanitizerOutput {
    client_comment: string;
    client_summary_line: string;
    safety: SafetyCheck;
    redactions: string[];
    locale: string;
}
export type VariationLabel = 'STANDARD' | 'ACCEPTABLE' | 'UNACCEPTABLE' | 'NOT_COVERED';
export type VariationSource = 'synthetic' | 'human' | 'contract';
export interface VariationExample {
    label: VariationLabel;
    text: string;
    source: VariationSource;
    source_document_id?: string;
    metadata?: Record<string, unknown>;
}
export interface VariationSet {
    rule_id: string;
    version: string;
    examples: VariationExample[];
}
export interface PolicyContext {
    policySpec: PolicySpec;
    variations: VariationExample[];
    definitions: Array<{
        term: string;
        definition: string;
    }>;
}
//# sourceMappingURL=PolicySpec.d.ts.map