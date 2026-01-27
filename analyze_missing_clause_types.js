// analyze_missing_clause_types.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hvlsuwdqtffiilvampxq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
    // Get clause_types from DB
    const { data: dbClauseTypes } = await supabase.from('clause_types').select('code');
    const dbCodes = new Set(dbClauseTypes.map(ct => ct.code));

    console.log('DB clause_types:', dbCodes.size);

    // Get clause_types from JSONL
    const lines = fs.readFileSync('Dataset /harvey_policy_examples_db_ready.jsonl', 'utf8').split('\n').filter(l => l.trim());
    const records = lines.map(l => JSON.parse(l));
    const jsonlCodes = new Set(records.map(r => r.clause_type_code));

    console.log('JSONL clause_types:', jsonlCodes.size);

    // Find missing
    const missing = [...jsonlCodes].filter(c => !dbCodes.has(c));
    console.log('Missing in DB:', missing.length);
    console.log('\nMissing clause_type_codes:');
    console.log(JSON.stringify(missing, null, 2));

    // Count records per missing clause_type
    console.log('\n=== Records per missing clause_type ===');
    const countByType = {};
    records.forEach(r => {
        if (!dbCodes.has(r.clause_type_code)) {
            countByType[r.clause_type_code] = (countByType[r.clause_type_code] || 0) + 1;
        }
    });
    console.log(JSON.stringify(countByType, null, 2));
}

analyze().catch(console.error);
