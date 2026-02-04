"use strict";
/**
 * Leakage Guard - Pre-export Validator (V5)
 *
 * Scans client-facing fields for prohibited terms that would
 * expose internal policies, rule names, or sensitive information.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLeakage = checkLeakage;
exports.sanitizeText = sanitizeText;
exports.validateForExport = validateForExport;
// Default blocklist - should be loaded from database in production
const DEFAULT_BLOCKLIST = [
    // Rule/Policy identifiers
    'playbook',
    'rule_id',
    'rule_name',
    'rulename',
    'policyspec',
    'policy_spec',
    // Internal classifications
    'aceptable',
    'acceptable',
    'inaceptable',
    'unacceptable',
    'not covered',
    'notcovered',
    'ambiguous',
    'deviation',
    // Internal team names
    'amazonlegal',
    'amazon legal',
    'seniorcounsel',
    'senior counsel',
    'policyowner',
    'policy owner',
    'escalation',
    'escalate',
    // Technical terms
    'threshold',
    'confidence',
    'anchor_conf',
    'coverage_threshold',
    'analysis_mode',
    'routing_policy',
    'block_export',
    // Guidance markers
    'guidance',
    'internal note',
    'internal_note',
    'with legal approval',
    'with amazon legal',
    'give:',
    'possible give',
    // Version/ID patterns
    'pb:v',
    'psv-',
    'dsa_amazon:',
    // Spanish equivalents
    'incumplimiento material no subsanado',
    'según política interna',
    'conforme al playbook',
    'regla interna'
];
// Patterns that indicate policy leakage (regex)
const LEAK_PATTERNS = [
    /\brule[_-]?id\b/i,
    /\bpb:\w+/i,
    /\bpsv-\d+/i,
    /\bth[_-]?(anchor|conf)/i,
    /\b(mode_strict|mode_enumerated|mode_policy)/i,
    /\b(auto_pass|auto_redline|escalate_human|block_export)\b/i,
    /\bconfidence[_-]?(overall|anchor)?\s*[=:]\s*[\d.]+/i,
    /\b(acceptable|unacceptable)[_-]?deviation\b/i,
    /\brouting[_-]?policy/i
];
/**
 * Normalize text for comparison
 */
function normalizeForSearch(text) {
    return text
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Check if text contains blocked terms
 */
function findBlockedTerms(text, blocklist) {
    const normalized = normalizeForSearch(text);
    return blocklist.filter(term => normalized.includes(normalizeForSearch(term)));
}
/**
 * Check for pattern-based leaks
 */
function findPatternLeaks(text) {
    return LEAK_PATTERNS
        .filter(pattern => pattern.test(text))
        .map(pattern => pattern.source);
}
/**
 * Calculate leak score based on findings
 */
function calculateLeakScore(blockedTerms, patternMatches) {
    const termWeight = 0.15;
    const patternWeight = 0.25;
    const termScore = Math.min(1, blockedTerms.length * termWeight);
    const patternScore = Math.min(1, patternMatches.length * patternWeight);
    return Math.min(1, termScore + patternScore);
}
/**
 * Generate recommendations for fixing leaks
 */
function generateRecommendations(blockedTerms, patternMatches) {
    const recommendations = [];
    if (blockedTerms.length > 0) {
        recommendations.push(`Remove or replace blocked terms: ${blockedTerms.slice(0, 3).join(', ')}`);
    }
    if (patternMatches.length > 0) {
        recommendations.push('Remove technical identifiers (rule IDs, thresholds, modes)');
    }
    if (blockedTerms.some(t => t.includes('accept') || t.includes('deviation'))) {
        recommendations.push('Use neutral language: "alinear con términos estándar", "clarificar", "asegurar consistencia"');
    }
    if (blockedTerms.some(t => t.includes('legal') || t.includes('counsel'))) {
        recommendations.push('Remove internal team references');
    }
    return recommendations;
}
/**
 * Main leakage check function
 */
function checkLeakage(clientComment, clientSummaryLine, customBlocklist) {
    const blocklist = customBlocklist || DEFAULT_BLOCKLIST;
    const combinedText = `${clientComment} ${clientSummaryLine}`;
    const blockedTerms = findBlockedTerms(combinedText, blocklist);
    const patternMatches = findPatternLeaks(combinedText);
    const allFlags = [...new Set([...blockedTerms, ...patternMatches.map(p => `pattern:${p}`)])];
    const leakScore = calculateLeakScore(blockedTerms, patternMatches);
    const recommendations = generateRecommendations(blockedTerms, patternMatches);
    return {
        pass: blockedTerms.length === 0 && patternMatches.length === 0,
        blocked_terms_detected: blockedTerms,
        leak_score: Math.round(leakScore * 100) / 100,
        policy_leak_flags: allFlags,
        recommendations
    };
}
/**
 * Sanitize text by replacing blocked terms with neutral alternatives
 */
function sanitizeText(text, blocklist) {
    const terms = blocklist || DEFAULT_BLOCKLIST;
    const redactions = [];
    let sanitized = text;
    // Neutral replacements
    const neutralReplacements = {
        'acceptable': 'alineado',
        'unacceptable': 'requiere ajuste',
        'deviation': 'variación',
        'playbook': 'política',
        'escalate': 'revisar',
        'escalation': 'revisión',
        'guidance': 'orientación',
        'threshold': 'criterio',
        'confidence': 'certeza'
    };
    for (const term of terms) {
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(sanitized)) {
            const replacement = neutralReplacements[term.toLowerCase()] || '[redacted]';
            sanitized = sanitized.replace(regex, replacement);
            redactions.push({ from: term, to: replacement });
        }
    }
    return { sanitized, redactions };
}
/**
 * Full pre-export validation
 */
function validateForExport(sanitizerOutput, blocklist) {
    const check = checkLeakage(sanitizerOutput.client_comment, sanitizerOutput.client_summary_line, blocklist);
    let action;
    if (check.pass) {
        action = 'PASS';
    }
    else if (check.leak_score < 0.5) {
        action = 'SANITIZE';
    }
    else {
        action = 'BLOCK_ESCALATE';
    }
    return {
        approved: check.pass,
        leakage_check: check,
        action
    };
}
//# sourceMappingURL=leakage_guard.js.map