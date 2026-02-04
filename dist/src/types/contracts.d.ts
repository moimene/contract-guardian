export type ContractTypology = 'amazon_dsa' | 'amazon_psa' | 'nueva_planta' | 'nda' | 'servicios';
export type NuevaPlantaFamily = 'PrecioPagos' | 'AlcanceTrabajo' | 'Responsabilidades' | 'EntregablesHitos' | 'TerminacionRescision' | 'GarantiasPostventa' | 'LimitesResponsabilidad' | 'FuerzaMayor';
export type AmazonFamily = 'Payment' | 'Reps' | 'Indemnity' | 'Termination' | 'IP' | 'Confidentiality';
export type ClauseStatus = 'OK' | 'RECOMMENDED' | 'REQUIRED' | 'NEEDS_REVIEW' | 'BLOCKED';
export interface ClauseStatusConfig {
    label: string;
    color: string;
    icon: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    description: string;
}
export declare const CLAUSE_STATUS_CONFIG: Record<ClauseStatus, ClauseStatusConfig>;
export interface ContractTypologyConfig {
    label: string;
    description: string;
    families: string[];
    icon: string;
}
export declare const CONTRACT_TYPOLOGY_CONFIG: Record<ContractTypology, ContractTypologyConfig>;
export type ChangeOperationType = 'INSERT' | 'DELETE' | 'REPLACE';
export interface TextAnchor {
    quote: string;
    start: number;
    end: number;
}
export interface ProposedChange {
    change_id: string;
    op_type: ChangeOperationType;
    anchor: TextAnchor;
    original_text?: string;
    suggested_text?: string;
    reason?: string;
    rule_id?: string;
    accepted: boolean;
    rejected: boolean;
    modified_text?: string;
}
export interface ClauseReview {
    clause_instance_id: string;
    clause_id: string;
    document_id: string;
    run_id: string;
    sequence_number: number;
    heading: string;
    clause_text: string;
    detected_family: string;
    confidence_score: number;
    client_state: ClauseStatus;
    client_comment: string;
    client_summary_line: string;
    proposed_changes: ProposedChange[];
    escalation_recommended: boolean;
    escalation_reason?: string;
    created_at: string;
    updated_at: string;
}
export interface ContractReviewSummary {
    document_id: string;
    run_id: string;
    file_name: string;
    contract_type: ContractTypology;
    contract_decision: string;
    total_clauses: number;
    ok_count: number;
    recommended_count: number;
    required_count: number;
    needs_review_count: number;
    blocked_count: number;
    progress_percentage: number;
    created_at: string;
    updated_at: string;
}
export type EscalationUrgency = 'low' | 'medium' | 'high';
export type EscalationStatus = 'pending' | 'in_review' | 'resolved' | 'rejected';
export interface EscalationRequest {
    escalation_id: string;
    clause_instance_id: string;
    document_id: string;
    run_id: string;
    reason: string;
    context: string;
    urgency: EscalationUrgency;
    status: EscalationStatus;
    assigned_to?: string;
    assigned_to_name?: string;
    resolution?: string;
    resolution_notes?: string;
    created_by: string;
    created_by_name?: string;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}
export interface EscalationComment {
    comment_id: string;
    escalation_id: string;
    author_id: string;
    author_name: string;
    content: string;
    created_at: string;
}
export interface ClauseFilters {
    status?: ClauseStatus[];
    family?: string[];
    hasChanges?: boolean;
    hasEscalation?: boolean;
    searchQuery?: string;
}
export interface EscalationFilters {
    status?: EscalationStatus[];
    urgency?: EscalationUrgency[];
    assignedTo?: string;
    documentId?: string;
    searchQuery?: string;
}
export type SortDirection = 'asc' | 'desc';
export interface SortOption<T extends string> {
    field: T;
    direction: SortDirection;
}
export interface ReviewPageState {
    selectedClauseId: string | null;
    filters: ClauseFilters;
    sortBy: SortOption<'sequence_number' | 'client_state' | 'detected_family'>;
    showOnlyPending: boolean;
    expandedSections: string[];
}
export interface EscalationPageState {
    selectedEscalationId: string | null;
    filters: EscalationFilters;
    sortBy: SortOption<'created_at' | 'urgency' | 'status'>;
}
export declare function getStatusBadgeClasses(status: ClauseStatus): string;
export declare function getTypologyFamilies(typology: ContractTypology): string[];
export declare function countClausesByStatus(clauses: ClauseReview[]): Record<ClauseStatus, number>;
export declare function calculateReviewProgress(clauses: ClauseReview[]): number;
//# sourceMappingURL=contracts.d.ts.map