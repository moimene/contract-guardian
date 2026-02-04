// ================================================================================
// Build Family Prompt v3.0 (PARANOID v3.0 Specification)
// ================================================================================
// Implements Legal Team specification from docs/Legal_Review_RAG_Tests.md:
// - 4 Operating Modes: FULL_PLAYBOOK, LIMITED_PLAYBOOK, RAG_ONLY, BLIND
// - Graduated Severity: CRITICAL (10), MAJOR (7), MINOR (3)
// - Industry Carve-outs with severity reduction
// - RAG Fallback Mode with similarity thresholds
// ================================================================================

const data = $('Enrich Policy').first().json;
const family = data.policySpec?.clause_family || 'OtherUnknown';
const clauseText = data.clause_text;
const policySpec = data.policySpec || {};
const playbookSpec = data.playbookSpec;
const ragContext = data.ragContext || {};

// ================================================================================
// v3.0: INDUSTRY CARVE-OUTS REGISTRY
// ================================================================================
const INDUSTRY_CARVEOUTS = {
    Entertainment: [
        { pattern: "financing sources", context: "disclosure to financing sources and completion guarantors", reduction: "MAJOR_TO_MINOR" },
        { pattern: "completion guarantors", context: "disclosure to insurers and completion guarantors", reduction: "MAJOR_TO_MINOR" },
        { pattern: "talent unavailability", context: "Including talent death, disability, or unavailability", reduction: "MAJOR_TO_MINOR" },
        { pattern: "production subsidiary", context: "Assignment to any wholly-owned production subsidiary", reduction: "MAJOR_TO_MINOR" }
    ],
    Technology: [
        { pattern: "merger or acquisition", context: "May assign without consent in connection with merger", reduction: "MAJOR_TO_MINOR" },
        { pattern: "consequential damages", context: "Neither party liable for consequential, incidental damages", reduction: "NO_FLAG", condition: "mutual" }
    ],
    Financial: [
        { pattern: "required by applicable law", context: "Disclosure required by applicable law or regulation", reduction: "NO_FLAG" },
        { pattern: "affiliate within", context: "Assignment to any affiliate within same holding company", reduction: "MAJOR_TO_MINOR" }
    ],
    RealEstate: [
        { pattern: "weather conditions", context: "Including unusually severe weather conditions", reduction: "NO_FLAG" },
        { pattern: "permit delays", context: "Delays in obtaining governmental permits", reduction: "NO_FLAG" }
    ]
};

// ================================================================================
// v3.0: DETERMINE OPERATING MODE
// ================================================================================
function determineOperatingMode(playbookSpec, ragContext) {
    const hasPlaybook = !!(playbookSpec && playbookSpec.amazon_position);
    const hasFullMatrix = !!(playbookSpec?.acceptability_matrix?.unacceptable?.patterns?.length);
    const hasRag = !!(ragContext && Object.keys(ragContext).length > 0);

    if (hasPlaybook && hasFullMatrix) return 'FULL_PLAYBOOK';
    if (hasPlaybook && !hasFullMatrix && hasRag) return 'LIMITED_PLAYBOOK';
    if (!hasPlaybook && hasRag) return 'RAG_ONLY';
    return 'BLIND';
}

// ================================================================================
// FORMATTERS
// ================================================================================
function formatGraduatedRedFlags(critical = [], major = [], minor = []) {
    let out = '';

    if (critical.length) {
        out += '\nRED FLAGS — CRITICAL (Severity: 10)\nImmediate escalation required. Cannot be mitigated.\n';
        out += critical.map(f => `  • "${f}"`).join('\n');
    }

    if (major.length) {
        out += '\n\nRED FLAGS — MAJOR (Severity: 7)\nEscalate unless mitigated by another clause provision.\n';
        out += major.map(f => `  • "${f}"`).join('\n');
    }

    if (minor.length) {
        out += '\n\nRED FLAGS — MINOR (Severity: 3)\nFlag and document, but may be approved with notes.\n';
        out += minor.map(f => `  • "${f}"`).join('\n');
    }

    return out || '  • None defined';
}

function formatIndustryCarveouts(carveouts = []) {
    if (!carveouts.length) return '  • None defined for this family';
    return carveouts.map(c =>
        `  • [${c.industry}] "${c.pattern}" → ${c.reduction}\n    Context: ${c.context}`
    ).join('\n');
}

function formatUnacceptable(patterns = []) {
    if (!Array.isArray(patterns) || !patterns.length) return '  • None defined';
    return patterns.map(p => {
        if (!p || typeof p !== 'object') return `  • ${String(p)}`;
        return [
            `  • [${p.id || 'unacc'}] ${p.pattern || ''}`,
            p.example ? `    Example: "${p.example}"` : null,
            p.reason ? `    Reason: ${p.reason}` : null,
            p.risk_level ? `    Risk: ${p.risk_level}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatPassable(vars = []) {
    if (!Array.isArray(vars) || !vars.length) return '  • None defined';
    return vars.map(v => {
        if (!v || typeof v !== 'object') return `  • ${String(v)}`;
        return [
            `  • [${v.id || 'pas'}] ${v.pattern || v.variation || ''}`,
            v.condition ? `    Condition: ${v.condition}` : null,
            v.risk_level ? `    Risk: ${v.risk_level}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatAcceptable(examples = []) {
    if (!Array.isArray(examples) || !examples.length) return '  • None defined';
    return examples.slice(0, 3).map(e => {
        if (!e || typeof e !== 'object') return `  • ${String(e)}`;
        return `  • [${e.id || 'acc'}] ${e.pattern || ''}`;
    }).join('\n');
}

function formatMustHave(anchors = []) {
    if (!Array.isArray(anchors) || !anchors.length) return '  • None defined';
    return anchors.map(a => `  • "${a}"`).join('\n');
}

function formatCoreRequirements(reqs = []) {
    if (!Array.isArray(reqs) || !reqs.length) return '  • None defined';
    return reqs.map(r => `  • ${r}`).join('\n');
}

function formatRagExamples(rag = {}) {
    const topUnacc = (rag.unacceptableExamples || rag.unacceptable || []).slice(0, 2);
    const topAcc = (rag.acceptableExamples || rag.acceptable || []).slice(0, 1);
    const topPass = (rag.passableExamples || rag.passable || []).slice(0, 1);

    let out = '';
    if (topUnacc.length) {
        out += '\n  UNACCEPTABLE examples (for grounding):\n';
        out += topUnacc.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }
    if (topAcc.length) {
        out += '\n  ACCEPTABLE examples (for grounding):\n';
        out += topAcc.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }
    if (topPass.length) {
        out += '\n  PASSABLE examples (for grounding):\n';
        out += topPass.map((e, i) => `    ${i + 1}. ${String(e.example_text || e.text || e).slice(0, 400)}...`).join('\n');
    }

    return out || '  • No RAG examples available';
}

// ================================================================================
// BUILD PROMPTS
// ================================================================================
const operatingMode = determineOperatingMode(playbookSpec, ragContext);
let paranoidSystem, valuatorSystem, TH_ANCHOR;

// Get industry carve-outs for this family
const familyCarveouts = playbookSpec?.industry_carveouts || [];
const allCarveouts = Object.values(INDUSTRY_CARVEOUTS).flat();

if (playbookSpec && playbookSpec.amazon_position) {
    const pos = playbookSpec.amazon_position || {};
    const matrix = playbookSpec.acceptability_matrix || {};
    const detection = playbookSpec.detection_patterns || {};

    // v3.0: Get graduated red flags
    const criticalFlags = playbookSpec.critical_red_flags || [];
    const majorFlags = playbookSpec.major_red_flags || detection.red_flags || [];
    const minorFlags = playbookSpec.minor_red_flags || [];

    // PARANOID SYSTEM PROMPT v3.0
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${playbookSpec.display_name}
Version: 3.0 | Family: ${playbookSpec.family_id} | Priority: ${playbookSpec.priority}
Mode: ${operatingMode}

═══════════════════════════════════════════════════════════════
SECTION 1: MISSION AND PHILOSOPHY
═══════════════════════════════════════════════════════════════

YOUR MISSION
You must identify EVERY deviation, risk, or concern with HIGH RECALL.
However, you must CLASSIFY findings by severity to enable graduated response.

OPERATING MODES
Your behavior adapts based on available reference data:
- FULL_PLAYBOOK: Complete playbook_spec available. Apply all matching rules.
- LIMITED_PLAYBOOK: Partial playbook_spec. Apply available rules + RAG fallback.
- RAG_ONLY: No playbook_spec but RAG examples exist. Rely on similarity matching.
- BLIND: No playbook_spec and no RAG examples. Flag everything, escalate all.

Current mode: ${operatingMode}

═══════════════════════════════════════════════════════════════
SECTION 2: REFERENCE DATA
═══════════════════════════════════════════════════════════════

AMAZON STANDARD POSITION
${pos.summary || 'Not defined for this family'}

CORE REQUIREMENTS
${formatCoreRequirements(pos.core_requirements)}

MUST-HAVE ANCHORS (required textual elements)
${formatMustHave(detection.must_have)}

═══════════════════════════════════════════════════════════════
SECTION 3: RED FLAGS (GRADUATED SEVERITY)
═══════════════════════════════════════════════════════════════

${formatGraduatedRedFlags(criticalFlags, majorFlags, minorFlags)}

Severity scoring:
- Total severity >= 10 → risk_level = RED
- Total severity 5-9 → risk_level = YELLOW
- Total severity < 5 → risk_level = GREEN (if no other issues)

═══════════════════════════════════════════════════════════════
SECTION 4: PATTERN MATCHING
═══════════════════════════════════════════════════════════════

UNACCEPTABLE PATTERNS (must reject if matched)
${formatUnacceptable(matrix?.unacceptable?.patterns)}

PASSABLE VARIATIONS (acceptable with legal approval)
${formatPassable(matrix?.passable?.variations)}

ACCEPTABLE EXAMPLES (fully compliant language)
${formatAcceptable(matrix?.acceptable?.examples)}

═══════════════════════════════════════════════════════════════
SECTION 5: INDUSTRY-STANDARD CARVE-OUTS
═══════════════════════════════════════════════════════════════

The following patterns are commonly accepted in specific industries.
When detected, flag as MINOR (not MAJOR/CRITICAL) and note the carve-out.

${formatIndustryCarveouts(familyCarveouts.length ? familyCarveouts : allCarveouts.slice(0, 8))}

When a clause matches an INDUSTRY-STANDARD CARVE-OUT:
1. Set industry_carveout = true in the observation
2. Reduce severity by 4 points (e.g., MAJOR → MINOR equivalent)
3. Include carve-out reference in the reason field
4. Do NOT auto-escalate solely due to the carve-out pattern

═══════════════════════════════════════════════════════════════
SECTION 6: RAG FALLBACK MODE
═══════════════════════════════════════════════════════════════

When operating in LIMITED_PLAYBOOK or RAG_ONLY mode:
- If similarity >= 0.92 with ACCEPTABLE example AND no CRITICAL flags:
  → May set risk_level = GREEN with rag_supported = true
- If similarity >= 0.85 with ACCEPTABLE example AND no CRITICAL flags:
  → Set risk_level = YELLOW with rag_supported = true
- If similarity >= 0.85 with UNACCEPTABLE example:
  → Confirm risk_level = RED, cite the historical rejection

═══════════════════════════════════════════════════════════════
SECTION 7: MATCHING RULES (DETERMINISTIC)
═══════════════════════════════════════════════════════════════

- Match is case-insensitive and whitespace-tolerant
- evidence MUST be an exact substring from clause_text
- offsets are 0-indexed character positions in clause_text
- If a must-have is missing: evidence = "[missing: <anchor>]", offsets = {start:0, end:0}

═══════════════════════════════════════════════════════════════
SECTION 8: OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this schema:

{
  "mode": "${operatingMode}",
  
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
}`;

    // VALUATOR prompt remains similar but with v3.0 context
    valuatorSystem = `VALUATOR AGENT — ${playbookSpec.display_name}
Version: 3.0 | Mode: MODE_ENUMERATED_DEVIATIONS | Priority: ${playbookSpec.priority}

YOUR MISSION
Based on Paranoid observations, determine final_status and propose changes.

RULES
1. NO NEW TEXT - proposed replacement_text MUST come from playbook standard_position
2. DETERMINISTIC MAPPING:
   - observations contains CRITICAL severity → final_status = UnacceptableDeviation
   - observations contains unmitigated MAJOR (>=2) → final_status = UnacceptableDeviation
   - observations only MINOR or IndustryCarveout → final_status = AcceptableDeviation
   - observations empty AND risk_level=GREEN → final_status = Compliant
3. RAG-SUPPORTED APPROVAL:
   - If rag_supported = true AND no CRITICAL → may approve with notes
4. ESCALATE ON UNCERTAINTY - if coverage_confidence < 0.75 → escalation_recommended = true

OUTPUT FORMAT (JSON ONLY):
{
  "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|Ambiguous",
  "escalation_recommended": false,
  "escalation_reason": null,
  "proposed_changes": [...],
  "confidence_overall": 0.0
}`;

    // v3.0: Relaxed thresholds
    const thresholds = {
        CRITICAL: { auto_pass: 0.90, with_notes: 0.80 },
        HIGH: { auto_pass: 0.88, with_notes: 0.78 },
        MEDIUM: { auto_pass: 0.85, with_notes: 0.75 },
        LOW: { auto_pass: 0.80, with_notes: 0.70 }
    };
    TH_ANCHOR = thresholds[playbookSpec.priority]?.auto_pass || 0.85;

} else {
    // RAG_ONLY or BLIND mode
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${family}
Family: ${family} | Mode: ${operatingMode}

This clause family lacks playbook specification. 
${operatingMode === 'RAG_ONLY' ? 'Using RAG examples for grounding.' : 'No grounding available - full escalation mode.'}

ANALYZE FOR:
1. Party obligations and responsibilities
2. Timelines and conditions
3. Exclusions and limitations
4. Any unusual or concerning language

OUTPUT FORMAT: Same as FULL_PLAYBOOK mode with mode="${operatingMode}"`;

    valuatorSystem = `VALUATOR AGENT — ${family}
Mode: ${operatingMode}

RULES:
1. In RAG_ONLY mode with high-similarity match to ACCEPTABLE → may approve
2. In BLIND mode → always escalate
3. No proposed_changes without standard_position

OUTPUT FORMAT:
{
  "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|Ambiguous",
  "escalation_recommended": ${operatingMode === 'BLIND'},
  "escalation_reason": "${operatingMode === 'BLIND' ? 'BLIND mode - no reference data' : null}",
  "proposed_changes": [],
  "confidence_overall": 0.0
}`;

    TH_ANCHOR = 0.85;
}

// Build User Message with RAG context
const ragBlock = `
RAG CONTEXT (for grounding only — evidence must come from clause_text):
${formatRagExamples(ragContext)}`;

const paranoidUserMessage = `CLAUSE TEXT TO ANALYZE:
---
${clauseText}
---

${ragBlock}

INSTRUCTIONS:
1. Check for ALL red flags (CRITICAL first, then MAJOR, then MINOR)
2. Check for ALL must-have anchors (report missing ones)
3. Check for industry carve-outs that may reduce severity
4. Check for unacceptable/passable patterns

Report EVERY finding with severity_class and severity_score.
RESPOND ONLY WITH JSON.`;

// Build complete messages for OpenAI
const paranoidMessages = [
    { role: 'system', content: paranoidSystem },
    { role: 'user', content: paranoidUserMessage }
];

return [{
    json: {
        ...data,
        paranoidMessages,
        paranoidSystemPrompt: paranoidSystem,
        paranoidUserPrompt: paranoidUserMessage,
        valuatorSystemPrompt: valuatorSystem,
        TH_ANCHOR: TH_ANCHOR,
        usedDynamicPrompt: !!playbookSpec,
        promptVersion: '3.0',
        operatingMode: operatingMode,
        ragInjected: !!(ragContext && Object.keys(ragContext).length)
    }
}];
