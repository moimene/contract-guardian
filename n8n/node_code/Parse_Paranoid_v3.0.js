// ================================================================================
// Parse Paranoid v3.0 (Output Parser for Paranoid Agent v3.0)
// ================================================================================
// Handles the new v3.0 output format with graduated severity and RAG matches
// ================================================================================

const prev = $('Build Family Prompt').first().json || {};
const clauseText = String(prev.clause_text || '');
const playbookSpec = prev.playbookSpec || {};
const operatingMode = prev.operatingMode || 'BLIND';

const detection = playbookSpec.detection_patterns || {};

// v3.0: Get graduated red flags from playbook_spec
const criticalFlags = playbookSpec.critical_red_flags || [];
const majorFlags = playbookSpec.major_red_flags || detection.red_flags || [];
const minorFlags = playbookSpec.minor_red_flags || [];

// ─────────────────────────────────────────────────────────────
// PARSE LLM OUTPUT
// ─────────────────────────────────────────────────────────────
let parsed = {
    mode: operatingMode,
    observations: [],
    rag_matches: [],
    summary: {
        counts: { total: 0, critical: 0, major: 0, minor: 0, missing: 0, added: 0, modified: 0 },
        total_severity_score: 0,
        coverage_confidence: 0,
        red_flags_found: 0,
        unacceptable_patterns_found: 0,
        must_have_missing: 0,
        industry_carveouts_applied: 0,
        rag_supported: false,
        highest_rag_similarity: 0
    },
    risk_level: 'GREEN',
    risk_level_reasoning: ''
};

let validationErrors = [];

try {
    const raw = $json.choices?.[0]?.message?.content || '{}';
    // Clean markdown code blocks if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    parsed = { ...parsed, ...JSON.parse(cleaned) };
} catch (e) {
    validationErrors.push({
        field: 'json_parse',
        error: e.message,
        auto_fixed: false
    });
}

// ─────────────────────────────────────────────────────────────
// ENSURE ARRAYS EXIST
// ─────────────────────────────────────────────────────────────
if (!Array.isArray(parsed.observations)) {
    parsed.observations = [];
    validationErrors.push({ field: 'observations', error: 'Not an array', auto_fixed: true });
}

if (!Array.isArray(parsed.rag_matches)) {
    parsed.rag_matches = [];
}

// ─────────────────────────────────────────────────────────────
// AUTO-FIX: Missing offsets
// ─────────────────────────────────────────────────────────────
const lowerText = clauseText.toLowerCase();
let offsetsFixed = 0;

parsed.observations = parsed.observations.map((obs, idx) => {
    // Ensure required fields exist
    if (!obs.severity_class) {
        obs.severity_class = 'MAJOR'; // Default conservative
    }
    if (obs.severity_score === undefined) {
        obs.severity_score = obs.severity_class === 'CRITICAL' ? 10 :
            obs.severity_class === 'MAJOR' ? 7 : 3;
    }

    // Fix missing or invalid offsets
    if (!obs.offsets || typeof obs.offsets.start !== 'number') {
        const evidence = String(obs.evidence || '').toLowerCase();
        if (evidence && !evidence.startsWith('[missing:')) {
            const startIdx = lowerText.indexOf(evidence);
            if (startIdx >= 0) {
                obs.offsets = { start: startIdx, end: startIdx + evidence.length };
                offsetsFixed++;
            } else {
                obs.offsets = { start: 0, end: 0 };
            }
        } else {
            obs.offsets = { start: 0, end: 0 };
        }
    }

    return obs;
});

if (offsetsFixed > 0) {
    validationErrors.push({
        field: 'offsets',
        error: `${offsetsFixed} observations had missing offsets`,
        auto_fixed: true
    });
}

// ─────────────────────────────────────────────────────────────
// DETERMINISTIC RED FLAG DETECTION (backup)
// ─────────────────────────────────────────────────────────────
let redFlagHits = [];

// Check CRITICAL flags
criticalFlags.forEach(flag => {
    const flagLower = String(flag).toLowerCase();
    const idx = lowerText.indexOf(flagLower);
    if (idx >= 0) {
        redFlagHits.push({
            pattern: flag,
            severity_class: 'CRITICAL',
            severity_score: 10,
            idx: idx,
            len: flagLower.length
        });
    }
});

// Check MAJOR flags
majorFlags.forEach(flag => {
    const flagLower = String(flag).toLowerCase();
    const idx = lowerText.indexOf(flagLower);
    if (idx >= 0) {
        redFlagHits.push({
            pattern: flag,
            severity_class: 'MAJOR',
            severity_score: 7,
            idx: idx,
            len: flagLower.length
        });
    }
});

// Check MINOR flags
minorFlags.forEach(flag => {
    const flagLower = String(flag).toLowerCase();
    const idx = lowerText.indexOf(flagLower);
    if (idx >= 0) {
        redFlagHits.push({
            pattern: flag,
            severity_class: 'MINOR',
            severity_score: 3,
            idx: idx,
            len: flagLower.length
        });
    }
});

// Add detected red flags as observations if not already present
redFlagHits.forEach(hit => {
    const alreadyReported = parsed.observations.some(obs => {
        if (!obs.offsets) return false;
        // Check overlap
        return (obs.offsets.start <= hit.idx && obs.offsets.end > hit.idx) ||
            (hit.idx <= obs.offsets.start && hit.idx + hit.len > obs.offsets.start);
    });

    if (!alreadyReported) {
        parsed.observations.push({
            evidence: clauseText.substring(hit.idx, hit.idx + hit.len),
            offsets: { start: hit.idx, end: hit.idx + hit.len },
            change_type: 'added',
            possible_category: 'MatchesRedFlag',
            pattern_matched: hit.pattern,
            severity_class: hit.severity_class,
            severity_score: hit.severity_score,
            industry_carveout: false,
            carveout_reference: null,
            mitigated_by: null,
            confidence: 0.95,
            reason: `Deterministic red flag detection: "${hit.pattern}"`,
            playbook_reference: null
        });

        validationErrors.push({
            field: 'red_flag_injection',
            error: `Added missed ${hit.severity_class} red flag: "${hit.pattern}"`,
            auto_fixed: true
        });
    }
});

// ─────────────────────────────────────────────────────────────
// CHECK MUST-HAVE ANCHORS
// ─────────────────────────────────────────────────────────────
const mustHave = Array.isArray(detection.must_have) ? detection.must_have : [];

mustHave.forEach(anchor => {
    const anchorLower = String(anchor).toLowerCase();
    const found = lowerText.includes(anchorLower);

    if (!found) {
        // Check if already reported
        const alreadyReported = parsed.observations.some(obs =>
            obs.evidence && obs.evidence.toLowerCase().includes(`[missing: ${anchor.toLowerCase()}]`)
        );

        if (!alreadyReported) {
            parsed.observations.push({
                evidence: `[missing: ${anchor}]`,
                offsets: { start: 0, end: 0 },
                change_type: 'missing',
                possible_category: 'MissingRequired',
                pattern_matched: anchor,
                severity_class: 'MAJOR',
                severity_score: 7,
                industry_carveout: false,
                carveout_reference: null,
                mitigated_by: null,
                confidence: 1.0,
                reason: `Required anchor "${anchor}" not found in clause text`,
                playbook_reference: null
            });
        }
    }
});

// ─────────────────────────────────────────────────────────────
// RECALCULATE SUMMARY
// ─────────────────────────────────────────────────────────────
const counts = {
    total: parsed.observations.length,
    critical: parsed.observations.filter(o => o.severity_class === 'CRITICAL').length,
    major: parsed.observations.filter(o => o.severity_class === 'MAJOR').length,
    minor: parsed.observations.filter(o => o.severity_class === 'MINOR').length,
    missing: parsed.observations.filter(o => o.change_type === 'missing').length,
    added: parsed.observations.filter(o => o.change_type === 'added').length,
    modified: parsed.observations.filter(o => o.change_type === 'modified').length
};

const totalSeverityScore = parsed.observations.reduce(
    (sum, obs) => sum + (obs.severity_score || 0),
    0
);

const industryCarveoutsApplied = parsed.observations.filter(
    o => o.industry_carveout
).length;

const highestRagSimilarity = parsed.rag_matches.length > 0
    ? Math.max(...parsed.rag_matches.map(m => m.similarity || 0))
    : 0;

parsed.summary = {
    counts,
    total_severity_score: totalSeverityScore,
    coverage_confidence: parsed.summary.coverage_confidence ||
        (parsed.observations.length > 0 ? 0.8 : 0.9),
    red_flags_found: counts.critical + counts.major,
    unacceptable_patterns_found: parsed.observations.filter(
        o => o.possible_category === 'MatchesUnacceptable'
    ).length,
    must_have_missing: counts.missing,
    industry_carveouts_applied: industryCarveoutsApplied,
    rag_supported: highestRagSimilarity >= 0.85,
    highest_rag_similarity: highestRagSimilarity
};

// ─────────────────────────────────────────────────────────────
// DETERMINE RISK LEVEL (deterministic override)
// ─────────────────────────────────────────────────────────────
let calculatedRiskLevel = 'GREEN';
let riskReasoning = '';

if (counts.critical > 0) {
    calculatedRiskLevel = 'RED';
    riskReasoning = `${counts.critical} CRITICAL severity issue(s) detected`;
} else if (totalSeverityScore >= 10) {
    calculatedRiskLevel = 'RED';
    riskReasoning = `Total severity score ${totalSeverityScore} >= 10 threshold`;
} else if (totalSeverityScore >= 5 || counts.major > 0) {
    calculatedRiskLevel = 'YELLOW';
    riskReasoning = `Severity score ${totalSeverityScore} or ${counts.major} MAJOR issue(s)`;
} else if (counts.minor > 0) {
    calculatedRiskLevel = 'GREEN';
    riskReasoning = `Only ${counts.minor} MINOR issue(s), no MAJOR/CRITICAL`;
} else {
    calculatedRiskLevel = 'GREEN';
    riskReasoning = 'No issues detected';
}

// Override if LLM's assessment is more severe
if (parsed.risk_level === 'RED' && calculatedRiskLevel !== 'RED') {
    // Trust LLM if it's more cautious, but log it
    validationErrors.push({
        field: 'risk_level',
        error: `LLM reported RED but calculation shows ${calculatedRiskLevel}`,
        auto_fixed: false
    });
} else {
    parsed.risk_level = calculatedRiskLevel;
    parsed.risk_level_reasoning = riskReasoning;
}

// ─────────────────────────────────────────────────────────────
// BUILD OUTPUT
// ─────────────────────────────────────────────────────────────
return [{
    json: {
        ...prev,
        paranoidOutput: parsed,
        validationErrors: validationErrors,
        parseVersion: '3.0',
        // Summary for logging
        _parseSummary: {
            observations_count: parsed.observations.length,
            critical_count: counts.critical,
            major_count: counts.major,
            minor_count: counts.minor,
            total_severity: totalSeverityScore,
            risk_level: parsed.risk_level,
            rag_supported: parsed.summary.rag_supported,
            auto_fixes_applied: validationErrors.filter(e => e.auto_fixed).length,
            mode: operatingMode
        }
    }
}];
