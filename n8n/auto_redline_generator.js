// CG-010: Auto-Redline Generator v1 (Suggest-Only)
// PO-mandated: CRITICAL families only, source_reference required

const CRITICAL_FAMILIES = [
    'IndemnityProdCo',
    'IndemnityAmazon',
    'IndemnityProcedures',
    'LiabilityLimitation',
    'TerminationRights',
    'TerminationConsequences',
    'RightsGrant',
    'RightsReversion',
    'AuditRights'
];

const TH_ANCHOR = 0.75; // Minimum anchor confidence threshold

/**
 * Generate redline suggestions for a clause
 * @param {Object} input - Clause data with valuator output
 * @returns {Array} - suggestions array
 */
function generateSuggestions(input) {
    const {
        clause_text,
        family,
        valuator_status,
        paranoid_observations,
        policy_spec
    } = input;

    // Only CRITICAL families get suggestions in v1
    if (!CRITICAL_FAMILIES.includes(family)) {
        return [];
    }

    const suggestions = [];

    // Logic by Valuator status
    switch (valuator_status) {
        case 'Compliant':
            // No suggestions needed
            return [];

        case 'AcceptableDeviation':
            // Optional suggestions (requires_review = false)
            if (policy_spec?.acceptable_variations?.length > 0) {
                const suggestion = buildSuggestion({
                    clause_text,
                    policy_spec,
                    requires_review: false,
                    rationale: 'Optional alignment with standard position'
                });
                if (suggestion) suggestions.push(suggestion);
            }
            break;

        case 'UnacceptableDeviation':
            // Mandatory suggestions (requires_review = true)
            const suggestion = buildSuggestion({
                clause_text,
                policy_spec,
                requires_review: true,
                rationale: 'Clause deviates from acceptable range - review required'
            });
            if (suggestion) suggestions.push(suggestion);
            break;

        case 'NotCoveredByPlaybook':
            // Comment only, no suggestions
            return [];

        default:
            return [];
    }

    return suggestions;
}

/**
 * Build a single suggestion with anchor detection
 */
function buildSuggestion({ clause_text, policy_spec, requires_review, rationale }) {
    if (!policy_spec?.standard_position) {
        return null;
    }

    // Find anchor in clause text
    const anchor = findAnchor(clause_text, policy_spec.unacceptable_patterns || []);

    if (!anchor || anchor.confidence < TH_ANCHOR) {
        // Cannot anchor reliably - skip suggestion
        return null;
    }

    return {
        op_type: 'REPLACE',
        anchor: {
            quote: anchor.text,
            offsets: { start: anchor.start, end: anchor.end },
            anchor_confidence: anchor.confidence
        },
        replacement_text: policy_spec.standard_position,
        source_reference: {
            source_type: 'STANDARD_POSITION',
            exact_text: policy_spec.standard_position
        },
        rationale,
        requires_review
    };
}

/**
 * Find anchor text in clause based on unacceptable patterns
 */
function findAnchor(clause_text, unacceptable_patterns) {
    const lowerClause = clause_text.toLowerCase();

    for (const pattern of unacceptable_patterns) {
        // Simple pattern matching - can be enhanced with regex
        const patternText = pattern.pattern || '';
        const lowerPattern = patternText.toLowerCase();

        const startIdx = lowerClause.indexOf(lowerPattern);
        if (startIdx !== -1) {
            const endIdx = startIdx + patternText.length;
            // Extract actual text with original casing
            const matchedText = clause_text.substring(startIdx, endIdx);

            return {
                text: matchedText,
                start: startIdx,
                end: endIdx,
                confidence: 0.85 // Pattern match confidence
            };
        }
    }

    // Fallback: no anchor found
    return null;
}

/**
 * Validate suggestion meets no-new-text rule
 */
function validateNoLeakage(suggestion) {
    if (!suggestion.source_reference?.exact_text) {
        return { valid: false, reason: 'Missing source_reference.exact_text' };
    }

    // Check replacement comes from source
    const sourceText = suggestion.source_reference.exact_text;
    const replacement = suggestion.replacement_text;

    if (replacement && !sourceText.includes(replacement.substring(0, 50))) {
        return { valid: false, reason: 'Replacement text not found in source' };
    }

    return { valid: true };
}

// n8n Code Node wrapper
const input = $json;
const suggestions = generateSuggestions(input);

// Validate all suggestions
const validatedSuggestions = suggestions.filter(s => {
    const validation = validateNoLeakage(s);
    if (!validation.valid) {
        console.log(`Blocked suggestion: ${validation.reason}`);
        return false;
    }
    return true;
});

return [{
    json: {
        ...input,
        suggestions: validatedSuggestions,
        suggestion_count: validatedSuggestions.length
    }
}];
