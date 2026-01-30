/**
 * DECISION ENGINE v1.0
 * Automated decision logic for clause review
 * 
 * Reduces escalation rate by auto-approving compliant clauses
 * and approving passable variations with notes.
 */

const CONFIG = {
    // Family priority definitions
    familyPriority: {
        // CRITICAL - Always requires more scrutiny
        "IndemnityProdCo": "CRITICAL",
        "IndemnityAmazon": "CRITICAL",
        "IndemnityProcedures": "CRITICAL",
        "RepsProdCo": "CRITICAL",
        "RightsGrant": "CRITICAL",
        "RightsReversion": "CRITICAL",
        "LiabilityLimitation": "CRITICAL",
        "TerminationRights": "CRITICAL",
        "TerminationConsequences": "CRITICAL",
        "PaymentCredits": "CRITICAL",
        "SurvivalRemedies": "CRITICAL",

        // SUPPORT - Important but more flexibility
        "Confidentiality": "SUPPORT",
        "Publicity": "SUPPORT",
        "Insurance": "SUPPORT",
        "DisputeResolution": "SUPPORT",
        "ServicesScope": "SUPPORT",
        "CreativeControl": "SUPPORT",
        "KeyPersons": "SUPPORT",
        "Assignment": "SUPPORT",
        "ForceMajeure": "SUPPORT",
        "ThirdPartyCredits": "SUPPORT",

        // LOW - Boilerplate, lower risk
        "Definitions": "LOW",
        "GeneralProvisions": "LOW",
        "Parties": "LOW",

        // Unknown
        "OtherUnknown": "UNKNOWN"
    },

    // Thresholds by priority
    thresholds: {
        CRITICAL: {
            autoApproveMaxObservations: 0,
            autoApproveMaxRisk: "low",
            escalateOnCriticalIssue: true,
            passableMaxObservations: 2
        },
        SUPPORT: {
            autoApproveMaxObservations: 0,
            autoApproveMaxRisk: "medium",
            escalateOnCriticalIssue: true,
            passableMaxObservations: 3
        },
        LOW: {
            autoApproveMaxObservations: 1,
            autoApproveMaxRisk: "medium",
            escalateOnCriticalIssue: true,
            passableMaxObservations: 5
        },
        UNKNOWN: {
            autoApproveMaxObservations: 0,
            autoApproveMaxRisk: "none",
            escalateOnCriticalIssue: true,
            passableMaxObservations: 0
        }
    },

    // Critical keywords
    criticalKeywords: [
        "CRITICAL", "critical", "unacceptable", "UNACCEPTABLE",
        "must reject", "symmetric liability", "no cap",
        "unlimited liability", "no termination right"
    ],

    // Passable keywords
    passableKeywords: [
        "passable", "requires approval", "variation",
        "acceptable with", "may be acceptable", "minor deviation"
    ],

    // Compliance keywords
    complianceKeywords: [
        "aligns with", "compliant", "meets requirement",
        "as required", "present", "included"
    ]
};

function makeDecision(data) {
    const internal = data._internal || data;
    const observations = internal.observations?.observations || [];
    const riskLevel = internal.observations?.risk_level || "medium";
    const family = internal.detected_family || data.detected_family || "OtherUnknown";
    const hasPlaybook = data.has_playbook_spec !== false &&
        internal.rule_id?.startsWith("PB:");

    const priority = CONFIG.familyPriority[family] || "UNKNOWN";
    const thresholds = CONFIG.thresholds[priority];

    // Analyze observations
    let hasCritical = false;
    let hasPassableOnly = true;
    let criticalIssues = [];
    let passableIssues = [];

    for (const obs of observations) {
        const text = (obs.issue || obs.text || obs.description || "").toLowerCase();

        const isCritical = CONFIG.criticalKeywords.some(k => text.includes(k.toLowerCase()));
        const isPassable = CONFIG.passableKeywords.some(k => text.includes(k.toLowerCase()));
        const isCompliance = CONFIG.complianceKeywords.some(k => text.includes(k.toLowerCase()));

        if (isCritical) {
            hasCritical = true;
            hasPassableOnly = false;
            criticalIssues.push(obs.issue || obs.text);
        } else if (isPassable) {
            passableIssues.push(obs.issue || obs.text);
        } else if (!isCompliance) {
            hasPassableOnly = false;
        }
    }

    // Decision Rules
    let decision = "ESCALATE_HUMAN";
    let reason = "DEFAULT_ESCALATION";
    let message = "Manual review required.";

    // R1: Unknown family
    if (priority === "UNKNOWN" || family === "OtherUnknown") {
        reason = "UNKNOWN_FAMILY";
        message = `Unknown family '${family}'. Manual review required.`;
    }
    // R2: No playbook spec
    else if (!hasPlaybook) {
        reason = "NO_PLAYBOOK_SPEC";
        message = `No playbook for '${family}'. Manual review required.`;
    }
    // R3: Critical issue detected
    else if (hasCritical) {
        reason = "CRITICAL_ISSUE_DETECTED";
        message = `Critical issues: ${criticalIssues.slice(0, 2).join("; ")}`;
    }
    // R4: Critical risk level
    else if (riskLevel === "critical") {
        reason = "CRITICAL_RISK_LEVEL";
        message = `Critical risk level in ${priority} family.`;
    }
    // R5: No observations + acceptable risk → Auto-approve
    else if (observations.length === 0 &&
        ["low", "medium"].includes(riskLevel) &&
        !hasCritical) {
        decision = "APPROVE";
        reason = "NO_ISSUES_DETECTED";
        message = `Complies with ${family} requirements.`;
    }
    // R6: Passable only → Approve with notes
    else if (hasPassableOnly &&
        observations.length <= thresholds.passableMaxObservations &&
        riskLevel !== "critical") {
        decision = "APPROVE_WITH_NOTES";
        reason = "PASSABLE_VARIATIONS_ONLY";
        message = `Contains passable variations.`;
    }
    // R7: High risk + critical family
    else if (riskLevel === "high" && priority === "CRITICAL") {
        reason = "HIGH_RISK_CRITICAL_FAMILY";
        message = `High-risk in critical family '${family}'.`;
    }
    // R8: Moderate issues + support/low
    else if ((priority === "SUPPORT" || priority === "LOW") &&
        riskLevel !== "critical" &&
        observations.length <= thresholds.passableMaxObservations) {
        decision = "APPROVE_WITH_NOTES";
        reason = "MODERATE_ISSUES_NON_CRITICAL";
        message = `Deviations in ${priority} family. May proceed with exceptions.`;
    }

    // Map to client state
    const clientState = decision === "APPROVE" ? "OK" :
        decision === "APPROVE_WITH_NOTES" ? "RECOMMENDED" :
            "REQUIRED";

    return {
        decision,
        decision_reason: reason,
        decision_message: message,
        family,
        family_priority: priority,
        risk_level: riskLevel,
        observation_count: observations.length,
        has_critical_issues: hasCritical,
        critical_issues: criticalIssues,
        passable_issues: passableIssues,
        has_playbook_spec: hasPlaybook,
        client_state: clientState,
        decided_at: new Date().toISOString()
    };
}

// n8n Entry Point
const data = $input.item.json;
const decisionResult = makeDecision(data);

// Update escalation fields based on new decision
const updatedInternal = {
    ...data._internal,
    decision: decisionResult.decision,
    escalation_recommended: decisionResult.decision === "ESCALATE_HUMAN",
    escalation_reason: decisionResult.decision_reason
};

return {
    json: {
        ...data,
        _internal: updatedInternal,
        _decision: decisionResult,
        decision: decisionResult.decision,
        client_state: decisionResult.client_state
    }
};
