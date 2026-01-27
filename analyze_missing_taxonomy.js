// analyze_missing_taxonomy.js
const fs = require('fs');

const lines = fs.readFileSync('Dataset /harvey_policy_examples_db_ready.jsonl', 'utf8').split('\n').filter(l => l.trim());
const records = lines.map(l => JSON.parse(l));

// DB matters (from query)
const dbMatters = new Set([
    'rights_ownership', 'miscellaneous_provisions', 'termination_and_remedies',
    'dispute_resolution', 'confidentiality_and_publicity', 'limitation_of_liability',
    'commercials_fees_credit', 'indemnity_amazon', 'insurance_requirements',
    'moral_rights', 'rw_prodco', 'indemnity_prodco', 'credit_entitlements',
    'confidentiality_npi_ai', 'rw_amazon', 'assignment', 'defense_settlement',
    'fees', 'limitation_liability_injunctive', 'data_tax_govlaw'
]);

// Find matters in JSONL not in DB
const jsonlMatters = new Set(records.map(r => r.matter_code));
const missingMatters = [...jsonlMatters].filter(m => !dbMatters.has(m));

console.log('=== JSONL Matters not in DB ===');
console.log(JSON.stringify(missingMatters, null, 2));

// Count records per missing matter
console.log('\n=== Records per missing matter ===');
const countByMatter = {};
records.forEach(r => {
    if (!dbMatters.has(r.matter_code)) {
        countByMatter[r.matter_code] = (countByMatter[r.matter_code] || 0) + 1;
    }
});
console.log(JSON.stringify(countByMatter, null, 2));
