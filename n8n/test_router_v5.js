/**
 * CG-016 Router v5.0 Test Suite
 * Run: node test_router_v5.js
 */

// Mock the $json object from n8n
const fs = require('fs');
const path = require('path');

// Read the router code
const routerCode = fs.readFileSync(
    path.join(__dirname, 'keyword_router_v5.0.js'),
    'utf8'
);

// Test cases from CG-016 specification
const TEST_CASES = [
    // PaymentCredits
    {
        id: "PC-001",
        text: "Amazon shall pay ProdCo a production fee of $500,000 per episode, payable within net 30 days of delivery.",
        expected_family: "PaymentCredits",
        min_confidence: 0.85
    },
    {
        id: "PC-002",
        text: "ProdCo shall be entitled to backend participation equal to 5% of net receipts.",
        expected_family: "PaymentCredits",
        min_confidence: 0.80
    },
    {
        id: "PC-003",
        text: "First installment upon commencement of principal photography, second installment upon delivery of the rough cut.",
        expected_family: "PaymentCredits",
        min_confidence: 0.75
    },

    // IndemnityAmazon vs IndemnityProdCo
    {
        id: "IA-001",
        text: "Amazon shall indemnify, defend, and hold harmless ProdCo from any claims arising from Amazon's breach.",
        expected_family: "IndemnityAmazon",
        expected_direction: "AMAZON_OBLIGOR",
        min_confidence: 0.88
    },
    {
        id: "IP-001",
        text: "ProdCo shall indemnify, defend, and hold harmless Amazon Indemnitees from any third-party claims.",
        expected_family: "IndemnityProdCo",
        expected_direction: "PRODCO_OBLIGOR",
        min_confidence: 0.90
    },
    {
        id: "IP-002",
        text: "ProdCo agrees to indemnify Amazon from and against any and all claims, damages, and losses arising from ProdCo's breach.",
        expected_family: "IndemnityProdCo",
        expected_direction: "PRODCO_OBLIGOR",
        min_confidence: 0.88
    },

    // LiabilityLimitation (ALL CAPS)
    {
        id: "LL-001",
        text: "IN NO EVENT SHALL AMAZON BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.",
        expected_family: "LiabilityLimitation",
        min_confidence: 0.90
    },
    {
        id: "LL-002",
        text: "Neither party shall be liable for consequential damages. Aggregate liability shall not exceed fees paid.",
        expected_family: "LiabilityLimitation",
        min_confidence: 0.85
    },
    {
        id: "LL-003",
        text: "Under no circumstances will either party be responsible for lost profits or special damages.",
        expected_family: "LiabilityLimitation",
        min_confidence: 0.85
    },

    // IndemnityProcedures
    {
        id: "IPROC-001",
        text: "The indemnified party shall promptly notify the indemnifying party and allow them to assume the defense with counsel reasonably acceptable.",
        expected_family: "IndemnityProcedures",
        min_confidence: 0.85
    },
    {
        id: "IPROC-002",
        text: "Control of the defense shall rest with the indemnifying party, subject to prior written consent to any settlement.",
        expected_family: "IndemnityProcedures",
        min_confidence: 0.82
    },

    // Insurance (not RepsProdCo)
    {
        id: "INS-001",
        text: "ProdCo shall obtain and maintain Errors & Omissions insurance with limits of $3,000,000 per occurrence and name Amazon as additional insured.",
        expected_family: "Insurance",
        min_confidence: 0.88
    },
    {
        id: "INS-002",
        text: "Commercial general liability insurance of $5,000,000 aggregate with certificate of insurance provided to Amazon.",
        expected_family: "Insurance",
        min_confidence: 0.85
    },

    // Force Majeure
    {
        id: "FM-001",
        text: "Neither party shall be liable for failure to perform due to Force Majeure events including acts of god, pandemic, or natural disaster.",
        expected_family: "ForceMajeure",
        min_confidence: 0.90
    },

    // RightsGrant
    {
        id: "RG-001",
        text: "ProdCo hereby grants to Amazon all rights in the Program throughout the universe in perpetuity.",
        expected_family: "RightsGrant",
        min_confidence: 0.85
    },

    // TerminationRights vs TerminationConsequences
    {
        id: "TR-001",
        text: "Amazon may terminate this Agreement for cause upon 30 days written notice if ProdCo commits a material breach.",
        expected_family: "TerminationRights",
        min_confidence: 0.85
    },
    {
        id: "TC-001",
        text: "Upon termination, ProdCo shall return all materials and Amazon shall pay the kill fee for work completed.",
        expected_family: "TerminationConsequences",
        min_confidence: 0.85
    },

    // Confidentiality
    {
        id: "CONF-001",
        text: "ProdCo shall maintain in strict confidence all non-public information disclosed by Amazon.",
        expected_family: "Confidentiality",
        min_confidence: 0.88
    },

    // GeneralProvisions
    {
        id: "GP-001",
        text: "This Agreement constitutes the entire agreement and supersedes all prior agreements. This Agreement shall be executed in counterparts.",
        expected_family: "GeneralProvisions",
        min_confidence: 0.80
    }
];

// Simulate n8n execution environment
function runRouter(clauseText) {
    // Create a mock environment
    const $json = { clause_text: clauseText, heading: '' };

    // Execute router code in isolated context
    const wrappedCode = `
        (function($json) {
            ${routerCode}
        })
    `;

    try {
        const routerFn = eval(wrappedCode);
        const result = routerFn($json);
        return result[0].json;
    } catch (error) {
        return { error: error.message };
    }
}

// Run tests
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   CG-016 Router v5.0 Test Suite                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const failures = [];

for (const testCase of TEST_CASES) {
    const result = runRouter(testCase.text);

    if (result.error) {
        console.log(`❌ ${testCase.id}: ERROR - ${result.error}`);
        failed++;
        failures.push({ id: testCase.id, error: result.error });
        continue;
    }

    const familyMatch = result.detected_family === testCase.expected_family;
    const confidenceMatch = result._keyword_confidence >= testCase.min_confidence;
    const directionMatch = !testCase.expected_direction ||
        result._obligation_direction === testCase.expected_direction;

    const testPassed = familyMatch && confidenceMatch && directionMatch;

    if (testPassed) {
        console.log(`✅ ${testCase.id}: ${result.detected_family} (${(result._keyword_confidence * 100).toFixed(1)}%)`);
        passed++;
    } else {
        const issues = [];
        if (!familyMatch) issues.push(`family: got ${result.detected_family}, expected ${testCase.expected_family}`);
        if (!confidenceMatch) issues.push(`confidence: ${(result._keyword_confidence * 100).toFixed(1)}% < ${(testCase.min_confidence * 100).toFixed(1)}%`);
        if (!directionMatch) issues.push(`direction: got ${result._obligation_direction}, expected ${testCase.expected_direction}`);

        console.log(`❌ ${testCase.id}: FAILED - ${issues.join(', ')}`);
        failed++;
        failures.push({ id: testCase.id, issues, result });
    }
}

// Summary
console.log('\n' + '='.repeat(64));
console.log(`RESULTS: ${passed}/${TEST_CASES.length} passed (${((passed / TEST_CASES.length) * 100).toFixed(1)}%)`);
console.log('='.repeat(64));

if (failed > 0) {
    console.log('\n📋 Failure Details:');
    for (const f of failures) {
        console.log(`\n${f.id}:`);
        if (f.error) {
            console.log(`  Error: ${f.error}`);
        } else {
            console.log(`  Issues: ${f.issues.join(', ')}`);
            console.log(`  Matches: ${JSON.stringify(f.result._matches?.slice(0, 2) || [])}`);
        }
    }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
