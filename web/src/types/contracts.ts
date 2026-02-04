// ============================================
// Contract Guardian - Type Definitions
// ============================================

export type ClauseStatus = 'OK' | 'RECOMMENDED' | 'REQUIRED' | 'NEEDS_REVIEW' | 'BLOCKED'

export interface ClauseStatusConfig {
    label: string
    icon: string
    bgColor: string
    textColor: string
    borderColor: string
    description: string
}

export const CLAUSE_STATUS_CONFIG: Record<ClauseStatus, ClauseStatusConfig> = {
    OK: {
        label: 'Conforme',
        icon: 'check',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        description: 'Esta cláusula cumple con los requisitos',
    },
    RECOMMENDED: {
        label: 'Recomendado',
        icon: 'info',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        description: 'Se sugieren mejoras opcionales',
    },
    REQUIRED: {
        label: 'Cambio requerido',
        icon: 'alert-circle',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        description: 'Se recomienda aplicar el cambio propuesto',
    },
    NEEDS_REVIEW: {
        label: 'Pendiente revisión',
        icon: 'eye',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        description: 'Esta cláusula requiere revisión manual',
    },
    BLOCKED: {
        label: 'Bloqueado',
        icon: 'ban',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        description: 'Esta cláusula impide la exportación',
    },
}

export interface ProposedChange {
    change_id: string
    op_type: 'INSERT' | 'DELETE' | 'REPLACE'
    anchor: {
        quote: string
        start: number
        end: number
    }
    original_text?: string
    suggested_text?: string
    reason?: string
    rule_id?: string
    accepted: boolean
    rejected: boolean
    modified_text?: string
    // CG-011: Audit trail fields
    edited: boolean
    original_suggestion?: string  // For undo capability
    accepted_by?: string
    accepted_at?: string
    rejected_by?: string
    rejected_at?: string
    edited_by?: string
    edited_at?: string
}

export interface ClauseReview {
    clause_instance_id: string
    clause_id: string
    document_id: string
    run_id: string
    sequence_number: number
    heading: string
    clause_text: string
    detected_family: string
    confidence_score: number
    client_state: ClauseStatus
    client_comment: string
    client_summary_line: string
    proposed_changes: ProposedChange[]
    escalation_recommended: boolean
    escalation_reason?: string
    created_at: string
    updated_at: string
}

export type EscalationUrgency = 'low' | 'medium' | 'high'
export type EscalationStatus = 'pending' | 'in_review' | 'resolved' | 'rejected'

export interface EscalationRequest {
    escalation_id: string
    clause_instance_id: string
    document_id: string
    run_id: string
    reason: string
    context: string
    urgency: EscalationUrgency
    status: EscalationStatus
    assigned_to?: string
    resolution?: string
    resolution_notes?: string
    created_by: string
    created_at: string
    resolved_at?: string
}

export interface Document {
    document_id: string
    file_name: string
    file_path?: string
    tenant_id: string
    uploaded_by: string
    contract_type_id?: string
    status: 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
    contract_decision?: string
    created_at: string
    updated_at: string
}

export interface ContractRun {
    run_id: string
    document_id: string
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    decision?: string
    total_clauses?: number
    processed_clauses?: number
    started_at?: string
    completed_at?: string
    created_at: string
}

export interface ContractType {
    code: string
    name: string
    description?: string
    icon?: string
    is_active: boolean
    availability_note?: string
}

// Tipología extensible (reemplaza CONTRACT_TYPES hardcodeado)
export interface Typology {
    id: string
    code: string
    name: string
    description?: string
    icon?: string  // lucide icon name
    color?: string // tailwind color class
    is_active: boolean
    matters_count: number
    clause_types_count: number
    examples_count: number
    config: {
        families: string[]
        workflow: string
        rag_threshold: number
    }
}

export const URGENCY_CONFIG = {
    low: { label: 'Baja', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    medium: { label: 'Media', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    high: { label: 'Alta', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export const STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    in_review: { label: 'En revisión', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    resolved: { label: 'Resuelta', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
}

// ============================================
// PRD v2.3 - Contract Lifecycle Management
// ============================================

export type ContractLifecycleStatus =
    | 'DRAFT_REVIEW'
    | 'REDLINE_READY'
    | 'SENT_FOR_NEGOTIATION'
    | 'UNDER_NEGOTIATION'
    | 'READY_FOR_SIGNATURE'
    | 'ARCHIVED'

export interface LifecycleStatusConfig {
    label: string
    color: string
    bgColor: string
    borderColor: string
    icon: string
    nextAction?: string
    allowedTransitions: ContractLifecycleStatus[]
}

export const LIFECYCLE_STATUS_CONFIG: Record<ContractLifecycleStatus, LifecycleStatusConfig> = {
    DRAFT_REVIEW: {
        label: 'Draft Review',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300',
        icon: 'edit',
        nextAction: 'Complete review to mark as ready',
        allowedTransitions: ['REDLINE_READY']
    },
    REDLINE_READY: {
        label: 'Redline Ready',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        icon: 'check-circle',
        nextAction: 'Send redline to counterparty',
        allowedTransitions: ['SENT_FOR_NEGOTIATION', 'DRAFT_REVIEW']
    },
    SENT_FOR_NEGOTIATION: {
        label: 'Sent for Negotiation',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        icon: 'send',
        nextAction: 'Awaiting counterparty response',
        allowedTransitions: ['UNDER_NEGOTIATION', 'REDLINE_READY']
    },
    UNDER_NEGOTIATION: {
        label: 'Under Negotiation',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
        icon: 'message-circle',
        nextAction: 'Review counterparty changes',
        allowedTransitions: ['READY_FOR_SIGNATURE', 'SENT_FOR_NEGOTIATION']
    },
    READY_FOR_SIGNATURE: {
        label: 'Ready for Signature',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-300',
        icon: 'file-signature',
        nextAction: 'Contract awaiting signature',
        allowedTransitions: ['ARCHIVED', 'UNDER_NEGOTIATION']
    },
    ARCHIVED: {
        label: 'Archived',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300',
        icon: 'archive',
        allowedTransitions: []
    }
}

// Redline Set aggregation
export interface RedlineSet {
    accepted: number
    rejected: number
    pending: number
    total: number
    isReady: boolean
}

// Extended ContractRun with CLM fields
export interface ContractRunWithCLM extends ContractRun {
    lifecycle_status: ContractLifecycleStatus
    redline_accepted_count: number
    redline_rejected_count: number
    redline_pending_count: number
    lifecycle_updated_at?: string
}
