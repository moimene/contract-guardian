// ================================================================
// DECISION ENGINE v2.0
// Con soporte para multi-familia y thresholds por prioridad
// For use in n8n Code Node
// ================================================================

// ================================================================
// CONFIGURACIÓN DE THRESHOLDS
// ================================================================

const THRESHOLDS = {
    CRITICAL: {
        auto_approve_confidence: 0.95,
        approve_with_notes_confidence: 0.85,
        escalate_confidence: 0.75,
        max_observations_for_auto: 0,
        max_observations_for_notes: 2,
        escalate_on_any_critical_issue: true
    },
    SUPPORT: {
        auto_approve_confidence: 0.90,
        approve_with_notes_confidence: 0.80,
        escalate_confidence: 0.70,
        max_observations_for_auto: 1,
        max_observations_for_notes: 3,
        escalate_on_any_critical_issue: true
    },
    LOW: {
        auto_approve_confidence: 0.85,
        approve_with_notes_confidence: 0.75,
        escalate_confidence: 0.65,
        max_observations_for_auto: 2,
        max_observations_for_notes: 5,
        escalate_on_any_critical_issue: false
    }
};

// ================================================================
// FAMILY PRIORITY MAPPING (Updated with all 20 families)
// ================================================================

const FAMILY_PRIORITY = {
    // CRITICAL - Core commercial/legal terms
    "PaymentCredits": "CRITICAL",
    "ThirdPartyCredits": "CRITICAL",
    "RepsProdCo": "CRITICAL",
    "IndemnityProdCo": "CRITICAL",
    "IndemnityAmazon": "CRITICAL",
    "IndemnityProcedures": "CRITICAL",
    "RightsGrant": "CRITICAL",
    "RightsReversion": "CRITICAL",
    "LiabilityLimitation": "CRITICAL",
    "InjunctiveReliefWaiver": "CRITICAL",
    "Assignment": "CRITICAL",
    "ForceMajeure": "CRITICAL",
    "AmazonControl": "CRITICAL",
    "TerminationRights": "CRITICAL",
    "TerminationConsequences": "CRITICAL",
    "DisputeResolution": "CRITICAL",

    // SUPPORT - Important but more flexibility
    "Confidentiality": "SUPPORT",
    "DataProtection": "SUPPORT",
    "ServicesScope": "SUPPORT",
    "PowerOfAttorney": "SUPPORT",
    "Insurance": "SUPPORT",
    "StandardTerms": "SUPPORT",
    "ConditionsPrecedent": "SUPPORT",
    "TaxProvisions": "SUPPORT",

    // LOW - Boilerplate
    "Definitions": "LOW",
    "GeneralProvisions": "LOW",
    "Parties": "LOW",
    "Severability": "LOW",

    // UNKNOWN - Always escalate
    "OtherUnknown": "UNKNOWN"
};

// ================================================================
// ESCALATION REASONS
// ================================================================

const ESCALATION_REASONS = {
    UNKNOWN_FAMILY: {
        code: "UNKNOWN_FAMILY",
        message: "Clause family not recognized",
        block_export: true
    },
    NO_PLAYBOOK_SPEC: {
        code: "NO_PLAYBOOK_SPEC",
        message: "No playbook specification available for this family",
        block_export: false
    },
    LOW_CONFIDENCE: {
        code: "LOW_CONFIDENCE",
        message: "Routing confidence below threshold",
        block_export: false
    },
    CRITICAL_ISSUE_DETECTED: {
        code: "CRITICAL_ISSUE_DETECTED",
        message: "Critical deviation or issue detected",
        block_export: true
    },
    CRITICAL_RISK_LEVEL: {
        code: "CRITICAL_RISK_LEVEL",
        message: "Analysis risk level is critical",
        block_export: true
    },
    HIGH_RISK_CRITICAL_FAMILY: {
        code: "HIGH_RISK_CRITICAL_FAMILY",
        message: "High-risk deviations in critical family",
        block_export: false
    },
    MULTI_FAMILY_DETECTED: {
        code: "MULTI_FAMILY_DETECTED",
        message: "Multiple clause families detected - manual review recommended",
        block_export: false
    },
    UNACCEPTABLE_DEVIATION: {
        code: "UNACCEPTABLE_DEVIATION",
        message: "Unacceptable deviation per playbook",
        block_export: true
    },
    REQUIRES_APPROVAL: {
        code: "REQUIRES_APPROVAL",
        message: "Deviation requires specific approval level",
        block_export: false,
        approval_levels: ["AMAZON_LEGAL", "AMAZON_LEGAL_REGIONAL_LEAD", "OC_DISCRETION", "AMAZON_TAX_FINANCE_BA"]
    }
};

// ================================================================
// CRITICAL ISSUE KEYWORDS
// ================================================================

const CRITICAL_KEYWORDS = [
    // Risk indicators
    "CRITICAL",
    "UNACCEPTABLE",
    "REJECT",
    "must reject",
    "hold to form",
    "do not accept",
    "do NOT",
    "unable to accommodate",

    // Commercial risk
    "symmetric liability",
    "unlimited liability",
    "no cap",
    "uncapped exposure",
    "Amazon shall indemnify",  // In wrong context
    "ProdCo retains",  // Rights context

    // Approval requirements
    "with Amazon Legal approval",
    "Amazon Legal L8 approval",
    "Litigation approval",
    "Amazon Tax",
    "Finance and BA"
];

// ================================================================
// PASSABLE KEYWORDS
// ================================================================

const PASSABLE_KEYWORDS = [
    "acceptable deviation",
    "passable",
    "may be granted",
    "OK to",
    "can be accepted",
    "can accept",
    "NTD",
    "at OC's discretion",
    "without Amazon's approval"
];

// ================================================================
// MAIN DECISION FUNCTION
// ================================================================

function makeDecision(analysisResult, routingResult) {
    const context = buildContext(analysisResult, routingResult);

    // Apply decision rules in order
    const rules = [
        checkUnknownFamily,
        checkNoPlaybookSpec,
        checkMultiFamily,
        checkCriticalIssues,
        checkCriticalRiskLevel,
        checkUnacceptableDeviations,
        checkRequiresApproval,
        checkAutoApprove,
        checkApproveWithNotes,
        checkHighRiskCriticalFamily,
        defaultEscalate
    ];

    for (const rule of rules) {
        const result = rule(context);
        if (result) {
            return buildDecisionOutput(result, context);
        }
    }

    // Should never reach here
    return buildDecisionOutput(defaultEscalate(context), context);
}

// ================================================================
// CONTEXT BUILDER
// ================================================================

function buildContext(analysisResult, routingResult) {
    const internal = analysisResult._internal || {};
    const observations = internal.observations?.observations || [];

    const family = routingResult?.detected_family ||
        internal.detected_family ||
        analysisResult.detected_family ||
        "OtherUnknown";

    const priority = FAMILY_PRIORITY[family] || "UNKNOWN";
    const thresholds = THRESHOLDS[priority] || THRESHOLDS.CRITICAL;

    // Analyze observations
    const hasCriticalIssue = observations.some(obs => {
        const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
        return CRITICAL_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    });

    const hasPassableOnly = observations.every(obs => {
        const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
        return PASSABLE_KEYWORDS.some(kw => text.includes(kw.toLowerCase())) ||
            text.includes("aligns with") ||
            text.includes("compliant");
    });

    const unacceptableDeviations = observations.filter(obs => {
        const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
        return text.includes("unacceptable") ||
            text.includes("reject") ||
            text.includes("do not accept");
    });

    const requiresApproval = observations.filter(obs => {
        const text = (obs.issue || obs.text || obs.description || "").toLowerCase();
        return text.includes("with amazon legal approval") ||
            text.includes("amazon legal l8") ||
            text.includes("regional lead") ||
            text.includes("amazon tax");
    });

    return {
        family,
        priority,
        thresholds,
        confidence: routingResult?.routing_confidence || internal.confidence_overall || 0.7,
        riskLevel: internal.observations?.risk_level || "medium",
        observations,
        observationCount: observations.length,
        hasCriticalIssue,
        hasPassableOnly,
        unacceptableDeviations,
        requiresApproval,
        hasPlaybookSpec: analysisResult.has_playbook_spec !== false,
        isMultiFamily: routingResult?._multi_family?.is_split || false,
        multiFamily: routingResult?._multi_family || null
    };
}

// ================================================================
// DECISION RULES
// ================================================================

function checkUnknownFamily(ctx) {
    if (ctx.priority === "UNKNOWN" || ctx.family === "OtherUnknown") {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.UNKNOWN_FAMILY,
            block_export: true
        };
    }
    return null;
}

function checkNoPlaybookSpec(ctx) {
    if (!ctx.hasPlaybookSpec) {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.NO_PLAYBOOK_SPEC,
            block_export: false
        };
    }
    return null;
}

function checkMultiFamily(ctx) {
    if (ctx.isMultiFamily) {
        // Multi-family clauses get processed individually
        // But flag for review
        return {
            decision: "APPROVE_WITH_NOTES",
            reason: ESCALATION_REASONS.MULTI_FAMILY_DETECTED,
            notes: [`Original clause split into ${ctx.multiFamily.total_splits} parts`],
            block_export: false
        };
    }
    return null;
}

function checkCriticalIssues(ctx) {
    if (ctx.hasCriticalIssue && ctx.thresholds.escalate_on_any_critical_issue) {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.CRITICAL_ISSUE_DETECTED,
            block_export: true
        };
    }
    return null;
}

function checkCriticalRiskLevel(ctx) {
    if (ctx.riskLevel === "critical") {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.CRITICAL_RISK_LEVEL,
            block_export: true
        };
    }
    return null;
}

function checkUnacceptableDeviations(ctx) {
    if (ctx.unacceptableDeviations.length > 0) {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.UNACCEPTABLE_DEVIATION,
            notes: ctx.unacceptableDeviations.map(d => d.issue || d.text),
            block_export: true
        };
    }
    return null;
}

function checkRequiresApproval(ctx) {
    if (ctx.requiresApproval.length > 0) {
        // Extract approval levels needed
        const approvals = ctx.requiresApproval.map(obs => {
            const text = (obs.issue || obs.text || "").toLowerCase();
            if (text.includes("amazon legal l8")) return "AMAZON_LEGAL_L8";
            if (text.includes("regional lead")) return "AMAZON_LEGAL_REGIONAL_LEAD";
            if (text.includes("amazon legal")) return "AMAZON_LEGAL";
            if (text.includes("amazon tax")) return "AMAZON_TAX_FINANCE";
            if (text.includes("oc's discretion")) return "OC_DISCRETION";
            return "AMAZON_LEGAL";
        });

        return {
            decision: "ESCALATE_HUMAN",
            reason: {
                ...ESCALATION_REASONS.REQUIRES_APPROVAL,
                required_approvals: [...new Set(approvals)]
            },
            notes: ctx.requiresApproval.map(d => d.issue || d.text),
            block_export: false
        };
    }
    return null;
}

function checkAutoApprove(ctx) {
    if (
        ctx.confidence >= ctx.thresholds.auto_approve_confidence &&
        ctx.observationCount <= ctx.thresholds.max_observations_for_auto &&
        ctx.riskLevel === "low" &&
        !ctx.hasCriticalIssue &&
        ctx.hasPassableOnly
    ) {
        return {
            decision: "AUTO_PASS",
            reason: {
                code: "COMPLIANT",
                message: "Clause complies with playbook requirements"
            },
            block_export: false
        };
    }
    return null;
}

function checkApproveWithNotes(ctx) {
    if (
        ctx.confidence >= ctx.thresholds.approve_with_notes_confidence &&
        ctx.observationCount <= ctx.thresholds.max_observations_for_notes &&
        ctx.riskLevel !== "critical" &&
        !ctx.hasCriticalIssue &&
        (ctx.hasPassableOnly || ctx.riskLevel === "low")
    ) {
        return {
            decision: "APPROVE_WITH_NOTES",
            reason: {
                code: "PASSABLE_VARIATIONS",
                message: "Clause contains passable variations"
            },
            notes: ctx.observations.map(o => o.issue || o.text),
            block_export: false
        };
    }
    return null;
}

function checkHighRiskCriticalFamily(ctx) {
    if (ctx.riskLevel === "high" && ctx.priority === "CRITICAL") {
        return {
            decision: "ESCALATE_HUMAN",
            reason: ESCALATION_REASONS.HIGH_RISK_CRITICAL_FAMILY,
            block_export: false
        };
    }
    return null;
}

function defaultEscalate(ctx) {
    return {
        decision: "ESCALATE_HUMAN",
        reason: {
            code: "DEFAULT_ESCALATION",
            message: "Unable to auto-approve - manual review required"
        },
        block_export: false
    };
}

// ================================================================
// OUTPUT BUILDER
// ================================================================

function buildDecisionOutput(result, ctx) {
    return {
        decision: result.decision,
        decision_code: result.reason.code,
        decision_message: result.reason.message,
        block_export: result.block_export || false,

        // Context
        family: ctx.family,
        family_priority: ctx.priority,
        confidence: ctx.confidence,
        risk_level: ctx.riskLevel,
        observation_count: ctx.observationCount,

        // Details
        has_critical_issue: ctx.hasCriticalIssue,
        has_passable_only: ctx.hasPassableOnly,
        notes: result.notes || [],
        required_approvals: result.reason.required_approvals || [],

        // Multi-family info
        is_multi_family: ctx.isMultiFamily,
        multi_family_info: ctx.multiFamily,

        // Client output
        client_state: mapToClientState(result.decision),
        client_summary: generateClientSummary(result, ctx),

        // Timestamp
        decided_at: new Date().toISOString()
    };
}

function mapToClientState(decision) {
    switch (decision) {
        case "AUTO_PASS": return "APPROVED";
        case "APPROVE_WITH_NOTES": return "APPROVED_WITH_NOTES";
        case "ESCALATE_HUMAN": return "PENDING_REVIEW";
        default: return "PENDING_REVIEW";
    }
}

function generateClientSummary(result, ctx) {
    switch (result.decision) {
        case "AUTO_PASS":
            return `✅ Auto-approved. Clause complies with ${ctx.family} requirements.`;
        case "APPROVE_WITH_NOTES":
            const noteCount = (result.notes || []).length;
            return `⚠️ Approved with ${noteCount} note(s). Review before finalizing.`;
        case "ESCALATE_HUMAN":
            if (result.block_export) {
                return `🔴 BLOCKED. ${result.reason.message}. Cannot proceed without resolution.`;
            }
            return `🔍 Requires review. ${result.reason.message}.`;
        default:
            return `⏳ Pending review.`;
    }
}

// ================================================================
// EXPORT FOR N8N
// ================================================================

const analysisResult = $input.item.json;
const routingResult = analysisResult._routing || analysisResult;

const decision = makeDecision(analysisResult, routingResult);

return {
    ...analysisResult,
    _decision: decision,
    decision: decision.decision,
    client_state: decision.client_state,
    client_summary: decision.client_summary,
    block_export: decision.block_export
};
