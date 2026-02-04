/**
 * CG-007: W2 Workflow Transformation Script
 * 
 * Transforms W2 v4.1 → v4.2 by:
 * 1. Modifying Keyword Router to add LLM decision logic
 * 2. Adding IF node for LLM routing
 * 3. Adding LLM Classification node
 * 4. Adding Parse LLM Result node
 * 5. Removing redundant Router Agent + Parse Router
 * 
 * Run: node scripts/transform_w2_hybrid.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - RAG Enhanced v4.1 (ForceMajeure Fix).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2 (CG-007).json');

// Load workflow
const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-007 W2 Transformation');
console.log('========================');
console.log(`Source: ${SOURCE_FILE}`);
console.log(`Nodes before: ${workflow.nodes.length}`);

// ================================================================
// Step 1: Modify Keyword Router to include LLM decision
// ================================================================

const keywordRouterNode = workflow.nodes.find(n => n.name === 'Keyword Router');
if (keywordRouterNode) {
    // The existing Keyword Router already has needs_llm logic
    // We just need to ensure it outputs the right flags
    console.log('✓ Keyword Router found - keeping as Hybrid Router Stage 1');

    // Rename for clarity
    keywordRouterNode.name = 'Hybrid Router (Stage 1)';
}

// ================================================================
// Step 2: Create IF node for LLM routing decision
// ================================================================

const ifNodePosition = [-5232, -48]; // Position of old Router Agent

const ifNode = {
    "parameters": {
        "conditions": {
            "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict" },
            "conditions": [{
                "id": "cg007-llm-check",
                "leftValue": "={{ $json.needs_llm_fallback }}",
                "rightValue": true,
                "operator": { "type": "boolean", "operation": "equals" }
            }],
            "combinator": "and"
        },
        "options": {}
    },
    "id": "cg007-if-llm",
    "name": "IF LLM Required",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2,
    "position": ifNodePosition
};

// ================================================================
// Step 3: Create LLM Classification node (HTTP Request to OpenAI)
// ================================================================

const llmNodePosition = [-5008, -148]; // Upper branch

const llmClassificationNode = {
    "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/chat/completions",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "sendHeaders": true,
        "headerParameters": {
            "parameters": [
                { "name": "Content-Type", "value": "application/json" }
            ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": `={
  "model": "gpt-4o-mini",
  "temperature": 0,
  "messages": [
    {
      "role": "system",
      "content": "You are a legal contract classifier for Amazon PSA/DSA agreements. Classify clauses into one of these families: PaymentCredits, ThirdPartyCredits, RepsProdCo, RepsAmazon, IndemnityProdCo, IndemnityAmazon, IndemnityProcedures, LiabilityLimitation, InjunctiveReliefWaiver, TerminationRights, TerminationConsequences, Confidentiality, DataProtection, GoverningLaw, DisputeResolution, ForceMajeure, Insurance, RightsGrant, RightsReversion, AuditRights, Publicity, Assignment, ServicesScope, SurvivalRemedies, AmazonControl, GeneralProvisions, ConditionsPrecedent, Definitions, Parties. Respond with JSON only: {family, confidence, reasoning}"
    },
    {
      "role": "user",
      "content": "Classify this clause (keyword hint: {{ $json.detected_family }} with {{ $json.routing_confidence }} confidence):\\n\\n{{ $json.clause_text.substring(0, 2000) }}"
    }
  ]
}`,
        "options": {}
    },
    "id": "cg007-llm-classify",
    "name": "LLM Classification",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": llmNodePosition,
    "credentials": { "openAiApi": { "id": "openai-credential", "name": "OpenAI API" } }
};

// ================================================================
// Step 4: Create Parse LLM Result node
// ================================================================

const parseLlmPosition = [-4784, -148];

const parseLlmNode = {
    "parameters": {
        "jsCode": `// CG-007: Parse LLM Classification Result
const input = $input.item.json;

// Get data from previous nodes
const clauseData = $('Hybrid Router (Stage 1)').first().json;
const llmResponse = input.choices?.[0]?.message?.content || '';
const keywordFamily = clauseData.detected_family;
const keywordConfidence = clauseData.routing_confidence || 0;

// Parse LLM response
let llmResult = { family: 'OtherUnknown', confidence: 0.5, reasoning: 'Parse failed' };
try {
    const jsonMatch = llmResponse.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
        llmResult = JSON.parse(jsonMatch[0]);
    }
} catch (e) {
    // Fallback to keyword
}

// Conflict resolution
const CANONICAL_FAMILIES = ["PaymentCredits", "ThirdPartyCredits", "RepsProdCo", "RepsAmazon",
    "IndemnityProdCo", "IndemnityAmazon", "IndemnityProcedures", "LiabilityLimitation",
    "InjunctiveReliefWaiver", "TerminationRights", "TerminationConsequences", "Confidentiality",
    "DataProtection", "GoverningLaw", "DisputeResolution", "ForceMajeure", "Insurance",
    "RightsGrant", "RightsReversion", "AuditRights", "Publicity", "Assignment", "ServicesScope",
    "SurvivalRemedies", "AmazonControl", "GeneralProvisions", "ConditionsPrecedent", "Definitions",
    "Parties", "OtherUnknown"];

if (!CANONICAL_FAMILIES.includes(llmResult.family)) {
    llmResult.family = 'OtherUnknown';
}

const llmConf = llmResult.confidence || 0.5;
let finalFamily = llmResult.family;
let finalConfidence = llmConf;
let method = 'llm_semantic';

// Resolution rules
if (keywordFamily === llmResult.family) {
    method = 'keyword+llm_agree';
    finalConfidence = Math.max(keywordConfidence, llmConf);
} else if (llmConf >= 0.85) {
    method = 'llm_semantic';
} else if (keywordConfidence >= 0.90 && llmConf < 0.80) {
    finalFamily = keywordFamily;
    finalConfidence = keywordConfidence;
    method = 'keyword_override';
}

return {
    json: {
        ...clauseData,
        detected_family: finalFamily,
        routing_confidence: finalConfidence,
        routing_method: method,
        _llm_result: llmResult,
        _keyword_family: keywordFamily,
        _keyword_confidence: keywordConfidence
    }
};`
    },
    "id": "cg007-parse-llm",
    "name": "Parse LLM Result",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": parseLlmPosition
};

// ================================================================
// Step 5: Create Merge node for both paths
// ================================================================

const mergePosition = [-4560, -48];

const mergeNode = {
    "parameters": {
        "mode": "chooseBranch",
        "output": "empty"
    },
    "id": "cg007-merge",
    "name": "Merge Router Paths",
    "type": "n8n-nodes-base.merge",
    "typeVersion": 3,
    "position": mergePosition
};

// ================================================================
// Step 6: Remove old nodes
// ================================================================

const nodesToRemove = ['Router Agent', 'Parse Router'];
workflow.nodes = workflow.nodes.filter(n => !nodesToRemove.includes(n.name));
console.log(`✓ Removed nodes: ${nodesToRemove.join(', ')}`);

// Add new nodes
workflow.nodes.push(ifNode, llmClassificationNode, parseLlmNode, mergeNode);
console.log('✓ Added nodes: IF LLM Required, LLM Classification, Parse LLM Result, Merge Router Paths');

// ================================================================
// Step 7: Update connections
// ================================================================

// Remove old connections
delete workflow.connections['Router Agent'];
delete workflow.connections['Parse Router'];

// Update Keyword Router → IF node
workflow.connections['Hybrid Router (Stage 1)'] = {
    main: [[{ node: 'IF LLM Required', type: 'main', index: 0 }]]
};

// IF node connections
workflow.connections['IF LLM Required'] = {
    main: [
        [{ node: 'LLM Classification', type: 'main', index: 0 }], // true branch
        [{ node: 'Merge Router Paths', type: 'main', index: 1 }]  // false branch (direct)
    ]
};

// LLM path
workflow.connections['LLM Classification'] = {
    main: [[{ node: 'Parse LLM Result', type: 'main', index: 0 }]]
};

workflow.connections['Parse LLM Result'] = {
    main: [[{ node: 'Merge Router Paths', type: 'main', index: 0 }]]
};

// Merge → next step (was Parse Router → Generate Clause Embedding)
workflow.connections['Merge Router Paths'] = {
    main: [[{ node: 'Generate Clause Embedding', type: 'main', index: 0 }]]
};

console.log('✓ Updated connections');

// ================================================================
// Step 8: Update workflow metadata
// ================================================================

workflow.name = 'W2_ClauseReview - Hybrid Router v4.2 (CG-007)';
workflow.meta = workflow.meta || {};
workflow.meta.instanceId = workflow.meta.instanceId || 'cg-007-generated';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log(`\nNodes after: ${workflow.nodes.length}`);
console.log(`\n✓ Saved to: ${OUTPUT_FILE}`);
console.log('\nNext: Import to n8n Cloud');
