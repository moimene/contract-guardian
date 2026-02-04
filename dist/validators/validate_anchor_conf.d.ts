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
/**
 * Calculate anchor confidence for a proposed change
 */
export declare function calculateAnchorConfidence(clauseText: string, anchor: Anchor, context?: ContextWindow, thAnchor?: number): AnchorValidationResult;
/**
 * Validate all anchors in proposed changes
 */
export declare function validateAnchors(clauseText: string, proposedChanges: Array<{
    anchor: Anchor;
    change_id?: string;
}>, thAnchor?: number): {
    valid: boolean;
    results: Array<AnchorValidationResult & {
        change_id?: string;
    }>;
    needsEscalation: boolean;
};
export {};
//# sourceMappingURL=validate_anchor_conf.d.ts.map