/**
 * test_e2e_pipeline.js
 * Test E2E del pipeline completo: upload → review → export
 * T-007: Testing E2E
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tests = {
    passed: 0,
    failed: 0,
    results: []
};

function log(message, status = 'info') {
    const icons = { pass: '✅', fail: '❌', info: 'ℹ️', test: '🧪' };
    console.log(`${icons[status] || ''} ${message}`);
}

function assert(condition, testName) {
    if (condition) {
        tests.passed++;
        tests.results.push({ name: testName, status: 'pass' });
        log(`${testName}`, 'pass');
    } else {
        tests.failed++;
        tests.results.push({ name: testName, status: 'fail' });
        log(`${testName}`, 'fail');
    }
}

async function runTests() {
    log('=== E2E Pipeline Test Suite ===\n', 'test');

    // Test 1: Database connectivity
    log('Test 1: Database Connectivity');
    const { data: docs, error: dbError } = await supabase
        .from('documents')
        .select('count')
        .limit(1);
    assert(!dbError, 'Database connection works');

    // Test 2: Monitoring dashboard RPC
    log('\nTest 2: Monitoring Dashboard');
    const { data: dashboard, error: dashError } = await supabase.rpc('get_monitoring_dashboard');
    assert(!dashError && dashboard, 'Monitoring dashboard RPC works');
    if (dashboard) {
        log(`  Documents: ${dashboard.overview?.total_documents || 0}`);
        log(`  Runs: ${dashboard.overview?.total_runs || 0}`);
        log(`  Examples: ${dashboard.overview?.total_examples || 0}`);
    }

    // Test 3: RAG search function
    log('\nTest 3: RAG Search');
    const testEmbedding = new Array(1536).fill(0.1);
    const { data: ragResults, error: ragError } = await supabase.rpc('search_policy_examples', {
        query_embedding: testEmbedding,
        match_threshold: 0.5,
        match_count: 5
    });
    assert(!ragError, 'RAG search RPC works');
    if (ragResults) {
        log(`  Found ${ragResults.length} similar examples`);
    }

    // Test 4: Policy examples with embeddings
    log('\nTest 4: Policy Examples Data');
    const { data: examples, count } = await supabase
        .from('policy_examples')
        .select('id, embedding', { count: 'exact' })
        .not('embedding', 'is', null)
        .limit(1);
    assert(count > 0, `Policy examples have embeddings (${count} found)`);

    // Test 5: Matters and clause types
    log('\nTest 5: Taxonomy Structure');
    const { data: matters } = await supabase.from('matters').select('id');
    const { data: clauseTypes } = await supabase.from('clause_types').select('id');
    assert(matters?.length >= 20, `Matters exist (${matters?.length || 0})`);
    assert(clauseTypes?.length >= 50, `Clause types exist (${clauseTypes?.length || 0})`);

    // Test 6: Contract runs
    log('\nTest 6: Contract Runs');
    const { data: runs } = await supabase
        .from('contract_runs')
        .select('run_id, status')
        .limit(5);
    assert(runs?.length > 0, `Contract runs exist (${runs?.length || 0})`);

    // Test 7: Superuser function
    log('\nTest 7: Superuser Function');
    const { data: isSuperuser, error: suError } = await supabase.rpc('is_superuser');
    assert(!suError, 'is_superuser() function accessible');

    // Test 8: Edge Functions accessible
    log('\nTest 8: Edge Functions');
    try {
        const monitoringUrl = `${process.env.SUPABASE_URL}/functions/v1/monitoring`;
        const response = await fetch(monitoringUrl, { method: 'POST' });
        assert(response.ok, 'Monitoring Edge Function responds');
    } catch (e) {
        assert(false, 'Monitoring Edge Function responds');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${tests.passed} passed, ${tests.failed} failed`);
    console.log('='.repeat(50));

    return tests.failed === 0;
}

// Run
runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
