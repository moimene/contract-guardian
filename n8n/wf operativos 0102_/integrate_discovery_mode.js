/**
 * Integrator Script: Merge Discovery Mode into W2 Workflow
 * 
 * Usage: node integrate_discovery_mode.js
 * 
 * This script:
 * 1. Reads the base W2 v2.4 workflow
 * 2. Adds Discovery Mode nodes
 * 3. Modifies connections to route through Discovery Mode check
 * 4. Outputs W2 v2.5 with Discovery Mode
 */

const fs = require('fs');
const path = require('path');

// Paths
const baseWorkflowPath = path.join(__dirname, 'W2_ClauseReview - Paranoid v2.4 (CG-012-FIX).json');
const outputPath = path.join(__dirname, 'W2_ClauseReview - Paranoid v2.5 (Discovery Mode).json');

// Read base workflow
const baseWorkflow = JSON.parse(fs.readFileSync(baseWorkflowPath, 'utf8'));

// New nodes for Discovery Mode
const discoveryNodes = [
    {
        "parameters": {
            "jsCode": `/**
 * Discovery Mode Check Node
 * Position: After "IF LLM Required" outputs merge
 * Purpose: Determine if Discovery Mode should activate for unknown/low-confidence clauses
 */

const clauseData = $json;
const routingConfidence = clauseData._keyword_confidence || 0;
const detectedFamily = clauseData.detected_family;
const needsLLM = clauseData.needs_llm_fallback;

// Determine if Discovery Mode should activate
const activateDiscovery =
    detectedFamily === 'OtherUnknown' ||
    routingConfidence < 0.50 ||
    (needsLLM && routingConfidence < 0.40);

// Known families with playbook specs
const KNOWN_FAMILIES = [
    // CRITICAL
    'IndemnityProdCo', 'IndemnityAmazon', 'IndemnityProcedures',
    'RepsProdCo', 'RightsGrant', 'RightsReversion',
    'LiabilityLimitation', 'InjunctiveReliefWaiver',
    'TerminationRights', 'TerminationConsequences',
    'PaymentCredits', 'ThirdPartyCredits',
    'SurvivalRemedies', 'AmazonControl', 'Assignment',
    'MoralRights', 'AIPolicy',

    // HIGH
    'DisputeResolution', 'Confidentiality', 'Insurance', 'ForceMajeure',
    'CreativeControl', 'KeyPersons', 'DeliveryAcceptance', 'BudgetOverages',

    // MEDIUM
    'DataProtection', 'ServicesScope', 'AuditRights', 'TaxProvisions',
    'Publicity', 'PowerOfAttorney', 'ConditionsPrecedent', 'StandardTerms'
];

const hasPlaybookSpec = KNOWN_FAMILIES.includes(detectedFamily);
const useDiscoveryMode = activateDiscovery || !hasPlaybookSpec;

// Determine discovery reason
let discoveryReason = null;
if (useDiscoveryMode) {
    if (!hasPlaybookSpec) {
        discoveryReason = 'NO_PLAYBOOK_SPEC';
    } else if (detectedFamily === 'OtherUnknown') {
        discoveryReason = 'UNKNOWN_FAMILY';
    } else {
        discoveryReason = 'LOW_CONFIDENCE';
    }
}

return [{
    json: {
        ...clauseData,
        _use_discovery_mode: useDiscoveryMode,
        _discovery_reason: discoveryReason,
        _routing_confidence: routingConfidence,
        _has_playbook_spec: hasPlaybookSpec
    }
}];`
        },
        "id": "discovery-check-001",
        "name": "Check Discovery Mode",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-5840, 1016]
    },
    {
        "parameters": {
            "conditions": {
                "boolean": [
                    {
                        "value1": "={{ $json._use_discovery_mode }}",
                        "value2": true
                    }
                ]
            }
        },
        "id": "discovery-if-001",
        "name": "IF Discovery Mode",
        "type": "n8n-nodes-base.if",
        "typeVersion": 1,
        "position": [-5616, 1016]
    },
    {
        "parameters": {
            "method": "POST",
            "url": "https://api.openai.com/v1/chat/completions",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "openAiApi",
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": `={
  "model": "gpt-4o",
  "temperature": 0.2,
  "max_tokens": 2000,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "You are a Discovery Agent for Amazon contract review. You analyze clauses that don't match known playbook families. Apply Amazon's general contracting principles: (1) Asymmetric Protection - Amazon receives MORE protection, ProdCo bears more risk; (2) Unlimited ProdCo Obligations - no caps on ProdCo liability; (3) Amazon Control - sole and final control over Program; (4) Broad Rights to Amazon - perpetual, worldwide, exclusive; (5) Amazon-Favorable Procedures; (6) No Knowledge/Materiality Qualifiers. Universal red flags: 'shall not exceed', 'capped at', 'mutual consent', 'ProdCo may', 'revert', 'turnaround'. Respond ONLY with valid JSON matching the schema."
    },
    {
      "role": "user",
      "content": "Analyze this clause:\\n\\nFamily Detection: {{ $json.detected_family }}\\nConfidence: {{ $json._routing_confidence }}\\nDiscovery Reason: {{ $json._discovery_reason }}\\n\\nClause Text:\\n{{ $json.clause_text }}\\n\\nRespond with JSON schema:\\n{\\n  \\"discovery_analysis\\": {\\n    \\"clause_characterization\\": { \\"primary_function\\": \\"protection|rights|procedural|financial|operational|administrative\\", \\"legal_concepts\\": [], \\"subject_matter\\": \\"description\\" },\\n    \\"directional_analysis\\": { \\"benefits\\": \\"Amazon|ProdCo|Mutual|Neutral\\", \\"obligates\\": \\"Amazon|ProdCo|Mutual|Neither\\", \\"assessment\\": \\"Amazon-favorable|ProdCo-favorable|Neutral|Mixed\\" },\\n    \\"risk_identification\\": { \\"universal_red_flags_found\\": [], \\"missing_protections\\": [], \\"risk_level\\": \\"HIGH|MEDIUM|LOW\\" },\\n    \\"family_proposal\\": { \\"suggested_family\\": \\"ExistingFamily or NEW:ProposedName\\", \\"confidence\\": 0.0, \\"rationale\\": \\"explanation\\", \\"similar_to\\": [] },\\n    \\"treatment_recommendation\\": { \\"action\\": \\"ESCALATE_CRITICAL|ESCALATE_REVIEW|PROVISIONAL_PASS\\", \\"reason\\": \\"explanation\\", \\"requires_new_spec\\": false }\\n  },\\n  \\"provisional_observations\\": [],\\n  \\"human_review_notes\\": \\"notes for legal team\\"\\n}"
    }
  ]
}`,
            "options": {
                "timeout": 60000
            }
        },
        "id": "discovery-agent-001",
        "name": "Discovery Agent",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [-5392, 800],
        "credentials": {
            "openAiApi": {
                "id": "SIqSVUfX83ooZaUa",
                "name": "amazon redliner"
            }
        },
        "onError": "continueErrorOutput"
    },
    {
        "parameters": {
            "jsCode": `/**
 * Parse Discovery Agent Response
 * Extracts structured discovery analysis and prepares for persistence
 */

const inputData = $json;
let discoveryOutput = null;

// Default structure
const defaultDiscovery = {
  discovery_analysis: {
    clause_characterization: { primary_function: 'unknown', legal_concepts: [], subject_matter: 'unclassified' },
    directional_analysis: { benefits: 'Unknown', obligates: 'Unknown', assessment: 'Unknown' },
    risk_identification: { universal_red_flags_found: [], missing_protections: [], risk_level: 'MEDIUM' },
    family_proposal: { suggested_family: 'OtherUnknown', confidence: 0, rationale: 'Parsing failed', similar_to: [] },
    treatment_recommendation: { action: 'ESCALATE_REVIEW', reason: 'Parsing failed', requires_new_spec: true }
  },
  provisional_observations: [],
  human_review_notes: 'Requires manual review'
};

try {
  // Get LLM response
  const responseText = inputData.message?.content || inputData.text || inputData.choices?.[0]?.message?.content || JSON.stringify(inputData);
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\`\`\`json\\n?([\\s\\S]*?)\\n?\`\`\`/) || responseText.match(/\\{[\\s\\S]*\\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
  
  discoveryOutput = JSON.parse(jsonStr);
} catch (e) {
  console.log('Discovery parse error:', e.message);
  discoveryOutput = defaultDiscovery;
}

// Get previous clause data
const prevData = $('Check Discovery Mode').first().json;

// Determine final decision based on discovery
const action = discoveryOutput.discovery_analysis?.treatment_recommendation?.action || 'ESCALATE_REVIEW';
let decision = 'ESCALATE_HUMAN';
let clientState = 'NEEDS_REVIEW';

if (action === 'ESCALATE_CRITICAL') {
  decision = 'BLOCK_EXPORT';
  clientState = 'REJECTED';
} else if (action === 'PROVISIONAL_PASS') {
  decision = 'APPROVE_WITH_NOTES';
  clientState = 'APPROVED_WITH_NOTES';
}

return [{
  json: {
    ...prevData,
    _discovery_output: discoveryOutput,
    _discovery_decision: decision,
    _discovery_client_state: clientState,
    _suggested_family: discoveryOutput.discovery_analysis?.family_proposal?.suggested_family || 'OtherUnknown',
    _requires_new_spec: discoveryOutput.discovery_analysis?.treatment_recommendation?.requires_new_spec || true,
    _discovery_risk_level: discoveryOutput.discovery_analysis?.risk_identification?.risk_level || 'MEDIUM',
    _discovery_observations: discoveryOutput.provisional_observations || [],
    _human_review_notes: discoveryOutput.human_review_notes || 'Requires review'
  }
}];`
        },
        "id": "discovery-parse-001",
        "name": "Parse Discovery",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-5168, 800]
    },
    {
        "parameters": {
            "jsCode": `/**
 * Build Discovery Result
 * Constructs final output for discovered clause types
 * Maps to discovered_clause_types table schema
 */

const data = $json;
const discovery = data._discovery_output || {};
const analysis = discovery.discovery_analysis || {};
const familyProposal = analysis.family_proposal || {};
const riskId = analysis.risk_identification || {};
const treatment = analysis.treatment_recommendation || {};

// Derive proposed_family_id and display_name
let proposedFamilyId = familyProposal.suggested_family || 'OtherUnknown';
let proposedDisplayName = proposedFamilyId;
if (proposedFamilyId.startsWith('NEW:')) {
  proposedDisplayName = proposedFamilyId.replace('NEW:', '');
  proposedFamilyId = proposedDisplayName.replace(/\\s+/g, '');
}

// Map risk level to priority
const riskToPriority = {
  'HIGH': 'CRITICAL',
  'MEDIUM': 'HIGH', 
  'LOW': 'MEDIUM'
};
const proposedPriority = riskToPriority[riskId.risk_level] || 'HIGH';

// Build record for discovered_clause_types table
const discoveredTypeRecord = {
  // Required fields
  proposed_family_id: proposedFamilyId,
  proposed_display_name: proposedDisplayName,
  
  // Optional fields
  proposed_priority: proposedPriority,
  source_clause_instance_id: data.clause_instance_id || null,
  source_document_id: data.document_id || null,
  source_run_id: data.run_id || null,
  
  // JSONB fields
  clause_characterization: analysis.clause_characterization || {},
  directional_analysis: analysis.directional_analysis || {},
  risk_identification: analysis.risk_identification || {},
  
  // Array fields - extract from treatment recommendation
  suggested_red_flags: riskId.universal_red_flags_found?.map(f => f.pattern || f) || [],
  suggested_must_have: riskId.missing_protections || [],
  
  // Text fields
  suggested_standard_position: treatment.reason || null,
  notes: data._human_review_notes || discovery.human_review_notes || null,
  
  // Example clauses (JSONB)
  example_clauses: [{
    text: data.clause_text,
    source_document_id: data.document_id,
    discovered_at: new Date().toISOString()
  }],
  
  // Timestamps
  discovered_at: new Date().toISOString()
};

// Build internal record for clause_reviews_internal
const internalResult = {
  clause_instance_id: data.clause_instance_id,
  clause_id: data.clause_id,
  document_id: data.document_id,
  run_id: data.run_id,
  detected_family: data.detected_family,
  routing_method: 'DISCOVERY_MODE',
  routing_confidence: data._routing_confidence || 0,
  discovery_mode: true,
  discovery_reason: data._discovery_reason,
  suggested_family: proposedFamilyId,
  risk_level: riskId.risk_level || 'MEDIUM',
  decision: data._discovery_decision,
  observations: data._discovery_observations,
  human_review_notes: data._human_review_notes,
  requires_new_spec: treatment.requires_new_spec || true,
  completed_at: new Date().toISOString()
};

// Build client-facing response
const clientResponse = {
  clause_instance_id: data.clause_instance_id,
  detected_family: data.detected_family,
  decision: data._discovery_decision,
  client_state: data._discovery_client_state,
  client_comment: \`This clause type requires legal team review. Suggested classification: \${proposedDisplayName}. Risk level: \${riskId.risk_level || 'MEDIUM'}.\`,
  safety_pass: data._discovery_decision !== 'BLOCK_EXPORT',
  discovery_mode: true
};

return [{
  json: {
    // Fields for Supabase insert (discovered_clause_types)
    ...discoveredTypeRecord,
    // Internal tracking
    _internal: internalResult,
    _client_response: clientResponse
  }
}];`
        },
        "id": "discovery-build-001",
        "name": "Build Discovery Result",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-4944, 800]
    },
    {
        "parameters": {
            "operation": "insert",
            "tableId": "discovered_clause_types",
            "fieldsToSend": "defineBelow",
            "fields": {
                "values": [
                    { "fieldName": "proposed_family_id", "fieldValue": "={{ $json.proposed_family_id }}" },
                    { "fieldName": "proposed_display_name", "fieldValue": "={{ $json.proposed_display_name }}" },
                    { "fieldName": "proposed_priority", "fieldValue": "={{ $json.proposed_priority }}" },
                    { "fieldName": "source_clause_instance_id", "fieldValue": "={{ $json.source_clause_instance_id }}" },
                    { "fieldName": "source_document_id", "fieldValue": "={{ $json.source_document_id }}" },
                    { "fieldName": "source_run_id", "fieldValue": "={{ $json.source_run_id }}" },
                    { "fieldName": "clause_characterization", "fieldValue": "={{ JSON.stringify($json.clause_characterization) }}" },
                    { "fieldName": "directional_analysis", "fieldValue": "={{ JSON.stringify($json.directional_analysis) }}" },
                    { "fieldName": "risk_identification", "fieldValue": "={{ JSON.stringify($json.risk_identification) }}" },
                    { "fieldName": "suggested_red_flags", "fieldValue": "={{ $json.suggested_red_flags }}" },
                    { "fieldName": "suggested_must_have", "fieldValue": "={{ $json.suggested_must_have }}" },
                    { "fieldName": "suggested_standard_position", "fieldValue": "={{ $json.suggested_standard_position }}" },
                    { "fieldName": "notes", "fieldValue": "={{ $json.notes }}" },
                    { "fieldName": "example_clauses", "fieldValue": "={{ JSON.stringify($json.example_clauses) }}" },
                    { "fieldName": "discovered_at", "fieldValue": "={{ $json.discovered_at }}" }
                ]
            },
            "options": {}
        },
        "id": "discovery-save-001",
        "name": "Save Discovered Clause Type",
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1.2,
        "position": [-4720, 800],
        "credentials": {
            "supabaseApi": {
                "id": "9SZmGHb4kHp3H92H",
                "name": "contract-guardian"
            }
        }
    },
    {
        "parameters": {
            "respondWith": "json",
            "responseBody": "={{ $json._client_response }}"
        },
        "id": "discovery-respond-001",
        "name": "Respond Discovery",
        "type": "n8n-nodes-base.respondToWebhook",
        "typeVersion": 1.1,
        "position": [-4496, 800]
    }
];

// Add new nodes to workflow
baseWorkflow.nodes = [...baseWorkflow.nodes, ...discoveryNodes];

// Update workflow name
baseWorkflow.name = "W2_ClauseReview - Paranoid v2.5 (Discovery Mode)";

// Modify connections
// 1. Change IF LLM Required -> false output to go to Check Discovery Mode
baseWorkflow.connections["IF LLM Required"].main[1] = [{
    "node": "Check Discovery Mode",
    "type": "main",
    "index": 0
}];

// 2. Change Parse LLM Result to go to Check Discovery Mode
baseWorkflow.connections["Parse LLM Result"].main[0] = [{
    "node": "Check Discovery Mode",
    "type": "main",
    "index": 0
}];

// 3. Add new connections for Discovery Mode flow
baseWorkflow.connections["Check Discovery Mode"] = {
    "main": [[{
        "node": "IF Discovery Mode",
        "type": "main",
        "index": 0
    }]]
};

baseWorkflow.connections["IF Discovery Mode"] = {
    "main": [
        // true branch -> Discovery Agent
        [{
            "node": "Discovery Agent",
            "type": "main",
            "index": 0
        }],
        // false branch -> existing flow (Generate Clause Embedding)
        [{
            "node": "Generate Clause Embedding",
            "type": "main",
            "index": 0
        }]
    ]
};

baseWorkflow.connections["Discovery Agent"] = {
    "main": [[{
        "node": "Parse Discovery",
        "type": "main",
        "index": 0
    }]]
};

baseWorkflow.connections["Parse Discovery"] = {
    "main": [[{
        "node": "Build Discovery Result",
        "type": "main",
        "index": 0
    }]]
};

baseWorkflow.connections["Build Discovery Result"] = {
    "main": [[{
        "node": "Save Discovered Clause Type",
        "type": "main",
        "index": 0
    }]]
};

baseWorkflow.connections["Save Discovered Clause Type"] = {
    "main": [[{
        "node": "Respond Discovery",
        "type": "main",
        "index": 0
    }]]
};

// Shift positions of downstream nodes to make room for Discovery Mode nodes
// The Discovery Mode branch is at y=800, the main flow stays at y=1016

// Write output
fs.writeFileSync(outputPath, JSON.stringify(baseWorkflow, null, 2));
console.log('✅ W2 v2.5 (Discovery Mode) created successfully!');
console.log(`   Output: ${outputPath}`);
console.log('\n📋 Summary of changes:');
console.log('   - Added 7 new nodes for Discovery Mode');
console.log('   - Modified IF LLM Required connections');
console.log('   - Added conditional branch for Discovery Mode');
console.log('   - Discovery branch: Discovery Agent → Parse Discovery → Build Discovery Result → Save → Respond');
console.log('   - Normal branch: continues to Generate Clause Embedding → Paranoid flow');
