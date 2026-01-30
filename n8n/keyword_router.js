/**
 * KEYWORD ROUTER v1.0
 * Pre-LLM deterministic clause family detection using regex patterns.
 * 
 * USAGE in n8n:
 * 1. Add a Code Node BEFORE the LLM Router node
 * 2. Paste this code
 * 3. Connect output to Switch node for routing decision
 * 
 * INPUT: $input.item.json.clause_text
 * OUTPUT: { routed, family, confidence, method, alternatives }
 */

const KEYWORD_PATTERNS = {
    // ================================================================
    // CRITICAL FAMILIES - High accuracy patterns
    // ================================================================

    RightsGrant: {
        patterns: [
            /work\s+made\s+for\s+hire/i,
            /Amazon\s+shall\s+(be|own|have)/i,
            /exclusive(ly)?\s+own/i,
            /throughout\s+the\s+universe/i,
            /in\s+perpetuity/i,
            /irrevocably\s+assigns?/i,
            /exclusive\s+owner\s+for\s+copyright/i,
            /results\s+and\s+proceeds/i
        ],
        min_matches: 2,
        confidence: 0.95,
        priority: 1,
        negative: [/\breversion\b/i, /\brevert\b/i, /\bturnaround\b/i, /\breacquisition\b/i]
    },

    RepsProdCo: {
        patterns: [
            /ProdCo\s+represents?\s*(,?\s*warrants?)?(\s+and\s+agrees)?/i,
            /REPRESENTATIONS?\/?WARRANTIES?/i,
            /will\s+not\s+infringe/i,
            /does\s+not\s+violate/i,
            /free\s+and\s+clear/i,
            /full\s+right,?\s+power,?\s+(and|&)\s+authority/i,
            /no\s+claim,?\s+litigation/i,
            /wholly\s+original/i,
            /chain\s+of\s+title/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        negative: [/Amazon\s+represents/i]
    },

    IndemnityProdCo: {
        patterns: [
            /ProdCo\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+Amazon/i,
            /indemnify\s+Amazon/i,
            /Amazon\s+Indemnitees/i,
            /ProdCo['']?s\s+indemnification/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        negative: [/Amazon\s+(shall|will)\s+indemnify/i]
    },

    IndemnityAmazon: {
        patterns: [
            /Amazon\s+(shall|will)\s+indemnify/i,
            /Amazon\s+agrees?\s+to\s+indemnify/i,
            /indemnify\s+ProdCo/i,
            /ProdCo\s+Indemnitees/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1
    },

    LiabilityLimitation: {
        patterns: [
            /IN\s+NO\s+EVENT\s+SHALL/i,
            /CONSEQUENTIAL\s+DAMAGES/i,
            /INDIRECT\s+DAMAGES/i,
            /INCIDENTAL\s+DAMAGES/i,
            /PUNITIVE\s+DAMAGES/i,
            /TOTAL\s+AGGREGATE\s+LIABILITY/i,
            /SHALL\s+NOT\s+EXCEED/i,
            /LIMITATION\s+OF\s+LIABILITY/i,
            /MAXIMUM\s+LIABILITY/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1
    },

    PaymentCredits: {
        patterns: [
            /production\s+fee/i,
            /Amazon\s+(shall|will)\s+pay/i,
            /in\s+full\s+consideration/i,
            /milestone\s+payment/i,
            /net\s+receipts/i,
            /contingent\s+compensation/i,
            /backend\s+participation/i,
            /payment\s+schedule/i,
            /\bFEES:\s/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },

    // ================================================================
    // SUPPORT FAMILIES
    // ================================================================

    ServicesScope: {
        patterns: [
            /ProdCo\s+will\s+render\s+services/i,
            /render\s+all\s+production\s+services/i,
            /pre-production,?\s+principal\s+photography,?\s+post-production/i,
            /complete\s+the\s+Program/i,
            /deliver\s+the\s+Program/i,
            /produce\s+the\s+Program/i,
            /\bSERVICES:\s/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },

    Confidentiality: {
        patterns: [
            /maintain\s+in\s+strict\s+confidence/i,
            /confidential\s+information/i,
            /\bDATA\s+PROTECTION\b/i,
            /personal\s+data/i,
            /\bGDPR\b/i,
            /data\s+protection\s+laws/i,
            /processing.*personal/i,
            /shall\s+not\s+disclose/i,
            /\bCCPA\b/i,
            /data\s+controller/i,
            /data\s+processor/i,
            /non-public\s+information/i,
            /\bNPI\b/
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 2
    },

    DisputeResolution: {
        patterns: [
            /GOVERNING\s+LAW/i,
            /JURISDICTION/i,
            /binding\s+arbitration/i,
            /\bJAMS\b/i,
            /\bAAA\b/,
            /waive[s]?\s+(any\s+)?right\s+to\s+(a\s+)?(jury\s+)?trial/i,
            /exclusive\s+jurisdiction/i,
            /governed\s+by\s+the\s+laws\s+of/i,
            /State\s+of\s+California/i,
            /\bTAX;\s+GOVERNING\s+LAW\b/i
        ],
        min_matches: 2,
        confidence: 0.90,
        priority: 2
    },

    TerminationRights: {
        patterns: [
            /may\s+terminate/i,
            /termination\s+for\s+(cause|convenience)/i,
            /right\s+to\s+terminate/i,
            /entitled\s+to\s+terminate/i,
            /cure\s+period/i,
            /upon\s+written\s+notice/i,
            /material\s+breach/i
        ],
        min_matches: 2,
        confidence: 0.85,
        priority: 2
    },

    TerminationConsequences: {
        patterns: [
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i,
            /termination\s+payment/i,
            /upon\s+such\s+termination/i,
            /shall\s+remain\s+vested/i
        ],
        min_matches: 2,
        confidence: 0.85,
        priority: 2
    },

    RightsReversion: {
        patterns: [
            /\bno\s+reversion\b/i,
            /\bshall\s+not\s+revert\b/i,
            /\breversion\s+of\s+rights\b/i,
            /\brights\s+shall\s+revert\b/i,
            /\bturnaround\b/i,
            /\breacquisition\b/i,
            /\brevert\s+to\s+ProdCo\b/i,
            /\brights\s+return\b/i,
            /\bno\s+rights?\s+of\s+reversion\b/i,
            /\bwaives?\s+(any\s+)?reversion\b/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1
    },

    SurvivalRemedies: {
        patterns: [
            /shall\s+survive\s+termination/i,
            /shall\s+survive\s+expiration/i,
            /provisions?\s+shall\s+survive/i,
            /by\s+its\s+nature\s+should\s+survive/i,
            /survive\s+in\s+perpetuity/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },

    Insurance: {
        patterns: [
            /obtain\s+and\s+maintain\s+insurance/i,
            /errors\s+and\s+omissions/i,
            /\bE&O\b/i,
            /certificate\s+of\s+insurance/i,
            /additional\s+insured/i,
            /workers['']?\s+compensation/i,
            /commercial\s+general\s+liability/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },

    Assignment: {
        patterns: [
            /may\s+not\s+assign/i,
            /shall\s+not\s+assign/i,
            /may\s+freely\s+assign/i,
            /without\s+prior\s+written\s+consent/i,
            /change\s+of\s+control/i
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 3
    },

    ThirdPartyCredits: {
        patterns: [
            /\bENTITLEMENTS?:?\s/i,
            /\bCREDIT:?\s/i,
            /screen\s+credit/i,
            /billing\s+block/i,
            /main\s+titles/i,
            /end\s+credits/i,
            /paid\s+ads/i,
            /presentation\s+credit/i,
            /executive\s+producer\s+credit/i,
            /production\s+credit/i,
            /if\s+not\s+in\s+material\s+breach/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2
    },

    ForceMajeure: {
        patterns: [
            /force\s+majeure/i,
            /beyond\s+reasonable\s+control/i,
            /acts?\s+of\s+God/i,
            /neither\s+party\s+shall\s+be\s+liable/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 3
    },

    // ================================================================
    // LOW PRIORITY - Boilerplate
    // ================================================================

    GeneralProvisions: {
        patterns: [
            /\bMISCELLANEOUS\b/i,
            /\bGENERAL\s+PROVISIONS?\b/i,
            /\bENTIRE\s+AGREEMENT\b/i,
            /\bseverability\b/i,
            /\bcounterparts?\b/i,
            /\bno\s+waiver\b/i
        ],
        min_matches: 2,
        confidence: 0.75,
        priority: 4,
        multi_family_hint: true
    },

    Parties: {
        patterns: [
            /\bPARTIES:\s/i,
            /Amazon\s+Content\s+Services\s+LLC/i,
            /entered\s+into\s+as\s+of/i,
            /by\s+and\s+between/i,
            /\bEFFECTIVE\s+DATE:\s/i
        ],
        min_matches: 2,
        confidence: 0.80,
        priority: 4
    },

    Definitions: {
        patterns: [
            /\bmeans\s+any\b/i,
            /\bshall\s+mean\b/i,
            /\bas\s+used\s+herein\b/i,
            /for\s+purposes\s+of\s+this\s+Agreement/i
        ],
        min_matches: 2,
        confidence: 0.75,
        priority: 4
    }
};

/**
 * Main keyword routing function
 * @param {string} clauseText - The clause text to analyze
 * @returns {object} Routing decision
 */
function keywordRoute(clauseText) {
    if (!clauseText || typeof clauseText !== 'string') {
        return {
            routed: false,
            method: "ERROR",
            error: "Invalid clause text"
        };
    }

    const results = [];

    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        // Check negative patterns first (redirects)
        if (config.negative) {
            const hasNegative = config.negative.some(p => p.test(clauseText));
            if (hasNegative) continue;  // Skip this family
        }

        // Count pattern matches
        const matchedPatterns = config.patterns.filter(p => p.test(clauseText));
        const matchCount = matchedPatterns.length;

        if (matchCount >= config.min_matches) {
            // Calculate confidence based on match ratio
            const matchRatio = matchCount / config.patterns.length;
            const adjustedConfidence = config.confidence * (0.7 + 0.3 * matchRatio);

            results.push({
                family: family,
                confidence: Math.round(adjustedConfidence * 100) / 100,
                matched_patterns: matchCount,
                total_patterns: config.patterns.length,
                priority: config.priority,
                multi_family_hint: config.multi_family_hint || false,
                method: "KEYWORD_MATCH"
            });
        }
    }

    // Sort by priority first, then confidence
    results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.confidence - a.confidence;
    });

    if (results.length > 0) {
        const primary = results[0];
        const alternatives = results.slice(1, 3);

        // Check for multi-family situation
        const hasMultipleCritical = results.filter(r => r.priority <= 2).length > 1;

        return {
            routed: true,
            family: primary.family,
            confidence: primary.confidence,
            matched_patterns: primary.matched_patterns,
            method: "KEYWORD",
            multi_family: hasMultipleCritical,
            multi_family_hint: primary.multi_family_hint,
            alternatives: alternatives.map(a => ({ family: a.family, confidence: a.confidence })),
            // Pass to next node in n8n
            needs_llm: false
        };
    }

    return {
        routed: false,
        family: null,
        confidence: 0,
        method: "NEEDS_LLM",
        needs_llm: true,
        multi_family: false
    };
}

// ================================================================
// n8n EXECUTION
// ================================================================

// Get input from previous node
const inputData = $input.item.json;
const clauseText = inputData.clause_text || inputData.text || "";

// Run keyword routing
const routingResult = keywordRoute(clauseText);

// Merge with original data
return {
    json: {
        ...inputData,
        _keyword_router: routingResult,
        detected_family: routingResult.family,
        routing_confidence: routingResult.confidence,
        routing_method: routingResult.method,
        needs_llm_fallback: routingResult.needs_llm
    }
};
