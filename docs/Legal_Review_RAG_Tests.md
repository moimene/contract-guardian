PARANOID AGENT v3.0 — Specification Document
Executive Summary
This document presents the revised specification for the Paranoid Analysis Agent, addressing the operational inefficiencies identified in v2.1 testing. The primary objectives of this revision are to reduce the escalation rate from ~67% to a target of 35-40%, introduce graduated response mechanisms, implement RAG fallback capabilities, and recognize industry-standard carve-outs while maintaining high recall for genuine risks.
The changes preserve the agent's conservative philosophy ("false positives acceptable, false negatives unacceptable") while adding the nuance necessary for practical deployment in high-volume clause review workflows.
Problem Statement
Testing of the Paranoid Agent v2.1 revealed three structural issues that caused excessive escalation rates without corresponding risk detection benefits.
The first issue concerns binary classification logic. The current rule "if ANY red_flag is found, risk_level MUST be RED or YELLOW" treats all flags equally regardless of severity, context, or mitigation. A minor formatting concern triggers the same response as a material liability shift.
The second issue involves missing RAG integration. Despite having 132 labeled examples in the variation_set database, the agent ignores this resource when playbook_spec is unavailable. This causes 100% escalation for families like ServicesScope that have abundant historical data but no formal specification.
The third issue relates to rigid industrial standards. Common contractual patterns that are widely accepted in specific industries (entertainment, technology licensing, real estate) are flagged as unacceptable because the agent lacks awareness of domain-specific norms.
Architecture Overview
The revised system operates in three layers. The Detection Layer (Paranoid Agent) identifies all potential deviations with maximum recall. The Classification Layer assigns severity, matches patterns, and queries RAG for historical precedent. The Decision Layer applies deterministic rules to route clauses to AUTO_PASS, APPROVE_WITH_NOTES, or ESCALATE_HUMAN.
The critical change in v3.0 is the introduction of bidirectional communication between the Classification and Detection layers, allowing RAG results to inform risk assessment before the Decision Layer applies routing rules.
Revised System Prompt
PARANOID ANALYSIS AGENT — {Family Name}
Version: 3.0 | Family: {family_id} | Priority: {priority}
Mode: {FULL_PLAYBOOK | LIMITED_PLAYBOOK | RAG_ONLY | BLIND}

═══════════════════════════════════════════════════════════════
SECTION 1: MISSION AND PHILOSOPHY
═══════════════════════════════════════════════════════════════

YOUR MISSION
You must identify EVERY deviation, risk, or concern with HIGH RECALL.
False positives are acceptable. False negatives are NOT acceptable.
However, you must CLASSIFY findings by severity to enable graduated response.

OPERATING MODES
Your behavior adapts based on available reference data:

- FULL_PLAYBOOK: Complete playbook_spec available. Apply all matching rules.
- LIMITED_PLAYBOOK: Partial playbook_spec. Apply available rules + RAG fallback.
- RAG_ONLY: No playbook_spec but RAG examples exist. Rely on similarity matching.
- BLIND: No playbook_spec and no RAG examples. Flag everything, escalate all.

Current mode for this analysis: {mode}

═══════════════════════════════════════════════════════════════
SECTION 2: REFERENCE DATA
═══════════════════════════════════════════════════════════════

AMAZON STANDARD POSITION
{pos.summary || 'Not defined for this family'}

CORE REQUIREMENTS
These elements define the minimum acceptable clause structure:
{formatted core_requirements}

MUST-HAVE ANCHORS (required textual elements)
Each anchor must appear in the clause. Missing anchors are flagged.
{formatted must_have}

═══════════════════════════════════════════════════════════════
SECTION 3: RED FLAGS (GRADUATED SEVERITY)
═══════════════════════════════════════════════════════════════

RED FLAGS — CRITICAL (Severity: 10)
Immediate escalation required. Cannot be mitigated or approved with notes.
These represent material risk shifts, liability exposure, or compliance violations.
{formatted critical_red_flags}

RED FLAGS — MAJOR (Severity: 7)
Escalate unless explicitly mitigated by another clause provision.
If mitigation is present, downgrade to YELLOW with detailed notes.
{formatted major_red_flags}

RED FLAGS — MINOR (Severity: 3)
Flag and document, but may be approved with notes.
These are suboptimal but within acceptable risk tolerance.
{formatted minor_red_flags}

Severity scoring:
- Total severity >= 10 → risk_level = RED
- Total severity 5-9 → risk_level = YELLOW
- Total severity < 5 → risk_level = GREEN (if no other issues)

═══════════════════════════════════════════════════════════════
SECTION 4: PATTERN MATCHING
═══════════════════════════════════════════════════════════════

UNACCEPTABLE PATTERNS (must reject if matched)
These patterns indicate clauses that cannot be approved under any circumstances.
{formatted unacceptable_patterns}

PASSABLE VARIATIONS (acceptable with legal approval)
These patterns deviate from standard but fall within acceptable risk parameters.
{formatted passable_variations}

ACCEPTABLE EXAMPLES (fully compliant language)
Reference language that meets all requirements without deviation.
{formatted acceptable_examples}

═══════════════════════════════════════════════════════════════
SECTION 5: INDUSTRY-STANDARD CARVE-OUTS
═══════════════════════════════════════════════════════════════

The following patterns are commonly accepted in specific industries.
When detected, flag as MINOR (not MAJOR/CRITICAL) and note the carve-out.

ENTERTAINMENT / MEDIA PRODUCTION
- Disclosure to financing sources, completion guarantors, and insurers without prior consent
- Assignment to production subsidiaries or affiliated production entities
- Force majeure including "studio/network decisions" or "talent unavailability"
- Pay-or-play provisions for key talent
- Most favored nations clauses for compensation

TECHNOLOGY / SOFTWARE LICENSING
- Automatic assignment in merger/acquisition scenarios
- Disclosure to auditors and legal counsel without consent
- Limitation of liability caps tied to fees paid
- Exclusion of consequential damages (mutual)
- Source code escrow arrangements

REAL ESTATE / CONSTRUCTION
- Force majeure including weather delays and permit delays
- Mechanic's lien rights preservation
- Substantial completion standards (vs. absolute completion)
- Retainage provisions
- Change order pricing mechanisms

FINANCIAL SERVICES
- Regulatory disclosure requirements override confidentiality
- Assignment to affiliates within holding company structure
- Indemnification for regulatory penalties (limited)
- Audit rights with reasonable notice

When a clause matches an INDUSTRY-STANDARD CARVE-OUT:
1. Set industry_carveout = true in the observation
2. Reduce severity by 4 points (e.g., MAJOR → MINOR equivalent)
3. Include carve-out reference in the reason field
4. Do NOT auto-escalate solely due to the carve-out pattern

═══════════════════════════════════════════════════════════════
SECTION 6: RAG FALLBACK MODE
═══════════════════════════════════════════════════════════════

When operating in LIMITED_PLAYBOOK or RAG_ONLY mode, use retrieved examples
to inform risk assessment.

RAG QUERY PROCESS
1. Generate embedding for the input clause_text
2. Query variation_set for top 5 semantically similar examples
3. Filter results where similarity >= 0.80
4. Evaluate the acceptability_status of matched examples

RAG-INFORMED DECISIONS
- If similarity >= 0.92 with ACCEPTABLE example AND no CRITICAL flags:
  → May set risk_level = GREEN with rag_supported = true
  
- If similarity >= 0.85 with ACCEPTABLE example AND no CRITICAL flags:
  → Set risk_level = YELLOW (not RED) with rag_supported = true
  → Decision engine may APPROVE_WITH_NOTES
  
- If similarity >= 0.85 with UNACCEPTABLE example:
  → Confirm risk_level = RED, cite the historical rejection
  
- If similarity >= 0.85 with PASSABLE example:
  → Set risk_level = YELLOW, inherit notes from historical approval

- If no matches >= 0.80:
  → RAG provides no guidance; proceed with standard analysis

Include RAG results in output:
{
  "rag_matches": [
    {
      "example_id": "uuid",
      "similarity": 0.89,
      "acceptability_status": "ACCEPTABLE|PASSABLE|UNACCEPTABLE",
      "historical_notes": "string or null"
    }
  ]
}

═══════════════════════════════════════════════════════════════
SECTION 7: ESCALATION TRIGGERS
═══════════════════════════════════════════════════════════════

AUTOMATIC ESCALATION (cannot be overridden)
- Any CRITICAL red_flag detected
- Clause matches UNACCEPTABLE pattern with confidence >= 0.90
- Multiple MAJOR red_flags (>= 2) without mitigation
- Missing >= 2 MUST-HAVE anchors
- Explicit indemnification of counterparty negligence/willful misconduct
- Unlimited liability exposure
- Waiver of jury trial or class action rights (without mutual waiver)

CONDITIONAL ESCALATION (may be overridden by RAG or carve-out)
- Single MAJOR red_flag without mitigation
- Missing 1 MUST-HAVE anchor
- Clause matches pattern not in playbook (unknown deviation)
- Low confidence analysis (coverage_confidence < 0.70)

NO ESCALATION REQUIRED
- Only MINOR flags detected
- Deviations match PASSABLE variations
- Clause matches INDUSTRY-STANDARD CARVE-OUT
- High-similarity RAG match to ACCEPTABLE example

═══════════════════════════════════════════════════════════════
SECTION 8: FEW-SHOT EXAMPLES
═══════════════════════════════════════════════════════════════

{few_shot_examples if available, otherwise omit this section}

═══════════════════════════════════════════════════════════════
SECTION 9: MATCHING RULES (DETERMINISTIC)
═══════════════════════════════════════════════════════════════

- Match is case-insensitive and whitespace-tolerant
- evidence MUST be an exact substring from clause_text
- offsets are 0-indexed character positions in clause_text
- If a must-have is missing: evidence = "[missing: <anchor>]", offsets = {start:0, end:0}
- Fuzzy matching allowed for semantic equivalence (note in reason field)

═══════════════════════════════════════════════════════════════
SECTION 10: OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this schema:

{
  "mode": "FULL_PLAYBOOK|LIMITED_PLAYBOOK|RAG_ONLY|BLIND",
  
  "observations": [
    {
      "evidence": "exact substring from clause_text OR [missing: <anchor>]",
      "offsets": { "start": 0, "end": 0 },
      "change_type": "missing|added|modified",
      "possible_category": "MatchesUnacceptable|MissingRequired|PassableVariation|IndustryCarveout|UnknownChange",
      "pattern_matched": "red_flag name OR pattern name OR null",
      "severity_class": "CRITICAL|MAJOR|MINOR",
      "severity_score": 0,
      "industry_carveout": false,
      "carveout_reference": "string or null",
      "mitigated_by": "string describing mitigation or null",
      "confidence": 0.0,
      "reason": "brief explanation",
      "playbook_reference": "pattern id or null"
    }
  ],
  
  "rag_matches": [
    {
      "example_id": "uuid",
      "similarity": 0.0,
      "acceptability_status": "ACCEPTABLE|PASSABLE|UNACCEPTABLE",
      "historical_notes": "string or null"
    }
  ],
  
  "summary": {
    "counts": {
      "total": 0,
      "critical": 0,
      "major": 0,
      "minor": 0,
      "missing": 0,
      "added": 0,
      "modified": 0
    },
    "total_severity_score": 0,
    "coverage_confidence": 0.0,
    "red_flags_found": 0,
    "unacceptable_patterns_found": 0,
    "must_have_missing": 0,
    "industry_carveouts_applied": 0,
    "rag_supported": false,
    "highest_rag_similarity": 0.0
  },
  
  "risk_level": "RED|YELLOW|GREEN",
  
  "risk_level_reasoning": "One sentence explaining why this risk level was assigned"
}

Revised Decision Engine Rules
The Decision Engine applies deterministic rules to the Paranoid Agent output. Rules are evaluated in order; the first matching rule determines the outcome.
// ═══════════════════════════════════════════════════════════════
// DECISION ENGINE v3.0 — Deterministic Gating Rules
// ═══════════════════════════════════════════════════════════════

function evaluateClause(paranoidOutput, familyPriority) {
  
  const { observations, summary, risk_level, rag_matches } = paranoidOutput;
  const priority = familyPriority; // CRITICAL | HIGH | MEDIUM | LOW
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 1: VALIDATION GATES (always escalate if failed)
  // ─────────────────────────────────────────────────────────────
  
  // R1: Schema validation failed
  if (!isValidSchema(paranoidOutput)) {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: 'R1: Output schema validation failed',
      requires_senior: true
    };
  }
  
  // R2: Unknown or unsupported family
  if (familyPriority === 'UNKNOWN') {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: 'R2: Clause family not recognized',
      requires_senior: true
    };
  }
  
  // R3: BLIND mode (no playbook, no RAG)
  if (paranoidOutput.mode === 'BLIND') {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: 'R3: No reference data available for analysis',
      requires_senior: true
    };
  }
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 2: AUTOMATIC ESCALATION (hard blocks)
  // ─────────────────────────────────────────────────────────────
  
  // R4: Any CRITICAL severity observation
  const criticalCount = summary.counts.critical || 0;
  if (criticalCount > 0) {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: `R4: ${criticalCount} CRITICAL issue(s) detected`,
      requires_senior: priority === 'CRITICAL',
      observations: observations.filter(o => o.severity_class === 'CRITICAL')
    };
  }
  
  // R5: Matches UNACCEPTABLE pattern in CRITICAL/HIGH priority family
  if (summary.unacceptable_patterns_found > 0 && 
      (priority === 'CRITICAL' || priority === 'HIGH')) {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: 'R5: Unacceptable pattern in high-priority family',
      requires_senior: true
    };
  }
  
  // R6: Multiple MAJOR issues without mitigation
  const unmitigatedMajor = observations.filter(
    o => o.severity_class === 'MAJOR' && !o.mitigated_by
  );
  if (unmitigatedMajor.length >= 2) {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: `R6: ${unmitigatedMajor.length} unmitigated MAJOR issues`,
      requires_senior: false
    };
  }
  
  // R7: Multiple missing MUST-HAVE anchors
  if (summary.must_have_missing >= 2) {
    return { 
      decision: 'ESCALATE_HUMAN', 
      reason: `R7: ${summary.must_have_missing} required elements missing`,
      requires_senior: false
    };
  }
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 3: RAG-SUPPORTED APPROVAL (new in v3.0)
  // ─────────────────────────────────────────────────────────────
  
  const thresholds = getThresholds(priority);
  const bestRagMatch = rag_matches?.[0] || { similarity: 0 };
  
  // R8: High-confidence RAG match to ACCEPTABLE example
  if (bestRagMatch.similarity >= 0.92 && 
      bestRagMatch.acceptability_status === 'ACCEPTABLE' &&
      criticalCount === 0 &&
      unmitigatedMajor.length === 0) {
    return { 
      decision: 'AUTO_PASS', 
      reason: 'R8: RAG match (92%+) to acceptable example, no critical issues',
      rag_reference: bestRagMatch.example_id,
      confidence: bestRagMatch.similarity
    };
  }
  
  // R9: Good RAG match to ACCEPTABLE example
  if (bestRagMatch.similarity >= 0.85 && 
      bestRagMatch.acceptability_status === 'ACCEPTABLE' &&
      criticalCount === 0) {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R9: RAG match (85%+) to acceptable example',
      rag_reference: bestRagMatch.example_id,
      notes: generateNotes(observations),
      confidence: bestRagMatch.similarity
    };
  }
  
  // R10: RAG match to PASSABLE example
  if (bestRagMatch.similarity >= 0.85 && 
      bestRagMatch.acceptability_status === 'PASSABLE' &&
      criticalCount === 0) {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R10: RAG match to historically passable variation',
      rag_reference: bestRagMatch.example_id,
      notes: bestRagMatch.historical_notes || generateNotes(observations),
      confidence: bestRagMatch.similarity
    };
  }
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 4: STANDARD APPROVAL PATHS
  // ─────────────────────────────────────────────────────────────
  
  // R11: Fully compliant (GREEN with high confidence)
  if (risk_level === 'GREEN' && 
      summary.coverage_confidence >= thresholds.auto_pass) {
    return { 
      decision: 'AUTO_PASS', 
      reason: 'R11: Compliant with high confidence',
      confidence: summary.coverage_confidence
    };
  }
  
  // R12: GREEN with moderate confidence
  if (risk_level === 'GREEN' && 
      summary.coverage_confidence >= thresholds.with_notes) {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R12: Compliant with moderate confidence',
      notes: 'Manual verification recommended due to confidence level',
      confidence: summary.coverage_confidence
    };
  }
  
  // R13: YELLOW with only MINOR issues or industry carve-outs
  const hasOnlyMinorOrCarveouts = observations.every(
    o => o.severity_class === 'MINOR' || o.industry_carveout
  );
  if (risk_level === 'YELLOW' && hasOnlyMinorOrCarveouts) {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R13: Minor deviations only (including industry carve-outs)',
      notes: generateNotes(observations),
      confidence: summary.coverage_confidence
    };
  }
  
  // R14: YELLOW with mitigated MAJOR issues
  const allMajorMitigated = observations
    .filter(o => o.severity_class === 'MAJOR')
    .every(o => o.mitigated_by);
  if (risk_level === 'YELLOW' && allMajorMitigated && priority !== 'CRITICAL') {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R14: Major issues present but mitigated',
      notes: generateNotes(observations),
      requires_legal_signoff: true
    };
  }
  
  // R15: YELLOW in LOW priority family
  if (risk_level === 'YELLOW' && priority === 'LOW') {
    return { 
      decision: 'APPROVE_WITH_NOTES', 
      reason: 'R15: Yellow risk in low-priority family',
      notes: generateNotes(observations)
    };
  }
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 5: DEFAULT ESCALATION
  // ─────────────────────────────────────────────────────────────
  
  // R16: Default fallback
  return { 
    decision: 'ESCALATE_HUMAN', 
    reason: 'R16: No approval rule matched; requires human review',
    observations: observations,
    requires_senior: priority === 'CRITICAL' || priority === 'HIGH'
  };
}

// ─────────────────────────────────────────────────────────────
// THRESHOLD CONFIGURATION (v3.0 - relaxed from v2.1)
// ─────────────────────────────────────────────────────────────

function getThresholds(priority) {
  const config = {
    CRITICAL: { auto_pass: 0.90, with_notes: 0.80, escalate: 0.70 },
    HIGH:     { auto_pass: 0.88, with_notes: 0.78, escalate: 0.68 },
    MEDIUM:   { auto_pass: 0.85, with_notes: 0.75, escalate: 0.65 },
    LOW:      { auto_pass: 0.80, with_notes: 0.70, escalate: 0.60 }
  };
  return config[priority] || config.MEDIUM;
}

// ─────────────────────────────────────────────────────────────
// HELPER: Generate approval notes from observations
// ─────────────────────────────────────────────────────────────

function generateNotes(observations) {
  return observations
    .filter(o => o.severity_class !== 'CRITICAL')
    .map(o => {
      let note = `[${o.severity_class}] ${o.reason}`;
      if (o.industry_carveout) note += ` (Industry carve-out: ${o.carveout_reference})`;
      if (o.mitigated_by) note += ` (Mitigated: ${o.mitigated_by})`;
      return note;
    })
    .join('\n');
}

Threshold Comparison: v2.1 vs v3.0
Priority	v2.1 Auto Pass	v3.0 Auto Pass	v2.1 With Notes	v3.0 With Notes	Change
CRITICAL	0.95	0.90	0.85	0.80	-5% / -5%
HIGH	0.92	0.88	0.82	0.78	-4% / -4%
MEDIUM	0.90	0.85	0.80	0.75	-5% / -5%
LOW	0.85	0.80	0.75	0.70	-5% / -5%

The rationale for relaxation is that v2.1 thresholds were set assuming perfect playbook coverage. In practice, clause language varies significantly while remaining substantively compliant. The 5% reduction acknowledges this variance without compromising risk detection.
Industry Carve-Out Registry
The following table defines recognized industry-standard variations that should trigger reduced severity scoring.
Industry	Pattern	Standard Clause Language	Severity Reduction
Entertainment	Financing Disclosure	"Producer may disclose to financing sources and completion guarantors"	MAJOR → MINOR
Entertainment	Talent Force Majeure	"Including talent death, disability, or unavailability"	MAJOR → MINOR
Entertainment	Pay-or-Play	"Studio shall pay guaranteed compensation regardless of production"	No flag
Entertainment	Production Entity Assignment	"Assignment to any wholly-owned production subsidiary"	MAJOR → MINOR
Technology	M&A Assignment	"May assign without consent in connection with merger or acquisition"	MAJOR → MINOR
Technology	Consequential Damages Waiver	"Neither party liable for consequential, incidental, or punitive damages"	No flag (if mutual)
Technology	Liability Cap	"Total liability shall not exceed fees paid in prior 12 months"	No flag
Technology	Audit Rights	"Licensor may audit upon 30 days written notice"	No flag
Real Estate	Weather Force Majeure	"Including unusually severe weather conditions"	No flag
Real Estate	Permit Delays	"Delays in obtaining governmental permits or approvals"	No flag
Real Estate	Substantial Completion	"Substantial completion" vs "final completion"	MINOR only
Financial	Regulatory Disclosure	"Disclosure required by applicable law or regulation"	No flag
Financial	Affiliate Assignment	"Assignment to any affiliate within the same holding company"	MAJOR → MINOR

Migration Guide: v2.1 to v3.0
Database Changes Required
The variation_set table requires no schema changes. The playbook_specs table requires additional columns:
ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS 
  critical_red_flags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS 
  major_red_flags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS 
  minor_red_flags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS 
  industry_carveouts JSONB DEFAULT '[]'::jsonb;

-- Migrate existing red_flags to major_red_flags (conservative default)
UPDATE playbook_specs 
SET major_red_flags = red_flags 
WHERE red_flags IS NOT NULL AND major_red_flags = '[]'::jsonb;

Workflow Changes
The n8n workflow requires updates at two nodes.
First, the Paranoid Agent node must be updated to use the new prompt template (Section 3 of this document). The model parameter may remain unchanged (GPT-4 or Claude recommended for complex analysis).
Second, the Decision Gate node must be updated to implement the revised rules (Section 4 of this document). This replaces the existing conditional logic with the new 16-rule evaluation function.
Testing Protocol
Before production deployment, the following test cases must pass.
Test ID	Input	Expected Output	Rule Triggered
T01	Standard force majeure clause	AUTO_PASS	R11
T02	Confidentiality with financing disclosure (entertainment)	APPROVE_WITH_NOTES	R13
T03	Unlimited liability clause	ESCALATE_HUMAN	R4
T04	ServicesScope (no playbook, RAG available)	APPROVE_WITH_NOTES	R9 or R10
T05	Unknown family, no data	ESCALATE_HUMAN	R2/R3
T06	Two unmitigated MAJOR issues	ESCALATE_HUMAN	R6
T07	One MAJOR issue with mitigation clause	APPROVE_WITH_NOTES	R14
T08	95% RAG match to ACCEPTABLE	AUTO_PASS	R8
T09	87% RAG match to PASSABLE	APPROVE_WITH_NOTES	R10
T10	CRITICAL priority, YELLOW risk	Depends on details	R14-R16

Expected Outcomes
Escalation Rate Projections
Scenario	v2.1 Rate	v3.0 Projected	Reduction
With full playbook_spec	30%	20-25%	-5 to -10pp
With limited playbook_spec	70%	40-50%	-20 to -30pp
With RAG only	100%	55-65%	-35 to -45pp
Blind (no data)	100%	100%	0 (correct)
Overall weighted average	~67%	~35-40%	-27 to -32pp

Risk Metrics
The changes are designed to maintain detection rates for genuine risks while reducing false escalations.
Metric	v2.1 Baseline	v3.0 Target	Measurement Method
True Positive Rate (critical issues)	99%+	99%+	Manual audit of AUTO_PASS decisions
False Positive Rate	~60%	~30%	Escalations reversed by human review
Processing Time (avg)	45 sec	40 sec	Reduced due to fewer escalation handoffs
Human Review Burden	670 clauses/1000	350-400 clauses/1000	Escalation count

Appendix A: Sample Output Comparison
Test Case: Confidentiality with Financing Disclosure
Input clause:
"Producer may disclose confidential information to investors and financing sources without prior written consent from Amazon."
v2.1 Output:
{
  "observations": [
    {
      "evidence": "without prior written consent",
      "change_type": "modified",
      "possible_category": "MatchesUnacceptable",
      "pattern_matched": "disclosure_without_consent",
      "confidence": 0.92,
      "severity": "high",
      "reason": "Disclosure permitted without consent violates standard"
    }
  ],
  "risk_level": "RED"
}

Decision: ESCALATE_HUMAN (R5: Unacceptable pattern)
v3.0 Output:
{
  "mode": "FULL_PLAYBOOK",
  "observations": [
    {
      "evidence": "disclose confidential information to investors and financing sources without prior written consent",
      "change_type": "modified",
      "possible_category": "IndustryCarveout",
      "pattern_matched": "disclosure_without_consent",
      "severity_class": "MINOR",
      "severity_score": 3,
      "industry_carveout": true,
      "carveout_reference": "Entertainment: Financing Disclosure",
      "confidence": 0.92,
      "reason": "Standard entertainment industry carve-out for production financing"
    }
  ],
  "summary": {
    "counts": { "total": 1, "critical": 0, "major": 0, "minor": 1 },
    "total_severity_score": 3,
    "industry_carveouts_applied": 1
  },
  "risk_level": "YELLOW",
  "risk_level_reasoning": "Single minor deviation matching industry-standard carve-out"
}

Decision: APPROVE_WITH_NOTES (R13: Minor deviations only)
Appendix B: Playbook Spec Template
For families currently lacking playbook_spec (e.g., ServicesScope), the following minimal template should be created:
{
  "family_id": "ServicesScope",
  "priority": "MEDIUM",
  "pos_summary": "Amazon requires comprehensive definition of services with clear deliverables, timelines, and acceptance criteria.",
  
  "core_requirements": [
    "Services must be specifically enumerated or reference an exhibit",
    "Deliverables must be defined with acceptance criteria",
    "Timeline or milestones must be specified"
  ],
  
  "must_have": [
    "services", "deliverables", "schedule OR timeline OR milestones"
  ],
  
  "critical_red_flags": [
    "Services to be determined at sole discretion of Provider",
    "Open-ended scope with no limitation"
  ],
  
  "major_red_flags": [
    "No acceptance criteria for deliverables",
    "Timeline subject to unilateral extension"
  ],
  
  "minor_red_flags": [
    "Vague service descriptions requiring interpretation",
    "Missing exhibit reference for detailed scope"
  ],
  
  "unacceptable_patterns": [
    "Provider shall determine scope and pricing after execution"
  ],
  
  "passable_variations": [
    "Scope may be modified by mutual written agreement",
    "Additional services available upon request at rates in Exhibit B"
  ],
  
  "industry_carveouts": [],
  
  "acceptable_examples": [
    "Provider shall perform the services described in Exhibit A in accordance with the timeline set forth in Exhibit B. Deliverables shall be subject to Amazon's acceptance, which shall not be unreasonably withheld."
  ]
}

Appendix C: Monitoring Dashboard Metrics
Post-deployment, the following metrics should be tracked weekly:
Metric	Formula	Target	Alert Threshold
Escalation Rate	Escalations / Total Clauses	35-40%	>50% or <25%
Auto-Pass Rate	Auto-Pass / Total Clauses	25-35%	<15%
RAG Utilization	RAG-supported decisions / (RAG_ONLY + LIMITED mode)	>60%	<40%
Carve-Out Application	Carve-outs applied / Total observations	5-15%	>25%
False Negative Rate	Critical issues in Auto-Pass (audited)	<1%	>2%
Human Override Rate	Human changes decision / Escalations reviewed	30-40%	>60%
Average Confidence	Mean coverage_confidence	>0.80	<0.70

