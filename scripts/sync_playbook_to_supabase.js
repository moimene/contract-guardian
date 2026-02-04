#!/usr/bin/env node
/**
 * Sync Playbook YAML to Supabase
 * ================================
 * Usage: node scripts/sync_playbook_to_supabase.js [family_id]
 * 
 * Examples:
 *   node scripts/sync_playbook_to_supabase.js IndemnityProdCo
 *   node scripts/sync_playbook_to_supabase.js --all
 * 
 * Environment variables required:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

// Configuration
const PLAYBOOK_DIR = path.join(__dirname, '..', 'playbook_specs');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cjblkdjyjdcpmmscnwzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable required');
    console.log('   Set it with: export SUPABASE_SERVICE_KEY="your-key"');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Parse a YAML playbook file and extract relevant fields for Supabase
 */
function parsePlaybook(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.parse(content);

    if (!data.family_id) {
        throw new Error(`Missing family_id in ${filePath}`);
    }

    // Build the detection_patterns object
    const detectionPatterns = data.detection_patterns || {};

    // Also extract red_flags from unacceptable_deviations if not in detection_patterns
    if (!detectionPatterns.red_flags && data.unacceptable_deviations) {
        const extractedFlags = [];
        for (const dev of data.unacceptable_deviations) {
            if (dev.text_patterns) {
                extractedFlags.push(...dev.text_patterns);
            }
            if (dev.text_pattern) {
                extractedFlags.push(dev.text_pattern);
            }
        }
        if (extractedFlags.length > 0) {
            detectionPatterns.red_flags = extractedFlags.filter(Boolean);
        }
    }

    // Build acceptability_matrix from deviations
    const acceptabilityMatrix = data.acceptability_matrix || {
        acceptable: {
            description: '',
            examples: (data.acceptable_deviations || []).map((d, i) => ({
                id: d.id || `acc-${i + 1}`,
                pattern: d.description || '',
                example: d.text_pattern || '',
                reason: d.guidance || d.amazon_position || '',
                risk_level: 'NONE'
            }))
        },
        passable: {
            description: '',
            requires_approval: 'OC_DISCRETION',
            variations: (data.acceptable_deviations || []).filter(d => d.approval_required).map((d, i) => ({
                id: d.id || `pas-${i + 1}`,
                pattern: d.description || '',
                condition: d.guidance || '',
                example: d.text_pattern || '',
                reason: d.amazon_position || '',
                risk_level: 'MEDIUM'
            }))
        },
        unacceptable: {
            description: '',
            action: 'REJECT',
            patterns: (data.unacceptable_deviations || []).map((d, i) => ({
                id: d.id || `unacc-${i + 1}`,
                pattern: d.description || '',
                example: (d.text_patterns || []).join('; ') || d.text_pattern || '',
                reason: d.amazon_position || '',
                risk_level: 'CRITICAL'
            }))
        }
    };

    // Build amazon_position
    const amazonPosition = data.amazon_position || {
        summary: data.standard_position || '',
        core_requirements: []
    };

    // Build risk_assessment
    const riskAssessment = data.risk_assessment || {
        escalation_triggers: []
    };

    return {
        family_id: data.family_id,
        display_name: data.rule_name || data.family_id,
        priority: data.priority || 'MEDIUM',
        requires_legal_review: data.priority === 'CRITICAL',
        psa_section: data.psa_section || null,

        // Core data
        amazon_position: amazonPosition,
        standard_position: data.standard_position || '',
        acceptability_matrix: acceptabilityMatrix,
        detection_patterns: detectionPatterns,
        risk_assessment: riskAssessment,
        negotiation_guidance: data.negotiation_guidance || null,

        // Metadata
        updated_at: new Date().toISOString()
    };
}

/**
 * Sync a single playbook to Supabase
 */
async function syncPlaybook(familyId) {
    const filePath = path.join(PLAYBOOK_DIR, `${familyId}.yaml`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }

    console.log(`📄 Parsing ${familyId}.yaml...`);

    try {
        const playbookData = parsePlaybook(filePath);

        console.log(`   detection_patterns.red_flags: ${(playbookData.detection_patterns.red_flags || []).length} items`);
        console.log(`   detection_patterns.must_have: ${(playbookData.detection_patterns.must_have || []).length} items`);
        console.log(`   acceptability_matrix.unacceptable.patterns: ${(playbookData.acceptability_matrix.unacceptable?.patterns || []).length} items`);

        console.log(`⬆️  Upserting to Supabase...`);

        const { data, error } = await supabase
            .from('playbook_specs')
            .upsert(playbookData, {
                onConflict: 'family_id',
                returning: 'minimal'
            });

        if (error) {
            console.error(`❌ Supabase error: ${error.message}`);
            console.error(`   Details: ${JSON.stringify(error)}`);
            return false;
        }

        console.log(`✅ ${familyId} synced successfully!`);
        return true;

    } catch (e) {
        console.error(`❌ Error processing ${familyId}: ${e.message}`);
        return false;
    }
}

/**
 * Sync all playbooks in the directory
 */
async function syncAll() {
    const files = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith('.yaml'));

    console.log(`\n📂 Found ${files.length} playbook files\n`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        const familyId = file.replace('.yaml', '');
        const result = await syncPlaybook(familyId);
        if (result) success++;
        else failed++;
        console.log('');
    }

    console.log(`\n📊 Summary: ${success} synced, ${failed} failed\n`);
}

// Main
async function main() {
    const arg = process.argv[2];

    if (!arg) {
        console.log('Usage: node sync_playbook_to_supabase.js [family_id | --all]');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/sync_playbook_to_supabase.js IndemnityProdCo');
        console.log('  node scripts/sync_playbook_to_supabase.js --all');
        process.exit(1);
    }

    console.log(`\n🔄 Playbook Sync Tool`);
    console.log(`   Supabase: ${SUPABASE_URL}`);
    console.log(`   Playbook dir: ${PLAYBOOK_DIR}\n`);

    if (arg === '--all') {
        await syncAll();
    } else {
        await syncPlaybook(arg);
    }
}

main().catch(console.error);
