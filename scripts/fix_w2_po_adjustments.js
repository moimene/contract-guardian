/**
 * CG-007: W2 v4.2.1 - PO Mandatory Adjustments
 * 
 * Fixes:
 * 1. Move embedding/RAG INSIDE LLM branch (cost optimization)
 * 2. Normalize routerOutput references to detected_family
 * 3. Fix connection flow for Merge node
 * 
 * Run: node scripts/fix_w2_po_adjustments.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2 (CG-007).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.1 (CG-007).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-007 W2 PO Adjustments');
console.log('========================');

// ================================================================
// ADJUSTMENT 1: Move embedding/RAG to LLM branch
// ================================================================

// Current positions of embedding nodes
const embedNodePos = [-4784, -148]; // Same as LLM Classification
const parseEmbedPos = [-4560, -148];
const ragSearchPos = [-4336, -148];
const parseRagPos = [-4112, -148];

// Find and update positions for embedding nodes to be in LLM branch
const generateEmbedding = workflow.nodes.find(n => n.name === 'Generate Clause Embedding');
const parseEmbedding = workflow.nodes.find(n => n.name === 'Parse Embedding');
const ragSearch = workflow.nodes.find(n => n.name === 'RAG: Search Similar Examples');
const parseRag = workflow.nodes.find(n => n.name === 'Parse RAG Results');

if (generateEmbedding) {
    generateEmbedding.position = [-4784, -248]; // Move to LLM branch row
}
if (parseEmbedding) {
    parseEmbedding.position = [-4560, -248];
}
if (ragSearch) {
    ragSearch.position = [-4336, -248];
}
if (parseRag) {
    parseRag.position = [-4112, -248];
}

console.log('✓ Adjustment 1: Repositioned embedding/RAG nodes to LLM branch');

// ================================================================
// ADJUSTMENT 2: Normalize routerOutput references
// ================================================================

// Find nodes that reference routerOutput.route and change to detected_family
const nodesToFix = ['Get Playbook Spec', 'Enrich Policy', 'Build Result', 'Detect Failures'];

for (const nodeName of nodesToFix) {
    const node = workflow.nodes.find(n => n.name === nodeName);
    if (node && node.parameters) {
        // Fix in jsCode
        if (node.parameters.jsCode) {
            node.parameters.jsCode = node.parameters.jsCode
                .replace(/routerOutput\.route/g, 'detected_family')
                .replace(/routerOutput\?\.route/g, 'detected_family');
        }
        // Fix in jsonBody
        if (node.parameters.jsonBody) {
            node.parameters.jsonBody = node.parameters.jsonBody
                .replace(/routerOutput\.route/g, 'detected_family')
                .replace(/routerOutput\?\.route/g, 'detected_family');
        }
    }
}

console.log('✓ Adjustment 2: Normalized routerOutput.route → detected_family');

// ================================================================
// ADJUSTMENT 3: Fix connection flow
// ================================================================

// New flow for LLM branch:
// IF LLM Required (true) → LLM Classification → Parse LLM → Generate Embedding → Parse Embedding → RAG → Parse RAG → Get Playbook
// IF LLM Required (false) → Merge Router Paths

// Update connections

// Parse LLM Result goes to Generate Embedding (for LLM path)
workflow.connections['Parse LLM Result'] = {
    main: [[{ node: 'Generate Clause Embedding', type: 'main', index: 0 }]]
};

// Update Parse Embedding to get data from Parse LLM Result (for LLM path)
const parseEmbeddingNode = workflow.nodes.find(n => n.name === 'Parse Embedding');
if (parseEmbeddingNode && parseEmbeddingNode.parameters.jsCode) {
    parseEmbeddingNode.parameters.jsCode = `const prevData = $('Parse LLM Result').first().json;
let embedding = null;

try {
  embedding = $json.data?.[0]?.embedding || null;
} catch (e) {
  console.log('Embedding parse error:', e.message);
}

return [{ json: { ...prevData, clauseEmbedding: embedding } }];`;
}

// IF LLM Required: true → LLM Classification, false → directly to routerOutput normalization
workflow.connections['IF LLM Required'] = {
    main: [
        [{ node: 'LLM Classification', type: 'main', index: 0 }], // true branch → LLM
        [{ node: 'Get Playbook Spec', type: 'main', index: 0 }]   // false branch → skip embedding, go to playbook
    ]
};

// Remove Merge Router Paths from connections - we're simplifying
delete workflow.connections['Merge Router Paths'];

// Hybrid Router (Stage 1) → IF LLM Required
workflow.connections['Hybrid Router (Stage 1)'] = {
    main: [[{ node: 'IF LLM Required', type: 'main', index: 0 }]]
};

// Parse RAG Results → Get Playbook Spec (for LLM path)
workflow.connections['Parse RAG Results'] = {
    main: [[{ node: 'Get Playbook Spec', type: 'main', index: 0 }]]
};

console.log('✓ Adjustment 3: Fixed connection flow (embedding in LLM branch only)');

// ================================================================
// ADJUSTMENT 4: Update Get Playbook Spec to handle both paths
// ================================================================

const getPlaybookNode = workflow.nodes.find(n => n.name === 'Get Playbook Spec');
if (getPlaybookNode && getPlaybookNode.parameters.jsonBody) {
    // Fix to use detected_family instead of routerOutput.route
    getPlaybookNode.parameters.jsonBody = '={ "p_family_id": "{{ $json.detected_family }}" }';
}

console.log('✓ Adjustment 4: Fixed Get Playbook Spec to use detected_family');

// ================================================================
// ADJUSTMENT 5: Remove unused Merge Router Paths node
// ================================================================

workflow.nodes = workflow.nodes.filter(n => n.name !== 'Merge Router Paths');
console.log('✓ Adjustment 5: Removed unused Merge Router Paths node');

// ================================================================
// Update metadata
// ================================================================

workflow.name = 'W2_ClauseReview - Hybrid Router v4.2.1 (CG-007)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log(`\nNodes: ${workflow.nodes.length}`);
console.log(`Saved to: ${OUTPUT_FILE}`);
console.log('\n✓ Ready for n8n import');
