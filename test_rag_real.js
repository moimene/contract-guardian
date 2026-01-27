/**
 * Test RAG with Real Embedding
 */
require('dotenv').config();
const OpenAI = require('openai');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testRAGWithRealEmbedding() {
    // Sample clause text
    const clauseText = "Amazon shall own exclusively, in perpetuity, throughout the universe, all right, title and interest in and to the Program and all Materials.";

    console.log('📝 Clause:', clauseText.substring(0, 80) + '...');
    console.log('\n1️⃣ Generating embedding with OpenAI...');

    // Generate real embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: clauseText,
        dimensions: 1536
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log('   ✅ Embedding generated (length:', embedding.length, ')');

    console.log('\n2️⃣ Searching similar examples via RAG...');

    // Call RAG search
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_policy_examples`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Error:', response.status, error);
        return;
    }

    const results = await response.json();
    console.log('   ✅ Found:', results.length, 'similar examples');

    if (results.length > 0) {
        console.log('\n📊 Top Results:');
        console.log('━'.repeat(60));

        results.forEach((r, i) => {
            const similarity = (r.similarity * 100).toFixed(1);
            console.log(`\n[${i + 1}] ${r.acceptance} (${similarity}% similar)`);
            console.log(`    Clause Type: ${r.clause_type_name || 'N/A'}`);
            console.log(`    Text: "${r.example_text?.substring(0, 120)}..."`);
        });

        console.log('\n━'.repeat(60));
        console.log('\n✅ RAG Search is working correctly!');
    } else {
        console.log('\n⚠️ No similar examples found. Try lowering match_threshold.');
    }
}

testRAGWithRealEmbedding().catch(console.error);
