// =====================================================
// Parse Paranoid v2.1 (CG-012-FIX + CG-018 Auto-Correction)
// =====================================================
// This fix resolves:
// 1. Severity override for observations with incorrect severity
// 2. Case-insensitive matching for red flags
// 3. Deterministic risk level: RED if red flags found
// 4. CG-018: Auto-fix missing offsets
// 5. CG-018: Auto-fix inconsistent summary counts
// 6. CG-018: Auto-fix risk_level based on observations
// 7. CG-018: Auto-fix missing required fields
// =====================================================

const prev = $('Build Family Prompt').first().json || {};
const clauseText = String(prev.clause_text || '');
const playbookSpec = prev.playbookSpec || {};
const matrix = playbookSpec.acceptability_matrix || {};
const detection = playbookSpec.detection_patterns || {};

const redFlags = Array.isArray(detection.red_flags) ? detection.red_flags : [];
const mustHave = Array.isArray(detection.must_have) ? detection.must_have : [];
const unacceptablePatterns = Array.isArray(matrix?.unacceptable?.patterns)
    ? matrix.unacceptable.patterns
    : [];

// Parse LLM output
let parsed = {
    observations: [],
    summary: { counts: { total: 0, missing: 0, added: 0, modified: 0 }, coverage_confidence: 0 },
    risk_level: 'GREEN'
};
let validationErrors = [];

try {
    const raw = $json.choices?.[0]?.message?.content || '{}';
    // Clean markdown if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    parsed = JSON.parse(cleaned);
} catch (e) {
    validationErrors.push({ field: 'json_parse', error: e.message, auto_fixed: false });
}

// Ensure observations is array
if (!Array.isArray(parsed.observations)) {
    validationErrors.push({ field: 'observations', error: 'Not an array', auto_fixed: true });
    parsed.observations = [];
}

// CG-018: Auto-fix missing offsets
let offsetsFixed = 0;
parsed.observations = parsed.observations.map((obs, idx) => {
    if (!obs.offsets || typeof obs.offsets.start !== 'number' || typeof obs.offsets.end !== 'number') {
        // Try to find evidence in clause text
        if (obs.evidence && typeof obs.evidence === 'string') {
            const evidenceStr = obs.evidence.replace(/\[missing: .*?\]/, '').trim();
            const startIdx = clauseText.toLowerCase().indexOf(evidenceStr.toLowerCase());
            if (startIdx >= 0) {
                obs.offsets = { start: startIdx, end: startIdx + evidenceStr.length };
                offsetsFixed++;
            } else {
                obs.offsets = { start: 0, end: 0 };
                offsetsFixed++;
            }
        } else {
            obs.offsets = { start: 0, end: 0 };
            offsetsFixed++;
        }
    }

    // CG-018: Auto-fix missing required fields
    if (!obs.change_type) obs.change_type = 'unknown';
    if (!obs.possible_category) obs.possible_category = 'UnknownChange';
    if (typeof obs.confidence !== 'number') obs.confidence = 0.5;
    if (!obs.severity) obs.severity = 'medium';
    if (!obs.reason) obs.reason = 'Auto-detected deviation';

    return obs;
});

if (offsetsFixed > 0) {
    validationErrors.push({ field: 'offsets', error: `Fixed ${offsetsFixed} missing offsets`, auto_fixed: true });
}

// CG-018: Deterministic red flag detection
const lowerText = clauseText.toLowerCase();
let redFlagHits = [];

// Check all red flags (case-insensitive)
redFlags.forEach(flag => {
    const flagLower = String(flag).toLowerCase();
    if (lowerText.includes(flagLower)) {
        const idx = lowerText.indexOf(flagLower);
        redFlagHits.push({
            pattern: flag,
            start: idx,
            end: idx + flagLower.length
        });
    }
});

// Check unacceptable patterns
unacceptablePatterns.forEach(pattern => {
    if (pattern && pattern.pattern) {
        const patLower = String(pattern.pattern).toLowerCase();
        if (lowerText.includes(patLower)) {
            const idx = lowerText.indexOf(patLower);
            redFlagHits.push({
                pattern: pattern.pattern,
                pattern_id: pattern.id,
                start: idx,
                end: idx + patLower.length
            });
        }
    }
});

// Add detected red flags as observations if not already present
redFlagHits.forEach(hit => {
    const alreadyReported = parsed.observations.some(obs =>
        obs.pattern_matched === hit.pattern ||
        (obs.offsets && Math.abs(obs.offsets.start - hit.start) < 10)
    );

    if (!alreadyReported) {
        parsed.observations.push({
            evidence: clauseText.slice(hit.start, hit.end),
            offsets: { start: hit.start, end: hit.end },
            change_type: 'added',
            possible_category: 'MatchesUnacceptable',
            pattern_matched: hit.pattern,
            confidence: 0.95,
            severity: 'high',
            reason: `Deterministic red flag match: "${hit.pattern}"`,
            playbook_reference: hit.pattern_id || null,
            auto_detected: true
        });
    }
});

// Check must-have anchors
mustHave.forEach(anchor => {
    const anchorLower = String(anchor).toLowerCase();
    if (!lowerText.includes(anchorLower)) {
        // Check if already reported as missing
        const alreadyReported = parsed.observations.some(obs =>
            obs.evidence && obs.evidence.includes('[missing:') &&
            obs.evidence.toLowerCase().includes(anchorLower)
        );

        if (!alreadyReported) {
            parsed.observations.push({
                evidence: `[missing: ${anchor}]`,
                offsets: { start: 0, end: 0 },
                change_type: 'missing',
                possible_category: 'MissingRequired',
                pattern_matched: anchor,
                confidence: 1.0,
                severity: 'high',
                reason: `Required element missing: "${anchor}"`,
                playbook_reference: null,
                auto_detected: true
            });
        }
    }
});

// Override severity for red_flag and unacceptable matches
parsed.observations = parsed.observations.map(obs => {
    if (obs.possible_category === 'MatchesUnacceptable' ||
        obs.possible_category === 'MissingRequired' ||
        redFlagHits.some(h => h.pattern === obs.pattern_matched)) {
        obs.severity = 'high';
    }
    return obs;
});

// CG-018: Auto-fix summary counts
const actualCounts = {
    total: parsed.observations.length,
    missing: parsed.observations.filter(o => o.change_type === 'missing').length,
    added: parsed.observations.filter(o => o.change_type === 'added').length,
    modified: parsed.observations.filter(o => o.change_type === 'modified').length
};

if (!parsed.summary || typeof parsed.summary !== 'object') {
    parsed.summary = {};
}

const summaryMismatch =
    parsed.summary.counts?.total !== actualCounts.total ||
    parsed.summary.counts?.missing !== actualCounts.missing;

if (summaryMismatch) {
    validationErrors.push({
        field: 'summary.counts',
        error: `Mismatch: LLM said ${parsed.summary.counts?.total || 0}, actual ${actualCounts.total}`,
        auto_fixed: true
    });
    parsed.summary.counts = actualCounts;
}

// CG-018: Auto-fix risk_level based on observations
const hasHighSeverity = parsed.observations.some(o => o.severity === 'high');
const hasUnacceptable = parsed.observations.some(o =>
    o.possible_category === 'MatchesUnacceptable' ||
    o.possible_category === 'MissingRequired'
);
const hasMediumSeverity = parsed.observations.some(o => o.severity === 'medium');

let determinedRiskLevel;
if (hasHighSeverity || hasUnacceptable || redFlagHits.length > 0) {
    determinedRiskLevel = 'RED';
} else if (hasMediumSeverity) {
    determinedRiskLevel = 'YELLOW';
} else if (parsed.observations.length === 0) {
    determinedRiskLevel = 'GREEN';
} else {
    determinedRiskLevel = 'YELLOW';
}

if (parsed.risk_level !== determinedRiskLevel) {
    validationErrors.push({
        field: 'risk_level',
        error: `LLM said ${parsed.risk_level}, corrected to ${determinedRiskLevel}`,
        auto_fixed: true
    });
    parsed.risk_level = determinedRiskLevel;
}

// Add auto-detection metadata
parsed.summary.red_flags_found = redFlagHits.length;
parsed.summary.unacceptable_patterns_found = parsed.observations.filter(o =>
    o.possible_category === 'MatchesUnacceptable'
).length;
parsed.summary.must_have_missing = parsed.observations.filter(o =>
    o.possible_category === 'MissingRequired'
).length;
parsed.summary.auto_detected_count = parsed.observations.filter(o => o.auto_detected).length;

// Build output
return [{
    json: {
        ...prev,
        paranoidOutput: parsed,
        paranoidValidationErrors: validationErrors,
        _redFlagHits: redFlagHits,
        _autoCorrections: {
            offsetsFixed,
            summaryFixed: summaryMismatch,
            riskLevelFixed: parsed.risk_level !== determinedRiskLevel,
            totalErrors: validationErrors.length,
            allAutoFixed: validationErrors.every(e => e.auto_fixed)
        }
    }
}];
