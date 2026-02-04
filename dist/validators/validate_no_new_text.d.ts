/**
 * Validate No New Text Rule (V1)
 *
 * For each proposed_changes[i].source_reference.exact_text:
 * - Must exist as substring in standard_position.text or fallback_acceptable_fragments.text
 * - Match must be exact or normalized (case/whitespace)
 */
interface SourceReference {
    source_type: 'STANDARD_POSITION' | 'FALLBACK_ACCEPTABLE';
    exact_text: string;
    match_method: 'EXACT' | 'NORMALIZED_EXACT';
}
interface ProposedChange {
    change_id?: string;
    op_type: 'INSERT' | 'DELETE' | 'REPLACE';
    source_reference: SourceReference;
    insert_text?: string;
    replace_to?: string;
}
interface PolicySpec {
    standard_position: {
        text: string;
        text_hash: string;
    };
    fallback_acceptable_fragments: Array<{
        text: string;
        text_hash: string;
    }>;
}
interface ValidationResult {
    valid: boolean;
    errors: Array<{
        change_id?: string;
        field: string;
        message: string;
        expected_source: string;
    }>;
}
/**
 * Validate that proposed change text comes from allowed sources
 */
export declare function validateNoNewText(proposedChanges: ProposedChange[], policySpec: PolicySpec): ValidationResult;
export {};
//# sourceMappingURL=validate_no_new_text.d.ts.map