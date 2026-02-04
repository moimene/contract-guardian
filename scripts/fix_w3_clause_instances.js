/**
 * W3 Hardening Script: Fix clause_instances UUID Insert Issue
 * 
 * Fixes:
 * 1. Add UUID validation in Format & Split
 * 2. Remove onError:continueRegularOutput from Insert Clauses (fail-fast)
 * 3. Add Verify Insert Count node
 * 
 * Run: node scripts/fix_w3_clause_instances.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W3 ContractReview - Stability v3 (Real Extraction).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W3 ContractReview - Stability v3.1 (UUID Hardened).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('W3 Hardening: Fixing clause_instances UUID Insert Issue');
console.log('=======================================================');

// Fix 1: Update Format & Split with UUID validation
const formatSplit = workflow.nodes.find(n => n.name === 'Format & Split');
if (formatSplit) {
    const newCode = `const prevJson = $('Pre-calc Params').first().json;
const aiResponse = $json;

// UUID generator compatible with n8n Cloud
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// UUID validator (PO-mandated hardening)
const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// Validate required UUIDs before proceeding
if (!isUuid(prevJson.document_id)) {
  throw new Error(\`Invalid document_id UUID: \${prevJson.document_id}\`);
}
if (!isUuid(prevJson.run_id)) {
  throw new Error(\`Invalid run_id UUID: \${prevJson.run_id}\`);
}

let clauses = [];
try {
  const content = aiResponse.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  clauses = parsed.clauses || parsed.items || (Array.isArray(parsed) ? parsed : []);
} catch (e) {
  console.log('Parse error:', e.message);
}

if (clauses.length === 0) {
  throw new Error('AI Parse returned 0 clauses - cannot proceed with empty extraction');
}

return clauses.map((c, i) => ({
  json: {
    ...prevJson,
    clause_instance_id: uuid(),
    clause_id: c.clause_id || \`clause_\${i+1}\`,
    clause_text: c.clause_text || c.text || '',
    heading: c.heading || '',
    total_clauses: clauses.length,
    clause_index: i
  }
}));`;

    formatSplit.parameters.jsCode = newCode;
    console.log('✓ Fix 1: Updated Format & Split with UUID validation');
}

// Fix 2: Remove onError from Insert Clauses (fail-fast)
const insertClauses = workflow.nodes.find(n => n.name === 'Insert Clauses');
if (insertClauses) {
    delete insertClauses.onError;
    console.log('✓ Fix 2: Removed onError from Insert Clauses (now fail-fast)');
}

// Fix 3: Add Verify Insert Count node
const verifyNode = {
    parameters: {
        jsCode: `// PO-mandated: Verify insert succeeded before calling W2
const insertResult = $json;

// Check if we have data (Insert Clauses returns the inserted row with Prefer: return=representation)
if (!insertResult || !insertResult.id) {
  throw new Error('Insert Clauses failed - no ID returned. Check Supabase logs for constraint violations.');
}

// Log success for observability
console.log(\`✓ Clause inserted: \${insertResult.id}\`);

return [{ json: insertResult }];`
    },
    id: 'verify_insert',
    name: 'Verify Insert',
    position: [1700, 304],
    type: 'n8n-nodes-base.code',
    typeVersion: 2
};

// Find if Verify Insert already exists
const existingVerify = workflow.nodes.find(n => n.name === 'Verify Insert');
if (!existingVerify) {
    workflow.nodes.push(verifyNode);
    console.log('✓ Fix 3: Added Verify Insert node');

    // Update connections: Insert Clauses -> Verify Insert -> Call W2 Review
    if (workflow.connections['Insert Clauses']) {
        // Save current connection to Call W2
        const callW2Connection = workflow.connections['Insert Clauses'];

        // Insert Clauses now goes to Verify Insert
        workflow.connections['Insert Clauses'] = {
            main: [[{ node: 'Verify Insert', type: 'main', index: 0 }]]
        };

        // Verify Insert goes to Call W2
        workflow.connections['Verify Insert'] = callW2Connection;

        console.log('✓ Updated connections: Insert Clauses → Verify Insert → Call W2');
    }
} else {
    console.log('⚠ Verify Insert node already exists, skipping');
}

// Update workflow name
workflow.name = 'W3 ContractReview - Stability v3.1 (UUID Hardened)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log('');
console.log('Nodes: ' + workflow.nodes.length);
console.log('Saved to: ' + OUTPUT_FILE);
console.log('');
console.log('Ready for n8n import');
console.log('');
console.log('After import:');
console.log('1. Activate W3 v3.1');
console.log('2. Deactivate W3 v3');
console.log('3. Run E2E test');
