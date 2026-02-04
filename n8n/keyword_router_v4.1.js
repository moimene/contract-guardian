/**
 * ================================================================
 * KEYWORD ROUTER v4.2 - Amazon PSA Optimized (Taxonomy Consolidation)
 * ================================================================
 * OPTIMIZED FOR: Amazon PSA/DSA contracts
 * 
 * CHANGES FROM v4.1:
 * - CG-001: Added CANONICAL_FAMILIES as single source of truth
 * - Aligned all 23 families with blueprint specification
 * - Added missing families: DataPrivacy, Publicity, Notices, etc.
 *
 * Version: 4.2
 * Last Updated: 2026-02-01
 * ================================================================
 */

// ================================================================
// CG-001: CANONICAL FAMILIES (Single Source of Truth)
// ================================================================
// ANY system (Router Agent, Parse Router, Decision Engine) MUST
// validate against this exact list. Do NOT create parallel lists.

const CANONICAL_FAMILIES = [
    // CRITICAL PRIORITY
    "PaymentCredits",       // Facturación, pagos, créditos
    "ThirdPartyCredits",    // Créditos en pantalla
    "RepsProdCo",           // Garantías de la Productora
    "RepsAmazon",           // Garantías del Cliente (Amazon)
    "IndemnityProdCo",      // Indemnidad ProdCo → Amazon
    "IndemnityAmazon",      // Indemnidad Amazon → ProdCo
    "IndemnityProcedures",  // Procedimientos de indemnidad
    "LiabilityLimitation",  // Limitación de responsabilidad
    "InjunctiveReliefWaiver", // Renuncia a medidas cautelares (CG-006.1)
    "TerminationRights",    // Derechos de terminación
    "TerminationConsequences", // Consecuencias de terminación
    "MoralRights",          // Derechos morales / Droit moral (NEW)
    "AIPolicy",             // Política AI/ML (NEW)

    // HIGH PRIORITY
    "Confidentiality",      // NDA / Confidencialidad
    "DataProtection",       // GDPR / Datos personales
    "GoverningLaw",         // Ley aplicable
    "DisputeResolution",    // Jurisdicción / Arbitraje
    "ForceMajeure",         // Fuerza Mayor
    "Insurance",            // Seguros
    "RightsGrant",          // IP / Cesión de derechos
    "RightsReversion",      // Reversión de derechos
    "CreativeControl",      // Control creativo (NEW)
    "KeyPersons",           // Personas clave (NEW)
    "DeliveryAcceptance",   // Entrega y aceptación (NEW)
    "BudgetOverages",       // Sobrecostes (NEW)

    // MEDIUM PRIORITY
    "AuditRights",          // Auditoría
    "Publicity",            // Publicidad / Press Release  
    "Assignment",           // Cesión del contrato
    "ServicesScope",        // Alcance de servicios
    "SurvivalRemedies",     // Supervivencia
    "AmazonControl",        // Control creativo Amazon
    "TaxProvisions",        // Provisiones fiscales (NEW)

    // LOW PRIORITY
    "GeneralProvisions",    // Boilerplate
    "ConditionsPrecedent",  // Condiciones suspensivas
    "Definitions",          // Definiciones
    "Parties",              // Identificación de partes
    "OtherUnknown"          // FALLBACK DEFAULT - Escalation trigger
];

// Helper for validation
const isValidFamily = (family) => CANONICAL_FAMILIES.includes(family);


// ================================================================
// KEYWORD PATTERNS
// ================================================================

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
            // Core Amazon indemnifying ProdCo (CG-006.1.2)
            /Amazon\s+shall\s+indemnify,?\s+defend\s+and\s+hold\s+harmless/i,
            /Amazon\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Amazon\s+agrees?\s+to\s+indemnify/i,
            /Client\s+shall\s+indemnify\s+ProdCo/i,

            // Claims arising from Amazon actions
            /indemnify.*from\s+and\s+against.*claims\s+arising\s+from.*Amazon/i,
            /claims\s+arising\s+(out\s+of|from)\\s+Amazon['']?s\\s+(distribution|exploitation|use)/i,
            /Amazon['']?s\\s+(breach|negligence|willful\\s+misconduct)/i,
            /arising\s+from\s+Amazon['']?s\s+(distribution|exploitation)/i,

            // Defense obligations
            /Amazon\s+shall\s+defend.*at\s+its\s+own\s+expense/i,
            /Amazon\s+shall\s+defend/i,

            // PSA specific markers
            /indemnify\s+ProdCo/i,
            /ProdCo\s+Indemnitees/i,
            /Amazon['']?s\s+indemnification/i,
            /hold\s+ProdCo\s+harmless/i,
            /hold\s+harmless\s+ProdCo/i,

            // CPC equivalents
            /Client\s+(shall|will|agrees?\s+to)\s+indemnify/i,
            /Client\s+Indemnity/i,
            /indemnify\s+(the\s+)?Company/i
        ],
        negative: [
            // Exclude when ProdCo/Producer is the indemnifying party
            /ProdCo\s+(shall|will)\s+indemnify/i,
            /Producer\s+(shall|will)\s+indemnify/i,
            /Company\s+(shall|will)\s+indemnify\s+(the\s+)?Client/i,
            // Amazon as beneficiary (NOT IndemnityAmazon)
            /Amazon\s+Indemnitees/i
        ],
        heading_boost: [
            /AMAZON\s+INDEMNITY/i,
            /CLIENT\s+INDEMNITY/i,
            /AMAZON['']?S\s+INDEMNIFICATION/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Amazon indemnifies Producer - Review scope limits"
    },

    IndemnityProcedures: {
        patterns: [
            // Notice requirements (CG-006.1.2)
            /prompt\s+written\s+notice\s+of\s+any\s+claim/i,
            /promptly\s+notify/i,
            /promptly\s+notify.*in\s+writing/i,
            /notice\s+of\s+a\s+claim/i,

            // Defense control
            /assume\s+the\s+defense/i,
            /control\s+of\s+the\s+defense\s+and\s+settlement/i,
            /control\s+of\s+the\s+defense/i,
            /indemnifying\s+party\s+shall\s+have\s+the\s+right\s+to\s+assume\s+the\s+defense/i,
            /the\s+indemnifying\s+party\s+shall\s+have/i,
            /defense\s+and\s+settlement/i,

            // Participation rights
            /right\s+to\s+participate\s+in\s+the\s+defense/i,
            /right\s+to\s+participate/i,
            /cooperate\s+in\s+the\s+defense/i,
            /costs\s+of\s+defense/i,

            // Settlement consent
            /consent\s+to\s+settlement\s+shall\s+not\s+be\s+unreasonably\s+withheld/i,
            /shall\s+not\s+settle\s+any\s+claim\s+without\s+prior\s+written\s+consent/i,
            /prior\s+written\s+consent.*settle/i,
            /settlement.*indemnified\s+party/i,
            /prior\s+written\s+consent\s+of\s+the\s+indemnified\s+party/i,

            // Counsel selection
            /select\s+counsel\s+reasonably\s+acceptable/i,
            /counsel\s+reasonably\s+acceptable/i,
            /mutually\s+acceptable\s+counsel/i
        ],
        negative: [
            // Exclude substantive indemnity (who indemnifies whom)
            /shall\s+indemnify/i,
            /limitation\s+of\s+liability/i,
            /insurance/i
        ],
        heading_boost: [
            /INDEMNIFICATION\s+PROCEDURES/i,
            /DEFENSE\s+PROCEDURES/i,
            /INDEMNITY\s+PROCEDURES/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Indemnification procedures - defense/settlement process"
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
        negative: [
            // CG-008.P: Termination context → TerminationConsequences wins
            /upon\s+termination/i,
            /effect\s+of\s+termination/i,
            /following\s+termination/i,
            /termination\s+fee/i,
            /kill\s+fee/i,
            /return\s+(all\s+)?materials/i,
            /deliver\s+(all\s+)?work\s+product/i
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
            /IN\s+NO\s+EVENT\s+SHALL.*BE\s+LIABLE\s+FOR/i,
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

            // Strong indicators (CG-006.1.2)
            /EXCEPT\s+FOR.*INDEMNIFICATION/i,
            /REGARDLESS\s+OF\s+THE\s+FORM\s+OF\s+ACTION/i,
            /aggregate\s+liability\s+shall\s+not\s+exceed/i,
            /total\s+liability\s+shall\s+be\s+limited\s+to/i,
            /consequential.*indirect.*incidental.*punitive\s+damages/i,
            /liability\s+cap/i,
            /liability\s+ceiling/i,

            // Specific cap references
            /liability\s+shall\s+be\s+limited\s+to/i,
            /limited\s+to\s+the\s+(total\s+)?Fee/i,
            /limited\s+to.*amounts\s+paid/i,
            /cap(ped)?\s+at/i,
            /aggregate\s+liability/i,
            /no\s+liability\s+for\s+consequential/i,
            /exclude[sd]?\s+liability/i,
            /waive[sd]?\s+liability/i
        ],
        negative: [
            // Exclude indemnity clauses
            /shall\s+indemnify/i,
            // Exclude carve-outs
            /gross\s+negligence/i,
            /willful\s+misconduct/i,
            /unlimited\s+liability/i,
            // Exclude equitable remedies
            /injunctive.*relief/i,
            /equitable\s+relief/i,
            /insurance/i
        ],
        heading_boost: [
            /LIMITATION\s+OF\s+LIABILITY/i,
            /LIABILITY\s+CAP/i,
            /DAMAGES/i,
            /EXCLUSION\s+OF\s+DAMAGES/i
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
        negative: [
            // CG-008: Prevent RightsReversion collision
            /revert\s+to\s+ProdCo/i,
            /rights\s+shall\s+revert/i,
            /reversionary\s+interest/i,
            /all\s+rights.*revert/i
        ],
        heading_boost: [
            /EFFECT\s+OF\s+TERMINATION/i,
            /CONSEQUENCES/i,
            /UPON\s+TERMINATION/i
        ],
        min_matches: 1,
        confidence: 0.88,  // CG-008: Boosted
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
            // Payment timing (CG-006.1.2)
            /upon\s+delivery/i,
            /upon\s+completion/i,
            /upon\s+acceptance/i,
            /invoice\s+shall\s+be\s+payable\s+within/i,
            /payable\s+within\s+\d+\s+days/i,
            /within\s+\d+\s+days/i,
            /net\s+30/i,
            /net\s+45/i,
            /net\s+60/i,

            // Credits and offsets
            /credit\s+against\s+fees/i,
            /offset\s+against/i,

            // Fee structures
            /production\s+fee/i,
            /Amazon\s+(shall|will)\s+pay/i,
            /in\s+full\s+consideration/i,
            /milestone\s+payment/i,
            /advance\s+payment/i,
            /final\s+payment/i,
            /shall\s+be\s+payable/i,
            /payment\s+schedule/i,
            /\bFEES:\s/i,
            /FEES\s+AND\s+PAYMENT/i,

            // Revenue sharing
            /net\s+receipts/i,
            /contingent\s+compensation/i,
            /backend\s+participation/i,
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
        negative: [
            // Exclude conditions precedent (different family)
            /condition\s+precedent/i,
            /no\s+obligation\s+shall\s+arise\s+unless/i,
            /subject\s+to\s+the\s+satisfaction/i
        ],
        heading_boost: [
            /PAYMENT/i,
            /COMPENSATION/i,
            /FEES/i,
            /BUDGET/i,
            /PAYMENT\s+TERMS/i
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
            /Company\s+will\s+produce\s+the\s+Deliverables/i,

            // CG-008: Expanded patterns
            /services\s+as\s+set\s+forth\s+in\s+Exhibit/i,
            /production\s+of\s+the\s+(Series|Program|Film)/i,
            /render.*production/i,
            /provide\s+all\s+services\s+necessary/i,
            /ProdCo\s+(shall|will)\s+provide\s+(the\s+)?services/i,
            /set\s+forth\s+in\s+Exhibit\s+A/i,
            /pursuant\s+to\s+the\s+production\s+schedule/i
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
            // SPECIFIC PSA phrases (CG-008: removed DataProtection patterns)
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
            /authorized\s+disclosure/i
        ],
        negative: [
            // CG-008: Prevent DataProtection collision
            /\bGDPR\b/i,
            /data\s+protection/i,
            /data\s+controller/i,
            /data\s+processor/i,
            /personal\s+data/i,
            /\bCCPA\b/i,
            // CG-008: Prevent Assignment collision
            /assign/i
        ],
        heading_boost: [
            /CONFIDENTIALITY/i,
            /CONFIDENTIAL\s+INFORMATION/i,
            /NON-DISCLOSURE/i,
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
            // Core obligation (CG-006.1.2)
            /shall\s+obtain\s+and\s+maintain.*insurance/i,
            /obtain\s+and\s+maintain\s+insurance/i,

            // Policy types
            /errors\s+and\s+omissions/i,
            /\bE\s*&\s*O\b/i,
            /\bE&O\b/i,
            /commercial\s+general\s+liability/i,
            /\bCGL\b/i,
            /workers['']?\s*compensation/i,
            /professional\s+(indemnity\s+)?insurance/i,

            // Certificate and naming
            /certificate\s+of\s+insurance/i,
            /certificate\s+of\s+insurance\s+naming\s+Amazon\s+as\s+additional\s+insured/i,
            /additional\s+insured/i,
            /loss\s+payee/i,
            /add\s+Amazon\s+as\s+an\s+additional\s+insured/i,

            // Coverage limits
            /coverage\s+of\s+at\s+least/i,
            /limits\s+of\s+not\s+less\s+than/i,
            /minimum\s+coverage/i,
            /insurance\s+polic(y|ies)/i,
            /prior\s+to\s+commencement/i,

            // CPC/entertainment equivalents
            /Public\s+Liability\s+Insurance/i,
            /Key\s+Person\s+Insurance/i,
            /Cast.*Insurance/i,
            /production\s+insurance/i
        ],
        negative: [
            // Exclude pure representations (not obligation)
            /represents\s+that.*is\s+insured/i,
            /shall\s+indemnify/i
        ],
        heading_boost: [
            /INSURANCE/i,
            /INSURANCE\s+REQUIREMENTS/i,
            /COVERAGE\s+REQUIREMENTS/i
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
        min_matches: 1,
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
            /strike|labor\s+dispute/i,
            // Generic additions for better coverage
            /circumstances\s+beyond/i,
            /impossibility\s+of\s+performance/i,
            /extraordinary\s+event/i,
            /excused\s+from\s+performance/i,
            /civil\s+unrest|riot/i,
            /epidemic/i,
            /embargo/i
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
            // Core restrictions (CG-006.1.2)
            /may\s+not\s+assign.*without\s+prior\s+written\s+consent/i,
            /may\s+not\s+assign/i,
            /shall\s+not\s+assign/i,
            /assignment\s+is\s+void/i,
            /any\s+purported\s+assignment.*shall\s+be\s+void/i,

            // Successors and assigns
            /successors\s+and\s+assigns/i,
            /binding\s+upon.*successors/i,
            /inure\s+to\s+the\s+benefit\s+of.*successors/i,

            // Change of control
            /change\s+of\s+control/i,
            /change\s+of\s+control\s+shall\s+be\s+deemed\\s+an\\s+assignment/i,

            // Assignment by operation
            /assignment\s+by\s+operation\s+of\s+law/i,
            /without\s+prior\s+written\s+consent/i,
            /assignment\s+of\s+this\s+Agreement/i,
            /assign\s+its\s+rights/i,
            /delegate\s+its\s+obligations/i,

            // Free assignment (Amazon carve-out)
            /may\s+freely\s+assign/i,
            /Amazon\s+may\s+assign/i
        ],
        negative: [
            // Exclude boilerplate conflicts
            /counterparts/i,
            /entire\s+agreement/i,
            // CG-008: Prevent Confidentiality collision
            /confidential/i,
            /disclose/i,
            /non-disclosure/i
        ],
        heading_boost: [
            /ASSIGNMENT/i,
            /ASSIGNABILITY/i,
            /SUCCESSORS\s+AND\s+ASSIGNS/i
        ],
        min_matches: 1,
        confidence: 0.88,  // CG-008: Boosted
        priority: 2,  // CG-008: Boosted from 3
        amazon_note: "Assignment restrictions - review consent requirements"
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
            /retain\s+records\s+for/i,
            // CG-008: Strong indicators
            /books\s+and\s+records/i,
            /certified\s+public\s+accountant/i,
            /audit.*reasonable\s+times/i
        ],
        negative: [
            // CG-008: Prevent RightsGrant collision
            /grant/i,
            /license/i,
            /exploitation/i,
            /in\s+perpetuity/i,
            /throughout\s+the\s+universe/i
        ],
        heading_boost: [
            /AUDIT/i,
            /AUDIT\s+RIGHTS/i,
            /BOOKS\s+AND\s+RECORDS/i
        ],
        min_matches: 1,  // Keep at 1 but with negatives
        confidence: 0.90,  // CG-008: Boosted
        priority: 2,
        amazon_note: "Audit rights"
    },

    GeneralProvisions: {
        patterns: [
            // Power of Attorney (PSA standard)
            /power\s+of\s+attorney/i,
            /irrevocably\s+authorizes/i,
            /execute.*on\s+.*behalf/i,
            /register\s+and\s+record\s+such\s+documents/i,
            /execute\s+and\s+deliver\s+all\s+additional\s+documents/i,
            /do\s+any\s+other\s+acts/i,

            // Entire Agreement
            /entire\s+agreement\s+between\s+the\s+parties/i,
            /constitutes\s+the\s+entire\s+understanding/i,
            /supersedes\s+all\s+prior\s+agreements/i,
            /supersedes\s+any\s+previous\s+negotiations/i,
            /merged\s+into\s+this\s+Agreement/i,

            // Modifications
            /may\s+not\s+be\s+amended\s+except\s+in\s+writing/i,
            /no\s+modification\s+shall\s+be\s+effective\s+unless/i,
            /amendment\s+must\s+be\s+signed\s+by\s+both\s+parties/i,
            /waiver\s+must\s+be\s+in\s+writing/i,

            // Severability
            /severability/i,
            /if\s+any\s+provision\s+is\s+held\s+invalid/i,
            /remaining\s+provisions\s+shall\s+continue/i,
            /deemed\s+severable/i,
            /unenforceable\s+provision\s+shall\s+be\s+modified/i,

            // Counterparts
            /executed\s+in\s+counterparts/i,
            /each\s+counterpart\s+shall\s+be\s+deemed\s+an\s+original/i,
            /facsimile\s+signatures/i,
            /electronic\s+signatures\s+shall\s+be\s+valid/i,

            // No Waiver
            /no\s+waiver\s+of\s+any\s+breach/i,
            /failure\s+to\s+enforce\s+shall\s+not\s+constitute/i,
            /waiver\s+of\s+any\s+right\s+shall\s+not\s+be\s+deemed/i,
            /delay\s+in\s+exercising\s+any\s+right/i,

            // Headings
            /headings\s+are\s+for\s+convenience\s+only/i,
            /section\s+headings\s+shall\s+not\s+affect/i,
            /captions\s+are\s+for\s+reference\s+only/i,

            // Notices
            /all\s+notices\s+shall\s+be\s+in\s+writing/i,
            /notice\s+shall\s+be\s+deemed\s+given\s+when/i,
            /sent\s+by\s+certified\s+mail/i,
            /delivered\s+by\s+overnight\s+courier/i,

            // Standard Terms (CG-006.1)
            /standard\s+terms\s+and\s+conditions/i,
            /attached\s+hereto\s+as\s+Exhibit/i,
            /incorporated\s+by\s+reference/i,
            /MISCELLANEOUS/i,
            /GENERAL\s+PROVISIONS/i
        ],
        negative: [
            // Exclude very specific substantive clauses (less aggressive)
            /shall\s+indemnify/i,
            /hold\s+harmless/i,
            /LIMITATION\s+OF\s+LIABILITY/i,
            /GOVERNING\s+LAW/i,
            /FORCE\s+MAJEURE/i
        ],
        heading_boost: [
            /MISCELLANEOUS/i,
            /GENERAL\s+PROVISIONS/i,
            /BOILERPLATE/i,
            /FURTHER\s+DOCUMENTS/i,
            /POWER\s+OF\s+ATTORNEY/i
        ],
        min_matches: 1,
        confidence: 0.80,
        priority: 4,
        amazon_note: "General provisions including power of attorney"
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
        min_matches: 1,
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
        min_matches: 1,
        confidence: 0.75,
        priority: 4,
        amazon_note: "Definitions section"
    },

    // ================================================================
    // CG-001: ADDITIONAL FAMILIES FOR TAXONOMY COMPLETENESS
    // ================================================================

    DataProtection: {
        patterns: [
            // GDPR/Privacy Regulation
            /General\s+Data\s+Protection\s+Regulation/i,
            /\bGDPR\b/i,
            /\bCCPA\b/i,
            /California\s+Consumer\s+Privacy\s+Act/i,
            /data\s+protection\s+laws?/i,
            /data\s+protection\s+legislation/i,
            /applicable\s+privacy\s+laws/i,

            // GDPR Roles
            /data\s+controller/i,
            /data\s+processor/i,
            /joint\s+controllers/i,
            /sub-processor/i,
            /independent\s+data\s+controllers/i,

            // Personal Data Operations
            /personal\s+data/i,
            /processing\s+of\s+personal\s+data/i,
            /process\s+personal\s+data\s+only/i,
            /lawful\s+basis\s+for\s+processing/i,
            /data\s+subject\s+rights/i,
            /right\s+of\s+access/i,
            /right\s+to\s+erasure/i,
            /data\s+breach\s+notification/i,
            /privacy\s+impact\s+assessment/i,

            // Transfers
            /transfer\s+of\s+personal\s+data/i,
            /standard\s+contractual\s+clauses/i,
            /adequate\s+level\s+of\s+protection/i,
            /cross-border\s+transfer/i,

            // Notice/Consent
            /privacy\s+notice/i,
            /privacy\s+policy/i,
            /consent\s+of\s+the\s+data\s+subject/i
        ],
        negative: [
            // Confidentiality (trade secrets, not personal data)
            /trade\s+secrets?/i,
            /proprietary\s+information/i,
            /confidential\s+information/i
        ],
        heading_boost: [
            /DATA\s+PROTECTION/i,
            /PRIVACY/i,
            /GDPR/i,
            /PERSONAL\s+DATA/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,  // CG-008: Higher priority than Confidentiality
        amazon_note: "Data protection - GDPR/CCPA compliance"
    },

    // ================================================================
    // CG-006.1: NEW FAMILIES FROM LEGAL TEAM
    // ================================================================

    ConditionsPrecedent: {
        patterns: [
            // Core expressions (simplified)
            /conditions?\s+precedent/i,
            /subject\s+to.*conditions\s+precedent/i,
            /as\s+a\s+condition\s+precedent/i,
            /subject\s+to\s+the\s+satisfaction\s+of/i,
            /conditioned\s+upon/i,
            /contingent\s+upon/i,
            /provided\s+that.*has\s+first/i,
            /obligations.*subject\s+to/i,

            // Conditional structure
            /no\s+obligation\s+shall\s+arise\s+unless/i,
            /shall\s+not\s+be\s+effective\s+until/i,
            /prior\s+to\s+the\s+commencement\s+of/i,
            /as\s+a\s+precondition\s+to/i,
            /shall\s+not\s+be\s+required\s+to\s+perform\s+until/i,

            // Satisfaction/Waiver
            /satisfaction\s+or\s+waiver\s+of/i,
            /deemed\s+satisfied\s+when/i,
            /condition\s+shall\s+be\s+deemed\s+waived/i,
            /failure\s+of\s+condition/i,
            /acknowledged\s+sat isfied/i,
            /outstanding\s+steps\s+required\s+to\s+satisfy/i,

            // PSA specific
            /conditions\s+to\s+closing/i
        ],
        negative: [
            // Exclude payment conditions (different family)
            /upon\s+delivery.*of\s+invoice/i,
            /milestone\s+payments?/i,
            /represent.*warrant/i,
            // Indemnity conditions
            /shall\s+indemnify/i,
            /hold\s+harmless/i
        ],
        heading_boost: [
            /CONDITIONS\s+PRECEDENT/i,
            /PRECONDITIONS/i,
            /CONDITIONS\s+TO\s+CLOSING/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 2,
        amazon_note: "Conditions precedent - Review trigger requirements"
    },

    InjunctiveReliefWaiver: {
        patterns: [
            // Waiver of injunctive relief
            /waives?\s+(any\s+)?right\s+to\s+(seek\s+)?injunctive\s+relief/i,
            /waives?\s+the\s+right\s+to\s+obtain\s+injunctive/i,
            /shall\s+not\s+seek\s+injunctive\s+relief/i,
            /shall\s+not\s+be\s+entitled\s+to\s+injunctive/i,
            /remedies\s+shall\s+be\s+limited\s+to\s+monetary\s+damages/i,
            /sole\s+remedy\s+shall\s+be\s+monetary\s+damages/i,

            // Prohibition of interference
            /shall\s+not\s+enjoin\s+or\s+restrain/i,
            /shall\s+not\s+seek\s+to\s+enjoin/i,
            /no\s+right\s+to\s+restrain\\s+the/i,
            /shall\s+not\s+interfere\s+with/i,

            // Limitation of remedies
            /limited\s+to\s+the\s+right\s+to\s+recover\s+monetary\s+damages/i,
            /exclusive\s+remedy\s+shall\s+be.*monetary|damages/i,
            /equitable\s+relief\s+shall\s+not\s+be\s+available/i,

            // Entertainment context
            /shall\s+not\s+enjoin.*development.*production.*distribution/i,
            /shall\s+not\s+seek\s+to\s+enjoin\s+the\s+release/i,
            /shall\s+not\s+interfere\s+with\s+Amazon['']?s\s+exploitation/i
        ],
        negative: [
            // Not LiabilityLimitation (amount limits)
            /aggregate\s+liability/i,
            /shall\s+not\s+exceed/i,
            /liability\s+cap/i,
            // Not DisputeResolution
            /arbitration/i,
            /jurisdiction/i
        ],
        heading_boost: [
            /INJUNCTIVE\s+RELIEF/i,
            /EQUITABLE\s+RELIEF/i,
            /WAIVER\s+OF\s+REMEDIES/i,
            /LIMITATION\s+OF\s+REMEDIES/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Injunctive relief waiver - Amazon operational protection"
    },

    Publicity: {
        patterns: [
            /press\s+release/i,
            /public\s+announcement/i,
            /publicity\s+rights/i,
            /promotional\s+use/i,
            /advertising/i,
            /use\s+of\s+name/i,
            /use\s+of\s+likeness/i,
            /trademark\s+use/i,
            /prior\s+written\s+approval.*announce/i,
            /shall\s+not\s+issue.*press/i,
            /no\s+public\s+statement/i
        ],
        heading_boost: [
            /PUBLICITY/i,
            /PUBLIC\s+ANNOUNCEMENTS/i,
            /PRESS\s+RELEASES/i,
            /MARKETING/i
        ],
        min_matches: 1,
        confidence: 0.85,
        priority: 3,
        amazon_note: "Publicity restrictions - Amazon approval required"
    },

    GoverningLaw: {
        patterns: [
            /governed\s+by\s+the\s+laws\s+of/i,
            /governing\s+law/i,
            /applicable\s+law/i,
            /laws\s+of\s+the\s+State\s+of/i,
            /without\s+regard\s+to.*conflict\s+of\s+laws/i,
            /choice\s+of\s+law/i
        ],
        heading_boost: [
            /GOVERNING\s+LAW/i,
            /APPLICABLE\s+LAW/i,
            /CHOICE\s+OF\s+LAW/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 2,
        amazon_note: "Governing law - Often paired with jurisdiction"
    },

    // ================================================================
    // CG-012: NEW FAMILIES FROM PLAYBOOK EXPANSION (Feb 2026)
    // ================================================================

    MoralRights: {
        patterns: [
            // Waiver patterns (Amazon wants waiver)
            /waive[sd]?\s+(any\s+and\s+all\s+)?moral\s+rights/i,
            /moral\s+rights/i,
            /droit\s+moral/i,
            /right\s+of\s+(integrity|paternity)/i,
            /author['']?s\s+rights/i,
            /non-exercise\s+of\s+moral\s+rights/i,
            /irrevocably\s+waives?/i,
            /waiver\s+of\s+moral\s+rights/i,
            // Red flag patterns (ProdCo retaining)
            /reserves?\s+moral\s+rights/i,
            /retains?\s+moral\s+rights/i,
            /shall\s+not\s+waive/i,
            /paternity\s+right/i,
            /integrity\s+right/i
        ],
        negative: [
            // Exclude RightsGrant (general IP)
            /work\s+made\s+for\s+hire/i,
            /throughout\s+the\s+universe/i
        ],
        heading_boost: [
            /MORAL\s+RIGHTS/i,
            /DROIT\s+MORAL/i,
            /AUTHOR['']?S\s+RIGHTS/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "Moral rights waiver - Critical for unrestricted exploitation"
    },

    CreativeControl: {
        patterns: [
            // Amazon control (preferred)
            /Amazon['']?s?\s+(sole\s+and\s+)?final\s+(approval|control)/i,
            /Amazon\s+shall\s+have\s+(sole\s+)?creative\s+control/i,
            /subject\s+to\s+Amazon['']?s\s+approval/i,
            /creative\s+control/i,
            /final\s+cut/i,
            /meaningful\s+consultation/i,
            /casting\s+approval/i,
            /script\s+approval/i,
            /consider\s+in\s+good\s+faith/i,
            /creative\s+decisions/i,
            // Red flags (ProdCo control)
            /ProdCo\s+shall\s+have\s+final\s+approval/i,
            /ProdCo\s+retains\s+creative\s+control/i,
            /mutual\s+approval\s+required/i,
            /shared\s+creative\s+control/i,
            /joint\s+creative\s+decisions/i
        ],
        negative: [
            // Exclude Publicity (marketing approvals)
            /press\s+release/i,
            /marketing\s+materials/i,
            /publicity/i
        ],
        heading_boost: [
            /CREATIVE\s+CONTROL/i,
            /CREATIVE\s+APPROVAL/i,
            /CREATIVE\s+DECISIONS/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Creative control - Amazon should retain sole authority"
    },

    KeyPersons: {
        patterns: [
            /key\s+person/i,
            /key\s+personnel/i,
            /key\s+talent/i,
            /attached\s+talent/i,
            /continued\s+attachment/i,
            /becomes?\s+unavailable/i,
            /key\s+person\s+availability/i,
            /replacement\s+of\s+key\s+person/i,
            /key\s+person\s+insurance/i,
            /pay-?or-?play/i,
            /suspension.*key\s+person/i,
            /producer\s+shall\s+not\s+replace/i,
            /subject\s+to\s+key\s+person/i,
            // Red flags
            /ProdCo\s+may\s+replace/i,
            /ProdCo\s+sole\s+discretion\s+to\s+replace/i,
            /automatic\s+termination\s+if.*unavailable/i
        ],
        negative: [
            // Exclude Insurance (general)
            /errors\s+and\s+omissions/i,
            /commercial\s+general\s+liability/i,
            /E\s*&\s*O\b/i
        ],
        heading_boost: [
            /KEY\s+PERSON/i,
            /KEY\s+PERSONNEL/i,
            /KEY\s+TALENT/i,
            /ATTACHED\s+ELEMENTS/i
        ],
        min_matches: 1,
        confidence: 0.90,
        priority: 1,
        amazon_note: "Key persons - Amazon approval for replacements"
    },

    AIPolicy: {
        patterns: [
            /artificial\s+intelligence/i,
            /\bAI\s+tool[s]?\b/i,
            /machine\s+learning/i,
            /generative\s+AI/i,
            /training\s+data/i,
            /model\s+training/i,
            /AI-generated\s+content/i,
            /input\s+into\s+AI/i,
            /NPI\s+into\s+AI/i,
            /third[\s-]party\s+AI\s+services/i,
            /compliant\s+with\s+Amazon['']?s?\s+policy/i,
            /Amazon['']?s?\s+AI\s+policy/i,
            /\bLLM[s]?\b/i,
            /large\s+language\s+model[s]?/i,
            // Red flags
            /may\s+use\s+AI\s+tools/i,
            /ProdCo\s+may\s+use\s+AI/i,
            /AI\s+usage\s+at\s+ProdCo['']?s?\s+discretion/i
        ],
        negative: [
            // Exclude AuditRights
            /audit/i,
            /books\s+and\s+records/i
        ],
        heading_boost: [
            /ARTIFICIAL\s+INTELLIGENCE/i,
            /AI\s+POLICY/i,
            /AI\/ML/i,
            /MACHINE\s+LEARNING/i
        ],
        min_matches: 1,
        confidence: 0.92,
        priority: 1,
        amazon_note: "AI/ML policy - Critical compliance requirement"
    },

    TaxProvisions: {
        patterns: [
            /withholding\s+tax/i,
            /tax\s+gross[\s-]up/i,
            /\bVAT\b/i,
            /\bGST\b/i,
            /sales\s+tax/i,
            /tax\s+residenc[ye]/i,
            /transaction\s+tax(es)?/i,
            /deduct\s+or\s+withhold/i,
            /taxes\s+and\s+(other\s+)?governmental\s+fees/i,
            /tax\s+equalization/i,
            /responsible\s+for.*tax/i,
            // Red flags
            /Amazon\s+shall\s+be\s+responsible\s+for\s+all\s+taxes/i,
            /Amazon\s+shall\s+gross[\s-]?up/i,
            /no\s+withholding/i
        ],
        negative: [
            // Exclude PaymentCredits
            /milestone\s+payment/i,
            /production\s+fee/i,
            /net\s+receipts/i
        ],
        heading_boost: [
            /TAX/i,
            /TAXES/i,
            /WITHHOLDING/i,
            /TAX\s+PROVISIONS/i
        ],
        min_matches: 1,
        confidence: 0.92,  // Boosted to beat PaymentCredits
        priority: 1,       // Boosted to priority 1
        amazon_note: "Tax provisions - ProdCo responsibility preferred"
    },

    DeliveryAcceptance: {
        patterns: [
            /delivery\s+(and\s+)?acceptance/i,
            /acceptance\s+criteria/i,
            /delivery\s+requirements/i,
            /final\s+delivery/i,
            /technical\s+specifications/i,
            /rejection\s+notice/i,
            /cure\s+period/i,
            /re-?delivery/i,
            /conformity\s+with\s+specifications/i,
            /deemed\s+delivered/i,
            /delivery\s+schedule/i,
            /acceptance\s+testing/i,
            // Red flags
            /deemed\s+accepted/i,
            /automatically\s+accepted/i,
            /ProdCo\s+determines\s+completion/i,
            /Amazon\s+waives\s+right\s+to\s+reject/i,
            /acceptance\s+not\s+unreasonably\s+withheld/i
        ],
        negative: [
            // Exclude ServicesScope
            /scope\s+of\s+services/i,
            /production\s+services/i
        ],
        heading_boost: [
            /DELIVERY/i,
            /ACCEPTANCE/i,
            /DELIVERY\s+AND\s+ACCEPTANCE/i,
            /TECHNICAL\s+REQUIREMENTS/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Delivery/acceptance - Amazon retains rejection rights"
    },

    BudgetOverages: {
        patterns: [
            /budget\s+over(age|run)/i,
            /cost\s+overrun/i,
            /overages?/i,
            /exceeds?\s+the\s+(approved\s+)?budget/i,
            /approved\s+budget/i,
            /approved\s+production\s+budget/i,
            /contingency/i,
            /actual\s+costs/i,
            /cost\s+plus/i,
            // Red flags
            /Amazon\s+shall\s+pay\s+all\s+overages/i,
            /overages\s+at\s+Amazon['']?s?\s+expense/i,
            /no\s+cap\s+on\s+overages/i,
            /ProdCo\s+not\s+responsible\s+for\s+overages/i,
            /Amazon\s+pre-?approves?\s+overages/i,
            /Amazon\s+bears\s+contingency/i
        ],
        negative: [
            // Exclude PaymentCredits
            /milestone\s+payment/i,
            /production\s+fee/i,
            /backend\s+participation/i
        ],
        heading_boost: [
            /BUDGET/i,
            /OVERAGES/i,
            /COST\s+OVERRUNS/i,
            /PRODUCTION\s+BUDGET/i
        ],
        min_matches: 1,
        confidence: 0.88,
        priority: 1,
        amazon_note: "Budget overages - ProdCo liability preferred"
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
