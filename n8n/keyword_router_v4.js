/**
 * ================================================================
 * KEYWORD ROUTER v4 - Amazon PSA Optimized
 * ================================================================
 * OPTIMIZED FOR: Amazon PSA/DSA contracts
 * 
 * CHANGES FROM v3:
 * - Added 100+ new specific triggers from real PSA contracts
 * - Reduced OtherUnknown from 55% to ~15% target
 * - Added priority scoring based on phrase specificity
 * - Added combined heading+text analysis
 *
 * Version: 4.0
 * Last Updated: 2026-01-31
 * ================================================================
 */

const KEYWORD_PATTERNS = {

    // ================================================================
    // CRITICAL PRIORITY - INDEMNITY
    // ================================================================

    IndemnityProdCo: {
        patterns: [
            // SPECIFIC PSA phrases (HIGH priority)
            /ProdCo\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+Amazon/i,
            /Amazon\s+Indemnitees/i,
            /ProdCo['']?s\s+indemnification/i,
            /from\s+and\s+against\s+any\s+(and\s+all\s+)?claims/i,
            /ProdCo\s+shall\s+defend/i,
            /indemnify.*arising\s+(out\s+of|from)/i,
            /hold\s+Amazon\s+harmless/i,
            /at\s+ProdCo['']?s\s+sole\s+cost/i,
            /ProdCo['']?s\s+negligence/i,
            /breach\s+by\s+ProdCo/i,
            /ProdCo['']?s\s+breach\s+of/i,

            // CPC Australia equivalents
            /Company\s+(shall|will|agrees?\s+to)\s+indemnify\s+(the\s+)?Client/i,
            /Company\s+shall\s+indemnify\s+the\s+Client/i,
            /Company\s+Indemnity/i,
            /Production\s+Company.*indemnify.*Client/i,

            // Generic fallback (lower weight)
            /Producer\s+(shall|will)\s+indemnify/i,
            /Contractor\s+(shall|will)\s+indemnify/i,
            /Vendor\s+(shall|will)\s+indemnify/i
        ],
        negative: [
            /Amazon\s+(shall|will)\s+indemnify/i,
            /Client\s+(shall|will)\s+indemnify/i,
            /mutual\s+indemnification/i
        ],
        heading_boost: [
            /INDEMNIFICATION/i,
            /INDEMNITY/i,
            /PRODCO\s+INDEMNITY/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Producer indemnifies Amazon - Core protection"
    },

    IndemnityAmazon: {
        patterns: [
            // SPECIFIC PSA phrases
            /Amazon\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Amazon\s+agrees?\s+to\s+indemnify/i,
            /indemnify\s+ProdCo/i,
            /ProdCo\s+Indemnitees/i,
            /Amazon['']?s\s+indemnification/i,
            /Amazon\s+shall\s+defend/i,
            /hold\s+ProdCo\s+harmless/i,
            /Amazon['']?s\s+negligence/i,
            /breach\s+by\s+Amazon/i,

            // CPC equivalents
            /Client\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Client\s+Indemnity/i,
            /indemnify\s+(the\s+)?Company/i
        ],
        negative: [
            /ProdCo\s+(shall|will)\s+indemnify/i,
            /Company\s+(shall|will)\s+indemnify\s+(the\s+)?Client/i
        ],
        heading_boost: [
            /AMAZON\s+INDEMNITY/i,
            /CLIENT\s+INDEMNITY/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Amazon indemnifies Producer - Review scope limits"
    },

    IndemnityProcedures: {
        patterns: [
            /assume\s+the\s+defense/i,
            /defense\s+and\s+settlement/i,
            /promptly\s+notify/i,
            /counsel\s+reasonably\s+acceptable/i,
            /indemnifying\s+party\s+shall\s+have/i,
            /settlement.*indemnified\s+party/i,
            /control\s+of\s+the\s+defense/i,
            /costs\s+of\s+defense/i,
            /cooperate\s+in\s+the\s+defense/i,
            /right\s+to\s+participate/i,
            /prior\s+written\s+consent.*settle/i,
            /promptly\s+notify.*in\s+writing/i
        ],
        heading_boost: [
            /INDEMNIFICATION\s+PROCEDURES/i,
            /DEFENSE\s+PROCEDURES/i
        ],
        min_matches: 2,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Indemnification procedures"
    },

    // ================================================================
    // CRITICAL PRIORITY - IP/RIGHTS
    // ================================================================

    RightsGrant: {
        patterns: [
            // SPECIFIC PSA phrases (CRITICAL)
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
            /for\s+all\s+purposes/i,
            /without\s+limitation/i,
            /in\s+any\s+(and\s+all\s+)?media/i,
            /now\s+known\s+or\s+hereafter\s+devised/i,
            /all\s+copyrights/i,
            /underlying\s+(rights|materials)/i,
            /chain\s+of\s+title/i,
            /grant[s]?\s+to\s+Amazon/i,
            /exclusively\s+to\s+Amazon/i,

            // CPC Australia
            /assign\s+to\s+(the\s+)?Client\s+all\s+of\s+its\s+copyright/i,
            /Company\s+shall\s+assign\s+to\s+(the\s+)?Client/i,
            /copyright\s+assignment/i,
            /ownership.*shall\s+vest\s+in\s+(the\s+)?Client/i
        ],
        negative: [
            /\breversion\b/i,
            /\brevert\b/i,
            /\bturnaround\b/i,
            /Company\s+retains\s+all/i,
            /ProdCo\s+retains/i,
            /reserved\s+to\s+ProdCo/i
        ],
        heading_boost: [
            /RIGHTS\s*(?:GRANT)?/i,
            /OWNERSHIP/i,
            /COPYRIGHT/i,
            /INTELLECTUAL\s+PROPERTY/i,
            /GRANT\s+OF\s+RIGHTS/i,
            /IP\s+OWNERSHIP/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Rights transfer to Amazon - Core requirement"
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
            /\bwaives?\s+(any\s+)?reversion\b/i,
            /shall\s+revert\s+to\s+(ProdCo|Company|Producer)/i,
            /right\s+of\s+first\s+negotiation/i,
            /first\s+refusal/i,
            /repurchase\s+option/i
        ],
        heading_boost: [
            /REVERSION/i,
            /TURNAROUND/i,
            /RIGHTS\s+REVERSION/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Rights reversion - Risk to perpetual ownership"
    },

    // ================================================================
    // CRITICAL PRIORITY - LIABILITY
    // ================================================================

    LiabilityLimitation: {
        patterns: [
            // SPECIFIC legal phrases (ALL CAPS common)
            /IN\s+NO\s+EVENT\s+SHALL/i,
            /CONSEQUENTIAL\s+DAMAGES/i,
            /INDIRECT\s+DAMAGES/i,
            /INCIDENTAL\s+DAMAGES/i,
            /PUNITIVE\s+DAMAGES/i,
            /SPECIAL\s+DAMAGES/i,
            /EXEMPLARY\s+DAMAGES/i,
            /TOTAL\s+AGGREGATE\s+LIABILITY/i,
            /SHALL\s+NOT\s+EXCEED/i,
            /LIMITATION\s+OF\s+LIABILITY/i,
            /MAXIMUM\s+LIABILITY/i,
            /LOSS\s+OF\s+(BUSINESS\s+)?PROFITS/i,
            /LOST\s+PROFITS/i,
            /LOST\s+BUSINESS/i,
            /LOST\s+REVENUE/i,
            /UNDER\s+NO\s+CIRCUMSTANCES/i,

            // Specific cap references
            /liability\s+shall\s+be\s+limited\s+to/i,
            /limited\s+to\s+the\s+(total\s+)?Fee/i,
            /limited\s+to.*amounts\s+paid/i,
            /cap(ped)?\s+at/i,
            /aggregate\s+liability/i,
            /liability\s+cap/i,
            /no\s+liability\s+for\s+consequential/i,
            /exclude[sd]?\s+liability/i,
            /waive[sd]?\s+liability/i
        ],
        negative: [
            /gross\s+negligence/i,
            /willful\s+misconduct/i,
            /unlimited\s+liability/i
        ],
        heading_boost: [
            /LIMITATION\s+OF\s+LIABILITY/i,
            /LIABILITY\s+CAP/i,
            /DAMAGES/i,
            /EXCLUSION/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Liability caps - Verify asymmetric protection"
    },

    // ================================================================
    // HIGH PRIORITY - REPRESENTATIONS & WARRANTIES
    // ================================================================

    RepsProdCo: {
        patterns: [
            // SPECIFIC PSA phrases
            /ProdCo\s+represents?\s*(,?\s*warrants?)?(\s+and\s+agrees)?/i,
            /REPRESENTATIONS?\/?WARRANTIES?/i,
            /will\s+not\s+infringe/i,
            /does\s+not\s+violate/i,
            /free\s+and\s+clear/i,
            /full\s+right,?\s+power,?\s+(and|&)\s+authority/i,
            /no\s+claim,?\s+litigation/i,
            /wholly\s+original/i,
            /chain\s+of\s+title/i,
            /has\s+the\s+right\s+to\s+enter/i,
            /duly\s+organized/i,
            /validly\s+existing/i,
            /good\s+standing/i,
            /not\s+infringe\s+any\s+copyright/i,
            /not\s+defame/i,
            /not\s+violate\s+any\s+right\s+of\s+privacy/i,
            /ProdCo\s+has\s+obtained/i,
            /ProdCo\s+has\s+secured/i,
            /ProdCo\s+will\s+obtain/i,

            // CPC equivalents
            /Company\s+(represents?|warrants?|agrees)/i,
            /Company\s+undertakes\s+to/i,
            /Company\s+shall\s+(ensure|procure)/i
        ],
        negative: [
            /Amazon\s+represents/i,
            /Client\s+(represents?|warrants?)/i,
            /mutual\s+representations/i
        ],
        heading_boost: [
            /REPRESENTATIONS/i,
            /WARRANTIES/i,
            /REPS\s*(AND|&)\s*WARRANTIES/i,
            /PRODCO\s+REPRESENTATIONS/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Producer representations - Comprehensive coverage"
    },

    // ================================================================
    // HIGH PRIORITY - TERMINATION
    // ================================================================

    TerminationRights: {
        patterns: [
            // SPECIFIC PSA phrases
            /Amazon\s+may\s+terminate/i,
            /may\s+terminate\s+this\s+Agreement/i,
            /termination\s+for\s+(cause|convenience)/i,
            /right\s+to\s+terminate/i,
            /entitled\s+to\s+terminate/i,
            /cure\s+period/i,
            /upon\s+written\s+notice/i,
            /material\s+breach/i,
            /in\s+its\s+sole\s+discretion.*terminate/i,
            /shall\s+have\s+the\s+right\s+to\s+terminate/i,
            /terminate\s+immediately/i,
            /terminate\s+without\s+cause/i,
            /terminate\s+at\s+any\s+time/i,
            /days['']?\s+prior\s+written\s+notice/i,
            /without\s+penalty/i,
            /ProdCo\s+fails\s+to\s+cure/i,
            /fails\s+to\s+remedy/i,

            // CPC equivalents
            /Client\s+shall\s+be\s+entitled\s+to.*cancel/i,
            /Client\s+may\s+terminate/i
        ],
        negative: [],
        heading_boost: [
            /TERMINATION/i,
            /TERM\s+AND\s+TERMINATION/i,
            /CANCELLATION/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Termination rights - Amazon convenience preferred"
    },

    TerminationConsequences: {
        patterns: [
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i,
            /termination\s+payment/i,
            /upon\s+such\s+termination/i,
            /shall\s+remain\s+vested/i,
            /rights\s+shall\s+survive/i,
            /kill\s+fee/i,
            /Cancellation\s+Fee/i,
            /termination\s+fee/i,
            /pay\s+ProdCo.*termination/i,
            /costs\s+incurred\s+prior\s+to\s+termination/i,
            /return\s+all\s+materials/i,
            /deliver\s+all\s+work\s+product/i
        ],
        heading_boost: [
            /EFFECT\s+OF\s+TERMINATION/i,
            /CONSEQUENCES/i,
            /UPON\s+TERMINATION/i
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
            /survive\s+in\s+perpetuity/i,
            /following\s+sections?\s+shall\s+survive/i,
            /obligations\s+shall\s+survive/i
        ],
        heading_boost: [
            /SURVIVAL/i,
            /SURVIVING\s+PROVISIONS/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Survival provisions"
    },

    // ================================================================
    // HIGH PRIORITY - PAYMENT
    // ================================================================

    PaymentCredits: {
        patterns: [
            // SPECIFIC PSA phrases
            /production\s+fee/i,
            /Amazon\s+(shall|will)\s+pay/i,
            /in\s+full\s+consideration/i,
            /milestone\s+payment/i,
            /net\s+receipts/i,
            /contingent\s+compensation/i,
            /backend\s+participation/i,
            /payment\s+schedule/i,
            /\bFEES:\s/i,
            /FEES\s+AND\s+PAYMENT/i,
            /within\s+\d+\s+days/i,
            /upon\s+delivery/i,
            /upon\s+completion/i,
            /advance\s+payment/i,
            /final\s+payment/i,
            /shall\s+be\s+payable/i,
            /gross\s+receipts/i,
            /net\s+profits/i,
            /residuals/i,
            /royalties/i,
            /bonus\s+payment/i,
            /withholding/i,
            /tax\s+deduction/i,

            // CPC equivalents
            /Payment\s+of\s+the\s+Agreed\s+Fee/i,
            /Client\s+agrees\s+to\s+pay/i,
            /Fifty\s+Percent.*due\s+on\s+receipt/i
        ],
        heading_boost: [
            /PAYMENT/i,
            /COMPENSATION/i,
            /FEES/i,
            /BUDGET/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Payment terms - Milestone-based, offset rights"
    },

    // ================================================================
    // MEDIUM PRIORITY - SERVICES & SCOPE
    // ================================================================

    ServicesScope: {
        patterns: [
            // SPECIFIC PSA phrases
            /ProdCo\s+will\s+render\s+services/i,
            /render\s+all\s+production\s+services/i,
            /pre-production,?\s+principal\s+photography,?\s+post-production/i,
            /complete\s+the\s+Program/i,
            /deliver\s+the\s+Program/i,
            /produce\s+the\s+Program/i,
            /\bSERVICES:\s/i,
            /production\s+services/i,
            /development\s+services/i,
            /creative\s+services/i,
            /ProdCo\s+shall\s+provide/i,
            /ProdCo\s+agrees\s+to\s+provide/i,
            /scope\s+of\s+services/i,
            /services\s+to\s+be\s+provided/i,
            /deliverables/i,
            /shooting\s+schedule/i,
            /production\s+schedule/i,
            /approved\s+budget/i,
            /final\s+delivery/i,

            // CPC equivalents
            /Company.*providing.*Production\s+Services/i,
            /Company\s+will\s+produce\s+the\s+Deliverables/i
        ],
        heading_boost: [
            /SERVICES/i,
            /SCOPE/i,
            /SCOPE\s+OF\s+(WORK|SERVICES)/i,
            /DELIVERABLES/i,
            /PRODUCTION\s+SERVICES/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Scope definition - Verify completeness"
    },

    // ================================================================
    // MEDIUM PRIORITY - CONFIDENTIALITY
    // ================================================================

    Confidentiality: {
        patterns: [
            // SPECIFIC PSA phrases
            /maintain\s+in\s+strict\s+confidence/i,
            /confidential\s+information/i,
            /non-public\s+information/i,
            /\bNPI\b/,
            /shall\s+not\s+disclose/i,
            /keep\s+confidential/i,
            /proprietary\s+information/i,
            /trade\s+secrets/i,
            /confidentiality\s+obligations/i,
            /non-disclosure/i,
            /without\s+prior\s+written\s+consent/i,
            /authorized\s+disclosure/i,

            // Data Protection
            /\bDATA\s+PROTECTION\b/i,
            /personal\s+data/i,
            /\bGDPR\b/i,
            /data\s+protection\s+laws/i,
            /\bCCPA\b/i,
            /data\s+controller/i,
            /data\s+processor/i,
            /privacy\s+policy/i,
            /processing.*personal/i
        ],
        heading_boost: [
            /CONFIDENTIALITY/i,
            /CONFIDENTIAL\s+INFORMATION/i,
            /NON-DISCLOSURE/i,
            /DATA\s+PROTECTION/i,
            /PRIVACY/i,
            /NPI/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Confidentiality obligations - NPI protection"
    },

    // ================================================================
    // MEDIUM PRIORITY - INSURANCE
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
            /professional\s+(indemnity\s+)?insurance/i,
            /insurance\s+polic(y|ies)/i,
            /coverage\s+of\s+at\s+least/i,
            /minimum\s+coverage/i,
            /add\s+Amazon\s+as\s+an\s+additional\s+insured/i,
            /prior\s+to\s+commencement/i,

            // CPC equivalents
            /Public\s+Liability\s+Insurance/i,
            /Key\s+Person\s+Insurance/i,
            /Cast.*Insurance/i
        ],
        heading_boost: [
            /INSURANCE/i,
            /INSURANCE\s+REQUIREMENTS/i,
            /COVERAGE/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Insurance requirements - E&O coverage"
    },

    // ================================================================
    // MEDIUM PRIORITY - DISPUTE RESOLUTION
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
            /Los\s+Angeles\s+County/i,
            /New\s+York/i,
            /submit\s+to.*jurisdiction/i,
            /mediation/i,
            /arbitrator/i,
            /dispute\s+resolution/i,
            /forum\s+selection/i
        ],
        heading_boost: [
            /GOVERNING\s+LAW/i,
            /JURISDICTION/i,
            /DISPUTE\s+RESOLUTION/i,
            /ARBITRATION/i
        ],
        min_matches: 2,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Dispute resolution - Amazon-favorable venue"
    },

    // ================================================================
    // LOW PRIORITY - BOILERPLATE
    // ================================================================

    ForceMajeure: {
        patterns: [
            /force\s+majeure/i,
            /Event\s+of\s+Force\s+Majeure/i,
            /beyond\s+reasonable\s+control/i,
            /acts?\s+of\s+God/i,
            /natural\s+disaster/i,
            /pandemic/i,
            /government.*lockdown/i,
            /neither\s+party.{0,20}liable/i,
            /unforeseeable\s+circumstances/i,
            /hurricane|earthquake|flood/i,
            /war|terrorism/i,
            /strike|labor\s+dispute/i
        ],
        heading_boost: [
            /FORCE\s+MAJEURE/i,
            /EXCUSABLE\s+DELAY/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 3,
        amazon_note: "Force majeure - Review termination rights"
    },

    Assignment: {
        patterns: [
            /may\s+not\s+assign/i,
            /shall\s+not\s+assign/i,
            /may\s+freely\s+assign/i,
            /without\s+prior\s+written\s+consent/i,
            /change\s+of\s+control/i,
            /assignment\s+of\s+this\s+Agreement/i,
            /assign\s+its\s+rights/i,
            /delegate\s+its\s+obligations/i,
            /binding\s+upon.*successors/i
        ],
        heading_boost: [
            /ASSIGNMENT/i,
            /ASSIGNABILITY/i
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
            /if\s+not\s+in\s+material\s+breach/i,
            /credit\s+obligations/i,
            /on-screen\s+credit/i,
            /credit\s+size/i,
            /credit\s+position/i
        ],
        heading_boost: [
            /CREDIT/i,
            /CREDITS/i,
            /ENTITLEMENTS/i,
            /BILLING/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Credits and entitlements"
    },

    AmazonControl: {
        patterns: [
            /sole\s+and\s+final\s+control/i,
            /Amazon['']?s\s+sole\s+discretion/i,
            /subject\s+to\s+Amazon['']?s\s+approval/i,
            /Amazon\s+shall\s+have\s+the\s+right\s+to/i,
            /final\s+cut/i,
            /creative\s+control/i,
            /approval\s+rights/i,
            /Amazon['']?s\s+prior\s+written\s+approval/i,
            /casting\s+approval/i,
            /script\s+approval/i,
            /budget\s+approval/i,
            /Amazon\s+may\s+require/i
        ],
        heading_boost: [
            /CONTROLS?/i,
            /APPROVAL/i,
            /CREATIVE\s+CONTROL/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Amazon control provisions"
    },

    AuditRights: {
        patterns: [
            /audit\s+rights/i,
            /right\s+to\s+audit/i,
            /inspect.*books\s+and\s+records/i,
            /access\s+to\s+records/i,
            /accountant.*designated/i,
            /examine.*accounting\s+records/i,
            /audit.*at\s+its\s+expense/i,
            /retain\s+records\s+for/i
        ],
        heading_boost: [
            /AUDIT/i,
            /AUDIT\s+RIGHTS/i,
            /BOOKS\s+AND\s+RECORDS/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Audit rights"
    },

    GeneralProvisions: {
        patterns: [
            /\bMISCELLANEOUS\b/i,
            /\bGENERAL\s+PROVISIONS?\b/i,
            /\bENTIRE\s+AGREEMENT\b/i,
            /\bseverability\b/i,
            /\bcounterparts?\b/i,
            /\bno\s+waiver\b/i,
            /\bheadings.*convenience/i,
            /\bnotices\s+shall\s+be/i,
            /\bamendments?\s+must\s+be\s+in\s+writing/i
        ],
        heading_boost: [
            /MISCELLANEOUS/i,
            /GENERAL\s+PROVISIONS/i,
            /BOILERPLATE/i
        ],
        min_matches: 2,
        confidence: 0.75,
        priority: 4,
        amazon_note: "General boilerplate - Low risk"
    },

    Parties: {
        patterns: [
            /\bPARTIES:\s/i,
            /Amazon\s+Content\s+Services\s+LLC/i,
            /entered\s+into\s+as\s+of/i,
            /by\s+and\s+between/i,
            /\bEFFECTIVE\s+DATE:\s/i,
            /hereinafter\s+referred\s+to\s+as/i,
            /party\s+of\s+the\s+first\s+part/i
        ],
        heading_boost: [
            /PARTIES/i,
            /RECITALS/i,
            /PREAMBLE/i
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
            /for\s+purposes\s+of\s+this\s+Agreement/i,
            /\"[A-Z][a-z]+\"\s+means/i,
            /the\s+following\s+terms\s+shall\s+have/i
        ],
        heading_boost: [
            /DEFINITIONS/i,
            /DEFINED\s+TERMS/i
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
        { pattern: /Buyer/i, label: "Buyer" }
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
    }

    return {
        amazon_equivalent: clientType,
        producer_equivalent: producerType,
        contract_style: contractStyle,
        mapping_note: contractStyle !== "AMAZON_PSA"
            ? `Mapped: ${clientType} → Amazon, ${producerType} → ProdCo`
            : null
    };
}

// ================================================================
// MAIN ROUTING FUNCTION (v4 Enhanced)
// ================================================================

function keywordRoute(clauseText, clauseHeading = "") {
    if (!clauseText || typeof clauseText !== 'string') {
        return { routed: false, method: "ERROR", error: "Invalid clause text" };
    }

    const combinedText = `${clauseHeading} ${clauseText}`;
    const results = [];

    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        // Skip if negative patterns match
        if (config.negative && config.negative.length > 0) {
            const hasNegative = config.negative.some(p => p.test(combinedText));
            if (hasNegative) continue;
        }

        // Count positive pattern matches
        const matchedPatterns = config.patterns.filter(p => p.test(combinedText));
        let matchCount = matchedPatterns.length;

        // BOOST: Check heading patterns for additional confidence
        let headingBoost = 0;
        if (config.heading_boost && clauseHeading) {
            const headingMatches = config.heading_boost.filter(p => p.test(clauseHeading));
            if (headingMatches.length > 0) {
                headingBoost = 0.10; // +10% confidence for heading match
                matchCount += 1; // Count as additional match
            }
        }

        if (matchCount >= config.min_matches) {
            const matchRatio = matchCount / config.patterns.length;
            let adjustedConfidence = config.confidence * (0.7 + 0.3 * matchRatio);
            adjustedConfidence = Math.min(0.98, adjustedConfidence + headingBoost);

            results.push({
                family: family,
                confidence: Math.round(adjustedConfidence * 100) / 100,
                matched_patterns: matchCount,
                total_patterns: config.patterns.length,
                priority: config.priority,
                amazon_note: config.amazon_note,
                heading_matched: headingBoost > 0,
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
            heading_matched: results[0].heading_matched,
            method: "KEYWORD",
            multi_family: results.length > 1,
            alternatives: results.slice(1, 3).map(a => ({
                family: a.family,
                confidence: a.confidence
            })),
            party_context: partyContext,
            needs_llm: false
        };
    }

    return {
        routed: false,
        family: "OtherUnknown",
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
        heading_matched: routingResult.heading_matched,
        party_context: routingResult.party_context,
        needs_llm_fallback: routingResult.needs_llm,
        multi_family_detected: routingResult.multi_family,
        alternative_families: routingResult.alternatives
    }
};
