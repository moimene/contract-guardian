"use strict";
// Contract Expert - Contract Review Types
// Extended types for contract review workflow and Nueva Planta support
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTRACT_TYPOLOGY_CONFIG = exports.CLAUSE_STATUS_CONFIG = void 0;
exports.getStatusBadgeClasses = getStatusBadgeClasses;
exports.getTypologyFamilies = getTypologyFamilies;
exports.countClausesByStatus = countClausesByStatus;
exports.calculateReviewProgress = calculateReviewProgress;
exports.CLAUSE_STATUS_CONFIG = {
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
exports.CONTRACT_TYPOLOGY_CONFIG = {
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
// EXPORT HELPERS
// ============================================================================
function getStatusBadgeClasses(status) {
    const config = exports.CLAUSE_STATUS_CONFIG[status];
    return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}
function getTypologyFamilies(typology) {
    return exports.CONTRACT_TYPOLOGY_CONFIG[typology]?.families || [];
}
function countClausesByStatus(clauses) {
    return clauses.reduce((acc, clause) => {
        acc[clause.client_state] = (acc[clause.client_state] || 0) + 1;
        return acc;
    }, {});
}
function calculateReviewProgress(clauses) {
    if (clauses.length === 0)
        return 0;
    const reviewedClauses = clauses.filter(c => c.client_state === 'OK' ||
        c.proposed_changes.every(pc => pc.accepted || pc.rejected)).length;
    return Math.round((reviewedClauses / clauses.length) * 100);
}
//# sourceMappingURL=contracts.js.map