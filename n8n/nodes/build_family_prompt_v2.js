// Build Family Prompt (CG-012) - v3.0 rendering + English prompts + RAG injection
// ================================================================================
// This node builds the system/user prompts for Paranoid and Valuator agents,
// correctly rendering v3.0 acceptability_matrix objects and injecting RAG context.

const data = $('Enrich Policy').first().json;
const family = data.policySpec?.clause_family || 'OtherUnknown';
const clauseText = data.clause_text;
const policySpec = data.policySpec || {};
const playbookSpec = data.playbookSpec;
const ragContext = data.ragContext || {};

// -------------------------
// v3 Formatters
// -------------------------
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
            v.example ? `    Example: "${v.example}"` : null,
            v.reason ? `    Reason: ${v.reason}` : null,
            v.risk_level ? `    Risk: ${v.risk_level}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatAcceptable(examples = []) {
    if (!Array.isArray(examples) || !examples.length) return '  • None defined';
    return examples.slice(0, 3).map(e => {
        if (!e || typeof e !== 'object') return `  • ${String(e)}`;
        return [
            `  • [${e.id || 'acc'}] ${e.pattern || ''}`,
            e.example ? `    Example: "${e.example}"` : null,
            e.reason ? `    Reason: ${e.reason}` : null,
        ].filter(Boolean).join('\n');
    }).join('\n');
}

function formatRedFlags(flags = []) {
    if (!Array.isArray(flags) || !flags.length) return '  • None defined';
    return flags.map(f => `  • "${f}" → Severity: high, Category: MatchesUnacceptable`).join('\n');
}

function formatMustHave(anchors = []) {
    if (!Array.isArray(anchors) || !anchors.length) return '  • None defined';
    return anchors.map(a => `  • "${a}"`).join('\n');
}

function formatCoreRequirements(reqs = []) {
    if (!Array.isArray(reqs) || !reqs.length) return '  • None defined';
    return reqs.map(r => `  • ${r}`).join('\n');
}

function formatEscalationTriggers(triggers = []) {
    if (!Array.isArray(triggers) || !triggers.length) return '  • None defined';
    return triggers.map(t => `  • ${t}`).join('\n');
}

// -------------------------
// RAG Context Formatter
// -------------------------
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

// -------------------------
// Build Prompts
// -------------------------
let paranoidSystem, valuatorSystem, TH_ANCHOR;

if (playbookSpec && playbookSpec.amazon_position) {
    const pos = playbookSpec.amazon_position || {};
    const matrix = playbookSpec.acceptability_matrix || {};
    const detection = playbookSpec.detection_patterns || {};
    const risk = playbookSpec.risk_assessment || {};

    // PARANOID SYSTEM PROMPT (English, imperative, v2.0)
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${playbookSpec.display_name}
Version: 2.0 | Family: ${playbookSpec.family_id} | Priority: ${playbookSpec.priority}

YOUR MISSION
You must identify EVERY deviation, risk, or concern with HIGH RECALL.
False positives are acceptable. False negatives are NOT acceptable.

CRITICAL RULE (NO EMPTY OBSERVATIONS)
If ANY red_flag is found OR ANY unacceptable pattern is matched OR ANY must-have is missing:
- observations.length MUST be > 0
- risk_level MUST be RED or YELLOW (never GREEN)

MATCHING RULES (DETERMINISTIC)
- Match is case-insensitive and whitespace-tolerant.
- evidence MUST be an exact substring from clause_text.
- offsets are 0-indexed character positions in clause_text.
- If a must-have is missing: evidence = "[missing: <anchor>]" and offsets = {start:0,end:0}

AMAZON STANDARD POSITION
${pos.summary || 'Not defined'}

CORE REQUIREMENTS
${formatCoreRequirements(pos.core_requirements)}

MUST-HAVE ANCHORS (required elements)
${formatMustHave(detection.must_have)}

RED FLAGS (report immediately if found)
${formatRedFlags(detection.red_flags)}

UNACCEPTABLE PATTERNS (must reject if matched)
${formatUnacceptable(matrix?.unacceptable?.patterns)}

PASSABLE VARIATIONS (acceptable only with legal approval)
${formatPassable(matrix?.passable?.variations)}

ACCEPTABLE EXAMPLES (fully compliant language)
${formatAcceptable(matrix?.acceptable?.examples)}

ESCALATION TRIGGERS
${formatEscalationTriggers(risk.escalation_triggers)}

OUTPUT FORMAT (JSON ONLY)
Return exactly this structure:
{
  "observations": [
    {
      "evidence": "exact substring from clause_text OR [missing: <anchor>]",
      "offsets": { "start": 0, "end": 0 },
      "change_type": "missing|added|modified",
      "possible_category": "MatchesUnacceptable|MissingRequired|PassableVariation|UnknownChange",
      "pattern_matched": "red_flag OR pattern name",
      "confidence": 0.0,
      "severity": "high|medium|low",
      "reason": "brief explanation",
      "playbook_reference": "pattern id or null"
    }
  ],
  "summary": {
    "counts": {"total": 0, "missing": 0, "added": 0, "modified": 0},
    "coverage_confidence": 0.0,
    "red_flags_found": 0,
    "unacceptable_patterns_found": 0,
    "must_have_missing": 0
  },
  "risk_level": "RED|YELLOW|GREEN"
}`;

    // VALUATOR SYSTEM PROMPT (English, deterministic)
    valuatorSystem = `VALUATOR AGENT — ${playbookSpec.display_name}
Version: 2.0 | Mode: MODE_ENUMERATED_DEVIATIONS | Priority: ${playbookSpec.priority}

YOUR MISSION
Based on Paranoid observations, determine final_status and propose changes.

RULES
1. NO NEW TEXT - proposed replacement_text MUST come from playbook standard_position or fallback_clauses
2. SOURCE REQUIRED - every proposed_change needs source_reference with exact_text
3. DETERMINISTIC MAPPING:
   - observations contains MatchesUnacceptable → final_status = UnacceptableDeviation
   - observations contains MissingRequired → final_status = UnacceptableDeviation  
   - observations only PassableVariation → final_status = AcceptableDeviation
   - observations empty AND risk_level=GREEN → final_status = Compliant
4. ESCALATE ON UNCERTAINTY - if confidence_overall < 0.75 → escalation_recommended = true

STANDARD POSITION (use as source for replacement_text):
${pos.summary || 'Not defined'}

OUTPUT FORMAT (JSON ONLY):
{
  "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|Ambiguous",
  "escalation_recommended": false,
  "escalation_reason": null,
  "proposed_changes": [
    {
      "target_text": "exact text from clause to replace",
      "replacement_text": "text from playbook standard_position",
      "change_type": "delete|replace|insert",
      "priority": "critical|high|medium",
      "source_reference": {
        "type": "standard_position|fallback_clause",
        "exact_text": "verbatim from playbook"
      }
    }
  ],
  "confidence_overall": 0.0
}`;

    TH_ANCHOR = playbookSpec.priority === 'CRITICAL' ? 0.86 : 0.85;

} else {
    // Fallback for unknown families
    paranoidSystem = `PARANOID ANALYSIS AGENT — ${family}
Family: ${family} | Status: NOT COVERED BY PLAYBOOK

YOUR MISSION
This clause family has no playbook specification. Analyze defensively.

ANALYZE FOR:
1. Party obligations and responsibilities
2. Timelines and conditions
3. Exclusions and limitations
4. Escape clauses or penalties
5. Any unusual or concerning language

OUTPUT FORMAT:
{
  "observations": [...],
  "summary": { "counts": {...}, "coverage_confidence": 0.0 },
  "risk_level": "YELLOW",
  "possible_family": "suggested family if identifiable"
}

IMPORTANT: Since no playbook exists, default to cautious analysis.`;

    valuatorSystem = `VALUATOR AGENT — ${family}
Status: NOT COVERED BY PLAYBOOK

RULES:
- final_status = NotCoveredByPlaybook
- escalation_recommended = true
- No proposed_changes (no playbook reference available)

OUTPUT: { "final_status": "NotCoveredByPlaybook", "escalation_recommended": true, "escalation_reason": "No playbook spec for ${family}", "proposed_changes": [], "confidence_overall": 0.0 }`;

    TH_ANCHOR = 0.85;
}

// -------------------------
// Build User Message (with RAG context)
// -------------------------
const ragBlock = `
RAG CONTEXT (for grounding only — DO NOT use as evidence; evidence must come from clause_text):
${formatRagExamples(ragContext)}`;

const paranoidUserMessage = `CLAUSE TEXT TO ANALYZE:
---
${clauseText}
---

${ragBlock}

INSTRUCTIONS:
1. First, check for ALL red flags (literal matches, case-insensitive)
2. Then, check for ALL must-have anchors (report missing ones)
3. Then, check for unacceptable patterns using examples for semantic matching
4. Finally, check for passable variations

Report EVERY finding with:
- evidence: exact substring from clause_text (or [missing: X])
- offsets: character positions in clause_text
- severity: high for red_flags/unacceptable, medium for passable, low for unknown

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
        promptVersion: '2.0',
        ragInjected: !!(ragContext && Object.keys(ragContext).length)
    }
}];
