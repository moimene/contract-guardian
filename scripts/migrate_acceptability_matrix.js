/**
 * CG-011: Acceptability Matrix Migration Script
 * 
 * Migra playbook_specs.acceptability_matrix de strings simples a objetos estructurados
 * con pattern/example/reason/risk_level extraídos de los archivos YAML fuente.
 * 
 * Usage:
 *   node scripts/migrate_acceptability_matrix.js --dry-run    # Preview changes
 *   node scripts/migrate_acceptability_matrix.js --execute    # Apply to Supabase
 *   node scripts/migrate_acceptability_matrix.js --verify     # Check migration status
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLAYBOOK_DIR = path.join(__dirname, '../playbook_specs');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvlsuwdqtffiilvampxq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ============================================================================
// YAML PARSING
// ============================================================================

function loadPlaybookYAML(familyId) {
    // List all YAML files in the directory
    const files = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith('.yaml'));

    // Find matching files (case-insensitive match on family_id in content or filename)
    const matchingFiles = files.filter(f => {
        const baseName = f.replace('.yaml', '').toLowerCase().replace(/_/g, '');
        const familyLower = familyId.toLowerCase();
        return baseName === familyLower || baseName.includes(familyLower) || familyLower.includes(baseName);
    });

    // Sort by file size (larger = v2 format with more detail) and prefer snake_case names
    matchingFiles.sort((a, b) => {
        const sizeA = fs.statSync(path.join(PLAYBOOK_DIR, a)).size;
        const sizeB = fs.statSync(path.join(PLAYBOOK_DIR, b)).size;
        // Prefer larger files (v2 format)
        return sizeB - sizeA;
    });

    for (const filename of matchingFiles) {
        const filePath = path.join(PLAYBOOK_DIR, filename);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = yaml.parse(content);

            // Verify family_id matches
            if (parsed.family_id === familyId) {
                const format = parsed.acceptability ? 'v2' : 'v1';
                console.log(`   ✓ Loaded ${filename} (${format} format)`);
                return parsed;
            }
        } catch (e) {
            console.warn(`   ⚠️  YAML parse error in ${filename}: ${e.message}`);
        }
    }

    console.warn(`  ⚠️  No YAML found for ${familyId}`);
    return null;
}

function extractAcceptableExamples(yamlData) {
    const acceptable = yamlData?.acceptability?.acceptable || {};
    const examples = [];

    // Extract from example_acceptable array
    if (acceptable.example_acceptable) {
        acceptable.example_acceptable.forEach((item, idx) => {
            examples.push({
                id: `acc-${String(idx + 1).padStart(3, '0')}`,
                pattern: item.notes || 'Standard acceptable clause',
                example: typeof item === 'string' ? item : (item.text || '').trim(),
                reason: 'Fully meets Amazon standard position',
                risk_level: 'NONE',
                confidence: item.confidence || 0.95
            });
        });
    }

    // Extract required_elements as patterns
    if (acceptable.required_elements) {
        acceptable.required_elements.forEach((elem, idx) => {
            examples.push({
                id: `acc-req-${String(idx + 1).padStart(3, '0')}`,
                pattern: typeof elem === 'string' ? elem : (elem.element || elem),
                example: elem.note || null,
                reason: 'Required element for acceptability',
                risk_level: 'NONE'
            });
        });
    }

    return examples;
}

function extractPassableVariations(yamlData) {
    const passable = yamlData?.acceptability?.passable || {};
    const variations = [];

    // Extract from passable_variations array
    const sourceVariations = passable.passable_variations || passable.variations || [];

    sourceVariations.forEach((item, idx) => {
        variations.push({
            id: `pas-${String(idx + 1).padStart(3, '0')}`,
            pattern: item.variation || item.pattern || item,
            condition: item.condition || null,
            example: (item.example || '').trim() || null,
            reason: item.notes || item.reason || null,
            risk_level: item.risk_level || 'MEDIUM'
        });
    });

    return variations;
}

function extractUnacceptablePatterns(yamlData) {
    // Support both v1 (unacceptable_deviations) and v2 (acceptability.unacceptable) formats
    const unacceptable = yamlData?.acceptability?.unacceptable || {};
    const patterns = [];

    // v2 format: acceptability.unacceptable.unacceptable_patterns
    const v2Patterns = unacceptable.unacceptable_patterns || unacceptable.patterns || [];

    // v1 format: unacceptable_deviations (at root level)
    const v1Patterns = yamlData?.unacceptable_deviations || [];

    const sourcePatterns = v2Patterns.length > 0 ? v2Patterns : v1Patterns;

    sourcePatterns.forEach((item, idx) => {
        if (typeof item === 'string') {
            patterns.push({
                id: `unacc-${String(idx + 1).padStart(3, '0')}`,
                pattern: item,
                example: null,
                reason: null,
                risk_level: 'HIGH'
            });
        } else {
            // v2 format: {pattern, example, reason, risk_level}
            // v1 format: {id, description, text_patterns, amazon_position}
            const patternText = item.pattern || item.description || '';
            const example = item.example ||
                (item.text_patterns ? item.text_patterns[0] : null) ||
                null;
            const reason = item.reason || item.amazon_position || null;

            patterns.push({
                id: item.id || `unacc-${String(idx + 1).padStart(3, '0')}`,
                pattern: patternText,
                example: typeof example === 'string' ? example.trim() : null,
                reason: typeof reason === 'string' ? reason.trim().substring(0, 500) : null,
                risk_level: item.risk_level || (item.action === 'REJECT' ? 'CRITICAL' : 'HIGH')
            });
        }
    });

    return patterns;
}

function buildEnrichedMatrix(yamlData) {
    if (!yamlData) return null;

    return {
        acceptable: {
            description: yamlData?.acceptability?.acceptable?.description || 'Language that fully protects Amazon\'s interests',
            examples: extractAcceptableExamples(yamlData)
        },
        passable: {
            description: yamlData?.acceptability?.passable?.description || 'Language that provides adequate protection with minor gaps',
            requires_approval: yamlData?.acceptability?.passable?.requires_approval || 'AMAZON_LEGAL',
            variations: extractPassableVariations(yamlData)
        },
        unacceptable: {
            description: yamlData?.acceptability?.unacceptable?.description || 'Language that fails to protect Amazon adequately',
            action: yamlData?.acceptability?.unacceptable?.action || 'REJECT or escalate to Senior Legal',
            patterns: extractUnacceptablePatterns(yamlData)
        }
    };
}

// ============================================================================
// SUPABASE OPERATIONS
// ============================================================================

async function fetchCurrentSpecs() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/playbook_specs?select=family_id,version,acceptability_matrix`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch specs: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

async function updateSpec(familyId, newMatrix, newVersion) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/playbook_specs?family_id=eq.${familyId}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                acceptability_matrix: newMatrix,
                version: newVersion,
                updated_at: new Date().toISOString()
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update ${familyId}: ${response.status} ${await response.text()}`);
    }

    return true;
}

async function backupMatrix(familyId, currentMatrix) {
    // Store backup in a separate column if it exists, or log to file
    const backupPath = path.join(__dirname, '../.backups');
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }

    fs.writeFileSync(
        path.join(backupPath, `${familyId}_matrix_backup.json`),
        JSON.stringify(currentMatrix, null, 2)
    );
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

async function migrate(options = { dryRun: true }) {
    console.log('\n🔄 CG-011: Acceptability Matrix Migration');
    console.log(`   Mode: ${options.dryRun ? 'DRY RUN (preview only)' : '⚡ EXECUTE (applying changes)'}\n`);

    // 1. Load current specs from Supabase
    console.log('📥 Fetching current playbook_specs from Supabase...');
    const currentSpecs = await fetchCurrentSpecs();
    console.log(`   Found ${currentSpecs.length} specs\n`);

    const results = {
        success: [],
        noYaml: [],
        errors: []
    };

    for (const spec of currentSpecs) {
        const familyId = spec.family_id;
        console.log(`\n📋 Processing: ${familyId}`);

        try {
            // 2. Load YAML source
            const yamlData = loadPlaybookYAML(familyId);

            if (!yamlData) {
                results.noYaml.push(familyId);
                continue;
            }

            // 3. Build enriched matrix
            const enrichedMatrix = buildEnrichedMatrix(yamlData);

            // 4. Compare and report
            const currentPatternCount = (spec.acceptability_matrix?.unacceptable?.patterns || []).length;
            const newPatternCount = enrichedMatrix.unacceptable.patterns.length;
            const newVariationCount = enrichedMatrix.passable.variations.length;
            const newExampleCount = enrichedMatrix.acceptable.examples.length;

            console.log(`   ├─ Acceptable: ${newExampleCount} examples`);
            console.log(`   ├─ Passable: ${newVariationCount} variations`);
            console.log(`   ├─ Unacceptable: ${currentPatternCount} → ${newPatternCount} patterns`);

            // Show sample of enriched data
            if (enrichedMatrix.unacceptable.patterns.length > 0) {
                const sample = enrichedMatrix.unacceptable.patterns[0];
                console.log(`   └─ Sample: "${sample.pattern}"`);
                if (sample.reason) console.log(`      └─ Reason: "${sample.reason.substring(0, 60)}..."`);
            }

            // 5. Execute update if not dry run
            if (!options.dryRun) {
                // Backup first
                await backupMatrix(familyId, spec.acceptability_matrix);

                // Update
                const newVersion = (parseFloat(spec.version || '2.0') + 0.1).toFixed(1);
                await updateSpec(familyId, enrichedMatrix, newVersion);
                console.log(`   ✅ Updated to v${newVersion}`);
            }

            results.success.push({
                familyId,
                acceptable: newExampleCount,
                passable: newVariationCount,
                unacceptable: newPatternCount
            });

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.errors.push({ familyId, error: error.message });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${results.success.length}`);
    console.log(`⚠️  No YAML: ${results.noYaml.length} (${results.noYaml.join(', ')})`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (options.dryRun) {
        console.log('\n💡 This was a DRY RUN. Run with --execute to apply changes.');
    } else {
        console.log('\n🎉 Migration completed! Backups saved to .backups/');
    }

    return results;
}

async function verify() {
    console.log('\n🔍 Verifying migration status...\n');

    const specs = await fetchCurrentSpecs();

    let migrated = 0;
    let legacy = 0;

    for (const spec of specs) {
        const firstPattern = spec.acceptability_matrix?.unacceptable?.patterns?.[0];
        const isMigrated = firstPattern && typeof firstPattern === 'object' && firstPattern.pattern;

        if (isMigrated) {
            migrated++;
            console.log(`✅ ${spec.family_id} - Migrated (v${spec.version})`);
        } else {
            legacy++;
            console.log(`❌ ${spec.family_id} - Legacy format (v${spec.version})`);
        }
    }

    console.log(`\n📊 ${migrated}/${specs.length} specs migrated`);

    return { migrated, legacy, total: specs.length };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (!SUPABASE_KEY) {
        console.error('❌ SUPABASE_SERVICE_KEY environment variable required');
        console.log('   export SUPABASE_SERVICE_KEY="your-key"');
        process.exit(1);
    }

    if (args.includes('--verify')) {
        await verify();
    } else if (args.includes('--execute')) {
        await migrate({ dryRun: false });
    } else {
        // Default: dry run
        await migrate({ dryRun: true });
    }
}

// Export for programmatic use
module.exports = { migrate, verify, loadPlaybookYAML, buildEnrichedMatrix };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
