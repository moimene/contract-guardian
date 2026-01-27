// load_harvey_batches.js
// Execute Harvey dataset batches via Supabase Admin Client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://hvlsuwdqtffiilvampxq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function executeBatch(filename) {
  const filePath = path.join(__dirname, 'sql_batches', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📦 Executing ${filename}...`);
  const start = Date.now();
  
  try {
    // Use raw SQL execution via rpc if available, or pg_execute
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) throw error;
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ ${filename} completed in ${elapsed}s`);
    return true;
  } catch (err) {
    console.error(`❌ ${filename} failed:`, err.message);
    return false;
  }
}

async function main() {
  const batches = ['batch_001.sql', 'batch_002.sql', 'batch_003.sql', 
                   'batch_004.sql', 'batch_005.sql', 'batch_006.sql', 'batch_007.sql'];
  
  console.log('🚀 Starting Harvey Dataset Load...\n');
  
  // Check initial counts
  const { data: before } = await supabase.from('policy_examples').select('id', { count: 'exact', head: true });
  console.log(`📊 Before: ${before?.length || 0} policy_examples`);
  
  for (const batch of batches) {
    await executeBatch(batch);
  }
  
  // Check final counts
  const { count } = await supabase.from('policy_examples').select('id', { count: 'exact', head: true });
  console.log(`\n📊 After: ${count} policy_examples`);
  console.log('✨ Done!');
}

main().catch(console.error);
