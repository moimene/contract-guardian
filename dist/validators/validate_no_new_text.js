"use strict";
/**
 * Validate No New Text Rule (V1)
 *
 * For each proposed_changes[i].source_reference.exact_text:
 * - Must exist as substring in standard_position.text or fallback_acceptable_fragments.text
 * - Match must be exact or normalized (case/whitespace)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoNewText = validateNoNewText;
/**
 * Normalize text for comparison (whitespace, case, punctuation)
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[""'']/g, '"')
        .replace(/[–—]/g, '-')
        .trim();
}
/**
 * Check if needle exists in haystack (exact or normalized)
 */
function textExists(needle, haystack, method) {
    if (method === 'EXACT') {
        return haystack.includes(needle);
    }
    else {
        return normalizeText(haystack).includes(normalizeText(needle));
    }
}
/**
 * Validate that proposed change text comes from allowed sources
 */
function validateNoNewText(proposedChanges, policySpec) {
    const errors = [];
    for (const change of proposedChanges) {
        const { source_reference, op_type, change_id } = change;
        const textToValidate = op_type === 'INSERT'
            ? change.insert_text
            : op_type === 'REPLACE'
                ? change.replace_to
                : null;
        // DELETE operations don't need text validation
        if (op_type === 'DELETE')
            continue;
        if (!textToValidate) {
            errors.push({
                change_id,
                field: op_type === 'INSERT' ? 'insert_text' : 'replace_to',
                message: `Missing required field for ${op_type} operation`,
                expected_source: source_reference.source_type
            });
            continue;
        }
        // Validate exact_text matches what we're proposing
        if (source_reference.exact_text !== textToValidate) {
            errors.push({
                change_id,
                field: 'source_reference.exact_text',
                message: 'exact_text does not match proposed text',
                expected_source: source_reference.source_type
            });
            continue;
        }
        // Check against appropriate source
        let found = false;
        if (source_reference.source_type === 'STANDARD_POSITION') {
            found = textExists(source_reference.exact_text, policySpec.standard_position.text, source_reference.match_method);
        }
        else if (source_reference.source_type === 'FALLBACK_ACCEPTABLE') {
            found = policySpec.fallback_acceptable_fragments.some(fragment => textExists(source_reference.exact_text, fragment.text, source_reference.match_method));
        }
        if (!found) {
            errors.push({
                change_id,
                field: 'source_reference.exact_text',
                message: `Text "${source_reference.exact_text.substring(0, 50)}..." not found in ${source_reference.source_type}`,
                expected_source: source_reference.source_type
            });
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=validate_no_new_text.js.map