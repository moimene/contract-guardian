// CG-010: W2 Workflow Update Script for Auto-Redline v1
// Adds: Auto-Redline Generator node, Persist Suggestions node

const fs = require('fs');
const path = require('path');

const W2_PATH = './n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.3.1 (CG-008.P).json';
const OUTPUT_PATH = './n8n/wf operativos 0102_/W2_ClauseReview - Auto-Redline v4.4 (CG-010).json';
const GENERATOR_PATH = './n8n/auto_redline_generator.js';

// Read files
const workflow = JSON.parse(fs.readFileSync(W2_PATH, 'utf8'));
const generatorCode = fs.readFileSync(GENERATOR_PATH, 'utf8');

// Find Valuator and Sanitizer node positions
const valuatorNode = workflow.nodes.find(n => n.name === 'Valuator' || n.name.includes('Valuator'));
const sanitizerNode = workflow.nodes.find(n => n.name === 'Sanitizer' || n.name.includes('Sanitizer'));

if (!valuatorNode) {
    console.error('❌ Valuator node not found');
    process.exit(1);
}

// Calculate new node positions
const valuatorPos = valuatorNode.position || [1000, 300];
const newX = valuatorPos[0] + 200;

// 1. Auto-Redline Generator node
const autoRedlineNode = {
    parameters: {
        jsCode: generatorCode
    },
    id: 'auto_redline_gen',
    name: 'Auto-Redline Generator',
    position: [newX, valuatorPos[1]],
    type: 'n8n-nodes-base.code',
    typeVersion: 2
};

// 2. Persist Suggestions node
const persistNode = {
    parameters: {
        method: 'POST',
        url: 'https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/redline_suggestions',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMjkwMiwiZXhwIjoyMDgzODg4OTAyfQ.fiPHwoYlT3aW6MRrRTMvF7H6zKSiiUdS3pyOd8tT0ok' },
                { name: 'apikey', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMjkwMiwiZXhwIjoyMDgzODg4OTAyfQ.fiPHwoYlT3aW6MRrRTMvF7H6zKSiiUdS3pyOd8tT0ok' },
                { name: 'Content-Type', value: 'application/json' },
                { name: 'Prefer', value: 'return=minimal' }
            ]
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ 
      $json.suggestions && $json.suggestions.length > 0 
      ? JSON.stringify($json.suggestions.map(s => ({
          run_id: $json.run_id,
          clause_instance_id: $json.clause_instance_id,
          family: $json.family,
          op_type: s.op_type,
          anchor_quote: s.anchor?.quote || null,
          anchor_start: s.anchor?.offsets?.start || null,
          anchor_end: s.anchor?.offsets?.end || null,
          anchor_confidence: s.anchor?.anchor_confidence || 0,
          replacement_text: s.replacement_text,
          source_reference: s.source_reference,
          rationale: s.rationale,
          requires_review: s.requires_review
        })))
      : '[]'
    }}`,
        options: {}
    },
    id: 'persist_suggestions',
    name: 'Persist Suggestions',
    position: [newX + 200, valuatorPos[1]],
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    onError: 'continueRegularOutput'
};

// Add new nodes
workflow.nodes.push(autoRedlineNode);
workflow.nodes.push(persistNode);

// Update connections: Valuator -> Auto-Redline -> Persist -> Sanitizer
// Find existing Valuator output connection
if (workflow.connections['Valuator']) {
    // Keep original flow, add new path
    workflow.connections['Auto-Redline Generator'] = {
        main: [[{ node: 'Persist Suggestions', type: 'main', index: 0 }]]
    };
    workflow.connections['Persist Suggestions'] = {
        main: [[{ node: 'Sanitizer', type: 'main', index: 0 }]]
    };

    // Redirect Valuator to Auto-Redline
    const valuatorOutput = workflow.connections['Valuator'];
    workflow.connections['Valuator'] = {
        main: [[{ node: 'Auto-Redline Generator', type: 'main', index: 0 }]]
    };
}

// Update workflow metadata
workflow.name = 'W2_ClauseReview - Auto-Redline v4.4 (CG-010)';

// Save
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(workflow, null, 2));
console.log(`✅ W2 v4.4 created: ${OUTPUT_PATH}`);
console.log('   - Added: Auto-Redline Generator node');
console.log('   - Added: Persist Suggestions node');
console.log('   - Flow: Valuator → Auto-Redline → Persist → Sanitizer');
