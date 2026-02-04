/**
 * ================================================================
 * PARSE ROUTER v4.2 - Taxonomy Consolidated
 * ================================================================
 * CG-001: Single Source of Truth for clause families
 * 
 * This file contains the Parse Router logic for W2 workflow.
 * Copy this code into the "Parse Router" node in n8n.
 * 
 * Version: 4.2
 * Last Updated: 2026-02-01
 * ================================================================
 */

const prevData = $('Keyword Router').first().json;
const keywordRouter = prevData._keyword_router;
let routerOutput = { route: 'OtherUnknown', confidence: 0, reasoning: '' };

// Check if keyword routing succeeded with high confidence
if (keywordRouter?.routed && keywordRouter.confidence >= 0.65) {
    routerOutput = {
        route: keywordRouter.family,
        confidence: keywordRouter.confidence,
        reasoning: 'Keyword pattern match: ' + keywordRouter.method + ' (' + keywordRouter.matched_patterns + ' patterns)'
    };
} else {
    // Use LLM result
    try {
        const content = $('Router Agent').first().json?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        routerOutput = {
            route: parsed.route || 'OtherUnknown',
            confidence: parsed.confidence || 0.5,
            reasoning: parsed.reasoning || 'LLM classification'
        };
    } catch (e) {
        // Fallback to keyword result if available
        if (keywordRouter?.family) {
            routerOutput = {
                route: keywordRouter.family,
                confidence: keywordRouter.confidence || 0.5,
                reasoning: 'LLM failed, using keyword fallback'
            };
        } else {
            routerOutput.reasoning = 'Parse error: ' + e.message;
        }
    }
}

// ================================================================
// CG-001: NORMALIZE - Map various formats to canonical PascalCase names
// ================================================================
const FAMILY_NORMALIZE = {
    // Indemnity variants
    'indemnity_prodco': 'IndemnityProdCo',
    'indemnityprodco': 'IndemnityProdCo',
    'prodco_indemnification': 'IndemnityProdCo',
    'indemnity_amazon': 'IndemnityAmazon',
    'indemnityamazon': 'IndemnityAmazon',
    'amazon_indemnification': 'IndemnityAmazon',
    'defense_settlement': 'IndemnityProcedures',
    'defensesettlement': 'IndemnityProcedures',
    'indemnity_procedures': 'IndemnityProcedures',

    // Representations variants
    'reps_prodco': 'RepsProdCo',
    'repsprodco': 'RepsProdCo',
    'prodco_representations': 'RepsProdCo',
    'reps_amazon': 'RepsAmazon',
    'repsamazon': 'RepsAmazon',

    // Payment variants
    'payment_credits': 'PaymentCredits',
    'paymentcredits': 'PaymentCredits',
    'compensation': 'PaymentCredits',
    'fees': 'PaymentCredits',
    'third_party_credits': 'ThirdPartyCredits',
    'thirdpartycredits': 'ThirdPartyCredits',
    'credits': 'ThirdPartyCredits',

    // Rights variants
    'rights_grant': 'RightsGrant',
    'rightsgrant': 'RightsGrant',
    'ownership': 'RightsGrant',
    'intellectual_property': 'RightsGrant',
    'ip': 'RightsGrant',
    'rights_reversion': 'RightsReversion',
    'rightsreversion': 'RightsReversion',
    'reversion': 'RightsReversion',

    // Liability variants
    'liability_limitation': 'LiabilityLimitation',
    'liabilitylimitation': 'LiabilityLimitation',
    'limitation_of_liability': 'LiabilityLimitation',
    'liability_cap': 'LiabilityLimitation',

    // Termination variants
    'termination_rights': 'TerminationRights',
    'terminationrights': 'TerminationRights',
    'termination': 'TerminationRights',
    'termination_consequences': 'TerminationConsequences',
    'terminationconsequences': 'TerminationConsequences',

    // Survival variants
    'survival_remedies': 'SurvivalRemedies',
    'survivalremedies': 'SurvivalRemedies',
    'survival': 'SurvivalRemedies',

    // Services variants
    'services_scope': 'ServicesScope',
    'servicesscope': 'ServicesScope',
    'scope': 'ServicesScope',
    'services': 'ServicesScope',

    // Standard families (lowercase mapping)
    'confidentiality': 'Confidentiality',
    'insurance': 'Insurance',
    'dispute_resolution': 'DisputeResolution',
    'disputeresolution': 'DisputeResolution',
    'jurisdiction': 'DisputeResolution',
    'arbitration': 'DisputeResolution',

    // NEW CG-001 families
    'data_privacy': 'DataPrivacy',
    'dataprivacy': 'DataPrivacy',
    'gdpr': 'DataPrivacy',
    'privacy': 'DataPrivacy',

    'publicity': 'Publicity',
    'press_release': 'Publicity',
    'marketing': 'Publicity',

    'governing_law': 'GoverningLaw',
    'governinglaw': 'GoverningLaw',
    'applicable_law': 'GoverningLaw',

    'force_majeure': 'ForceMajeure',
    'forcemajeure': 'ForceMajeure',

    'assignment': 'Assignment',

    'audit_rights': 'AuditRights',
    'auditrights': 'AuditRights',
    'audit': 'AuditRights',

    'amazon_control': 'AmazonControl',
    'amazoncontrol': 'AmazonControl',
    'creative_control': 'AmazonControl',

    'general_provisions': 'GeneralProvisions',
    'generalprovisions': 'GeneralProvisions',
    'boilerplate': 'GeneralProvisions',
    'miscellaneous': 'GeneralProvisions',

    'definitions': 'Definitions',

    'parties': 'Parties',

    'other_unknown': 'OtherUnknown',
    'otherunknown': 'OtherUnknown',
    'unknown': 'OtherUnknown'
};

const rawRoute = (routerOutput.route || 'OtherUnknown').toLowerCase().replace(/[^a-z_]/g, '').trim();
routerOutput.route = FAMILY_NORMALIZE[rawRoute] || routerOutput.route;

// ================================================================
// CG-001: CANONICAL FAMILIES (Single Source of Truth)
// ================================================================
// Must match exactly with keyword_router_v4.2.js CANONICAL_FAMILIES
const validFamilies = [
    'PaymentCredits',
    'ThirdPartyCredits',
    'RepsProdCo',
    'RepsAmazon',
    'IndemnityProdCo',
    'IndemnityAmazon',
    'IndemnityProcedures',
    'LiabilityLimitation',
    'TerminationRights',
    'TerminationConsequences',
    'Confidentiality',
    'DataPrivacy',
    'GoverningLaw',
    'DisputeResolution',
    'ForceMajeure',
    'Insurance',
    'RightsGrant',
    'RightsReversion',
    'AuditRights',
    'Publicity',
    'Assignment',
    'ServicesScope',
    'SurvivalRemedies',
    'AmazonControl',
    'GeneralProvisions',
    'Definitions',
    'Parties',
    'OtherUnknown'
];

if (!validFamilies.includes(routerOutput.route)) {
    routerOutput.route = 'OtherUnknown';
}

// Include routing metadata
routerOutput._routing_method = keywordRouter?.routed ? 'KEYWORD' : 'LLM';
routerOutput._keyword_confidence = keywordRouter?.confidence || 0;

return [{ json: { ...prevData, routerOutput } }];
