/**
 * Anchor Confidence Calculator (V2)
 * 
 * Calculates anchor_confidence deterministically based on:
 * - Exact substring match in clause_text
 * - Normalized match fallback
 * - Multiple match penalty
 * - Context window validation
 */

interface Anchor {
    quote: string;
    offsets: {
        start: number;
        end: number;
    };
    anchor_confidence?: number;
    strategy?: string;
}

interface ContextWindow {
    before?: string;
    after?: string;
}

interface AnchorValidationResult {
    anchor_confidence: number;
    strategy: string;
    issues: string[];
    needs_human_validation: boolean;
}

const TH_ANCHOR_DEFAULT = 0.85;

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[""'']/g, '"')
        .replace(/[–—]/g, '-')
        .trim();
}

/**
 * Count occurrences of a substring in text
 */
function countOccurrences(text: string, substring: string): number {
    let count = 0;
    let pos = 0;
    while ((pos = text.indexOf(substring, pos)) !== -1) {
        count++;
        pos += 1;
    }
    return count;
}

/**
 * Calculate anchor confidence for a proposed change
 */
export function calculateAnchorConfidence(
    clauseText: string,
    anchor: Anchor,
    context?: ContextWindow,
    thAnchor: number = TH_ANCHOR_DEFAULT
): AnchorValidationResult {
    const issues: string[] = [];
    let confidence = 0;
    let strategy = 'UNKNOWN';

    const { quote, offsets } = anchor;

    // Step 1: Verify exact substring match at offsets
    const extractedText = clauseText.substring(offsets.start, offsets.end);

    if (extractedText === quote) {
        // Exact match at exact position
        confidence = 1.0;
        strategy = 'EXACT_OFFSET_MATCH';
    } else if (normalizeText(extractedText) === normalizeText(quote)) {
        // Normalized match at position
        confidence = 0.9;
        strategy = 'NORMALIZED_OFFSET_MATCH';
        issues.push('Quote matched only after normalization');
    } else {
        // Position mismatch - try to find the quote elsewhere
        const exactIndex = clauseText.indexOf(quote);
        if (exactIndex !== -1) {
            confidence = 0.7;
            strategy = 'QUOTE_FOUND_DIFFERENT_OFFSET';
            issues.push(`Quote found at offset ${exactIndex}, not ${offsets.start}`);
        } else {
            const normalizedClause = normalizeText(clauseText);
            const normalizedQuote = normalizeText(quote);
            if (normalizedClause.includes(normalizedQuote)) {
                confidence = 0.5;
                strategy = 'NORMALIZED_SEARCH_MATCH';
                issues.push('Quote found only with normalized search');
            } else {
                confidence = 0.0;
                strategy = 'NO_MATCH';
                issues.push('Quote not found in clause text');
            }
        }
    }

    // Step 2: Multiple match penalty
    if (confidence > 0) {
        const occurrences = countOccurrences(clauseText, quote);
        if (occurrences > 1) {
            const penalty = Math.min(0.25, (occurrences - 1) * 0.1);
            confidence = Math.max(0.5, confidence - penalty);
            issues.push(`Multiple occurrences (${occurrences}) - confidence penalized`);
        }
    }

    // Step 3: Context validation bonus/penalty
    if (context && confidence > 0.5) {
        let contextMatch = 0;
        let contextChecks = 0;

        if (context.before) {
            contextChecks++;
            const beforeIndex = clauseText.indexOf(context.before);
            if (beforeIndex !== -1 && beforeIndex < offsets.start) {
                contextMatch++;
            }
        }

        if (context.after) {
            contextChecks++;
            const afterIndex = clauseText.indexOf(context.after);
            if (afterIndex !== -1 && afterIndex > offsets.end) {
                contextMatch++;
            }
        }

        if (contextChecks > 0) {
            const contextScore = contextMatch / contextChecks;
            if (contextScore === 1) {
                confidence = Math.min(1.0, confidence + 0.05);
            } else if (contextScore === 0) {
                confidence = Math.max(0.4, confidence - 0.15);
                issues.push('Context window did not match');
            }
        }
    }

    return {
        anchor_confidence: Math.round(confidence * 100) / 100,
        strategy,
        issues,
        needs_human_validation: confidence < thAnchor
    };
}

/**
 * Validate all anchors in proposed changes
 */
export function validateAnchors(
    clauseText: string,
    proposedChanges: Array<{ anchor: Anchor; change_id?: string }>,
    thAnchor: number = TH_ANCHOR_DEFAULT
): {
    valid: boolean;
    results: Array<AnchorValidationResult & { change_id?: string }>;
    needsEscalation: boolean;
} {
    const results = proposedChanges.map(change => ({
        change_id: change.change_id,
        ...calculateAnchorConfidence(clauseText, change.anchor, undefined, thAnchor)
    }));

    const needsEscalation = results.some(r => r.needs_human_validation);
    const valid = results.every(r => r.anchor_confidence >= thAnchor);

    return { valid, results, needsEscalation };
}
