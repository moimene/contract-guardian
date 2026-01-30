/**
 * ================================================================
 * KEYWORD ROUTER v3 - Generic Patterns for Amazon Contract Review
 * ================================================================
 * Supports: Amazon PSA, CPC Australia, Generic Production Agreements
 * 
 * IMPORTANT: This system is designed for AMAZON as the CLIENT.
 * All patterns are mapped to Amazon's perspective where:
 *   - Amazon/Client = The buyer of production services
 *   - ProdCo/Company = The production service provider
 *
 * Version: 3.0
 * Last Updated: 2026-01-30
 * ================================================================
 */

const KEYWORD_PATTERNS = {

    // ================================================================
    // INDEMNITY PATTERNS
    // ================================================================

    // IndemnityProdCo - Producer indemnifies Amazon/Client
    IndemnityProdCo: {
        patterns: [
            // Amazon PSA standard
            /ProdCo\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+Amazon/i,
            /indemnify\s+Amazon/i,
            /Amazon\s+Indemnitees/i,
            /ProdCo['']?s\s+indemnification/i,

            // CPC Australia - Company (Producer) indemnifies Client (Amazon)
            /Company\s+(shall|will|agrees?\s+to)\s+indemnify\s+(the\s+)?Client/i,
            /Company\s+shall\s+indemnify\s+the\s+Client/i,
            /Company['']?s?\s+liability\s+shall\s+be\s+limited/i,
            /Company\s+Indemnity/i,
            /Production\s+Company.*indemnify.*Client/i,

            // Generic patterns
            /Producer\s+(shall|will)\s+indemnify/i,
            /Contractor\s+(shall|will)\s+indemnify/i,
            /Service\s+Provider\s+(shall|will)\s+indemnify/i,
            /Vendor\s+(shall|will)\s+indemnify\s+(the\s+)?(Customer|Buyer)/i
        ],
        negative: [
            /Amazon\s+(shall|will)\s+indemnify/i,
            /Client\s+(shall|will)\s+indemnify/i,
            /Customer\s+(shall|will)\s+indemnify/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Producer indemnifies Amazon - Standard Amazon position"
    },

    // IndemnityAmazon - Amazon/Client indemnifies Producer
    IndemnityAmazon: {
        patterns: [
            // Amazon PSA standard
            /Amazon\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Amazon\s+agrees?\s+to\s+indemnify/i,
            /indemnify\s+ProdCo/i,
            /ProdCo\s+Indemnitees/i,

            // CPC Australia - Client (Amazon) indemnifies Company (Producer)
            /Client\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Client\s+Indemnity/i,
            /Client\s+shall\s+indemnify\s+(the\s+)?Company/i,
            /Client\s+indemnity\s+shall\s+be\s+limited/i,
            /indemnify\s+(the\s+)?Company/i,

            // Generic patterns
            /Customer\s+(shall|will)\s+indemnify/i,
            /Buyer\s+(shall|will)\s+indemnify/i,
            /Advertiser\s+(shall|will)\s+indemnify/i
        ],
        negative: [
            /ProdCo\s+(shall|will)\s+indemnify/i,
            /Company\s+(shall|will)\s+indemnify\s+(the\s+)?Client/i,
            /Producer\s+(shall|will)\s+indemnify/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Amazon indemnifies Producer - Review scope limitation"
    },

    // IndemnityProcedures
    IndemnityProcedures: {
        patterns: [
            /assume\s+the\s+defense/i,
            /defense\s+and\s+settlement/i,
            /promptly\s+notify/i,
            /counsel\s+reasonably\s+acceptable/i,
            /indemnifying\s+party\s+shall\s+have/i,
            /settlement.*indemnified\s+party/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Indemnification procedures"
    },

    // ================================================================
    // COPYRIGHT / IP PATTERNS
    // ================================================================

    RightsGrant: {
        patterns: [
            // Amazon PSA standard - Full ownership
            /work[s]?\s+made\s+for\s+hire/i,
            /irrevocably\s+assign/i,
            /Amazon\s+shall\s+(own|be\s+the\s+owner|have)/i,
            /exclusive(ly)?\s+own/i,
            /all\s+right[s]?,?\s+title,?\s+(and|&)\s+interest/i,
            /throughout\s+the\s+universe/i,
            /in\s+perpetuity/i,
            /shall\s+be\s+owned\s+by\s+Amazon/i,
            /vest\s+in\s+Amazon/i,
            /exclusive\s+owner\s+for\s+copyright/i,
            /results\s+and\s+proceeds/i,

            // CPC Australia - Copyright Assignment to Client (Amazon)
            /assign\s+to\s+(the\s+)?Client\s+all\s+of\s+its\s+copyright/i,
            /Company\s+shall\s+assign\s+to\s+(the\s+)?Client/i,
            /copyright\s+assignment/i,
            /assign.*copyright.*throughout\s+the\s+world/i,
            /ownership.*shall\s+vest\s+in\s+(the\s+)?Client/i,
            /upon\s+receipt.*Fee.*assign/i,

            // Generic IP transfer to buyer
            /assign[s]?\s+(all\s+)?(of\s+its\s+)?copyright/i,
            /transfer[s]?\s+(all\s+)?intellectual\s+property/i,
            /vest[s]?\s+in\s+(the\s+)?(Client|Customer|Buyer)/i,
            /rights?\s+shall\s+vest\s+in/i
        ],
        negative: [
            // Reversion patterns - should go to RightsReversion
            /\breversion\b/i,
            /\brevert\b/i,
            /\bturnaround\b/i,
            /\breacquisition\b/i,
            // Producer retains rights - RED FLAG
            /Company\s+retains\s+all\s+intellectual\s+property/i,
            /ProdCo\s+retains/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Rights transfer to Amazon - Core Amazon requirement"
    },

    // RightsReversion - Rights revert to Producer
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
            /\bwaives?\s+(any\s+)?reversion\b/i,
            /shall\s+revert\s+to\s+(ProdCo|Company|Producer)/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Rights reversion - Potential risk to Amazon's perpetual ownership"
    },

    // ================================================================
    // REPRESENTATIONS & WARRANTIES
    // ================================================================

    RepsProdCo: {
        patterns: [
            // Amazon PSA standard
            /ProdCo\s+represents?\s*(,?\s*warrants?)?(\s+and\s+agrees)?/i,
            /REPRESENTATIONS?\/?WARRANTIES?/i,
            /will\s+not\s+infringe/i,
            /does\s+not\s+violate/i,
            /free\s+and\s+clear/i,
            /full\s+right,?\s+power,?\s+(and|&)\s+authority/i,
            /no\s+claim,?\s+litigation/i,
            /wholly\s+original/i,
            /chain\s+of\s+title/i,

            // CPC Australia
            /Company\s+(represents?|warrants?|agrees)/i,
            /Company\s+undertakes\s+to/i,
            /Company\s+shall\s+(ensure|procure)/i,

            // Generic
            /Producer\s+(represents?|warrants?)/i,
            /Contractor\s+(represents?|warrants?)/i,
            /Service\s+Provider\s+(represents?|warrants?)/i
        ],
        negative: [
            /Amazon\s+represents/i,
            /Client\s+(represents?|warrants?)/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Producer representations - Ensure comprehensive coverage"
    },

    // ================================================================
    // LIABILITY LIMITATION
    // ================================================================

    LiabilityLimitation: {
        patterns: [
            // Standard legal phrases
            /IN\s+NO\s+EVENT\s+SHALL/i,
            /CONSEQUENTIAL\s+DAMAGES/i,
            /INDIRECT\s+DAMAGES/i,
            /INCIDENTAL\s+DAMAGES/i,
            /PUNITIVE\s+DAMAGES/i,
            /TOTAL\s+AGGREGATE\s+LIABILITY/i,
            /SHALL\s+NOT\s+EXCEED/i,
            /LIMITATION\s+OF\s+LIABILITY/i,
            /MAXIMUM\s+LIABILITY/i,
            /LOSS\s+OF\s+(BUSINESS\s+)?PROFITS/i,

            // CPC Australia
            /liability\s+shall\s+be\s+limited\s+to/i,
            /limited\s+to\s+the\s+(total\s+)?Fee/i,
            /no\s+liability\s+for\s+consequential\s+loss/i,
            /no\s+liability\s+for.*pecuniary\s+loss/i,

            // Generic
            /liability\s+cap/i,
            /cap\s+on\s+liability/i,
            /aggregate\s+liability/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Liability caps - Verify asymmetric (ProdCo uncapped, Amazon capped)"
    },

    // ================================================================
    // PAYMENT
    // ================================================================

    PaymentCredits: {
        patterns: [
            // Amazon PSA standard
            /production\s+fee/i,
            /Amazon\s+(shall|will)\s+pay/i,
            /in\s+full\s+consideration/i,
            /milestone\s+payment/i,
            /net\s+receipts/i,
            /contingent\s+compensation/i,
            /backend\s+participation/i,
            /payment\s+schedule/i,
            /\bFEES:\s/i,

            // CPC Australia
            /Payment\s+of\s+the\s+Agreed\s+Fee/i,
            /Client\s+agrees\s+to\s+pay\s+(the\s+)?Company/i,
            /Fifty\s+Percent.*due\s+on\s+receipt/i,
            /instalments/i,
            /PAYMENT\s+TERMS/i,
            /payable.*days\s+after/i,

            // Generic
            /fee[s]?\s+payable/i,
            /late\s+payment.*interest/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Payment terms - Verify milestone-based, offset rights"
    },

    // ================================================================
    // TERMINATION
    // ================================================================

    TerminationRights: {
        patterns: [
            // Amazon PSA standard
            /Amazon\s+may\s+terminate/i,
            /may\s+terminate/i,
            /termination\s+for\s+(cause|convenience)/i,
            /right\s+to\s+terminate/i,
            /entitled\s+to\s+terminate/i,
            /cure\s+period/i,
            /upon\s+written\s+notice/i,
            /material\s+breach/i,

            // CPC Australia
            /Client\s+shall\s+be\s+entitled\s+to.*cancel/i,
            /Client\s+may\s+terminate\s+this\s+Agreement/i,
            /cancel\s+the\s+whole\s+or\s+any\s+part/i,
            /notice\s+of\s+cancellation/i,
            /relocation,?\s+postponement\s+or\s+cancellation/i,
            /terminate\s+this\s+Agreement\s+by.*written\s+notice/i,

            // Generic
            /either\s+party\s+may\s+terminate/i,
            /terminate\s+for\s+cause/i,
            /terminate\s+for\s+breach/i,
            /termination\s+upon\s+written\s+notice/i
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 1,
        amazon_note: "Termination rights - Amazon prefers convenience termination"
    },

    TerminationConsequences: {
        patterns: [
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i,
            /termination\s+payment/i,
            /upon\s+such\s+termination/i,
            /shall\s+remain\s+vested/i,

            // CPC Australia - Cancellation fees
            /Cancellation\s+Fee/i,
            /cancellation\s+fee\s+payable/i,
            /Working\s+Days\s+prior\s+to.*commencement/i,
            /Hard\s+Costs/i,
            /Creative\s+Fee.*Production\s+Fee/i,
            /Recommencement\s+Costs/i,

            // Generic
            /termination\s+fee/i,
            /kill\s+fee/i
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 2,
        amazon_note: "Termination consequences - Review cost exposure"
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
        priority: 2,
        amazon_note: "Survival provisions"
    },

    // ================================================================
    // SERVICES SCOPE
    // ================================================================

    ServicesScope: {
        patterns: [
            // Amazon PSA standard
            /ProdCo\s+will\s+render\s+services/i,
            /render\s+all\s+production\s+services/i,
            /pre-production,?\s+principal\s+photography,?\s+post-production/i,
            /complete\s+the\s+Program/i,
            /deliver\s+the\s+Program/i,
            /produce\s+the\s+Program/i,
            /\bSERVICES:\s/i,

            // CPC Australia
            /Company.*providing.*Production\s+Services/i,
            /Company\s+will\s+produce\s+the\s+Deliverables/i,
            /Scope\s+of\s+Services/i,
            /Services\s+means/i,
            /provision\s+of\s+(the\s+)?Services/i,

            // Generic
            /scope\s+of\s+work/i,
            /services\s+to\s+be\s+provided/i,
            /Contractor\s+(shall|will)\s+provide/i,
            /deliverables/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Scope definition"
    },

    // ================================================================
    // CONFIDENTIALITY
    // ================================================================

    Confidentiality: {
        patterns: [
            // Amazon PSA standard
            /maintain\s+in\s+strict\s+confidence/i,
            /confidential\s+information/i,
            /non-public\s+information/i,
            /\bNPI\b/,

            // CPC Australia
            /duty\s+not.*to\s+disclose/i,
            /without.*prior\s+written\s+permission.*confidential/i,
            /keep\s+confidential\s+and\s+not\s+disclose/i,
            /treat\s+in\s+confidence/i,
            /confidential\s+nature/i,

            // Data Protection
            /\bDATA\s+PROTECTION\b/i,
            /personal\s+data/i,
            /\bGDPR\b/i,
            /data\s+protection\s+laws/i,
            /processing.*personal/i,
            /shall\s+not\s+disclose/i,
            /\bCCPA\b/i,
            /data\s+controller/i,
            /data\s+processor/i,

            // Generic
            /non-disclosure/i,
            /proprietary\s+information/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Confidentiality obligations"
    },

    // ================================================================
    // INSURANCE
    // ================================================================

    Insurance: {
        patterns: [
            /obtain\s+and\s+maintain\s+insurance/i,
            /errors\s+and\s+omissions/i,
            /\bE&O\b/i,
            /certificate\s+of\s+insurance/i,
            /additional\s+insured/i,
            /workers['']?\s+compensation/i,
            /commercial\s+general\s+liability/i,

            // CPC Australia
            /insure\s+itself\s+effectively/i,
            /Public\s+Liability\s+Insurance/i,
            /Workers\s+Comp/i,
            /Key\s+Person\s+Insurance/i,
            /Cast.*Insurance/i,
            /insurances?\s+are\s+in\s+effect/i,

            // Generic
            /insurance\s+polic(y|ies)/i,
            /professional\s+indemnity\s+insurance/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Insurance requirements"
    },

    // ================================================================
    // DISPUTE RESOLUTION
    // ================================================================

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
            /\bTAX;\s+GOVERNING\s+LAW\b/i,

            // CPC Australia
            /Dispute\s+Procedure/i,
            /Dispute\s+Policy/i,
            /mediation/i,
            /submit\s+to.*jurisdiction/i,

            // Generic
            /dispute\s+resolution/i,
            /choice\s+of\s+law/i,
            /forum\s+selection/i,
            /venue\s+for\s+disputes/i,
            /arbitration\s+clause/i
        ],
        min_matches: 2,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Dispute resolution - Check for Amazon-favorable venue"
    },

    // ================================================================
    // FORCE MAJEURE
    // ================================================================

    ForceMajeure: {
        patterns: [
            /force\s+majeure/i,
            /Event\s+of\s+Force\s+Majeure/i,
            /beyond\s+reasonable\s+control/i,
            /acts?\s+of\s+God/i,
            /natural\s+disaster/i,
            /state-of-emergency/i,
            /government.*lockdown/i,
            /pandemic/i,
            /neither\s+party\s+shall\s+be\s+liable/i,
            /unforeseeable\s+circumstances/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 3,
        amazon_note: "Force majeure - Review termination and cost allocation"
    },

    // ================================================================
    // LOW PRIORITY - Boilerplate
    // ================================================================

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
        priority: 3,
        amazon_note: "Assignment restrictions"
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
        priority: 2,
        amazon_note: "Credits and entitlements"
    },

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
        amazon_note: "General boilerplate"
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
        priority: 4,
        amazon_note: "Party identification"
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
        priority: 4,
        amazon_note: "Definitions section"
    }
};

// ================================================================
// PARTY CONTEXT DETECTION
// ================================================================

const PARTY_NORMALIZATION = {
    client_patterns: [
        { pattern: /Amazon/i, label: "Amazon" },
        { pattern: /Client/i, label: "Client" },
        { pattern: /Customer/i, label: "Customer" },
        { pattern: /Buyer/i, label: "Buyer" },
        { pattern: /Advertiser/i, label: "Advertiser" }
    ],
    producer_patterns: [
        { pattern: /ProdCo/i, label: "ProdCo" },
        { pattern: /Production\s+Company/i, label: "Production Company" },
        { pattern: /Company/i, label: "Company" },
        { pattern: /Producer/i, label: "Producer" },
        { pattern: /Contractor/i, label: "Contractor" }
    ]
};

function detectPartyContext(text) {
    let clientType = "Unknown";
    let producerType = "Unknown";

    for (const { pattern, label } of PARTY_NORMALIZATION.client_patterns) {
        if (pattern.test(text)) { clientType = label; break; }
    }

    for (const { pattern, label } of PARTY_NORMALIZATION.producer_patterns) {
        if (pattern.test(text)) { producerType = label; break; }
    }

    let contractStyle = "UNKNOWN";
    if (/Amazon|ProdCo/i.test(text)) {
        contractStyle = "AMAZON_PSA";
    } else if (/Company.*Client|Production\s+Company/i.test(text)) {
        contractStyle = "CPC_AUSTRALIA";
    } else if (/Contractor.*Customer/i.test(text)) {
        contractStyle = "GENERIC_SERVICES";
    }

    return {
        amazon_equivalent: clientType,
        producer_equivalent: producerType,
        contract_style: contractStyle,
        mapping_note: contractStyle !== "AMAZON_PSA"
            ? `Mapped: ${clientType} → Amazon role, ${producerType} → ProdCo role`
            : null
    };
}

// ================================================================
// MAIN ROUTING FUNCTION
// ================================================================

function keywordRoute(clauseText, clauseHeading = "") {
    if (!clauseText || typeof clauseText !== 'string') {
        return { routed: false, method: "ERROR", error: "Invalid clause text" };
    }

    const combinedText = `${clauseHeading} ${clauseText}`;
    const results = [];

    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        // Skip if negative patterns match
        if (config.negative) {
            const hasNegative = config.negative.some(p => p.test(combinedText));
            if (hasNegative) continue;
        }

        // Count positive pattern matches
        const matchedPatterns = config.patterns.filter(p => p.test(combinedText));
        const matchCount = matchedPatterns.length;

        if (matchCount >= config.min_matches) {
            const matchRatio = matchCount / config.patterns.length;
            const adjustedConfidence = Math.min(0.95, config.confidence * (0.7 + 0.3 * matchRatio));

            results.push({
                family: family,
                confidence: Math.round(adjustedConfidence * 100) / 100,
                matched_patterns: matchCount,
                total_patterns: config.patterns.length,
                priority: config.priority,
                amazon_note: config.amazon_note,
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
        const partyContext = detectPartyContext(combinedText);

        return {
            routed: true,
            family: results[0].family,
            confidence: results[0].confidence,
            matched_patterns: results[0].matched_patterns,
            amazon_note: results[0].amazon_note,
            method: "KEYWORD",
            multi_family: results.length > 1,
            alternatives: results.slice(1, 3).map(a => ({ family: a.family, confidence: a.confidence })),
            party_context: partyContext,
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
// N8N EXECUTION
// ================================================================

const inputData = $input.item.json;
const clauseText = inputData.clause_text || inputData.text || "";
const clauseHeading = inputData.heading || inputData.clause_heading || "";

const routingResult = keywordRoute(clauseText, clauseHeading);

return {
    json: {
        ...inputData,
        _keyword_router: routingResult,
        detected_family: routingResult.family,
        routing_confidence: routingResult.confidence,
        routing_method: routingResult.method,
        amazon_note: routingResult.amazon_note,
        party_context: routingResult.party_context,
        needs_llm_fallback: routingResult.needs_llm
    }
};
