/**
 * Discovery Mode Check Node
 * Position: After "Hybrid Router (Stage 1)"
 * Purpose: Determine if Discovery Mode should activate for unknown/low-confidence clauses
 */

const clauseData = $json;
const routingConfidence = clauseData._keyword_confidence || 0;
const detectedFamily = clauseData.detected_family;
const needsLLM = clauseData.needs_llm_fallback;

// Determine if Discovery Mode should activate
const activateDiscovery =
    detectedFamily === 'OtherUnknown' ||
    routingConfidence < 0.50 ||
    (needsLLM && routingConfidence < 0.40);

// Known families with playbook specs
const KNOWN_FAMILIES = [
    // CRITICAL
    'IndemnityProdCo', 'IndemnityAmazon', 'IndemnityProcedures',
    'RepsProdCo', 'RightsGrant', 'RightsReversion',
    'LiabilityLimitation', 'InjunctiveReliefWaiver',
    'TerminationRights', 'TerminationConsequences',
    'PaymentCredits', 'ThirdPartyCredits',
    'SurvivalRemedies', 'AmazonControl', 'Assignment',
    'MoralRights', 'AIPolicy',

    // HIGH
    'DisputeResolution', 'Confidentiality', 'Insurance', 'ForceMajeure',
    'CreativeControl', 'KeyPersons', 'DeliveryAcceptance', 'BudgetOverages',

    // MEDIUM
    'DataProtection', 'ServicesScope', 'AuditRights', 'TaxProvisions',
    'Publicity', 'PowerOfAttorney', 'ConditionsPrecedent', 'StandardTerms'
];

const hasPlaybookSpec = KNOWN_FAMILIES.includes(detectedFamily);
const useDiscoveryMode = activateDiscovery || !hasPlaybookSpec;

// Determine discovery reason
let discoveryReason = null;
if (useDiscoveryMode) {
    if (!hasPlaybookSpec) {
        discoveryReason = 'NO_PLAYBOOK_SPEC';
    } else if (detectedFamily === 'OtherUnknown') {
        discoveryReason = 'UNKNOWN_FAMILY';
    } else {
        discoveryReason = 'LOW_CONFIDENCE';
    }
}

return [{
    json: {
        ...clauseData,
        _use_discovery_mode: useDiscoveryMode,
        _discovery_reason: discoveryReason,
        _routing_confidence: routingConfidence,
        _has_playbook_spec: hasPlaybookSpec
    }
}];
