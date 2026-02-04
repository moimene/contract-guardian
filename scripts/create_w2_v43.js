/**
 * CG-008: Create W2 v4.3 with updated keyword patterns
 * 
 * The W2 workflow has the Hybrid Router code embedded in the JSON.
 * This script updates the "Hybrid Router Stage 1" node with CG-008 pattern fixes.
 * 
 * Run: node scripts/create_w2_v43.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.2.4 (CG-007).json');
const ROUTER_FILE = path.join(__dirname, '../n8n/keyword_router_v4.1.js');
const OUTPUT_FILE = path.join(__dirname, '../n8n/wf operativos 0102_/W2_ClauseReview - Hybrid Router v4.3 (CG-008).json');

const workflow = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));

console.log('CG-008: Creating W2 v4.3 with Pattern Fixes');
console.log('============================================');

// Find the Hybrid Router Stage 1 node
const hybridRouter = workflow.nodes.find(n => n.name === 'Hybrid Router (Stage 1)');
if (hybridRouter) {
    // Read the updated keyword router code
    const routerCode = fs.readFileSync(ROUTER_FILE, 'utf8');

    // The n8n node needs to extract just the KEYWORD_PATTERNS section and route function
    // For now, we'll update the inline patterns directly

    // Create minimal code update focusing on the critical patterns
    const updatedCode = `// CG-008: Hybrid Router Stage 1 with Pattern Fixes
// Combines Keyword Router + LLM fallback decision

const clauseText = $json.clause_text || '';
const heading = $json.heading || '';

// ============================================================
// CG-008: UPDATED KEYWORD PATTERNS WITH COLLISION FIXES
// ============================================================

const KEYWORD_PATTERNS = {
    // HIGH PRIORITY - INDEMNITY
    IndemnityProdCo: {
        patterns: [
            /ProdCo\\s+(shall|will|agrees?\\s+to)\\s+indemnify/i,
            /indemnify,?\\s+defend,?\\s+(and\\s+)?hold\\s+harmless\\s+Amazon/i,
            /Amazon\\s+Indemnitees/i,
            /from\\s+and\\s+against\\s+any\\s+(and\\s+all\\s+)?claims/i,
            /ProdCo\\s+shall\\s+defend/i,
            /hold\\s+Amazon\\s+harmless/i
        ],
        negative: [/Amazon\\s+(shall|will)\\s+indemnify/i],
        min_matches: 1,
        confidence: 0.90,
        priority: 1
    },
    IndemnityAmazon: {
        patterns: [
            /Amazon\\s+(shall|will|agrees?\\s+to)\\s+indemnify/i,
            /indemnify\\s+ProdCo/i,
            /ProdCo\\s+Indemnitees/i,
            /hold\\s+ProdCo\\s+harmless/i
        ],
        negative: [/ProdCo\\s+(shall|will)\\s+indemnify/i],
        min_matches: 1,
        confidence: 0.90,
        priority: 1
    },
    
    // CG-008: DataProtection with HIGH PRIORITY (Fix 2)
    DataProtection: {
        patterns: [
            /\\bGDPR\\b/i,
            /\\bCCPA\\b/i,
            /data\\s+protection\\s+laws?/i,
            /data\\s+controller/i,
            /data\\s+processor/i,
            /personal\\s+data/i,
            /processing\\s+of\\s+personal\\s+data/i,
            /data\\s+subject\\s+rights/i,
            /privacy\\s+impact\\s+assessment/i
        ],
        negative: [
            /trade\\s+secrets?/i,
            /proprietary\\s+information/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1  // CG-008: Higher than Confidentiality
    },
    
    // CG-008: Confidentiality WITHOUT GDPR patterns (Fix 1)
    Confidentiality: {
        patterns: [
            /maintain\\s+in\\s+strict\\s+confidence/i,
            /confidential\\s+information/i,
            /non-public\\s+information/i,
            /\\bNPI\\b/,
            /shall\\s+not\\s+disclose/i,
            /keep\\s+confidential/i,
            /proprietary\\s+information/i,
            /trade\\s+secrets/i,
            /confidentiality\\s+obligations/i,
            /non-disclosure/i
        ],
        negative: [
            // CG-008: Prevent DataProtection collision
            /\\bGDPR\\b/i,
            /data\\s+protection/i,
            /data\\s+controller/i,
            /personal\\s+data/i,
            // CG-008: Prevent Assignment collision
            /assign/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2
    },
    
    // CG-008: Assignment with expanded negatives (Fix 3)
    Assignment: {
        patterns: [
            /may\\s+not\\s+assign/i,
            /shall\\s+not\\s+assign/i,
            /assignment\\s+is\\s+void/i,
            /successors\\s+and\\s+assigns/i,
            /change\\s+of\\s+control/i,
            /assignment\\s+of\\s+this\\s+Agreement/i,
            /may\\s+freely\\s+assign/i,
            /Amazon\\s+may\\s+assign/i
        ],
        negative: [
            /counterparts/i,
            /entire\\s+agreement/i,
            // CG-008: Prevent Confidentiality collision
            /confidential/i,
            /disclose/i,
            /non-disclosure/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    
    // CG-008: TerminationConsequences with negatives (Fix 4)
    TerminationConsequences: {
        patterns: [
            /upon\\s+termination/i,
            /effect\\s+of\\s+termination/i,
            /following\\s+termination/i,
            /termination\\s+payment/i,
            /kill\\s+fee/i,
            /termination\\s+fee/i,
            /return\\s+all\\s+materials/i
        ],
        negative: [
            // CG-008: Prevent RightsReversion collision
            /revert\\s+to\\s+ProdCo/i,
            /rights\\s+shall\\s+revert/i,
            /reversionary\\s+interest/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    
    // CG-008: AuditRights with negatives (Fix 5)
    AuditRights: {
        patterns: [
            /audit\\s+rights/i,
            /right\\s+to\\s+audit/i,
            /inspect.*books\\s+and\\s+records/i,
            /books\\s+and\\s+records/i,
            /accountant/i,
            /examine.*accounting\\s+records/i
        ],
        negative: [
            // CG-008: Prevent RightsGrant collision
            /grant/i,
            /license/i,
            /exploitation/i,
            /in\\s+perpetuity/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2
    },
    
    // CG-008: ServicesScope expanded (Fix 6)
    ServicesScope: {
        patterns: [
            /ProdCo\\s+(shall|will)\\s+provide\\s+(the\\s+)?services/i,
            /production\\s+services/i,
            /scope\\s+of\\s+services/i,
            /services\\s+to\\s+be\\s+provided/i,
            /deliverables/i,
            /services\\s+as\\s+set\\s+forth\\s+in\\s+Exhibit/i,
            /production\\s+of\\s+the\\s+(Series|Program|Film)/i,
            /set\\s+forth\\s+in\\s+Exhibit\\s+A/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    
    // Other critical families
    TerminationRights: {
        patterns: [
            /may\\s+terminate\\s+this\\s+Agreement/i,
            /right\\s+to\\s+terminate/i,
            /terminate\\s+immediately/i,
            /upon\\s+\\\\d+\\s+days.*notice/i,
            /material\\s+breach/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    ForceMajeure: {
        patterns: [
            /force\\s+majeure/i,
            /acts?\\s+of\\s+God/i,
            /war,?\\s+terrorism/i,
            /beyond\\s+reasonable\\s+control/i,
            /natural\\s+disaster/i,
            /pandemic/i,
            /earthquake|flood|hurricane/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1
    },
    LiabilityLimitation: {
        patterns: [
            /limitation\\s+of\\s+liability/i,
            /in\\s+no\\s+event\\s+shall.*liability/i,
            /aggregate\\s+liability/i,
            /indirect.*damages/i,
            /consequential.*damages/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1
    },
    RightsGrant: {
        patterns: [
            /grants?\\s+to\\s+Amazon/i,
            /all\\s+rights.*throughout\\s+the\\s+universe/i,
            /in\\s+perpetuity/i,
            /exclusive\\s+license/i,
            /exploitation\\s+rights/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    RightsReversion: {
        patterns: [
            /rights\\s+shall\\s+revert/i,
            /revert\\s+to\\s+ProdCo/i,
            /turnaround\\s+rights/i,
            /reversionary\\s+interest/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    Insurance: {
        patterns: [
            /obtain\\s+and\\s+maintain.*insurance/i,
            /errors\\s+and\\s+omissions/i,
            /\\bE\\s*&\\s*O\\b/i,
            /commercial\\s+general\\s+liability/i,
            /certificate\\s+of\\s+insurance/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    DisputeResolution: {
        patterns: [
            /binding\\s+arbitration/i,
            /dispute.*resolution/i,
            /mediation/i,
            /exclusive\\s+jurisdiction/i,
            /governed\\s+by\\s+the\\s+laws/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    AmazonControl: {
        patterns: [
            /sole\\s+and\\s+final\\s+control/i,
            /Amazon['']?s\\s+sole\\s+discretion/i,
            /subject\\s+to\\s+Amazon['']?s\\s+approval/i,
            /final\\s+cut/i,
            /creative\\s+control/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    Publicity: {
        patterns: [
            /publicity\\s+materials/i,
            /press\\s+release/i,
            /use\\s+of\\s+name\\s+and\\s+likeness/i,
            /promotional\\s+purposes/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    PaymentCredits: {
        patterns: [
            /Amazon\\s+(shall|will)\\s+pay/i,
            /payable\\s+within\\s+\\\\d+\\s+days/i,
            /net\\s+30/i,
            /production\\s+fee/i,
            /milestone\\s+payment/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    GoverningLaw: {
        patterns: [
            /governed\\s+by.*laws\\s+of/i,
            /laws\\s+of\\s+(the\\s+State\\s+of\\s+)?California/i,
            /exclusive\\s+jurisdiction/i,
            /venue.*shall\\s+be/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },
    GeneralProvisions: {
        patterns: [
            /entire\\s+agreement/i,
            /supersedes\\s+all\\s+prior/i,
            /severability/i,
            /executed\\s+in\\s+counterparts/i,
            /no\\s+waiver/i
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 3
    },
    RepsProdCo: {
        patterns: [
            /ProdCo\\s+represents\\s+and\\s+warrants/i,
            /ProdCo\\s+warrants\\s+that/i,
            /full\\s+authority\\s+to\\s+enter/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    }
};

// Routing function
function routeClause(text) {
    const results = [];
    const lowerText = text.toLowerCase();
    
    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        let matchCount = 0;
        let matchedPatterns = [];
        
        // Check positive patterns
        for (const pattern of config.patterns) {
            if (pattern.test(text)) {
                matchCount++;
                matchedPatterns.push(pattern.source);
            }
        }
        
        // Check negative patterns
        let hasNegative = false;
        if (config.negative) {
            for (const negPattern of config.negative) {
                if (negPattern.test(text)) {
                    hasNegative = true;
                    break;
                }
            }
        }
        
        if (matchCount >= (config.min_matches || 1) && !hasNegative) {
            results.push({
                family,
                matchCount,
                matchedPatterns,
                confidence: config.confidence,
                priority: config.priority
            });
        }
    }
    
    // Sort by priority (lower = higher priority), then by match count
    results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.matchCount - a.matchCount;
    });
    
    return results;
}

// Execute routing
const routingResults = routeClause(clauseText);
const topMatch = routingResults[0];

const detected_family = topMatch ? topMatch.family : 'OtherUnknown';
const confidence = topMatch ? topMatch.confidence : 0.0;
const needs_llm = !topMatch || topMatch.confidence < 0.7;

return [{
    json: {
        ...$json,
        detected_family,
        _routing_method: needs_llm ? 'PENDING_LLM' : 'KEYWORD',
        _keyword_confidence: confidence,
        _matches: routingResults.slice(0, 3),
        needs_llm_fallback: needs_llm
    }
}];`;

    hybridRouter.parameters.jsCode = updatedCode;
    console.log('✓ Updated Hybrid Router Stage 1 with CG-008 pattern fixes');
}

// Update metadata
workflow.name = 'W2_ClauseReview - Hybrid Router v4.3 (CG-008)';

// Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2));

console.log('');
console.log('Nodes: ' + workflow.nodes.length);
console.log('Saved to: ' + OUTPUT_FILE);
console.log('');
console.log('Ready for n8n import');
