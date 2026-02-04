/**
 * ================================================================
 * LLM ROUTER v1.0 - CG-007 Implementation
 * ================================================================
 * Semantic classification for clauses that escape Keyword Router
 * 
 * ARCHITECTURE:
 * - Receives OtherUnknown or low-confidence clauses from Keyword Router
 * - Uses LLM (GPT-4o-mini) + RAG for semantic classification
 * - Returns canonical family with confidence
 * 
 * Version: 1.0
 * Last Updated: 2026-02-01
 * ================================================================
 */

// ================================================================
// CONFIGURATION
// ================================================================

const LLM_CONFIG = {
    // Threshold for trusting Keyword Router without LLM
    KEYWORD_TRUST_THRESHOLD: 0.85,  // Lowered from 0.90

    // Threshold for calling LLM
    LLM_REQUIRED_THRESHOLD: 0.80,   // Lowered from 0.85

    // Families that ALWAYS require LLM (low keyword recall <30%)
    ALWAYS_LLM_FAMILIES: [
        'PaymentCredits',      // 14% recall
        'IndemnityProcedures'  // 25% recall
        // Removed LiabilityLimitation (29%) and Insurance (33%) - let them try keyword first
    ],

    // Families where keyword is highly reliable (>50% recall)
    KEYWORD_RELIABLE_FAMILIES: [
        'ServicesScope',       // 100%
        'AmazonControl',       // 67%
        'RightsGrant',         // 50%
        'ForceMajeure',        // 63%
        'DisputeResolution',   // 60%
        'Assignment',          // 57%
        'ConditionsPrecedent', // 67%
        'Confidentiality',     // 75%
        'ThirdPartyCredits',   // 60%
        'IndemnityProdCo'      // 50%
    ],

    // LLM confidence thresholds
    LLM_HIGH_CONFIDENCE: 0.85,
    LLM_ESCALATION_THRESHOLD: 0.70,

    // RAG settings
    RAG_TOP_K: 3,
    RAG_SIMILARITY_THRESHOLD: 0.3
};

// ================================================================
// CANONICAL FAMILIES (imported from keyword router)
// ================================================================

const CANONICAL_FAMILIES = [
    "PaymentCredits", "ThirdPartyCredits", "RepsProdCo", "RepsAmazon",
    "IndemnityProdCo", "IndemnityAmazon", "IndemnityProcedures",
    "LiabilityLimitation", "InjunctiveReliefWaiver", "TerminationRights",
    "TerminationConsequences", "Confidentiality", "DataProtection",
    "GoverningLaw", "DisputeResolution", "ForceMajeure", "Insurance",
    "RightsGrant", "RightsReversion", "AuditRights", "Publicity",
    "Assignment", "ServicesScope", "SurvivalRemedies", "AmazonControl",
    "GeneralProvisions", "ConditionsPrecedent", "Definitions", "Parties",
    "OtherUnknown"
];

// ================================================================
// FALLBACK DECISION LOGIC
// ================================================================

/**
 * Determines if LLM Router should be called based on Keyword Router output
 * @param {Object} keywordResult - Output from keywordRoute()
 * @returns {Object} { callLLM: boolean, reason: string }
 */
function shouldCallLLM(keywordResult) {
    const { family, confidence, matches } = keywordResult;

    // Case 1: OtherUnknown - always call LLM
    if (family === 'OtherUnknown') {
        return { callLLM: true, reason: 'OtherUnknown requires semantic classification' };
    }

    // Case 2: Low-recall families - always call LLM for verification
    if (LLM_CONFIG.ALWAYS_LLM_FAMILIES.includes(family)) {
        return { callLLM: true, reason: `${family} has low keyword recall, needs LLM verification` };
    }

    // Case 3: High-confidence keyword for reliable families - trust keyword
    if (confidence >= LLM_CONFIG.KEYWORD_TRUST_THRESHOLD &&
        LLM_CONFIG.KEYWORD_RELIABLE_FAMILIES.includes(family)) {
        return { callLLM: false, reason: 'High-confidence keyword match for reliable family' };
    }

    // Case 4: High confidence with multiple matches - trust keyword
    if (confidence >= LLM_CONFIG.KEYWORD_TRUST_THRESHOLD && matches && matches.length >= 2) {
        return { callLLM: false, reason: 'High confidence with multiple pattern matches' };
    }

    // Case 5: Below LLM threshold - call LLM
    if (confidence < LLM_CONFIG.LLM_REQUIRED_THRESHOLD) {
        return { callLLM: true, reason: `Confidence ${confidence} below threshold ${LLM_CONFIG.LLM_REQUIRED_THRESHOLD}` };
    }

    // Default: trust keyword for medium-high confidence
    return { callLLM: false, reason: 'Sufficient keyword confidence' };
}

// ================================================================
// LLM PROMPT TEMPLATE
// ================================================================

/**
 * Generates the LLM prompt for classification
 * @param {string} clauseText - The clause to classify
 * @param {string} heading - Section heading if available
 * @param {Object} keywordHint - Keyword router's guess
 * @param {Array} ragExamples - Similar examples from RAG
 * @returns {string} Formatted prompt
 */
function buildLLMPrompt(clauseText, heading, keywordHint, ragExamples) {
    const familyList = CANONICAL_FAMILIES.filter(f => f !== 'OtherUnknown').join(', ');

    const ragContext = ragExamples && ragExamples.length > 0
        ? ragExamples.map((ex, i) =>
            `Example ${i + 1} (${ex.family}):\n"${ex.clause_text.substring(0, 200)}..."`
        ).join('\n\n')
        : 'No similar examples found.';

    return `You are a legal contract classifier for Amazon entertainment agreements (PSA/DSA).

TASK: Classify the following clause into exactly ONE family from this taxonomy:
${familyList}

CLAUSE TO CLASSIFY:
"""
${clauseText}
"""

SECTION HEADING: ${heading || 'Not provided'}

KEYWORD ROUTER SUGGESTION: ${keywordHint.family} (confidence: ${keywordHint.confidence.toFixed(2)})

SIMILAR EXAMPLES FROM POLICY DATABASE:
${ragContext}

CLASSIFICATION RULES:
1. Choose the MOST SPECIFIC family that applies
2. If clause spans multiple families, choose the PRIMARY purpose
3. Set ambiguity_flag=true if clause legitimately belongs to 2+ families
4. Set escalation_required=true if you cannot confidently classify

OUTPUT FORMAT (JSON only, no markdown):
{
  "family": "<family_name>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence explanation>",
  "ambiguity_flag": <true/false>,
  "secondary_family": "<if ambiguous, otherwise null>",
  "escalation_required": <true/false>
}`;
}

// ================================================================
// CONFLICT RESOLUTION
// ================================================================

/**
 * Resolves disagreement between Keyword and LLM Router
 * @param {Object} keywordResult - Keyword Router output
 * @param {Object} llmResult - LLM Router output
 * @returns {Object} Final classification decision
 */
function resolveConflict(keywordResult, llmResult) {
    const kwConf = keywordResult.confidence;
    const llmConf = llmResult.confidence;

    // Agreement - use LLM result (has reasoning)
    if (keywordResult.family === llmResult.family) {
        return {
            family: llmResult.family,
            confidence: Math.max(kwConf, llmConf),
            method: 'keyword+llm_agree',
            reasoning: llmResult.reasoning,
            escalation_required: false
        };
    }

    // Disagreement resolution

    // Case 1: Keyword very high, LLM low - trust keyword
    if (kwConf >= 0.90 && llmConf < 0.80) {
        return {
            family: keywordResult.family,
            confidence: kwConf,
            method: 'keyword_override',
            reasoning: `Keyword high confidence (${kwConf}) overrides low LLM confidence (${llmConf})`,
            escalation_required: false
        };
    }

    // Case 2: Keyword low, LLM high - trust LLM
    if (kwConf < 0.85 && llmConf >= 0.85) {
        return {
            family: llmResult.family,
            confidence: llmConf,
            method: 'llm_semantic',
            reasoning: llmResult.reasoning,
            escalation_required: false
        };
    }

    // Case 3: Both high confidence but different - LLM wins (semantic authority)
    if (kwConf >= 0.85 && llmConf >= 0.85) {
        return {
            family: llmResult.family,
            confidence: llmConf,
            method: 'llm_semantic_authority',
            reasoning: llmResult.reasoning,
            escalation_required: false
        };
    }

    // Case 4: Both low confidence - escalate
    if (kwConf < 0.70 && llmConf < 0.70) {
        return {
            family: llmResult.family, // Use LLM as best guess
            confidence: Math.max(kwConf, llmConf),
            method: 'escalation',
            reasoning: `Both classifiers uncertain: keyword=${kwConf}, llm=${llmConf}`,
            escalation_required: true
        };
    }

    // Default: trust LLM
    return {
        family: llmResult.family,
        confidence: llmConf,
        method: 'llm_default',
        reasoning: llmResult.reasoning,
        escalation_required: llmResult.escalation_required
    };
}

// ================================================================
// MAIN HYBRID ROUTER
// ================================================================

/**
 * Hybrid Router - combines Keyword and LLM classification
 * This is the main entry point for clause classification
 * 
 * @param {string} clauseText - The clause to classify
 * @param {string} heading - Section heading
 * @param {Function} keywordRoute - The keyword router function
 * @param {Function} callLLM - Function to call LLM API
 * @param {Function} fetchRAGExamples - Function to fetch similar examples
 * @returns {Promise<Object>} Classification result
 */
async function hybridRoute(clauseText, heading, keywordRoute, callLLM, fetchRAGExamples) {
    // Step 1: Get keyword routing result
    const keywordResult = keywordRoute(clauseText, heading);

    // Step 2: Decide if LLM is needed
    const llmDecision = shouldCallLLM(keywordResult);

    if (!llmDecision.callLLM) {
        // Fast path: trust keyword router
        return {
            family: keywordResult.family,
            confidence: keywordResult.confidence,
            method: 'keyword_only',
            reasoning: llmDecision.reason,
            escalation_required: false,
            llm_called: false
        };
    }

    // Step 3: Fetch RAG examples
    const ragExamples = await fetchRAGExamples(clauseText, LLM_CONFIG.RAG_TOP_K);

    // Step 4: Build prompt and call LLM
    const prompt = buildLLMPrompt(clauseText, heading, keywordResult, ragExamples);
    const llmResponse = await callLLM(prompt);

    // Step 5: Parse LLM response
    let llmResult;
    try {
        llmResult = JSON.parse(llmResponse);

        // Validate family
        if (!CANONICAL_FAMILIES.includes(llmResult.family)) {
            llmResult.family = 'OtherUnknown';
            llmResult.escalation_required = true;
        }
    } catch (e) {
        // LLM response parsing failed - escalate
        return {
            family: keywordResult.family,
            confidence: keywordResult.confidence,
            method: 'keyword_fallback',
            reasoning: 'LLM response parsing failed',
            escalation_required: true,
            llm_called: true,
            llm_error: e.message
        };
    }

    // Step 6: Resolve any conflict
    const finalResult = resolveConflict(keywordResult, llmResult);

    return {
        ...finalResult,
        llm_called: true,
        keyword_guess: keywordResult.family,
        keyword_confidence: keywordResult.confidence,
        ambiguity_flag: llmResult.ambiguity_flag || false,
        secondary_family: llmResult.secondary_family || null
    };
}

// ================================================================
// EXPORTS (for n8n integration)
// ================================================================

module.exports = {
    hybridRoute,
    shouldCallLLM,
    resolveConflict,
    buildLLMPrompt,
    LLM_CONFIG,
    CANONICAL_FAMILIES
};

// Also expose for n8n inline use
if (typeof $input !== 'undefined') {
    // n8n context - export functions globally
    globalThis.hybridRoute = hybridRoute;
    globalThis.shouldCallLLM = shouldCallLLM;
    globalThis.resolveConflict = resolveConflict;
    globalThis.buildLLMPrompt = buildLLMPrompt;
    globalThis.LLM_CONFIG = LLM_CONFIG;
}
