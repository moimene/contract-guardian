/**
 * Router Evaluation Harness
 * CG-006: Measures Router v4.2 accuracy against golden dataset
 */

const fs = require('fs');
const path = require('path');

// Load dataset
const DATASET_PATH = path.join(__dirname, '../n8n/test_payloads/router_eval_dataset.json');
const ROUTER_PATH = path.join(__dirname, '../n8n/keyword_router_v4.1.js');

// Extract router logic (without n8n execution part)
function loadRouterLogic() {
    const routerCode = fs.readFileSync(ROUTER_PATH, 'utf8');

    // Find where n8n execution starts and cut it off
    const n8nStart = routerCode.indexOf('// N8N EXECUTION');
    const coreLogic = routerCode.substring(0, n8nStart);

    // Create a function from the code
    const wrappedCode = `
    ${coreLogic}
    return { keywordRoute, CANONICAL_FAMILIES, detectPartyContext };
  `;

    const routerModule = new Function(wrappedCode)();
    return routerModule;
}

// Run evaluation
function evaluate() {
    console.log('='.repeat(60));
    console.log('CG-006: Router Evaluation Harness');
    console.log('='.repeat(60));
    console.log();

    // Load components
    const rawDataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
    const { keywordRoute, CANONICAL_FAMILIES } = loadRouterLogic();

    // CG-006.1.2: Exclude non-routable examples
    const nonRoutableCount = rawDataset.filter(e => e.non_routable).length;
    const dataset = rawDataset.filter(e => !e.non_routable);

    console.log(`Dataset: ${rawDataset.length} examples (${nonRoutableCount} marked NON_ROUTABLE, ${dataset.length} evaluated)`);
    console.log(`Router: v4.2 with ${CANONICAL_FAMILIES.length} families`);
    console.log();

    // Run evaluations
    const results = [];
    const confusionMatrix = {};
    const familyMetrics = {};

    for (const example of dataset) {
        const result = keywordRoute(example.clause_text, '');
        const predicted = result.family;
        const expected = example.expected_family;
        const correct = predicted === expected;

        results.push({
            id: example.id,
            expected,
            predicted,
            correct,
            confidence: result.confidence,
            method: result.method
        });

        // Update confusion matrix
        if (!confusionMatrix[expected]) confusionMatrix[expected] = {};
        confusionMatrix[expected][predicted] = (confusionMatrix[expected][predicted] || 0) + 1;

        // Track per-family metrics
        if (!familyMetrics[expected]) {
            familyMetrics[expected] = { tp: 0, fp: 0, fn: 0, total: 0 };
        }
        familyMetrics[expected].total++;

        if (correct) {
            familyMetrics[expected].tp++;
        } else {
            familyMetrics[expected].fn++;
            if (!familyMetrics[predicted]) {
                familyMetrics[predicted] = { tp: 0, fp: 0, fn: 0, total: 0 };
            }
            familyMetrics[predicted].fp++;
        }
    }

    // Calculate overall accuracy
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = (correctCount / results.length * 100).toFixed(1);

    // Calculate OtherUnknown rate
    const otherUnknownCount = results.filter(r => r.predicted === 'OtherUnknown').length;
    const otherUnknownRate = (otherUnknownCount / results.length * 100).toFixed(1);

    // Print summary
    console.log('=== SUMMARY ===');
    console.log(`Overall Accuracy: ${accuracy}% (${correctCount}/${results.length})`);
    console.log(`OtherUnknown Rate: ${otherUnknownRate}% (${otherUnknownCount}/${results.length})`);
    console.log();

    // Print per-family metrics
    console.log('=== PER-FAMILY METRICS ===');
    console.log('Family'.padEnd(25) + 'Precision'.padEnd(12) + 'Recall'.padEnd(12) + 'Total');
    console.log('-'.repeat(55));

    const familyResults = [];
    for (const [family, metrics] of Object.entries(familyMetrics)) {
        if (metrics.total === 0) continue;

        const precision = metrics.tp + metrics.fp > 0
            ? (metrics.tp / (metrics.tp + metrics.fp) * 100).toFixed(0)
            : 'N/A';
        const recall = metrics.tp + metrics.fn > 0
            ? (metrics.tp / (metrics.tp + metrics.fn) * 100).toFixed(0)
            : 'N/A';

        familyResults.push({
            family,
            precision: precision === 'N/A' ? 0 : parseFloat(precision),
            recall: recall === 'N/A' ? 0 : parseFloat(recall),
            total: metrics.total
        });

        console.log(
            family.padEnd(25) +
            (precision + '%').padEnd(12) +
            (recall + '%').padEnd(12) +
            metrics.total
        );
    }
    console.log();

    // Print errors
    const errors = results.filter(r => !r.correct);
    if (errors.length > 0) {
        console.log('=== ERRORS ===');
        errors.forEach(e => {
            console.log(`  ${e.id}: expected ${e.expected}, got ${e.predicted}`);
        });
        console.log();
    }

    // GO/NO-GO Analysis
    console.log('=== GO/NO-GO CRITERIA ===');
    const goChecks = [
        { name: 'Overall accuracy >= 70%', pass: parseFloat(accuracy) >= 70 },
        { name: 'OtherUnknown rate < 15%', pass: parseFloat(otherUnknownRate) < 15 },
        { name: 'No family < 50% recall', pass: familyResults.every(f => f.recall >= 50 || f.total === 0) }
    ];

    goChecks.forEach(check => {
        console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPass = goChecks.every(c => c.pass);
    console.log();
    console.log(`Decision: ${allPass ? '🟢 GO for CG-007' : '🔴 NO-GO - Needs improvement'}`);

    // Write detailed report
    const report = {
        timestamp: new Date().toISOString(),
        dataset_size: dataset.length,
        overall_accuracy: parseFloat(accuracy),
        other_unknown_rate: parseFloat(otherUnknownRate),
        go_no_go: allPass ? 'GO' : 'NO-GO',
        family_metrics: familyResults,
        errors: errors,
        confusion_matrix: confusionMatrix
    };

    const reportPath = path.join(__dirname, '../docs/router_baseline_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Detailed report saved to ${reportPath}`);
}

// Run
evaluate();
