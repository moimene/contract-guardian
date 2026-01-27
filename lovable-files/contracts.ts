// Contract Expert - Contract Review Types
// Extended types for contract review workflow and Nueva Planta support

// ============================================================================
// CONTRACT TYPOLOGIES
// ============================================================================

export type ContractTypology =
  | 'amazon_dsa'
  | 'amazon_psa'
  | 'nueva_planta'
  | 'nda'
  | 'servicios';

// Nueva Planta specific families
export type NuevaPlantaFamily =
  | 'PrecioPagos'
  | 'AlcanceTrabajo'
  | 'Responsabilidades'
  | 'EntregablesHitos'
  | 'TerminacionRescision'
  | 'GarantiasPostventa'
  | 'LimitesResponsabilidad'
  | 'FuerzaMayor';

// Amazon DSA/PSA families
export type AmazonFamily =
  | 'Payment'
  | 'Reps'
  | 'Indemnity'
  | 'Termination'
  | 'IP'
  | 'Confidentiality';

// ============================================================================
// CLAUSE STATUS
// ============================================================================

export type ClauseStatus =
  | 'OK'
  | 'RECOMMENDED'
  | 'REQUIRED'
  | 'NEEDS_REVIEW'
  | 'BLOCKED';

export interface ClauseStatusConfig {
  label: string;
  color: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export const CLAUSE_STATUS_CONFIG: Record<ClauseStatus, ClauseStatusConfig> = {
  OK: {
    label: 'Conforme',
    color: 'success',
    icon: 'check',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Esta cláusula cumple con los requisitos',
  },
  RECOMMENDED: {
    label: 'Recomendado',
    color: 'info',
    icon: 'info',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Se sugieren mejoras opcionales',
  },
  REQUIRED: {
    label: 'Cambio requerido',
    color: 'warning',
    icon: 'alert-circle',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    description: 'Se recomienda aplicar el cambio propuesto',
  },
  NEEDS_REVIEW: {
    label: 'Pendiente revisión',
    color: 'warning',
    icon: 'eye',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    description: 'Esta cláusula requiere revisión manual',
  },
  BLOCKED: {
    label: 'Bloqueado',
    color: 'error',
    icon: 'ban',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Esta cláusula impide la exportación',
  },
};

// ============================================================================
// CONTRACT TYPOLOGY CONFIG
// ============================================================================

export interface ContractTypologyConfig {
  label: string;
  description: string;
  families: string[];
  icon: string;
}

export const CONTRACT_TYPOLOGY_CONFIG: Record<ContractTypology, ContractTypologyConfig> = {
  amazon_dsa: {
    label: 'DSA - Streaming Platform',
    description: 'Digital Service Agreement para plataformas de streaming',
    families: ['Payment', 'Reps', 'Indemnity', 'Termination', 'IP', 'Confidentiality'],
    icon: 'play-circle',
  },
  amazon_psa: {
    label: 'PSA - Streaming Platform',
    description: 'Production Service Agreement para contenido',
    families: ['Payment', 'Reps', 'Indemnity', 'Termination', 'IP', 'Confidentiality'],
    icon: 'film',
  },
  nueva_planta: {
    label: 'Proyecto Nueva Planta (EPC)',
    description: 'Contratos de construcción de instalaciones desde cero',
    families: [
      'PrecioPagos',
      'AlcanceTrabajo',
      'Responsabilidades',
      'EntregablesHitos',
      'TerminacionRescision',
      'GarantiasPostventa',
      'LimitesResponsabilidad',
      'FuerzaMayor',
    ],
    icon: 'building-2',
  },
  nda: {
    label: 'NDA - Confidencialidad',
    description: 'Acuerdos de confidencialidad y no divulgación',
    families: ['Confidentiality', 'Term', 'Exclusions', 'Remedies'],
    icon: 'lock',
  },
  servicios: {
    label: 'Contrato de Servicios',
    description: 'Contratos de prestación de servicios profesionales',
    families: ['Scope', 'Payment', 'Term', 'Liability', 'IP'],
    icon: 'briefcase',
  },
};

// ============================================================================
// PROPOSED CHANGES
// ============================================================================

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
  modified_text?: string; // If user modifies the suggestion
}

// ============================================================================
// CLAUSE REVIEW
// ============================================================================

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

// ============================================================================
// CONTRACT REVIEW SUMMARY
// ============================================================================

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

// ============================================================================
// ESCALATION REQUEST
// ============================================================================

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

// ============================================================================
// FILTER AND SORT OPTIONS
// ============================================================================

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

// ============================================================================
// UI STATE
// ============================================================================

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

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function getStatusBadgeClasses(status: ClauseStatus): string {
  const config = CLAUSE_STATUS_CONFIG[status];
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

export function getTypologyFamilies(typology: ContractTypology): string[] {
  return CONTRACT_TYPOLOGY_CONFIG[typology]?.families || [];
}

export function countClausesByStatus(clauses: ClauseReview[]): Record<ClauseStatus, number> {
  return clauses.reduce((acc, clause) => {
    acc[clause.client_state] = (acc[clause.client_state] || 0) + 1;
    return acc;
  }, {} as Record<ClauseStatus, number>);
}

export function calculateReviewProgress(clauses: ClauseReview[]): number {
  if (clauses.length === 0) return 0;
  const reviewedClauses = clauses.filter(
    c => c.client_state === 'OK' ||
         c.proposed_changes.every(pc => pc.accepted || pc.rejected)
  ).length;
  return Math.round((reviewedClauses / clauses.length) * 100);
}
