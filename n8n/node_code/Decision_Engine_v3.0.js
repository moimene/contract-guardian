// ================================================================================
// Decision Engine v3.0 (16-Rule Deterministic Gating)
// ================================================================================
// Implements Legal Team specification from docs/Legal_Review_RAG_Tests.md
// Target: Reduce escalation rate from ~67% to 35-40%
// ================================================================================

const prev = $('Parse Paranoid').first().json;
const paranoidOutput = prev.paranoidOutput || {};
const familyPriority = prev.playbookSpec?.priority || 'MEDIUM';
const operatingMode = paranoidOutput.mode || prev.operatingMode || 'BLIND';

const { observations = [], summary = {}, risk_level, rag_matches = [] } = paranoidOutput;

// ─────────────────────────────────────────────────────────────
// THRESHOLD CONFIGURATION (v3.0 - relaxed from v2.1)
// ─────────────────────────────────────────────────────────────
const THRESHOLDS = {
    CRITICAL: { auto_pass: 0.90, with_notes: 0.80, escalate: 0.70 },
    HIGH: { auto_pass: 0.88, with_notes: 0.78, escalate: 0.68 },
    MEDIUM: { auto_pass: 0.85, with_notes: 0.75, escalate: 0.65 },
    LOW: { auto_pass: 0.80, with_notes: 0.70, escalate: 0.60 }
};

const thresholds = THRESHOLDS[familyPriority] || THRESHOLDS.MEDIUM;

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────
function generateNotes(obs) {
    return obs
        .filter(o => o.severity_class !== 'CRITICAL')
        .map(o => {
            let note = `[${o.severity_class || 'UNKNOWN'}] ${o.reason || 'No reason provided'}`;
            if (o.industry_carveout) note += ` (Industry carve-out: ${o.carveout_reference})`;
            if (o.mitigated_by) note += ` (Mitigated: ${o.mitigated_by})`;
            return note;
        })
        .join('\n') || 'No notes';
}

// Count observations by severity class
const criticalCount = observations.filter(o => o.severity_class === 'CRITICAL').length;
const majorCount = observations.filter(o => o.severity_class === 'MAJOR').length;
const minorCount = observations.filter(o => o.severity_class === 'MINOR').length;

// Identify unmitigated major issues
const unmitigatedMajor = observations.filter(
    o => o.severity_class === 'MAJOR' && !o.mitigated_by
);

// Get best RAG match
const bestRagMatch = rag_matches?.[0] || { similarity: 0 };

// Check if all observations are minor or carve-outs
const hasOnlyMinorOrCarveouts = observations.every(
    o => o.severity_class === 'MINOR' || o.industry_carveout
);

// Check if all major issues are mitigated
const allMajorMitigated = observations
    .filter(o => o.severity_class === 'MAJOR')
    .every(o => o.mitigated_by);

// ─────────────────────────────────────────────────────────────
// DECISION ENGINE v3.0 — 16 RULES
// ─────────────────────────────────────────────────────────────
let decision, reason, extras = {};

// ═══════════════════════════════════════════════════════════════
// PHASE 1: VALIDATION GATES (always escalate if failed)
// ═══════════════════════════════════════════════════════════════

// R1: Schema validation failed
if (!paranoidOutput || typeof paranoidOutput !== 'object' || !Array.isArray(observations)) {
    decision = 'ESCALATE_HUMAN';
    reason = 'R1: Output schema validation failed';
    extras.requires_senior = true;
}

// R2: Unknown or unsupported family
else if (familyPriority === 'UNKNOWN') {
    decision = 'ESCALATE_HUMAN';
    reason = 'R2: Clause family not recognized';
    extras.requires_senior = true;
}

// R3: BLIND mode (no playbook, no RAG)
else if (operatingMode === 'BLIND') {
    decision = 'ESCALATE_HUMAN';
    reason = 'R3: No reference data available for analysis';
    extras.requires_senior = true;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: AUTOMATIC ESCALATION (hard blocks)
// ═══════════════════════════════════════════════════════════════

// R4: Any CRITICAL severity observation
else if (criticalCount > 0) {
    decision = 'ESCALATE_HUMAN';
    reason = `R4: ${criticalCount} CRITICAL issue(s) detected`;
    extras.requires_senior = familyPriority === 'CRITICAL';
    extras.critical_observations = observations.filter(o => o.severity_class === 'CRITICAL');
}

// R5: Matches UNACCEPTABLE pattern in CRITICAL/HIGH priority family
else if ((summary.unacceptable_patterns_found || 0) > 0 &&
    (familyPriority === 'CRITICAL' || familyPriority === 'HIGH')) {
    decision = 'ESCALATE_HUMAN';
    reason = 'R5: Unacceptable pattern in high-priority family';
    extras.requires_senior = true;
}

// R6: Multiple MAJOR issues without mitigation
else if (unmitigatedMajor.length >= 2) {
    decision = 'ESCALATE_HUMAN';
    reason = `R6: ${unmitigatedMajor.length} unmitigated MAJOR issues`;
    extras.requires_senior = false;
}

// R7: Multiple missing MUST-HAVE anchors
else if ((summary.must_have_missing || 0) >= 2) {
    decision = 'ESCALATE_HUMAN';
    reason = `R7: ${summary.must_have_missing} required elements missing`;
    extras.requires_senior = false;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3: RAG-SUPPORTED APPROVAL (new in v3.0)
// ═══════════════════════════════════════════════════════════════

// R8: High-confidence RAG match to ACCEPTABLE example
else if (bestRagMatch.similarity >= 0.92 &&
    bestRagMatch.acceptability_status === 'ACCEPTABLE' &&
    criticalCount === 0 &&
    unmitigatedMajor.length === 0) {
    decision = 'AUTO_PASS';
    reason = 'R8: RAG match (92%+) to acceptable example, no critical issues';
    extras.rag_reference = bestRagMatch.example_id;
    extras.confidence = bestRagMatch.similarity;
}

// R9: Good RAG match to ACCEPTABLE example
else if (bestRagMatch.similarity >= 0.85 &&
    bestRagMatch.acceptability_status === 'ACCEPTABLE' &&
    criticalCount === 0) {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R9: RAG match (85%+) to acceptable example';
    extras.rag_reference = bestRagMatch.example_id;
    extras.notes = generateNotes(observations);
    extras.confidence = bestRagMatch.similarity;
}

// R10: RAG match to PASSABLE example
else if (bestRagMatch.similarity >= 0.85 &&
    bestRagMatch.acceptability_status === 'PASSABLE' &&
    criticalCount === 0) {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R10: RAG match to historically passable variation';
    extras.rag_reference = bestRagMatch.example_id;
    extras.notes = bestRagMatch.historical_notes || generateNotes(observations);
    extras.confidence = bestRagMatch.similarity;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4: STANDARD APPROVAL PATHS
// ═══════════════════════════════════════════════════════════════

// R11: Fully compliant (GREEN with high confidence)
else if (risk_level === 'GREEN' &&
    (summary.coverage_confidence || 0) >= thresholds.auto_pass) {
    decision = 'AUTO_PASS';
    reason = 'R11: Compliant with high confidence';
    extras.confidence = summary.coverage_confidence;
}

// R12: GREEN with moderate confidence
else if (risk_level === 'GREEN' &&
    (summary.coverage_confidence || 0) >= thresholds.with_notes) {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R12: Compliant with moderate confidence';
    extras.notes = 'Manual verification recommended due to confidence level';
    extras.confidence = summary.coverage_confidence;
}

// R13: YELLOW with only MINOR issues or industry carve-outs
else if (risk_level === 'YELLOW' && hasOnlyMinorOrCarveouts) {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R13: Minor deviations only (including industry carve-outs)';
    extras.notes = generateNotes(observations);
    extras.confidence = summary.coverage_confidence;
}

// R14: YELLOW with mitigated MAJOR issues
else if (risk_level === 'YELLOW' && allMajorMitigated && familyPriority !== 'CRITICAL') {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R14: Major issues present but mitigated';
    extras.notes = generateNotes(observations);
    extras.requires_legal_signoff = true;
}

// R15: YELLOW in LOW priority family
else if (risk_level === 'YELLOW' && familyPriority === 'LOW') {
    decision = 'APPROVE_WITH_NOTES';
    reason = 'R15: Yellow risk in low-priority family';
    extras.notes = generateNotes(observations);
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5: DEFAULT ESCALATION
// ═══════════════════════════════════════════════════════════════

// R16: Default fallback
else {
    decision = 'ESCALATE_HUMAN';
    reason = 'R16: No approval rule matched; requires human review';
    extras.observations = observations;
    extras.requires_senior = familyPriority === 'CRITICAL' || familyPriority === 'HIGH';
}

// ─────────────────────────────────────────────────────────────
// BUILD OUTPUT
// ─────────────────────────────────────────────────────────────
const output = {
    decision: decision,
    reason: reason,
    rule_triggered: reason.split(':')[0],
    family_priority: familyPriority,
    operating_mode: operatingMode,
    risk_level: risk_level,
    thresholds_used: thresholds,
    summary_counts: {
        critical: criticalCount,
        major: majorCount,
        minor: minorCount,
        unmitigated_major: unmitigatedMajor.length,
        rag_similarity: bestRagMatch.similarity || 0
    },
    ...extras,
    // Map decision to client_status for downstream
    client_status: decision === 'ESCALATE_HUMAN' ? null :
        (decision === 'AUTO_PASS' ? 'ACCEPTABLE' : 'REQUIRED'),
    final_status: decision === 'ESCALATE_HUMAN' ? null :
        (decision === 'AUTO_PASS' ? 'Compliant' : 'AcceptableDeviation')
};

return [{
    json: {
        ...prev,
        decisionEngineOutput: output,
        decision: decision,
        client_status: output.client_status,
        final_status: output.final_status,
        decisionEngineVersion: '3.0'
    }
}];
