/**
 * CPC PATTERN TEST - AMAZON PERSPECTIVE
 * Validates generic patterns work correctly for contracts like CPC Australia
 */

// Import the router (for standalone testing)
const fs = require('fs');
const path = require('path');

// Load the v3 router code
const routerCode = fs.readFileSync(path.join(__dirname, 'keyword_router_v3.js'), 'utf8');

// Extract just the function and patterns (remove n8n-specific parts)
const cleanedCode = routerCode
    .replace(/const inputData[\s\S]*$/, '')  // Remove n8n execution code
    .replace(/\$input\.item\.json/g, '{}');

// Evaluate the code to get the functions
eval(cleanedCode);

const CPC_TESTS = [
    {
        id: "CPC-001",
        name: "Client Indemnity → IndemnityAmazon",
        clauseText: `13. CLIENT WARRANTY, INDEMNITY: The Client shall indemnify the Company, 
      its officers, employees, contractors, and agents against all actions, claims, 
      demands or proceedings. The Client indemnity shall be limited to the total Fee.`,
        expectedFamily: "IndemnityAmazon",
        amazonImplication: "Amazon (as Client) indemnifies Producer - Review scope"
    },
    {
        id: "CPC-002",
        name: "Company Indemnity → IndemnityProdCo",
        clauseText: `14. COMPANY INDEMNITY: The Company shall indemnify the Client. 
      The Company's liability shall be limited to the Fee paid by the Client.`,
        expectedFamily: "IndemnityProdCo",
        amazonImplication: "Producer indemnifies Amazon - Standard position"
    },
    {
        id: "CPC-003",
        name: "Copyright Assignment → RightsGrant",
        clauseText: `10. COPYRIGHT: Upon receipt by the Company of the total Fee, 
      the Company shall assign to the Client all of its copyright in the Rushes 
      and Deliverables throughout the world for use in the approved Mediums.`,
        expectedFamily: "RightsGrant",
        amazonImplication: "Rights transfer to Amazon - Core requirement"
    },
    {
        id: "CPC-004",
        name: "Cancellation by Client → TerminationRights",
        clauseText: `11. CANCELLATION: The Client shall be entitled at any time to 
      cancel the whole or any part of the Services under this Agreement by 
      written notice to the Company.`,
        expectedFamily: "TerminationRights",
        amazonImplication: "Amazon can terminate - Favorable"
    },
    {
        id: "CPC-005",
        name: "Cancellation Fees → TerminationConsequences",
        clauseText: `12. CANCELLATION FEE: Cancellation Fee payable: 1-10 Working Days 
      prior to shoot commencement: 100% of Creative Fee plus Production Fee.
      Hard Costs incurred shall also be reimbursed.`,
        expectedFamily: "TerminationConsequences",
        amazonImplication: "Termination costs - Review Amazon exposure"
    },
    {
        id: "CPC-006",
        name: "Confidentiality → Confidentiality",
        clauseText: `21. CONFIDENTIAL INFORMATION: Each party agrees to keep confidential 
      and not disclose to third parties the terms and conditions of this Agreement 
      and any confidential information regarding the other party.`,
        expectedFamily: "Confidentiality",
        amazonImplication: "Mutual confidentiality - Standard"
    },
    {
        id: "CPC-007",
        name: "Liability Cap → LiabilityLimitation",
        clauseText: `The Company's liability shall be limited to the Fee paid by the 
      Client. The Company shall have no liability for consequential loss, 
      loss of business profits or other pecuniary losses.`,
        expectedFamily: "LiabilityLimitation",
        amazonImplication: "Producer liability capped - Review if acceptable"
    },
    {
        id: "CPC-008",
        name: "Dispute Resolution → DisputeResolution",
        clauseText: `20. DISPUTE PROCEDURE: Any dispute shall be submitted to mediation. 
      This Agreement shall be governed by the laws of New South Wales, Australia.`,
        expectedFamily: "DisputeResolution",
        amazonImplication: "Australian law - Not Amazon standard (Delaware)"
    },
    {
        id: "CPC-009",
        name: "Insurance → Insurance",
        clauseText: `The Company agrees to insure itself effectively for all actions, 
      claims, losses and demands which may arise. Errors and Omissions insurance 
      shall be maintained throughout the production.`,
        expectedFamily: "Insurance",
        amazonImplication: "Producer insurance obligations"
    },
    {
        id: "CPC-010",
        name: "Payment Terms → PaymentCredits",
        clauseText: `3. PAYMENT TERMS: Payment of the Agreed Fee shall be made by the 
      Client in the following instalments: Fifty Percent due on receipt of invoice, 
      Fifty Percent payable 30 days after approval of offline edit.`,
        expectedFamily: "PaymentCredits",
        amazonImplication: "Payment schedule - Verify milestone-based"
    }
];

function runTests() {
    console.log("\n" + "=".repeat(75));
    console.log("🎯 CPC GENERIC PATTERNS TEST - AMAZON PERSPECTIVE");
    console.log("=".repeat(75) + "\n");

    let passed = 0;
    let failed = 0;
    const failedTests = [];

    for (const test of CPC_TESTS) {
        const result = keywordRoute(test.clauseText, test.name);
        const detected = result.family || "OtherUnknown";
        const success = detected === test.expectedFamily;

        if (success) {
            passed++;
            console.log(`✅ ${test.id}: ${test.name}`);
            console.log(`   Family: ${detected} | Confidence: ${result.confidence}`);
        } else {
            failed++;
            failedTests.push(test.id);
            console.log(`❌ ${test.id}: ${test.name}`);
            console.log(`   Expected: ${test.expectedFamily}`);
            console.log(`   Got: ${detected}`);
        }
        console.log(`   Amazon: ${test.amazonImplication}\n`);
    }

    // Summary
    console.log("=".repeat(75));
    console.log(`RESULTS: ${passed}/${CPC_TESTS.length} passed (${(passed / CPC_TESTS.length * 100).toFixed(1)}%)`);
    if (failedTests.length > 0) {
        console.log(`Failed: ${failedTests.join(", ")}`);
    }
    console.log("=".repeat(75) + "\n");

    return { passed, failed, total: CPC_TESTS.length };
}

// Run tests
const results = runTests();
process.exit(results.failed > 0 ? 1 : 0);
