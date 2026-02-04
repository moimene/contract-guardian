// =====================================================
// Parse Paranoid (CG-012-FIX) - Deterministic Red Flag Detection
// =====================================================
// COPIA ESTE CÓDIGO EN EL NODO "Parse Paranoid" DE n8n
// Este fix resuelve:
// 1. Severity override para observaciones del LLM con severidad incorrecta
// 2. Matching case-insensitive para red flags
// 3. Risk level determinístico: RED si hay red flags
// =====================================================

const prev = $('Build Family Prompt').first().json || {};
const clauseText = String(prev.clause_text || '');
const playbookSpec = prev.playbookSpec || {};
const matrix = playbookSpec.acceptability_matrix || {};
const detection = playbookSpec.detection_patterns || {};

const redFlags = Array.isArray(detection.red_flags) ? detection.red_flags : [];
const mustHave = Array.isArray(detection.must_have) ? detection.must_have : [];
const unacceptablePatterns = Array.isArray(matrix?.unacceptable?.patterns) ? matrix.unacceptable.patterns : [];

const raw = $json?.choices?.[0]?.message?.content || '{}';

// -------------------------
// Helpers
// -------------------------
function safeJsonParse(str) {
    try { return JSON.parse(str); } catch { return null; }
}

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeWsRegex(phrase) {
    const tokens = String(phrase).trim().split(/\s+/).filter(Boolean).map(escapeRegex);
    if (!tokens.length) return null;
    return new RegExp(tokens.join('\\s+'), 'gi');
}

function findAllOccurrences(text, phrase) {
    const rx = makeWsRegex(phrase);
    if (!rx) return [];
    const out = [];
    let m;
    while ((m = rx.exec(text)) !== null) {
        const start = m.index;
        const end = m.index + m[0].length;
        out.push({ evidence: text.slice(start, end), offsets: { start, end } });
        if (m[0].length === 0) rx.lastIndex++;
    }
    return out;
}

function bestEvidenceFromExample(text, example) {
    const words = String(example).match(/[A-Za-z0-9']+/g) || [];
    for (let n = Math.min(8, words.length); n >= 3; n--) {
        for (let i = 0; i + n <= words.length; i++) {
            const needle = words.slice(i, i + n).join(' ');
            const hits = findAllOccurrences(text, needle);
            if (hits.length) {
                return { ...hits[0], needle };
            }
        }
    }
    return null;
}

function toSeverity(riskLevel) {
    const v = String(riskLevel || '').toUpperCase();
    if (v === 'CRITICAL' || v === 'HIGH') return 'high';
    if (v === 'MEDIUM') return 'medium';
    return 'low';
}

function defaultOutput() {
    return {
        observations: [],
        summary: {
            counts: { total: 0, missing: 0, added: 0, modified: 0 },
            coverage_confidence: 0,
            red_flags_found: 0,
            unacceptable_patterns_found: 0,
            must_have_missing: 0
        },
        risk_level: 'GREEN'
    };
}

function normalizeParanoid(parsed) {
    const out = defaultOutput();
    if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.observations)) out.observations = parsed.observations;
        if (parsed.summary && typeof parsed.summary === 'object') out.summary = { ...out.summary, ...parsed.summary };
        if (typeof parsed.risk_level === 'string') out.risk_level = parsed.risk_level;
    }
    if (!Array.isArray(out.observations)) out.observations = [];
    if (!out.summary || typeof out.summary !== 'object') out.summary = defaultOutput().summary;
    if (!out.summary.counts || typeof out.summary.counts !== 'object') out.summary.counts = defaultOutput().summary.counts;
    if (typeof out.risk_level !== 'string') out.risk_level = 'GREEN';
    return out;
}

// =====================================================
// CG-012-FIX: Helper para matching case-insensitive de red flags
// =====================================================
function matchesRedFlag(text, redFlags) {
    const textLower = String(text || '').toLowerCase();
    for (const rf of redFlags) {
        const rfLower = String(rf).toLowerCase();
        if (textLower.includes(rfLower) || rfLower.includes(textLower.substring(0, 20))) {
            return rf;
        }
    }
    return null;
}

// -------------------------
// 1) Parse LLM JSON
// -------------------------
const parsed = safeJsonParse(raw);
let paranoidOutput = normalizeParanoid(parsed);

// =====================================================
// CG-012-FIX: SEVERITY OVERRIDE FOR LLM OBSERVATIONS
// =====================================================
// If LLM returned observations but assigned wrong severity to red flags,
// FORCE severity=high and possible_category=MatchesUnacceptable
let severityOverrideCount = 0;
for (const obs of paranoidOutput.observations) {
    const evidenceLower = String(obs.evidence || '').toLowerCase();

    const matchedFlag = matchesRedFlag(obs.evidence, redFlags);

    if (matchedFlag) {
        if (obs.severity !== 'high') {
            obs.severity = 'high';
            severityOverrideCount++;
        }
        if (obs.possible_category !== 'MatchesUnacceptable') {
            obs.possible_category = 'MatchesUnacceptable';
        }
        obs.pattern_matched = matchedFlag;
        obs.confidence = Math.max(obs.confidence || 0.7, 0.95);
        obs.reason = obs.reason ? obs.reason + ` [GUARDRAIL: Red flag '${matchedFlag}' detected]` : `GUARDRAIL: Red flag '${matchedFlag}' detected`;
    }
}

// -------------------------
// 2) Deterministic findings (guardrail)
// -------------------------
const injected = [];

// 2.1 Red flags
for (const flag of redFlags) {
    const hits = findAllOccurrences(clauseText, flag);
    for (const h of hits) {
        injected.push({
            evidence: h.evidence,
            offsets: h.offsets,
            change_type: 'modified',
            possible_category: 'MatchesUnacceptable',
            pattern_matched: String(flag),
            confidence: 0.95,
            severity: 'high',
            reason: `Red flag found: "${flag}"`,
            playbook_reference: null
        });
    }
}

// 2.2 Must-have
for (const anchor of mustHave) {
    const hits = findAllOccurrences(clauseText, anchor);
    if (!hits.length) {
        injected.push({
            evidence: `[missing: ${anchor}]`,
            offsets: { start: 0, end: 0 },
            change_type: 'missing',
            possible_category: 'MissingRequired',
            pattern_matched: String(anchor),
            confidence: 0.95,
            severity: 'high',
            reason: `Missing required must-have element: "${anchor}"`,
            playbook_reference: null
        });
    }
}

// 2.3 Unacceptable patterns
for (const p of unacceptablePatterns) {
    const pat = (p && typeof p === 'object') ? p : { pattern: String(p) };
    const patternName = String(pat.pattern || '').trim();
    const example = String(pat.example || '').trim();
    const isShort = patternName.length > 0 && patternName.length <= 40;

    let hits = [];
    let matchedBy = null;

    if (isShort && patternName) {
        hits = findAllOccurrences(clauseText, patternName);
        if (hits.length) matchedBy = patternName;
    }

    if (!hits.length && example) {
        hits = findAllOccurrences(clauseText, example);
        if (hits.length) matchedBy = example;
    }

    if (!hits.length && example) {
        const best = bestEvidenceFromExample(clauseText, example);
        if (best) {
            hits = [{ evidence: best.evidence, offsets: best.offsets }];
            matchedBy = best.needle || example;
        }
    }

    for (const h of hits) {
        injected.push({
            evidence: h.evidence,
            offsets: h.offsets,
            change_type: 'modified',
            possible_category: 'MatchesUnacceptable',
            pattern_matched: patternName || matchedBy || 'UnacceptablePattern',
            confidence: 0.90,
            severity: toSeverity(pat.risk_level),
            reason: pat.reason || `Matches unacceptable pattern: ${patternName || matchedBy}`,
            playbook_reference: pat.id || null
        });
    }
}

// -------------------------
// 3) Merge strategy
// -------------------------
function obsKey(o) {
    const start = o?.offsets?.start ?? -1;
    const end = o?.offsets?.end ?? -1;
    const pat = String(o?.pattern_matched ?? '');
    const ev = String(o?.evidence ?? '');
    return `${start}:${end}:${pat}:${ev}`;
}

if (paranoidOutput.observations.length === 0 && injected.length > 0) {
    paranoidOutput.observations = injected;
} else if (injected.length > 0) {
    const existing = new Set(paranoidOutput.observations.map(obsKey));
    for (const inj of injected) {
        const k = obsKey(inj);
        if (!existing.has(k)) paranoidOutput.observations.push(inj);
    }
}

// -------------------------
// 4) Recompute summary + risk_level deterministically
// -------------------------
const obs = paranoidOutput.observations;

const counts = {
    total: obs.length,
    missing: obs.filter(o => o.change_type === 'missing').length,
    added: obs.filter(o => o.change_type === 'added').length,
    modified: obs.filter(o => o.change_type === 'modified').length
};

// =====================================================
// CG-012-FIX: Count red flags using case-insensitive partial matching
// =====================================================
const redFlagsFound = obs.filter(o => {
    const patLower = String(o.pattern_matched || '').toLowerCase();
    return redFlags.some(rf => patLower.includes(rf.toLowerCase()) || rf.toLowerCase().includes(patLower));
}).length;

const mustHaveMissing = obs.filter(o => o.possible_category === 'MissingRequired').length;
const unacceptableFound = obs.filter(o => o.possible_category === 'MatchesUnacceptable').length;

// =====================================================
// CG-012-FIX: DETERMINISTIC RISK LEVEL
// =====================================================
let risk = 'GREEN';
if (redFlagsFound > 0 || unacceptableFound > 0 || mustHaveMissing > 0) {
    risk = 'RED';
} else if (obs.some(o => o.severity === 'high')) {
    risk = 'RED';
} else if (obs.some(o => o.severity === 'medium')) {
    risk = 'YELLOW';
}

paranoidOutput.summary = {
    ...paranoidOutput.summary,
    counts,
    red_flags_found: redFlagsFound,
    unacceptable_patterns_found: unacceptableFound,
    must_have_missing: mustHaveMissing,
    coverage_confidence: paranoidOutput.summary?.coverage_confidence ?? 0
};
paranoidOutput.risk_level = risk;

const guardrailTriggered = injected.length > 0 || severityOverrideCount > 0;

// -------------------------
// 5) Return merged data
// -------------------------
return [{
    json: {
        ...prev,
        paranoidOutput,
        paranoidRaw: raw,
        paranoid_guardrail_triggered: guardrailTriggered,
        paranoid_guardrail_injected_count: injected.length,
        paranoid_severity_overrides: severityOverrideCount
    }
}];
