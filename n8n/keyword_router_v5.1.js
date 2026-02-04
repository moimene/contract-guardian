/**
 * ================================================================
 * HYBRID KEYWORD ROUTER v5.1 - CG-018 Legal Reinforcement
 * ================================================================
 * OPTIMIZED FOR: Amazon PSA/DSA contracts
 * 
 * CG-016 FIXES (v5.0):
 * - 5-Stage Architecture: Normalize → Direction → Match → Resolve → Confidence
 * - Case-insensitive patterns (fixes LiabilityLimitation)
 * - Directional analysis (fixes IndemnityAmazon vs IndemnityProdCo)
 * - Multi-tier matching: Exact → Regex → Keywords
 * - Conflict resolution with priority scoring
 *
 * CG-018 LEGAL REINFORCEMENT (v5.1):
 * - Added 22 new red flag patterns from Legal Team
 * - Enhanced IndemnityProcedures with settlement/control patterns
 * - Added knowledge qualifier detection for RepsProdCo
 * - Added mutual indemnification detection
 *
 * Version: 5.1
 * Last Updated: 2026-02-03
 * ================================================================
 */

const clauseText = $json.clause_text || '';
const heading = $json.heading || '';

// ============================================================
// STAGE 1: TEXT NORMALIZATION
// ============================================================

const normalizedText = clauseText.toLowerCase();
const originalText = clauseText;
const hasAllCaps = /[A-Z]{4,}/.test(originalText);

// ============================================================
// STAGE 2: DIRECTIONAL ANALYSIS
// Determines WHO is obligated TO WHOM
// ============================================================

function detectDirection(text) {
    const lower = text.toLowerCase();

    const prodcoObligorPatterns = [
        /prodco\s+(shall|will|agrees?\s+to|hereby)\s+(indemnify|defend|hold\s+harmless)/i,
        /prodco\s+(shall|will)\s+be\s+(liable|responsible)/i,
        /prodco\s+(represents|warrants|covenants)/i,
        /prodco['']?s\s+(obligation|liability|indemnification)/i,
        /indemnify[\s,]+defend[\s,]+.*?amazon/i,
        /hold\s+amazon\s+harmless/i
    ];

    const amazonObligorPatterns = [
        /amazon\s+(shall|will|agrees?\s+to|hereby)\s+(indemnify|defend|hold\s+harmless)/i,
        /amazon\s+(shall|will)\s+be\s+(liable|responsible)/i,
        /amazon['']?s\s+(obligation|liability|indemnification)/i,
        /indemnify[\s,]+defend[\s,]+.*?prodco/i,
        /hold\s+prodco\s+harmless/i,
        /amazon\s+indemnitee/i
    ];

    const mutualPatterns = [
        /each\s+party\s+(shall|will|agrees?\s+to)/i,
        /both\s+parties/i,
        /mutual(ly)?/i,
        /reciprocal/i
    ];

    let prodcoScore = 0, amazonScore = 0, mutualScore = 0;

    prodcoObligorPatterns.forEach(p => { if (p.test(text)) prodcoScore++; });
    amazonObligorPatterns.forEach(p => { if (p.test(text)) amazonScore++; });
    mutualPatterns.forEach(p => { if (p.test(text)) mutualScore++; });

    if (/amazon\s+indemnitees?/i.test(text)) prodcoScore += 2;
    if (/prodco\s+indemnitees?/i.test(text)) amazonScore += 2;

    if (mutualScore > 0 && prodcoScore === amazonScore) return 'MUTUAL';
    if (prodcoScore > amazonScore) return 'PRODCO_OBLIGOR';
    if (amazonScore > prodcoScore) return 'AMAZON_OBLIGOR';
    return 'NONE';
}

const obligationDirection = detectDirection(clauseText);

// ============================================================
// STAGE 3: ENHANCED PATTERN DEFINITIONS
// ============================================================

const ENHANCED_PATTERNS = {

    // ========== CRITICAL PRIORITY - INDEMNITY ==========

    IndemnityProdCo: {
        tier1_exact: [
            "prodco shall indemnify",
            "prodco will indemnify",
            "prodco agrees to indemnify",
            "prodco hereby indemnifies",
            "indemnify, defend, and hold harmless amazon",
            "indemnify, defend and hold harmless amazon",
            "amazon indemnitees"
        ],
        tier2_regex: [
            /prodco\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+amazon/i,
            /from\s+and\s+against\s+any\s+(and\s+all\s+)?claims/i,
            /prodco\s+shall\s+defend/i,
            /hold\s+amazon\s+harmless/i
        ],
        tier3_keywords: ["indemnify", "defend", "hold harmless", "losses", "claims"],
        negative: [/amazon\s+(shall|will)\s+indemnify/i],
        requires_direction: 'PRODCO_OBLIGOR',
        min_matches: 1,
        base_confidence: 0.92,
        priority: 1,
        // CG-018 Legal Red Flags - Mutual/Capped Indemnification
        red_flag_patterns: [
            /each\s+party\s+(shall|will)\s+indemnify/i,
            /mutual\s+indemnification/i,
            /shall\s+not\s+exceed/i,
            /capped\s+at/i,
            /aggregate\s+liability/i
        ]
    },

    IndemnityAmazon: {
        tier1_exact: [
            "amazon shall indemnify",
            "amazon will indemnify",
            "amazon agrees to indemnify",
            "amazon hereby indemnifies",
            "indemnify, defend, and hold harmless prodco",
            "prodco indemnitees"
        ],
        tier2_regex: [
            /amazon\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+prodco/i,
            /amazon['']?s\s+indemnification\s+obligations?/i,
            /amazon\s+shall\s+defend\s+prodco/i
        ],
        tier3_keywords: ["amazon indemnify", "amazon's indemnification"],
        negative: [/prodco\s+(shall|will)\s+indemnify/i],
        requires_direction: 'AMAZON_OBLIGOR',
        min_matches: 1,
        base_confidence: 0.92,
        priority: 1,
        // CG-018 Legal Red Flags
        red_flag_patterns: [
            /same\s+terms/i,
            /mutual/i,
            /reciprocal\s+indemnification/i
        ]
    },

    IndemnityProcedures: {
        tier1_exact: [
            "promptly notify",
            "prompt notice",
            "prompt written notice",
            "assume the defense",
            "control of the defense",
            "right to participate",
            "consent to settlement",
            "prior written consent to any settlement",
            "counsel reasonably acceptable",
            "defense of such claim",
            // CG-018 Legal Additions:
            "notice as condition to indemnity",
            "sole control of settlement",
            "without Amazon's consent",
            "waives any right to participate"
        ],
        tier2_regex: [
            /notice\s+of\s+(any\s+)?(claim|action|proceeding)/i,
            /assume\s+(the\s+)?defense/i,
            /control\s+(of\s+)?(the\s+)?defense/i,
            /settlement\s+(shall\s+)?require/i,
            /right\s+to\s+participate\s+in\s+(the\s+)?defense/i,
            /counsel\s+(reasonably\s+)?acceptable/i,
            /cooperate\s+(in\s+)?(the\s+)?defense/i,
            /indemnifying\s+party\s+(shall|will)/i,
            /indemnified\s+party\s+(shall|will)/i,
            // CG-018 Legal Red Flags:
            /notice\s+as\s+condition/i,
            /sole\s+control\s+of\s+settlement/i,
            /prodco\s+may\s+settle/i,
            /without\s+amazon['']?s\s+consent/i,
            /waive[sd]?\s+(any\s+)?right\s+to\s+participate/i,
            /counsel\s+without\s+amazon['']?s\s+approval/i
        ],
        tier3_keywords: ["notice", "defense", "settlement", "claim", "counsel", "control"],
        negative: [],
        min_matches: 2,
        base_confidence: 0.88,
        priority: 1,
        // CG-018: These patterns indicate CRITICAL risk
        red_flag_patterns: [
            /notice\s+as\s+condition/i,
            /sole\s+control/i,
            /prodco\s+may\s+settle/i,
            /without\s+amazon['']?s\s+consent/i,
            /forfeit/i
        ]
    },

    // ========== CG-016 FIX: LiabilityLimitation ==========

    LiabilityLimitation: {
        tier1_exact: [
            "in no event shall",
            "under no circumstances",
            "limitation of liability",
            "aggregate liability",
            "consequential damages",
            "indirect damages",
            "incidental damages",
            "punitive damages",
            "special damages",
            "lost profits",
            "shall not exceed",
            "maximum liability",
            "waives all claims"
        ],
        tier2_regex: [
            /in\s+no\s+event\s+shall/i,
            /under\s+no\s+circumstances/i,
            /limitation\s+of\s+liability/i,
            /aggregate\s+liability\s+(shall\s+)?not\s+exceed/i,
            /consequential\s+(or\s+)?(indirect\s+)?damages/i,
            /indirect\s+(or\s+)?(consequential\s+)?damages/i,
            /incidental\s+(or\s+)?(punitive\s+)?damages/i,
            /waive[sd]?\s+(all\s+)?claims/i,
            /liability\s+(shall\s+)?be\s+limited\s+to/i,
            /liability\s+cap/i,
            /exclude[sd]?\s+(all\s+)?liability/i,
            /neither\s+party\s+shall\s+be\s+liable/i
        ],
        tier3_keywords: ["liability", "damages", "cap", "exceed", "limitation"],
        negative: [
            /shall\s+indemnify/i,
            /gross\s+negligence/i,
            /willful\s+misconduct/i
        ],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1,
        boost_if_all_caps: true,
        // CG-018 Legal Red Flags
        red_flag_patterns: [
            /shall\s+not\s+exceed/i,
            /capped\s+at/i,
            /neither\s+party\s+shall\s+be\s+liable/i,
            /mutual\s+limitation/i,
            /prodco['']?s\s+liability\s+shall\s+not\s+exceed/i,
            /symmetric/i,
            /cap\s+shall\s+apply\s+to\s+both\s+parties/i,
            /gross\s+negligence\s+only/i,
            /willful\s+misconduct\s+only/i,
            /consequential/i,
            /sole\s+remedy/i,
            /exclusive\s+remedy/i
        ]
    },

    // ========== CG-016 FIX: PaymentCredits ==========

    PaymentCredits: {
        tier1_exact: [
            "production fee",
            "production fees",
            "episode fee",
            "per-episode fee",
            "pilot fee",
            "net receipts",
            "gross receipts",
            "backend participation",
            "profit participation",
            "contingent compensation",
            "deferred compensation",
            "milestone payment",
            "milestone payments",
            "payment schedule",
            "payment terms",
            "payable within",
            "net 30",
            "net 45",
            "net 60",
            "upon delivery",
            "upon acceptance",
            "commencement of principal photography",
            "completion of production"
        ],
        tier2_regex: [
            /amazon\s+(shall|will)\s+pay/i,
            /payable\s+within\s+\d+\s+days/i,
            /net\s+\d+/i,
            /production\s+fee/i,
            /episode\s+fee/i,
            /per[- ]episode/i,
            /pilot\s+fee/i,
            /budget(ed)?\s+amount/i,
            /approved\s+budget/i,
            /payment\s+(shall|will)\s+be\s+made/i,
            /entitled\s+to\s+(receive\s+)?payment/i,
            /fee\s+of\s+\$[\d,]+/i,
            /\$[\d,]+\s+(per|for)\s+(episode|pilot|season)/i,
            /(first|second|third|final)\s+installment/i,
            /upon\s+(delivery|acceptance|completion)/i,
            /backend\s+(participation|points)/i,
            /profit\s+participation/i,
            /gross\s+receipts?/i,
            /net\s+receipts?/i,
            /contingent\s+compensation/i
        ],
        tier3_keywords: ["payment", "fee", "pay", "compensate", "remuneration"],
        negative: [
            /terminate/i,
            /upon\s+termination/i,
            /kill\s+fee/i
        ],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 1
    },

    // ========== CG-016 FIX: Insurance ==========

    Insurance: {
        tier1_exact: [
            "errors and omissions",
            "E&O",
            "e&o insurance",
            "commercial general liability",
            "CGL",
            "workers compensation",
            "workers' compensation",
            "umbrella insurance",
            "umbrella policy",
            "additional insured",
            "certificate of insurance",
            "ACORD",
            "policy limits",
            "coverage limits",
            "per occurrence",
            "aggregate limit",
            "primary and non-contributory"
        ],
        tier2_regex: [
            /errors?\s+and\s+omissions?/i,
            /\bE\s*&\s*O\b/i,
            /commercial\s+general\s+liability/i,
            /\bCGL\b/i,
            /worker['']?s?\s*['']?\s*comp(ensation)?/i,
            /umbrella\s+(insurance|policy|coverage)/i,
            /additional\s+insured/i,
            /certificate\s+of\s+insurance/i,
            /obtain\s+and\s+maintain\s+(the\s+following\s+)?insurance/i,
            /insurance\s+(coverage|requirements?|policies)/i,
            /policy\s+limits?\s+(of|shall\s+be)/i,
            /\$[\d,]+\s+per\s+occurrence/i,
            /\$[\d,]+\s+aggregate/i,
            /cancellation\s+notice/i,
            /waiver\s+of\s+subrogation/i,
            /primary\s+and\s+non-?contributory/i,
            /auto(mobile)?\s+(liability\s+)?insurance/i
        ],
        tier3_keywords: ["insurance", "policy", "coverage", "insured", "carrier"],
        negative: [
            /represents\s+and\s+warrants/i,
            /warrant\s+that/i
        ],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1
    },

    // ========== HIGH PRIORITY ==========

    RepsProdCo: {
        tier1_exact: [
            "prodco represents and warrants",
            "prodco hereby represents",
            "prodco warrants that",
            "prodco covenants",
            "full right and authority",
            "duly organized",
            "validly existing",
            "no litigation pending",
            "chain of title"
        ],
        tier2_regex: [
            /prodco\s+(hereby\s+)?(represents|warrants)\s+(and\s+warrants\s+)?that/i,
            /prodco\s+covenants/i,
            /full\s+right\s+(and\s+)?authority/i,
            /duly\s+organized\s+and\s+validly\s+existing/i,
            /no\s+(pending\s+)?(litigation|claims?|actions?)/i,
            /chain\s+of\s+title/i,
            /free\s+and\s+clear\s+of\s+(any\s+)?(liens?|encumbrances?)/i
        ],
        tier3_keywords: ["represents", "warrants", "covenants", "authority"],
        negative: [
            /amazon\s+(represents|warrants)/i,
            /insurance/i,
            /coverage/i,
            /E\s*&\s*O/i
        ],
        requires_direction: 'PRODCO_OBLIGOR',
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2,
        // CG-018 Legal Red Flags - Knowledge Qualifiers
        red_flag_patterns: [
            /to\s+prodco['']?s?\s+knowledge/i,
            /to\s+the\s+best\s+of\s+prodco['']?s?\s+knowledge/i,
            /material\s+breach\s+only/i,
            /except\s+as\s+disclosed/i,
            /subject\s+to\s+exceptions?/i
        ]
    },

    RightsGrant: {
        tier1_exact: [
            "grants to amazon",
            "hereby grants",
            "all rights",
            "exclusive rights",
            "exclusive license",
            "in perpetuity",
            "throughout the universe",
            "work made for hire",
            "work-made-for-hire",
            "all media now known or hereafter devised"
        ],
        tier2_regex: [
            /grants?\s+to\s+amazon/i,
            /(hereby\s+)?grants?\s+(to\s+amazon\s+)?(all\s+)?rights?/i,
            /exclusive\s+(and\s+irrevocable\s+)?(rights?|license)/i,
            /in\s+perpetuity/i,
            /throughout\s+the\s+universe/i,
            /world-?wide/i,
            /work[- ]made[- ]for[- ]hire/i,
            /all\s+media\s+(now\s+known|whether\s+now)/i,
            /exploitation\s+rights?/i,
            /all\s+right,?\s+title,?\s+and\s+interest/i
        ],
        tier3_keywords: ["grant", "rights", "license", "exclusive", "perpetuity"],
        negative: [/revert/i, /turnaround/i, /reacquire/i],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    RightsReversion: {
        tier1_exact: [
            "rights shall revert",
            "reversion of rights",
            "turnaround",
            "turnaround rights",
            "reacquisition",
            "reacquire the rights",
            "first negotiation",
            "first refusal",
            "matching right",
            "last refusal"
        ],
        tier2_regex: [
            /rights?\s+(shall|will)\s+revert/i,
            /reversion\s+of\s+rights?/i,
            /turnaround(\s+rights?)?/i,
            /reacquir(e|ition)/i,
            /first\s+(negotiation|refusal)/i,
            /matching\s+right/i,
            /last\s+refusal/i,
            /right\s+to\s+reacquire/i
        ],
        tier3_keywords: ["revert", "reversion", "turnaround", "reacquire"],
        negative: [
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i
        ],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1
    },

    TerminationRights: {
        tier1_exact: [
            "may terminate this agreement",
            "right to terminate",
            "terminate for cause",
            "terminate for convenience",
            "terminate immediately",
            "terminate upon notice",
            "material breach"
        ],
        tier2_regex: [
            /(may|shall\s+have\s+the\s+right\s+to)\s+terminate/i,
            /right\s+to\s+terminate/i,
            /terminate\s+(for\s+)?(cause|convenience)/i,
            /terminate\s+immediately/i,
            /terminate\s+upon\s+\d+\s+days/i,
            /upon\s+\d+\s+days['']?\s+(prior\s+)?(written\s+)?notice/i,
            /material\s+breach/i,
            /uncured\s+breach/i,
            /cure\s+period/i
        ],
        tier3_keywords: ["terminate", "termination", "breach", "cure"],
        negative: [
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i,
            /consequence/i
        ],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    TerminationConsequences: {
        tier1_exact: [
            "upon termination",
            "effect of termination",
            "following termination",
            "consequences of termination",
            "termination payment",
            "kill fee",
            "termination fee",
            "return all materials",
            "deliver all work product"
        ],
        tier2_regex: [
            /upon\s+(any\s+)?termination/i,
            /effect\s+of\s+termination/i,
            /following\s+(any\s+)?termination/i,
            /consequence[s]?\s+of\s+termination/i,
            /termination\s+(payment|fee)/i,
            /kill\s+fee/i,
            /return\s+(all\s+)?materials?/i,
            /deliver\s+(all\s+)?work\s+product/i,
            /shall\s+be\s+(paid|due)\s+upon\s+termination/i,
            /rights?\s+(granted\s+)?shall\s+(survive|terminate)/i
        ],
        tier3_keywords: ["upon termination", "following termination", "kill fee"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    ForceMajeure: {
        tier1_exact: [
            "force majeure",
            "act of god",
            "acts of god",
            "beyond reasonable control",
            "beyond the control",
            "natural disaster",
            "pandemic",
            "epidemic"
        ],
        tier2_regex: [
            /force\s+majeure/i,
            /acts?\s+of\s+god/i,
            /beyond\s+(the\s+)?(reasonable\s+)?control/i,
            /natural\s+disaster/i,
            /pandemic/i,
            /epidemic/i,
            /war,?\s+(terrorism|civil)/i,
            /earthquake|flood|hurricane|fire/i,
            /government(al)?\s+(action|order|regulation)/i,
            /labor\s+(dispute|strike)/i,
            /suspend\s+(any\s+)?services?/i,
            /automatically\s+extend/i
        ],
        tier3_keywords: ["force majeure", "act of god", "disaster", "pandemic"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.92,
        priority: 1
    },

    Confidentiality: {
        tier1_exact: [
            "confidential information",
            "maintain in strict confidence",
            "shall not disclose",
            "non-disclosure",
            "NPI",
            "non-public information",
            "proprietary information",
            "trade secrets"
        ],
        tier2_regex: [
            /confidential\s+information/i,
            /maintain\s+(in\s+)?(strict\s+)?confidence/i,
            /shall\s+not\s+disclose/i,
            /non[- ]disclosure/i,
            /\bNPI\b/,
            /non[- ]public\s+information/i,
            /proprietary\s+information/i,
            /trade\s+secrets?/i,
            /confidentiality\s+obligations?/i,
            /keep\s+(strictly\s+)?confidential/i
        ],
        tier3_keywords: ["confidential", "disclose", "secret", "proprietary"],
        negative: [
            /\bGDPR\b/i,
            /data\s+protection/i,
            /data\s+controller/i,
            /personal\s+data/i,
            /assign/i
        ],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 2
    },

    DataProtection: {
        tier1_exact: [
            "GDPR",
            "CCPA",
            "data protection",
            "personal data",
            "data controller",
            "data processor",
            "data subject"
        ],
        tier2_regex: [
            /\bGDPR\b/i,
            /\bCCPA\b/i,
            /data\s+protection\s+laws?/i,
            /data\s+controller/i,
            /data\s+processor/i,
            /personal\s+data/i,
            /processing\s+of\s+personal\s+data/i,
            /data\s+subject\s+rights?/i,
            /privacy\s+impact\s+assessment/i,
            /data\s+breach\s+notification/i
        ],
        tier3_keywords: ["GDPR", "personal data", "data protection", "privacy"],
        negative: [/trade\s+secrets?/i, /proprietary\s+information/i],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1
    },

    DisputeResolution: {
        tier1_exact: [
            "governing law",
            "laws of the state of california",
            "state of california",
            "exclusive jurisdiction",
            "binding arbitration",
            "JAMS",
            "AAA",
            "American Arbitration Association"
        ],
        tier2_regex: [
            /governed\s+by\s+(the\s+)?laws?\s+of/i,
            /laws?\s+of\s+(the\s+State\s+of\s+)?California/i,
            /exclusive\s+jurisdiction/i,
            /venue\s+shall\s+be/i,
            /binding\s+arbitration/i,
            /\bJAMS\b/,
            /\bAAA\b/,
            /American\s+Arbitration\s+Association/i,
            /waive[s]?\s+(any\s+)?right\s+to\s+(a\s+)?jury/i,
            /jury\s+trial\s+waiver/i
        ],
        tier3_keywords: ["governing law", "jurisdiction", "arbitration", "venue"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    AuditRights: {
        tier1_exact: [
            "audit rights",
            "right to audit",
            "books and records",
            "inspect books",
            "examine records"
        ],
        tier2_regex: [
            /audit\s+rights?/i,
            /right\s+to\s+audit/i,
            /inspect\s+(the\s+)?books\s+(and\s+records)?/i,
            /books\s+and\s+records/i,
            /examine\s+(the\s+)?records?/i,
            /accountant\s+(shall|may)\s+(have\s+)?access/i,
            /access\s+to\s+(the\s+)?records?/i,
            /production\s+costs?\s+records?/i,
            /verification\s+of\s+costs?/i
        ],
        tier3_keywords: ["audit", "inspect", "books", "records", "examine"],
        negative: [/grant/i, /license/i, /exploitation/i, /in\s+perpetuity/i],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 2
    },

    Assignment: {
        tier1_exact: [
            "may not assign",
            "shall not assign",
            "assignment is void",
            "successors and assigns",
            "may freely assign",
            "Amazon may assign"
        ],
        tier2_regex: [
            /(may|shall)\s+not\s+assign/i,
            /assignment\s+is\s+void/i,
            /successors?\s+and\s+assigns?/i,
            /change\s+of\s+control/i,
            /assignment\s+of\s+this\s+Agreement/i,
            /may\s+freely\s+assign/i,
            /amazon\s+may\s+assign/i,
            /without\s+(the\s+)?(prior\s+)?(written\s+)?consent/i,
            /affiliate\s+assignment/i
        ],
        tier3_keywords: ["assign", "assignment", "successors", "assigns"],
        negative: [/counterparts/i, /entire\s+agreement/i, /confidential/i, /disclose/i, /non-disclosure/i],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    Publicity: {
        tier1_exact: [
            "press release",
            "public announcement",
            "Amazon's prior written approval",
            "publicity materials",
            "marketing materials"
        ],
        tier2_regex: [
            /press\s+release/i,
            /public\s+announcement/i,
            /amazon['']?s\s+prior\s+(written\s+)?approval/i,
            /publicity\s+materials?/i,
            /marketing\s+materials?/i,
            /promotional\s+purposes?/i,
            /use\s+of\s+name\s+and\s+likeness/i,
            /social\s+media/i,
            /amazon\s+trademark/i
        ],
        tier3_keywords: ["press release", "publicity", "marketing", "announcement"],
        negative: [/indemnify/i],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    ServicesScope: {
        tier1_exact: [
            "production services",
            "scope of services",
            "services to be provided",
            "deliverables",
            "production of the program",
            "production of the series"
        ],
        tier2_regex: [
            /prodco\s+(shall|will)\s+provide\s+(the\s+)?services?/i,
            /production\s+services?/i,
            /scope\s+of\s+(the\s+)?services?/i,
            /services?\s+to\s+be\s+(provided|rendered)/i,
            /deliverables?/i,
            /services?\s+as\s+set\s+forth\s+in\s+Exhibit/i,
            /production\s+of\s+the\s+(Series|Program|Film)/i,
            /set\s+forth\s+in\s+Exhibit\s+A/i,
            /pre-production/i,
            /post-production/i,
            /principal\s+photography/i
        ],
        tier3_keywords: ["services", "production", "deliverables", "scope"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    AmazonControl: {
        tier1_exact: [
            "sole and final control",
            "Amazon's sole discretion",
            "subject to Amazon's approval",
            "final cut",
            "creative control"
        ],
        tier2_regex: [
            /sole\s+and\s+final\s+control/i,
            /amazon['']?s\s+sole\s+discretion/i,
            /subject\s+to\s+amazon['']?s\s+approval/i,
            /final\s+cut/i,
            /creative\s+control/i,
            /amazon\s+shall\s+have\s+(the\s+)?(sole|final|exclusive)/i,
            /in\s+amazon['']?s\s+(sole\s+)?(and\s+absolute\s+)?discretion/i
        ],
        tier3_keywords: ["sole control", "final control", "Amazon's discretion"],
        negative: [/ProdCo\s+shall\s+have/i, /mutual\s+approval/i],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    SurvivalRemedies: {
        tier1_exact: [
            "shall survive",
            "survive termination",
            "survive expiration",
            "survival",
            "in perpetuity"
        ],
        tier2_regex: [
            /shall\s+survive/i,
            /survive\s+(termination|expiration)/i,
            /survival\s+(of\s+)?provisions?/i,
            /in\s+perpetuity/i,
            /continue\s+in\s+(full\s+)?force\s+and\s+effect/i,
            /provisions?\s+(shall\s+)?survive/i
        ],
        tier3_keywords: ["survive", "survival", "perpetuity"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.85,
        priority: 2
    },

    GeneralProvisions: {
        tier1_exact: [
            "entire agreement",
            "supersedes all prior",
            "severability",
            "executed in counterparts",
            "no waiver",
            "amendment",
            "modification"
        ],
        tier2_regex: [
            /entire\s+agreement/i,
            /supersedes?\s+(all\s+)?prior/i,
            /severability/i,
            /executed\s+in\s+counterparts?/i,
            /no\s+waiver/i,
            /waiver\s+(of\s+any\s+)?breach/i,
            /amendment\s+(or\s+modification\s+)?shall\s+be\s+in\s+writing/i,
            /headings?\s+(are\s+)?for\s+convenience/i,
            /binding\s+(upon|on)\s+(the\s+)?parties/i,
            /time\s+is\s+of\s+the\s+essence/i
        ],
        tier3_keywords: ["entire agreement", "severability", "counterparts", "waiver"],
        negative: [/indemnif/i, /represent/i, /warrant/i],
        min_matches: 2,
        base_confidence: 0.85,
        priority: 3
    },

    ThirdPartyCredits: {
        tier1_exact: [
            "third party credits",
            "contractually bind",
            "credit obligations",
            "screen credit",
            "main titles",
            "end credits"
        ],
        tier2_regex: [
            /third[- ]party\s+credits?/i,
            /contractually\s+bind/i,
            /credit\s+obligations?/i,
            /screen\s+credit/i,
            /main\s+titles?/i,
            /end\s+credits?/i,
            /credit\s+requirements?/i,
            /guild\s+requirements?/i
        ],
        tier3_keywords: ["credit", "credits", "screen credit", "titles"],
        negative: [/payment/i, /fee/i, /production\s+fee/i],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    },

    MoralRights: {
        tier1_exact: [
            "moral rights",
            "droit moral",
            "waives any and all moral rights",
            "right of integrity",
            "right of paternity"
        ],
        tier2_regex: [
            /moral\s+rights?/i,
            /droit\s+moral/i,
            /waive[sd]?\s+(any\s+and\s+all\s+)?moral\s+rights?/i,
            /non-?exercise\s+of\s+moral\s+rights?/i,
            /right\s+of\s+integrity/i,
            /right\s+of\s+paternity/i,
            /author['']?s\s+(moral\s+)?rights?/i
        ],
        tier3_keywords: ["moral rights", "droit moral", "integrity", "paternity"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1
    },

    AIPolicy: {
        tier1_exact: [
            "artificial intelligence",
            "AI tool",
            "machine learning",
            "generative AI",
            "NPI into AI"
        ],
        tier2_regex: [
            /artificial\s+intelligence/i,
            /\bAI\s+tool/i,
            /machine\s+learning/i,
            /generative\s+AI/i,
            /NPI\s+into\s+AI/i,
            /shall\s+not\s+(input|use|submit).*?AI/i,
            /AI\s+service/i,
            /AI\s+platform/i
        ],
        tier3_keywords: ["AI", "artificial intelligence", "machine learning"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.90,
        priority: 1
    },

    KeyPersons: {
        tier1_exact: [
            "key person",
            "key persons",
            "key talent",
            "attached talent",
            "essential element"
        ],
        tier2_regex: [
            /key\s+person/i,
            /key\s+persons?/i,
            /key\s+talent/i,
            /attached\s+talent/i,
            /essential\s+element/i,
            /continued\s+attachment/i,
            /becomes?\s+unavailable/i,
            /pay[- ]or[- ]play/i
        ],
        tier3_keywords: ["key person", "key talent", "attached", "unavailable"],
        negative: [],
        min_matches: 1,
        base_confidence: 0.88,
        priority: 2
    }
};

// ============================================================
// STAGE 3: MULTI-TIER MATCHING ENGINE
// ============================================================

function matchClause(text, originalText, direction) {
    const results = [];
    const lowerText = text.toLowerCase();

    for (const [family, config] of Object.entries(ENHANCED_PATTERNS)) {
        let score = 0;
        let matchCount = 0;
        let matchedPatterns = [];
        let tier1Matches = 0, tier2Matches = 0, tier3Matches = 0;

        if (config.requires_direction && config.requires_direction !== direction) {
            if (direction !== 'NONE' && direction !== 'MUTUAL') {
                continue;
            }
        }

        if (config.tier1_exact) {
            for (const phrase of config.tier1_exact) {
                if (lowerText.includes(phrase.toLowerCase())) {
                    tier1Matches++;
                    matchCount++;
                    matchedPatterns.push(`T1:${phrase}`);
                    score += 30;
                }
            }
        }

        if (config.tier2_regex) {
            for (const regex of config.tier2_regex) {
                if (regex.test(text)) {
                    tier2Matches++;
                    matchCount++;
                    matchedPatterns.push(`T2:${regex.source.substring(0, 30)}`);
                    score += 20;
                }
            }
        }

        if (config.tier3_keywords) {
            let keywordMatches = 0;
            for (const keyword of config.tier3_keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    keywordMatches++;
                }
            }
            if (keywordMatches >= 2) {
                tier3Matches = keywordMatches;
                score += keywordMatches * 5;
                matchedPatterns.push(`T3:${keywordMatches} keywords`);
            }
        }

        let hasNegative = false;
        if (config.negative && config.negative.length > 0) {
            for (const negPattern of config.negative) {
                if (negPattern.test(text)) {
                    hasNegative = true;
                    score -= 50;
                    break;
                }
            }
        }

        if (config.boost_if_all_caps && hasAllCaps) {
            score += 15;
        }

        if (config.requires_direction && config.requires_direction === direction) {
            score += 25;
        }

        const minMatches = config.min_matches || 1;
        if (matchCount >= minMatches && !hasNegative) {
            const maxPossibleScore =
                (config.tier1_exact?.length || 0) * 30 +
                (config.tier2_regex?.length || 0) * 20 +
                (config.tier3_keywords?.length || 0) * 5 +
                25;

            let confidence = Math.min(
                config.base_confidence + (score / maxPossibleScore) * 0.15,
                0.99
            );

            if (tier1Matches > 0 && tier2Matches > 0) confidence += 0.03;
            if (tier1Matches > 2) confidence += 0.02;

            results.push({
                family,
                matchCount,
                tier1Matches,
                tier2Matches,
                tier3Matches,
                matchedPatterns,
                score,
                confidence: Math.min(confidence, 0.99),
                priority: config.priority,
                direction_match: config.requires_direction === direction
            });
        }
    }

    return results;
}

// ============================================================
// STAGE 4: CONFLICT RESOLUTION
// ============================================================

function resolveConflicts(results, direction) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];

    results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.direction_match && !b.direction_match) return -1;
        if (!a.direction_match && b.direction_match) return 1;
        if (a.tier1Matches !== b.tier1Matches) return b.tier1Matches - a.tier1Matches;
        if (a.score !== b.score) return b.score - a.score;
        return b.confidence - a.confidence;
    });

    const top = results[0];
    const second = results[1];

    if ((top.family === 'IndemnityProdCo' && second?.family === 'IndemnityAmazon') ||
        (top.family === 'IndemnityAmazon' && second?.family === 'IndemnityProdCo')) {

        if (direction === 'PRODCO_OBLIGOR') {
            return results.find(r => r.family === 'IndemnityProdCo') || top;
        } else if (direction === 'AMAZON_OBLIGOR') {
            return results.find(r => r.family === 'IndemnityAmazon') || top;
        }
    }

    if ((top.family === 'PaymentCredits' && second?.family === 'TerminationConsequences') ||
        (top.family === 'TerminationConsequences' && second?.family === 'PaymentCredits')) {

        if (/upon\s+termination|kill\s+fee/i.test(clauseText)) {
            return results.find(r => r.family === 'TerminationConsequences') || top;
        }
    }

    return top;
}

// ============================================================
// EXECUTE ROUTER
// ============================================================

const matchResults = matchClause(normalizedText, originalText, obligationDirection);
const topMatch = resolveConflicts(matchResults, obligationDirection);

const detected_family = topMatch ? topMatch.family : 'OtherUnknown';
const confidence = topMatch ? topMatch.confidence : 0.0;
const needs_llm = !topMatch || topMatch.confidence < 0.65;

const multiFamilyHint = matchResults.length > 1 &&
    matchResults[1]?.confidence > 0.70 &&
    matchResults[1]?.family !== detected_family;

return [{
    json: {
        ...$json,
        detected_family,
        _routing_method: needs_llm ? 'PENDING_LLM' : 'KEYWORD_V5',
        _keyword_confidence: confidence,
        _obligation_direction: obligationDirection,
        _matches: matchResults.slice(0, 5),
        _multi_family_hint: multiFamilyHint,
        _suggested_split: multiFamilyHint ? [detected_family, matchResults[1]?.family] : null,
        needs_llm_fallback: needs_llm
    }
}];
