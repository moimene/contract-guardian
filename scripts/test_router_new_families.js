#!/usr/bin/env node
/**
 * Test Router v4.2 with 7 New Families
 * Run: node scripts/test_router_new_families.js
 */

const fs = require('fs');
const path = require('path');

// Import the router code (inline for testing)
const routerPath = path.join(__dirname, '../n8n/keyword_router_v4.1.js');
let routerCode = fs.readFileSync(routerPath, 'utf8');

// Remove n8n-specific execution code at the end
routerCode = routerCode.replace(/\/\/ ================================================================\n\/\/ N8N EXECUTION[\s\S]*$/, '');

// Add module export
routerCode += '\nmodule.exports = { keywordRoute, CANONICAL_FAMILIES, KEYWORD_PATTERNS };';

// Write temp file
const tempPath = '/tmp/router_test.js';
fs.writeFileSync(tempPath, routerCode);

// Import router
const { keywordRoute, CANONICAL_FAMILIES, KEYWORD_PATTERNS } = require(tempPath);

console.log('='.repeat(60));
console.log('ROUTER v4.2 - NEW FAMILIES TEST');
console.log('='.repeat(60));
console.log(`Total CANONICAL_FAMILIES: ${CANONICAL_FAMILIES.length}`);
console.log(`Total KEYWORD_PATTERNS: ${Object.keys(KEYWORD_PATTERNS).length}`);
console.log('');

// Test cases for new families
const testCases = [
    {
        name: 'MoralRights',
        heading: 'MORAL RIGHTS',
        text: 'ProdCo reserves moral rights (droit moral) including right of integrity and paternity. ProdCo shall not waive any moral rights.',
        expectedFamily: 'MoralRights'
    },
    {
        name: 'CreativeControl',
        heading: 'CREATIVE CONTROL',
        text: 'ProdCo shall have final approval over all creative decisions. ProdCo retains creative control. Mutual approval required for changes.',
        expectedFamily: 'CreativeControl'
    },
    {
        name: 'KeyPersons',
        heading: 'KEY PERSONS',
        text: 'If any Key Person becomes unavailable, ProdCo may replace at ProdCo sole discretion. Key Person insurance shall be maintained.',
        expectedFamily: 'KeyPersons'
    },
    {
        name: 'AIPolicy',
        heading: 'AI POLICY',
        text: 'ProdCo may use AI tools and generative AI. Materials may be input into third-party AI services. AI usage at ProdCo discretion.',
        expectedFamily: 'AIPolicy'
    },
    {
        name: 'TaxProvisions',
        heading: 'TAX PROVISIONS',
        text: 'Amazon shall be responsible for all withholding tax and VAT. Amazon shall gross up payments. No withholding shall be applied.',
        expectedFamily: 'TaxProvisions'
    },
    {
        name: 'DeliveryAcceptance',
        heading: 'DELIVERY AND ACCEPTANCE',
        text: 'Deliverables shall be deemed accepted. Acceptance shall not be unreasonably withheld. ProdCo determines completion. Amazon waives right to reject.',
        expectedFamily: 'DeliveryAcceptance'
    },
    {
        name: 'BudgetOverages',
        heading: 'BUDGET',
        text: 'Amazon shall pay all overages. No cap on overages. ProdCo not responsible for cost overruns. Amazon bears contingency.',
        expectedFamily: 'BudgetOverages'
    }
];

let passed = 0;
let failed = 0;

console.log('TEST RESULTS:');
console.log('-'.repeat(60));

for (const tc of testCases) {
    const result = keywordRoute(tc.text, tc.heading);
    const success = result.family === tc.expectedFamily;

    if (success) {
        passed++;
        console.log(`✅ ${tc.name}: ${result.family} (${result.confidence}) [${result.matched_patterns} patterns]`);
    } else {
        failed++;
        console.log(`❌ ${tc.name}: Expected ${tc.expectedFamily}, got ${result.family} (${result.confidence})`);
        if (result.alternatives && result.alternatives.length > 0) {
            console.log(`   Alternatives: ${result.alternatives.map(a => `${a.family}:${a.confidence}`).join(', ')}`);
        }
    }
}

console.log('-'.repeat(60));
console.log(`TOTAL: ${passed}/${testCases.length} passed`);
console.log('');

// Verify new families are in CANONICAL_FAMILIES
const newFamilies = ['MoralRights', 'CreativeControl', 'KeyPersons', 'AIPolicy', 'TaxProvisions', 'DeliveryAcceptance', 'BudgetOverages'];
console.log('CANONICAL_FAMILIES CHECK:');
for (const fam of newFamilies) {
    const inCanonical = CANONICAL_FAMILIES.includes(fam);
    const hasPatterns = KEYWORD_PATTERNS[fam] !== undefined;
    const status = inCanonical && hasPatterns ? '✅' : '❌';
    console.log(`${status} ${fam}: canonical=${inCanonical}, patterns=${hasPatterns}`);
}

// Cleanup
fs.unlinkSync(tempPath);

process.exit(failed > 0 ? 1 : 0);
