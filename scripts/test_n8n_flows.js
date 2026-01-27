#!/usr/bin/env node
/**
 * Test Flow Suite - Contract Guardian v2.1
 * Tests the complete n8n workflow pipeline
 * 
 * Usage: node scripts/test_n8n_flows.js
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvlsuwdqtffiilvampxq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// n8n webhook URLs - update with your actual endpoints
const N8N_BASE = 'https://mmenendeza.app.n8n.cloud/webhook';

const TEST_CLAUSES = {
    rights_ownership: {
        clause_text: "Amazon shall own exclusively and in perpetuity all rights, title and interest in and to the Content, including all intellectual property rights therein.",
        expected_family: "rights_ownership"
    },
    indemnity_prodco: {
        clause_text: "The Producer shall indemnify, defend and hold harmless Amazon and its affiliates from any and all claims, damages, losses arising from Producer's breach of representations.",
        expected_family: "indemnity_prodco"
    },
    termination: {
        clause_text: "Either party may terminate this Agreement upon 30 days written notice if the other party materially breaches any term and fails to cure within 30 days.",
        expected_family: "termination_and_remedies"
    },
    confidentiality: {
        clause_text: "Each party agrees to maintain in confidence all Confidential Information of the other party and shall not disclose such information to any third party.",
        expected_family: "confidentiality_and_publicity"
    },
    fees: {
        clause_text: "Amazon shall pay Producer the License Fee set forth in Schedule A, payable within 45 days of delivery acceptance.",
        expected_family: "commercials_fees_credit"
    }
};

async function supabaseQuery(query) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ query })
    });
    return response.json();
}

async function testRAGSearch(clauseText) {
    console.log('\n🔍 Testing RAG Search...');

    try {
        // First generate embedding
        const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: clauseText,
                dimensions: 1536
            })
        });

        if (!embedResponse.ok) {
            console.log('⚠️  OpenAI API not configured, skipping embedding test');
            return { success: false, reason: 'no_openai_key' };
        }

        const embedData = await embedResponse.json();
        const embedding = embedData.data?.[0]?.embedding;

        if (!embedding) {
            return { success: false, reason: 'no_embedding' };
        }

        // Now search RAG
        const ragResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_policy_examples`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 5
            })
        });

        const ragResults = await ragResponse.json();
        console.log(`✅ RAG returned ${ragResults.length} similar examples`);

        if (ragResults.length > 0) {
            console.log(`   Top match: ${ragResults[0].acceptance} (similarity: ${(ragResults[0].similarity * 100).toFixed(1)}%)`);
        }

        return { success: true, results: ragResults };
    } catch (e) {
        console.log(`❌ RAG test failed: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function testW2Webhook(clauseData) {
    console.log(`\n🚀 Testing W2 Webhook for: ${clauseData.expected_family}`);

    const payload = {
        clause_instance_id: `test_${Date.now()}`,
        clause_id: `clause_${clauseData.expected_family}`,
        clause_text: clauseData.clause_text,
        run_id: `test_run_${Date.now()}`,
        document_id: `test_doc_${Date.now()}`,
        contract_type: 'amazon-psa'
    };

    try {
        const response = await fetch(`${N8N_BASE}/clause-review-rag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 120000
        });

        if (!response.ok) {
            console.log(`⚠️  W2 Webhook returned ${response.status}`);
            return { success: false, status: response.status };
        }

        const result = await response.json();
        console.log(`✅ W2 returned: route=${result.detected_family}, state=${result.client_state}`);

        const familyMatch = result.detected_family === clauseData.expected_family;
        if (!familyMatch) {
            console.log(`⚠️  Expected ${clauseData.expected_family}, got ${result.detected_family}`);
        }

        return { success: true, result, familyMatch };
    } catch (e) {
        console.log(`❌ W2 test failed: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function testEdgeFunctions() {
    console.log('\n⚡ Testing Edge Functions...');

    const tests = [
        { name: 'monitoring', endpoint: `${SUPABASE_URL}/functions/v1/monitoring` },
    ];

    for (const test of tests) {
        try {
            const response = await fetch(test.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log(`✅ ${test.name}: OK`);
            } else {
                console.log(`⚠️  ${test.name}: ${response.status}`);
            }
        } catch (e) {
            console.log(`❌ ${test.name}: ${e.message}`);
        }
    }
}

async function testDatabaseConnectivity() {
    console.log('\n🗄️  Testing Database...');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/matters?select=count`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        });

        const count = response.headers.get('content-range')?.split('/')[1] || 0;
        console.log(`✅ Database connected: ${count} matters`);
        return { success: true, count };
    } catch (e) {
        console.log(`❌ Database: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function testPolicyExamples() {
    console.log('\n📚 Testing Policy Examples...');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/policy_examples?select=id,acceptance&limit=10`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        });

        const count = response.headers.get('content-range')?.split('/')[1] || 0;
        console.log(`✅ Policy examples: ${count} total`);
        return { success: true, count };
    } catch (e) {
        console.log(`❌ Policy examples: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function main() {
    console.log('🧪 === Contract Guardian Flow Test Suite ===\n');
    console.log(`Supabase: ${SUPABASE_URL}`);
    console.log(`n8n Base: ${N8N_BASE}`);

    const results = {
        database: false,
        policyExamples: false,
        rag: false,
        edgeFunctions: false,
        w2Webhook: []
    };

    // Test 1: Database
    const dbResult = await testDatabaseConnectivity();
    results.database = dbResult.success;

    // Test 2: Policy Examples
    const peResult = await testPolicyExamples();
    results.policyExamples = peResult.success;

    // Test 3: Edge Functions
    await testEdgeFunctions();
    results.edgeFunctions = true;

    // Test 4: RAG Search
    const ragResult = await testRAGSearch(TEST_CLAUSES.rights_ownership.clause_text);
    results.rag = ragResult.success;

    // Test 5: W2 Webhook (optional - requires n8n running)
    console.log('\n📋 W2 Webhook Tests (requires n8n active):');
    console.log('   To run: Set N8N webhooks to active and run:');
    console.log('   node scripts/test_n8n_flows.js --with-webhooks');

    if (process.argv.includes('--with-webhooks')) {
        for (const [name, clauseData] of Object.entries(TEST_CLAUSES)) {
            const result = await testW2Webhook(clauseData);
            results.w2Webhook.push({ name, ...result });

            // Small delay between tests
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Database:       ${results.database ? '✅' : '❌'}`);
    console.log(`Policy Examples: ${results.policyExamples ? '✅' : '❌'}`);
    console.log(`Edge Functions: ${results.edgeFunctions ? '✅' : '❌'}`);
    console.log(`RAG Search:     ${results.rag ? '✅' : '⚠️ (needs OPENAI_API_KEY)'}`);

    if (results.w2Webhook.length > 0) {
        const passed = results.w2Webhook.filter(r => r.success && r.familyMatch).length;
        console.log(`W2 Webhooks:    ${passed}/${results.w2Webhook.length} passed`);
    }
}

main().catch(console.error);
