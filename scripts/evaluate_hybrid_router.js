/**
 * Hybrid Router Evaluation Harness - CG-007
 * 
 * Tests the combined Keyword + LLM Router performance
 * using a mock LLM for fast iteration.
 * 
 * Usage: node scripts/evaluate_hybrid_router.js
 */

const fs = require('fs');
const path = require('path');

// Load modules
const DATASET_PATH = path.join(__dirname, '../n8n/test_payloads/router_eval_dataset.json');
const KEYWORD_ROUTER_PATH = path.join(__dirname, '../n8n/keyword_router_v4.1.js');
const LLM_ROUTER_PATH = path.join(__dirname, '../n8n/llm_router_v1.js');

// ================================================================
// LOAD ROUTERS
// ================================================================

function loadKeywordRouter() {
    const routerCode = fs.readFileSync(KEYWORD_ROUTER_PATH, 'utf8');
    const n8nStart = routerCode.indexOf('// N8N EXECUTION');
    const coreLogic = routerCode.substring(0, n8nStart);

    const wrappedCode = `
        ${coreLogic}
        return { keywordRoute, CANONICAL_FAMILIES };
    `;

    return new Function(wrappedCode)();
}

function loadLLMRouter() {
    // Clear cache first
    delete require.cache[require.resolve(LLM_ROUTER_PATH)];
    return require(LLM_ROUTER_PATH);
}

// ================================================================
// MOCK LLM (for fast evaluation)
// ================================================================

/**
 * Mock LLM that uses simple heuristics to guess family
 * This simulates what GPT-4o-mini would do
 */
function mockLLM(prompt) {
    // Extract clause from prompt
    const clauseMatch = prompt.match(/CLAUSE TO CLASSIFY:\s*"""\s*([\s\S]*?)"""/);
    const clause = clauseMatch ? clauseMatch[1].toLowerCase() : '';

    // Extract keyword guess
    const keywordMatch = prompt.match(/KEYWORD ROUTER SUGGESTION:\s*(\w+)/);
    const keywordGuess = keywordMatch ? keywordMatch[1] : 'OtherUnknown';

    // Simple semantic rules (what LLM would detect)
    let family = keywordGuess;
    let confidence = 0.75;
    let reasoning = 'Based on semantic analysis';

    // Payment-related clauses
    if (clause.includes('pay') || clause.includes('invoice') || clause.includes('fee') ||
        clause.includes('compensation') || clause.includes('net ')) {
        family = 'PaymentCredits';
        confidence = 0.85;
        reasoning = 'Contains payment terminology';
    }

    // Indemnity procedures
    if (clause.includes('notice of claim') || clause.includes('defense of') ||
        clause.includes('settlement') || clause.includes('counsel')) {
        family = 'IndemnityProcedures';
        confidence = 0.85;
        reasoning = 'Contains indemnity procedure terminology';
    }

    // Liability limitation
    if (clause.includes('regardless') || clause.includes('direct damages') ||
        clause.includes('consequential') || clause.includes('punitive') ||
        clause.includes('cap') || clause.includes('aggregate')) {
        family = 'LiabilityLimitation';
        confidence = 0.85;
        reasoning = 'Contains liability cap terminology';
    }

    // Insurance
    if (clause.includes('insurance') || clause.includes('coverage') ||
        clause.includes('policy') || clause.includes('insured')) {
        family = 'Insurance';
        confidence = 0.85;
        reasoning = 'Contains insurance terminology';
    }

    // Assignment
    if (clause.includes('assign') || clause.includes('successor') ||
        clause.includes('transfer')) {
        family = 'Assignment';
        confidence = 0.85;
        reasoning = 'Contains assignment terminology';
    }

    // Indemnity Amazon
    if (clause.includes('prodco') && (clause.includes('indemnif') || clause.includes('hold harmless'))) {
        family = 'IndemnityProdCo';
        confidence = 0.88;
        reasoning = 'ProdCo indemnifies Amazon';
    }

    if (clause.includes('amazon') && clause.includes('indemnif') && !clause.includes('prodco')) {
        family = 'IndemnityAmazon';
        confidence = 0.85;
        reasoning = 'Amazon indemnification mentioned';
    }

    // Representations
    if (clause.includes('represents') || clause.includes('warrants') ||
        clause.includes('representation')) {
        family = 'RepsProdCo';
        confidence = 0.82;
        reasoning = 'Contains representations and warranties';
    }

    // General provisions
    if (clause.includes('severabil') || clause.includes('waiver') ||
        clause.includes('entire agreement') || clause.includes('counterpart')) {
        family = 'GeneralProvisions';
        confidence = 0.85;
        reasoning = 'Contains boilerplate provisions';
    }

    // Data protection
    if (clause.includes('data') || clause.includes('gdpr') || clause.includes('privacy') ||
        clause.includes('personal information')) {
        family = 'DataProtection';
        confidence = 0.85;
        reasoning = 'Contains data protection terminology';
    }

    // Rights grant
    if (clause.includes('grant') && (clause.includes('right') || clause.includes('license'))) {
        family = 'RightsGrant';
        confidence = 0.85;
        reasoning = 'Contains rights grant terminology';
    }

    return JSON.stringify({
        family,
        confidence,
        reasoning,
        ambiguity_flag: false,
        secondary_family: null,
        escalation_required: confidence < 0.70
    });
}

/**
 * Mock RAG fetch
 */
function mockFetchRAG(clauseText, topK) {
    // Return empty array - real RAG would fetch from Supabase
    return [];
}

// ================================================================
// EVALUATION
// ================================================================

async function evaluate() {
    console.log('='.repeat(60));
    console.log('CG-007: Hybrid Router Evaluation Harness');
    console.log('='.repeat(60));
    console.log();

    // Load components
    const rawDataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
    const { keywordRoute, CANONICAL_FAMILIES } = loadKeywordRouter();
    const { hybridRoute, shouldCallLLM } = loadLLMRouter();

    // Filter non-routable
    const nonRoutableCount = rawDataset.filter(e => e.non_routable).length;
    const dataset = rawDataset.filter(e => !e.non_routable);

    console.log(`Dataset: ${rawDataset.length} total (${nonRoutableCount} NON_ROUTABLE, ${dataset.length} evaluated)`);
    console.log(`Router: Keyword v4.2 + LLM v1.0 (mock)`);
    console.log();

    // Run evaluations
    const results = [];
    let llmCalls = 0;
    let keywordOnly = 0;

    for (const example of dataset) {
        // Use hybrid router
        const result = await hybridRoute(
            example.clause_text,
            '',
            keywordRoute,
            mockLLM,
            mockFetchRAG
        );

        const correct = result.family === example.expected_family;

        if (result.llm_called) {
            llmCalls++;
        } else {
            keywordOnly++;
        }

        results.push({
            id: example.id,
            expected: example.expected_family,
            predicted: result.family,
            correct,
            confidence: result.confidence,
            method: result.method,
            llm_called: result.llm_called
        });
    }

    // Calculate metrics
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = (correctCount / results.length * 100).toFixed(1);

    const otherUnknownCount = results.filter(r => r.predicted === 'OtherUnknown').length;
    const otherUnknownRate = (otherUnknownCount / results.length * 100).toFixed(1);

    const escalationCount = results.filter(r => r.method === 'escalation').length;
    const escalationRate = (escalationCount / results.length * 100).toFixed(1);

    // Print summary
    console.log('=== SUMMARY ===');
    console.log(`Overall Accuracy: ${accuracy}% (${correctCount}/${results.length})`);
    console.log(`OtherUnknown Rate: ${otherUnknownRate}% (${otherUnknownCount}/${results.length})`);
    console.log(`Escalation Rate: ${escalationRate}% (${escalationCount}/${results.length})`);
    console.log();
    console.log('=== ROUTING DISTRIBUTION ===');
    console.log(`Keyword Only: ${keywordOnly} (${(keywordOnly / results.length * 100).toFixed(1)}%)`);
    console.log(`LLM Called: ${llmCalls} (${(llmCalls / results.length * 100).toFixed(1)}%)`);
    console.log();

    // Per-family metrics
    const familyMetrics = {};
    for (const r of results) {
        if (!familyMetrics[r.expected]) {
            familyMetrics[r.expected] = { tp: 0, fp: 0, fn: 0, total: 0 };
        }
        familyMetrics[r.expected].total++;
        if (r.correct) {
            familyMetrics[r.expected].tp++;
        } else {
            familyMetrics[r.expected].fn++;
        }
    }

    console.log('=== PER-FAMILY RECALL ===');
    console.log('Family'.padEnd(25) + 'Recall'.padEnd(12) + 'Total');
    console.log('-'.repeat(45));

    const familyResults = [];
    for (const [family, metrics] of Object.entries(familyMetrics)) {
        const recall = metrics.total > 0
            ? (metrics.tp / metrics.total * 100).toFixed(0)
            : 'N/A';
        familyResults.push({ family, recall: parseFloat(recall) || 0, total: metrics.total });
        console.log(family.padEnd(25) + (recall + '%').padEnd(12) + metrics.total);
    }
    console.log();

    // Errors
    const errors = results.filter(r => !r.correct);
    console.log('=== ERRORS ===');
    errors.slice(0, 15).forEach(e => {
        console.log(`  ${e.id}: expected ${e.expected}, got ${e.predicted} [${e.method}]`);
    });
    if (errors.length > 15) {
        console.log(`  ... and ${errors.length - 15} more`);
    }
    console.log();

    // GO/NO-GO
    console.log('=== GO/NO-GO CRITERIA ===');
    const goChecks = [
        { name: 'Combined accuracy >= 70%', pass: parseFloat(accuracy) >= 70 },
        { name: 'OtherUnknown rate < 10%', pass: parseFloat(otherUnknownRate) < 10 },
        { name: 'Escalation rate < 15%', pass: parseFloat(escalationRate) < 15 }
    ];

    goChecks.forEach(check => {
        console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPass = goChecks.every(c => c.pass);
    console.log();
    console.log(`Decision: ${allPass ? '🟢 GO for production' : '🟡 Needs more tuning'}`);

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        version: 'CG-007 Hybrid v1.0 (mock LLM)',
        metrics: {
            accuracy: parseFloat(accuracy),
            other_unknown_rate: parseFloat(otherUnknownRate),
            escalation_rate: parseFloat(escalationRate),
            llm_call_rate: (llmCalls / results.length * 100)
        },
        family_results: familyResults,
        errors: errors.slice(0, 30)
    };

    const reportPath = path.join(__dirname, '../docs/hybrid_router_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Report saved to ${reportPath}`);
}

// Run
evaluate().catch(console.error);
