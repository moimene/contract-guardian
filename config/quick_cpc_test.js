// Quick CPC Pattern Test
const KEYWORD_PATTERNS = {
    IndemnityProdCo: {
        patterns: [
            /ProdCo\s+(shall|will)\s+indemnify/i,
            /indemnify.*Amazon/i,
            /Company\s+(shall|will)\s+indemnify\s+(the\s+)?Client/i,
            /Company\s+shall\s+indemnify\s+the\s+Client/i,
            /Company\s+Indemnity/i
        ],
        negative: [/Client\s+(shall|will)\s+indemnify/i],
        min_matches: 1,
        confidence: 0.88
    },
    IndemnityAmazon: {
        patterns: [
            /Amazon\s+(shall|will)\s+indemnify/i,
            /Client\s+(shall|will)\s+indemnify/i,
            /Client\s+Indemnity/i,
            /Client\s+shall\s+indemnify\s+(the\s+)?Company/i,
            /Client\s+indemnity\s+shall\s+be\s+limited/i,
            /indemnify\s+(the\s+)?Company/i
        ],
        negative: [/Company\s+(shall|will)\s+indemnify\s+(the\s+)?Client/i],
        min_matches: 1,
        confidence: 0.88
    },
    RightsGrant: {
        patterns: [
            /work\s+made\s+for\s+hire/i,
            /assign\s+to\s+(the\s+)?Client\s+all\s+of\s+its\s+copyright/i,
            /Company\s+shall\s+assign\s+to\s+(the\s+)?Client/i,
            /copyright\s+assignment/i,
            /assign.*copyright.*throughout/i
        ],
        min_matches: 1,
        confidence: 0.85
    },
    TerminationRights: {
        patterns: [
            /may\s+terminate/i,
            /Client\s+shall\s+be\s+entitled\s+to.*cancel/i,
            /cancel\s+the\s+whole\s+or\s+any\s+part/i,
            /notice\s+of\s+cancellation/i
        ],
        min_matches: 1,
        confidence: 0.85
    },
    TerminationConsequences: {
        patterns: [
            /Cancellation\s+Fee/i,
            /cancellation\s+fee\s+payable/i,
            /Hard\s+Costs/i,
            /Creative\s+Fee.*Production\s+Fee/i
        ],
        min_matches: 1,
        confidence: 0.82
    },
    Confidentiality: {
        patterns: [
            /confidential\s+information/i,
            /keep\s+confidential\s+and\s+not\s+disclose/i,
            /shall\s+not\s+disclose/i
        ],
        min_matches: 1,
        confidence: 0.90
    },
    LiabilityLimitation: {
        patterns: [
            /liability\s+shall\s+be\s+limited/i,
            /no\s+liability\s+for\s+consequential\s+loss/i,
            /pecuniary\s+loss/i
        ],
        min_matches: 1,
        confidence: 0.92
    },
    DisputeResolution: {
        patterns: [
            /dispute/i,
            /mediation/i,
            /governed\s+by\s+the\s+laws\s+of/i
        ],
        min_matches: 2,
        confidence: 0.85
    },
    Insurance: {
        patterns: [
            /insure\s+itself\s+effectively/i,
            /Errors\s+and\s+Omissions/i,
            /insurance.*maintained/i
        ],
        min_matches: 1,
        confidence: 0.88
    },
    PaymentCredits: {
        patterns: [
            /Payment.*Fee/i,
            /instalments/i,
            /payable.*days\s+after/i
        ],
        min_matches: 1,
        confidence: 0.88
    }
};

function keywordRoute(text) {
    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        if (config.negative) {
            const hasNeg = config.negative.some(p => p.test(text));
            if (hasNeg) continue;
        }
        const matches = config.patterns.filter(p => p.test(text));
        if (matches.length >= config.min_matches) {
            return { family, confidence: config.confidence, matches: matches.length };
        }
    }
    return { family: 'OtherUnknown', confidence: 0.5, matches: 0 };
}

const tests = [
    { id: 'CPC-001', text: 'The Client shall indemnify the Company. Client indemnity shall be limited to the Fee.', expected: 'IndemnityAmazon' },
    { id: 'CPC-002', text: 'The Company shall indemnify the Client. Company Indemnity.', expected: 'IndemnityProdCo' },
    { id: 'CPC-003', text: 'The Company shall assign to the Client all of its copyright throughout the world.', expected: 'RightsGrant' },
    { id: 'CPC-004', text: 'The Client shall be entitled at any time to cancel the whole or any part of the Services.', expected: 'TerminationRights' },
    { id: 'CPC-005', text: 'Cancellation Fee payable: Hard Costs and Creative Fee plus Production Fee.', expected: 'TerminationConsequences' },
    { id: 'CPC-006', text: 'Each party agrees to keep confidential and not disclose any confidential information.', expected: 'Confidentiality' },
    { id: 'CPC-007', text: 'The Company liability shall be limited to the Fee. No liability for consequential loss.', expected: 'LiabilityLimitation' },
    { id: 'CPC-008', text: 'Any dispute shall be submitted to mediation. Governed by the laws of NSW.', expected: 'DisputeResolution' },
    { id: 'CPC-009', text: 'The Company agrees to insure itself effectively. Errors and Omissions insurance maintained.', expected: 'Insurance' },
    { id: 'CPC-010', text: 'Payment of the Agreed Fee shall be made in instalments, payable 30 days after approval.', expected: 'PaymentCredits' }
];

console.log('======================================================================');
console.log('🎯 CPC PATTERNS TEST - KEYWORD ROUTER v3');
console.log('======================================================================\n');

let passed = 0;
for (const t of tests) {
    const r = keywordRoute(t.text);
    const ok = r.family === t.expected;
    if (ok) passed++;
    console.log((ok ? '✅' : '❌') + ' ' + t.id + ': ' + t.expected);
    if (!ok) console.log('   Got: ' + r.family);
}

console.log('\n======================================================================');
console.log('RESULTS: ' + passed + '/10 (' + (passed * 10) + '%)');
console.log('======================================================================');
