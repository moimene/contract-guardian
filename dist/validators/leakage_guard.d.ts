/**
 * Leakage Guard - Pre-export Validator (V5)
 *
 * Scans client-facing fields for prohibited terms that would
 * expose internal policies, rule names, or sensitive information.
 */
interface LeakageCheckResult {
    pass: boolean;
    blocked_terms_detected: string[];
    leak_score: number;
    policy_leak_flags: string[];
    recommendations: string[];
}
/**
 * Main leakage check function
 */
export declare function checkLeakage(clientComment: string, clientSummaryLine: string, customBlocklist?: string[]): LeakageCheckResult;
/**
 * Sanitize text by replacing blocked terms with neutral alternatives
 */
export declare function sanitizeText(text: string, blocklist?: string[]): {
    sanitized: string;
    redactions: Array<{
        from: string;
        to: string;
    }>;
};
/**
 * Full pre-export validation
 */
export declare function validateForExport(sanitizerOutput: {
    client_comment: string;
    client_summary_line: string;
}, blocklist?: string[]): {
    approved: boolean;
    leakage_check: LeakageCheckResult;
    action: 'PASS' | 'SANITIZE' | 'BLOCK_ESCALATE';
};
export {};
//# sourceMappingURL=leakage_guard.d.ts.map