/**
 * CG-007: W2 v4.2.2 - Fix RAG Dependency Error
 * 
 * Issue: When needs_llm_fallback = false, flow goes directly to Get Playbook
 * but Enrich Policy references $('Parse RAG Results') which hasn't executed.
 * 
 * Solution: Keep embedding/RAG in BOTH paths (LLM and direct)
 * The cost optimization is minimal since embedding is fast.
 * 
 * New Flow:
 * - Hybrid Router → IF LLM Required
 *   - TRUE:  LLM → Parse LLM → Embedding → RAG → Playbook
 *   - FALSE: Embedding → RAG → Playbook (skip LLM only)
 * 
 * Run: node scripts/fix_w2_rag_dependency.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.1 (CG-007).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.2 (CG-007).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-007 W2 v4.2.2 - RAG Dependency Fix');
console.log('=====================================');

// ================================================================
// FIX: Both paths must go through Embedding → RAG → Playbook
// ================================================================

// Update IF LLM Required connections:
// - TRUE  → LLM Classification (then to Parse LLM → Embedding)
// - FALSE → Generate Clause Embedding (skip LLM, go to Embedding directly)

workflow.connections['IF LLM Required'] = {
    main: [
        [{ node: 'LLM Classification', type: 'main', index: 0 }],      // true: LLM path
        [{ node: 'Generate Clause Embedding', type: 'main', index: 0 }] // false: direct to embedding
    ]
};

console.log('✓ Fixed IF LLM Required: both paths now go through Embedding/RAG');

// ================================================================
// FIX: Parse Embedding must handle data from EITHER Parse LLM Result OR Hybrid Router
// ================================================================

const parseEmbeddingNode = workflow.nodes.find(n => n.name === 'Parse Embedding');
if (parseEmbeddingNode) {
    parseEmbeddingNode.parameters.jsCode = `// Get data from either Parse LLM Result (LLM path) or Hybrid Router (direct path)
let prevData;
try {
  prevData = $('Parse LLM Result').first().json;
} catch (e) {
  // Direct path - get from Hybrid Router
  prevData = $('Hybrid Router (Stage 1)').first().json;
}

let embedding = null;
try {
  embedding = $json.data?.[0]?.embedding || null;
} catch (e) {
  console.log('Embedding parse error:', e.message);
}

return [{ json: { ...prevData, clauseEmbedding: embedding } }];`;
}

console.log('✓ Fixed Parse Embedding: handles both LLM and direct paths');

// ================================================================
// Update metadata
// ================================================================

workflow.name = 'W2_ClauseReview - Hybrid Router v4.2.2 (CG-007)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log(`\nNodes: ${workflow.nodes.length}`);
console.log(`Saved to: ${OUTPUT_FILE}`);
console.log('\n✓ Ready for n8n import');
console.log('\nNew Flow:');
console.log('  LLM Path:    Router → IF → LLM → Parse LLM → Embedding → RAG → Playbook');
console.log('  Direct Path: Router → IF → Embedding → RAG → Playbook');
