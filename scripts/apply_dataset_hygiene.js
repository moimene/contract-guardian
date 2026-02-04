/**
 * Dataset Hygiene Script - CG-006.1.2
 * 
 * Marks examples as NON_ROUTABLE based on PO criteria:
 * - TRIG with < 15 words (too minimal)
 * - GUIDE with meta-commentary ("Amazon Position:", "Amazon Legal", etc.)
 * - Examples without valid contractual text
 * 
 * Usage: node scripts/apply_dataset_hygiene.js
 */

const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '../n8n/test_payloads/router_eval_dataset.json');

// PO-specified hygiene rules
const HYGIENE_RULES = {
    // Mark as non-routable if contains meta-commentary
    META_TEXT_PATTERNS: [
        /^Amazon\s+Position:/i,
        /^With\s+Amazon\s+Legal/i,
        /^If\s+ProdCo\s+requests/i,
        /^Amazon\s+Legal\s+approval/i,
        /should\s+(add|hold|inform|check)/i, // Editorial guidance
    ],
    // Minimum word count for valid clause
    MIN_WORDS: 15,
    // Example types that should be scrutinized
    SCRUTINIZE_TYPES: ['synthetic', 'near-miss']
};

function countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

function shouldMarkNonRoutable(example) {
    const { clause_text, type, id } = example;
    const reasons = [];

    // Rule 1: Check for meta-text patterns
    for (const pattern of HYGIENE_RULES.META_TEXT_PATTERNS) {
        if (pattern.test(clause_text)) {
            reasons.push(`Meta-text pattern: ${pattern.toString()}`);
            break; // One pattern is enough
        }
    }

    // Rule 2: Check word count for synthetic examples
    if (type === 'synthetic') {
        const wordCount = countWords(clause_text);
        if (wordCount < HYGIENE_RULES.MIN_WORDS) {
            reasons.push(`Too short: ${wordCount} words < ${HYGIENE_RULES.MIN_WORDS} minimum`);
        }
    }

    return {
        nonRoutable: reasons.length > 0,
        reasons
    };
}

function main() {
    console.log('CG-006.1.2: Dataset Hygiene Script');
    console.log('===================================\n');

    // Load dataset
    const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
    console.log(`Loaded ${dataset.length} examples\n`);

    // Apply hygiene rules
    let markedCount = 0;
    const markedExamples = [];

    for (const example of dataset) {
        const { nonRoutable, reasons } = shouldMarkNonRoutable(example);

        if (nonRoutable) {
            example.non_routable = true;
            example.non_routable_reasons = reasons;
            markedCount++;
            markedExamples.push({
                id: example.id,
                type: example.type,
                family: example.expected_family,
                reasons
            });
        }
    }

    // Save updated dataset
    fs.writeFileSync(DATASET_PATH, JSON.stringify(dataset, null, 2));
    console.log(`Marked ${markedCount} examples as NON_ROUTABLE\n`);

    // Print summary by family
    const byFamily = {};
    for (const ex of markedExamples) {
        byFamily[ex.family] = (byFamily[ex.family] || 0) + 1;
    }

    console.log('Marked examples by family:');
    console.log('--------------------------');
    for (const [family, count] of Object.entries(byFamily).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${family}: ${count}`);
    }

    console.log('\nDetails:');
    console.log('--------');
    for (const ex of markedExamples.slice(0, 20)) {
        console.log(`  ${ex.id}: ${ex.reasons[0]}`);
    }

    if (markedExamples.length > 20) {
        console.log(`  ... and ${markedExamples.length - 20} more`);
    }

    console.log('\n✓ Dataset updated. Run evaluation with --exclude-non-routable');
}

main();
