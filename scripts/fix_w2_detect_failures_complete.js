/**
 * CG-007: W2 v4.2.4 - Complete Detect Failures fix
 * 
 * Issue: Multiple bare references to detected_family and routerOutput
 * Solution: Add variable definitions at the start of the code
 * 
 * Run: node scripts/fix_w2_detect_failures_complete.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.3 (CG-007).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.4 (CG-007).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-007 W2 v4.2.4 - Complete Detect Failures Fix');
console.log('================================================');

// Find and completely rewrite Detect Failures node
const detectFailures = workflow.nodes.find(n => n.name === 'Detect Failures');
if (detectFailures) {
    detectFailures.parameters.jsCode = `// Detect potential routing failures for logging
const data = $json;

// Define variables from $json to avoid bare reference errors
const detected_family = data.detected_family || data._internal?.detected_family || 'OtherUnknown';
const routerOutput = data.routerOutput || data._internal || {};
const internalData = data._internal || {};

// Detect failure conditions
const failures = [];

// 1. Low confidence routing (< 0.65)
const routingConf = routerOutput.confidence || routerOutput.routing_confidence || 0;
if (routingConf > 0 && routingConf < 0.65) {
  failures.push({
    type: 'low_confidence',
    agent: 'router',
    confidence: routingConf,
    route: detected_family,
    method: routerOutput._routing_method || routerOutput.routing_method || 'unknown'
  });
}

// 2. LLM fallback when keyword should have matched
const routingMethod = routerOutput._routing_method || routerOutput.routing_method || '';
const keywordConf = routerOutput._keyword_confidence || 0;
if (routingMethod === 'LLM' && keywordConf > 0.4) {
  failures.push({
    type: 'keyword_fallback',
    agent: 'router',
    confidence: routingConf,
    keyword_conf: keywordConf
  });
}

// 3. OtherUnknown classification (potentially missed family)
if (detected_family === 'OtherUnknown') {
  failures.push({
    type: 'unknown_classification',
    agent: 'router',
    confidence: routingConf,
    clause_text_preview: (data.clause_text || '').substring(0, 200)
  });
}

// 4. Escalation due to low anchor confidence
const anchorConf = internalData.anchor_confidence || 0;
if (internalData.escalation_recommended && anchorConf < 0.7) {
  failures.push({
    type: 'low_anchor_confidence',
    agent: 'decision_engine',
    confidence: anchorConf,
    anchor_reason: internalData.escalation_reason || 'unknown'
  });
}

// Build failure payload if any failures detected
const hasFailures = failures.length > 0;
const failurePayload = hasFailures ? {
  run_id: data.run_id || '',
  clause_instance_id: data.clause_instance_id || '',
  agent_name: failures[0].agent,
  failure_type: failures[0].type,
  original_input: (data.clause_text || '').substring(0, 1000),
  actual_output: JSON.stringify(routerOutput),
  confidence: failures[0].confidence,
  route_assigned: detected_family
} : null;

return [{
  json: {
    ...data,
    _failure_detection: {
      has_failures: hasFailures,
      failures: failures,
      payload: failurePayload
    }
  }
}];`;

    console.log('✓ Completely rewrote Detect Failures with proper variable definitions');
}

// Update metadata
workflow.name = 'W2_ClauseReview - Hybrid Router v4.2.4 (CG-007)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log(`\nNodes: ${workflow.nodes.length}`);
console.log(`Saved to: ${OUTPUT_FILE}`);
console.log('\n✓ Ready for n8n import');
