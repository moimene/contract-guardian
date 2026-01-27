// load_missing_harvey.js
// Carga registros faltantes del JSONL a Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

const supabaseUrl = 'https://hvlsuwdqtffiilvampxq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getExistingTexts() {
    console.log('📊 Fetching existing policy_examples...');
    const { data, error } = await supabase
        .from('policy_examples')
        .select('example_text');

    if (error) throw error;
    return new Set(data.map(r => r.example_text.trim().substring(0, 200)));
}

async function getMatterPolicies() {
    const { data, error } = await supabase
        .from('matter_policies')
        .select('id, matters(code)')
        .order('id');

    if (error) throw error;

    const lookup = {};
    for (const mp of data) {
        lookup[mp.matters.code] = mp.id;
    }
    return lookup;
}

async function getClauseTypes() {
    const { data, error } = await supabase
        .from('clause_types')
        .select('id, code');

    if (error) throw error;

    const lookup = {};
    for (const ct of data) {
        lookup[ct.code] = ct.id;
    }
    return lookup;
}

async function loadMissingRecords() {
    const existingTexts = await getExistingTexts();
    const matterPolicies = await getMatterPolicies();
    const clauseTypes = await getClauseTypes();

    console.log(`📊 Existing: ${existingTexts.size} records`);
    console.log(`📊 Matter Policies: ${Object.keys(matterPolicies).length}`);
    console.log(`📊 Clause Types: ${Object.keys(clauseTypes).length}`);

    const fileStream = fs.createReadStream('Dataset /harvey_policy_examples_db_ready.jsonl');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const toInsert = [];
    let skipped = 0;
    let noMatter = 0;
    let noClauseType = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;

        const record = JSON.parse(line);
        const textKey = record.example_text.trim().substring(0, 200);

        // Skip if already exists
        if (existingTexts.has(textKey)) {
            skipped++;
            continue;
        }

        const matter_policy_id = matterPolicies[record.matter_code];
        const clause_type_id = clauseTypes[record.clause_type_code];

        if (!matter_policy_id) {
            noMatter++;
            continue;
        }

        if (!clause_type_id) {
            noClauseType++;
            continue;
        }

        toInsert.push({
            matter_policy_id,
            clause_type_id,
            acceptance: record.acceptance,
            example_text: record.example_text,
            normalized_terms: record.normalized_terms || [],
            source_ref: record.source_ref || null
        });
    }

    console.log(`\n📊 Analysis:`);
    console.log(`  - Already in DB: ${skipped}`);
    console.log(`  - Missing matter_policy: ${noMatter}`);
    console.log(`  - Missing clause_type: ${noClauseType}`);
    console.log(`  - To insert: ${toInsert.length}`);

    if (toInsert.length === 0) {
        console.log('✅ No new records to insert!');
        return;
    }

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('policy_examples').insert(batch);

        if (error) {
            console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        } else {
            inserted += batch.length;
            console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records`);
        }
    }

    console.log(`\n🎉 Total inserted: ${inserted}`);
}

loadMissingRecords().catch(console.error);
