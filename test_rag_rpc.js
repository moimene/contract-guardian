/**
 * Test RAG Search RPC
 */
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRAG() {
    // Create a dummy embedding (all 0.1)
    const dummyEmbedding = Array(1536).fill(0.1);

    console.log('Testing RAG search_policy_examples RPC...');
    console.log('URL:', `${SUPABASE_URL}/rest/v1/rpc/search_policy_examples`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_policy_examples`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query_embedding: dummyEmbedding,
            match_threshold: 0.5,
            match_count: 3
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Error:', response.status, error);
        return;
    }

    const results = await response.json();
    console.log('\n✅ RAG Search Results:');
    console.log('Found:', results.length, 'examples');

    results.forEach((r, i) => {
        console.log(`\n[${i + 1}] ${r.acceptance} (similarity: ${(r.similarity * 100).toFixed(1)}%)`);
        console.log(`   Clause Type: ${r.clause_type_name}`);
        console.log(`   Text: ${r.example_text?.substring(0, 100)}...`);
    });
}

testRAG().catch(console.error);
