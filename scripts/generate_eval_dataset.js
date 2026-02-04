/**
 * Router Evaluation Dataset Generator (Enhanced)
 * CG-006: Extracts golden, near-miss, and synthetic examples from playbook specs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const PLAYBOOK_DIR = path.join(__dirname, '../playbook_specs');
const OUTPUT_FILE = path.join(__dirname, '../n8n/test_payloads/router_eval_dataset.json');

// Map playbook family_id to CANONICAL_FAMILIES (from Router v4.2)
const FAMILY_MAPPING = {
    'ForceMajeure': 'ForceMajeure',
    'IndemnityProdCo': 'IndemnityProdCo',
    'IndemnityAmazon': 'IndemnityAmazon',
    'IndemnityProcedures': 'IndemnityProcedures',
    'LiabilityLimitation': 'LiabilityLimitation',
    'RightsGrant': 'RightsGrant',
    'RepsProdCo': 'RepsProdCo',
    'ServicesScope': 'ServicesScope',
    'AmazonControl': 'AmazonControl',
    'DataProtection': 'DataProtection',
    'DataPrivacy': 'DataProtection', // CG-006.1: merged into DataProtection
    'DisputeResolution': 'DisputeResolution',
    'Assignment': 'Assignment',
    'ConditionsPrecedent': 'ConditionsPrecedent',
    'EntitlementsCredit': 'ThirdPartyCredits',
    'Fees': 'PaymentCredits',
    'PowerOfAttorney': 'GeneralProvisions',
    'InjunctiveReliefWaiver': 'InjunctiveReliefWaiver',
    'StandardTerms': 'GeneralProvisions',
    'audit_rights': 'AuditRights',
    'confidentiality': 'Confidentiality',
    'dispute_resolution': 'DisputeResolution',
    'force_majeure': 'ForceMajeure',
    'indemnity_amazon': 'IndemnityAmazon',
    'indemnity_procedures': 'IndemnityProcedures',
    'indemnity_prodco': 'IndemnityProdCo',
    'insurance': 'Insurance',
    'liability_limitation': 'LiabilityLimitation',
    'payment_credits': 'PaymentCredits',
    'reps_prodco': 'RepsProdCo',
    'rights_grant': 'RightsGrant',
    'rights_reversion': 'RightsReversion',
    'survival_remedies': 'SurvivalRemedies',
    'termination_consequences': 'TerminationConsequences',
    'termination_rights': 'TerminationRights'
};

function extractExamples() {
    const dataset = [];
    const files = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith('.yaml'));

    console.log(`Found ${files.length} playbook specs\n`);

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(PLAYBOOK_DIR, file), 'utf8');
            const spec = yaml.parse(content);

            const rawFamily = spec.family_id || path.basename(file, '.yaml');
            const canonicalFamily = FAMILY_MAPPING[rawFamily] || rawFamily;
            let count = 0;

            // 1. GOLDEN: standard_position (canonical clause text)
            if (spec.standard_position && spec.standard_position.length > 50) {
                dataset.push({
                    id: `${canonicalFamily}-STD-001`,
                    clause_text: spec.standard_position.trim(),
                    expected_family: canonicalFamily,
                    source: `${file}:standard_position`,
                    type: 'golden'
                });
                count++;
            }

            // 2. VARIANTS: acceptable deviations text_pattern
            if (spec.acceptable_deviations) {
                spec.acceptable_deviations.forEach((dev, i) => {
                    if (dev.text_pattern && typeof dev.text_pattern === 'string' && dev.text_pattern.length > 30) {
                        dataset.push({
                            id: `${canonicalFamily}-ACC-${String(i + 1).padStart(3, '0')}`,
                            clause_text: dev.text_pattern.trim(),
                            expected_family: canonicalFamily,
                            source: `${file}:acc:${dev.id || i}`,
                            type: 'variant'
                        });
                        count++;
                    }
                    // Near-miss: guidance contains context about the family
                    if (dev.guidance && dev.guidance.length > 100) {
                        dataset.push({
                            id: `${canonicalFamily}-GUIDE-${String(i + 1).padStart(3, '0')}`,
                            clause_text: dev.guidance.trim(),
                            expected_family: canonicalFamily,
                            source: `${file}:guidance:${dev.id || i}`,
                            type: 'near-miss'
                        });
                        count++;
                    }
                    // Near-miss: amazon_position
                    if (dev.amazon_position && dev.amazon_position.length > 80) {
                        dataset.push({
                            id: `${canonicalFamily}-AMZPOS-${String(i + 1).padStart(3, '0')}`,
                            clause_text: dev.amazon_position.trim(),
                            expected_family: canonicalFamily,
                            source: `${file}:amz_pos:${dev.id || i}`,
                            type: 'near-miss'
                        });
                        count++;
                    }
                });
            }

            // 3. NEGATIVE: unacceptable deviations amazon_position
            if (spec.unacceptable_deviations) {
                spec.unacceptable_deviations.forEach((dev, i) => {
                    if (dev.amazon_position && dev.amazon_position.length > 80) {
                        dataset.push({
                            id: `${canonicalFamily}-UNACC-${String(i + 1).padStart(3, '0')}`,
                            clause_text: dev.amazon_position.trim(),
                            expected_family: canonicalFamily,
                            source: `${file}:unacc:${dev.id || i}`,
                            type: 'negative'
                        });
                        count++;
                    }
                });
            }

            // 4. SYNTHETIC: Generate from trigger phrases
            if (spec.triggers && spec.triggers.primary) {
                spec.triggers.primary.slice(0, 2).forEach((trigger, i) => {
                    const synthetic = `The parties agree that ${trigger} shall be governed by the terms set forth herein, and any modifications thereto shall require written consent.`;
                    dataset.push({
                        id: `${canonicalFamily}-TRIG-${String(i + 1).padStart(3, '0')}`,
                        clause_text: synthetic,
                        expected_family: canonicalFamily,
                        source: `${file}:trigger:${trigger}`,
                        type: 'synthetic'
                    });
                    count++;
                });
            }

            console.log(`  ✓ ${file}: ${canonicalFamily} (${count} examples)`);

        } catch (err) {
            console.error(`  ✗ ${file}: ${err.message}`);
        }
    }

    return dataset;
}

function generateReport(dataset) {
    const byFamily = {};
    const byType = { golden: 0, variant: 0, 'near-miss': 0, negative: 0, synthetic: 0 };

    dataset.forEach(item => {
        if (!byFamily[item.expected_family]) {
            byFamily[item.expected_family] = 0;
        }
        byFamily[item.expected_family]++;
        byType[item.type] = (byType[item.type] || 0) + 1;
    });

    console.log('\n=== Dataset Summary ===');
    console.log(`Total examples: ${dataset.length}`);
    console.log(`Families covered: ${Object.keys(byFamily).length}`);
    console.log(`\nBy type: golden=${byType.golden}, variant=${byType.variant}, near-miss=${byType['near-miss']}, negative=${byType.negative}, synthetic=${byType.synthetic}`);
    console.log('\nBy family:');
    Object.entries(byFamily)
        .sort((a, b) => b[1] - a[1])
        .forEach(([family, count]) => {
            const bar = '█'.repeat(Math.min(count, 20));
            console.log(`  ${family.padEnd(25)} ${count.toString().padStart(3)} ${bar}`);
        });
}

// Main
console.log('CG-006: Router Evaluation Dataset Generator (Enhanced)\n');
const dataset = extractExamples();
generateReport(dataset);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
console.log(`\n✓ Saved ${dataset.length} examples to ${OUTPUT_FILE}`);
