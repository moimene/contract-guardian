/**
 * CG-007: W2 v4.2.3 - Fix Detect Failures variable reference
 * 
 * Issue: Detect Failures uses `detected_family` as bare variable
 * Should be: `$json.detected_family`
 * 
 * Run: node scripts/fix_w2_detect_failures.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.2 (CG-007).json');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.3 (CG-007).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-007 W2 v4.2.3 - Detect Failures Fix');
console.log('======================================');

// Find and fix Detect Failures node
const detectFailures = workflow.nodes.find(n => n.name === 'Detect Failures');
if (detectFailures && detectFailures.parameters.jsCode) {
    // Replace bare `detected_family` with `$json.detected_family`
    detectFailures.parameters.jsCode = detectFailures.parameters.jsCode
        .replace(/\broute: detected_family/g, 'route: $json.detected_family')
        .replace(/\bif \(detected_family ===/g, 'if ($json.detected_family ===')
        .replace(/\bdetected_family === 'OtherUnknown'/g, "$json.detected_family === 'OtherUnknown'");

    console.log('✓ Fixed Detect Failures: detected_family → $json.detected_family');
}

// Update metadata
workflow.name = 'W2_ClauseReview - Hybrid Router v4.2.3 (CG-007)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log(`\nNodes: ${workflow.nodes.length}`);
console.log(`Saved to: ${OUTPUT_FILE}`);
console.log('\n✓ Ready for n8n import');
