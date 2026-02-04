/**
 * ================================================================
 * HYBRID ROUTER v1.0 - CG-007 n8n Integration
 * ================================================================
 * Single node that replaces: Keyword Router + Router Agent + Parse Router
 * 
 * ARCHITECTURE:
 * Stage 1: Keyword Router (deterministic, fast)
 * Stage 2: LLM Fallback (GPT-4o-mini) when:
 *   - family == OtherUnknown
 *   - confidence < 0.80
 *   - family ∈ ALWAYS_LLM_FAMILIES
 *
 * Version: 1.0
 * Last Updated: 2026-02-01
 * ================================================================
 */

// ================================================================
// CONFIGURATION
// ================================================================

const LLM_CONFIG = {
    KEYWORD_TRUST_THRESHOLD: 0.85,
    LLM_REQUIRED_THRESHOLD: 0.80,
    ALWAYS_LLM_FAMILIES: ['PaymentCredits', 'IndemnityProcedures'],
    KEYWORD_RELIABLE_FAMILIES: [
        'ServicesScope', 'AmazonControl', 'RightsGrant', 'ForceMajeure',
        'DisputeResolution', 'Assignment', 'ConditionsPrecedent',
        'Confidentiality', 'ThirdPartyCredits', 'IndemnityProdCo'
    ],
    RAG_TOP_K: 3
};

// ================================================================
// CANONICAL FAMILIES (Single Source of Truth)
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
// KEYWORD PATTERNS (Imported from keyword_router_v4.1.js)
// ================================================================

// NOTE: Full patterns are imported from the main router file
// This is a placeholder - in n8n, import the actual patterns

const KEYWORD_PATTERNS = {
    // ... patterns imported from keyword_router_v4.1.js
    // For n8n, this will be inlined during deployment
};

// ================================================================
// KEYWORD ROUTER LOGIC
// ================================================================

function keywordRoute(clauseText, heading = '') {
    const textLower = clauseText.toLowerCase();
    const headingLower = (heading || '').toLowerCase();

    let bestMatch = { family: 'OtherUnknown', confidence: 0, matches: [] };

    for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
        const patterns = config.patterns || [];
        const negative = config.negative || [];

        // Check negative patterns first
        const hasNegative = negative.some(p => p.test(clauseText));
        if (hasNegative) continue;

        // Count positive matches
        const matchingPatterns = patterns.filter(p => p.test(clauseText));

        if (matchingPatterns.length > 0) {
            const confidence = Math.min(0.95, 0.7 + (matchingPatterns.length * 0.08));

            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    family,
                    confidence,
                    matches: matchingPatterns.map(p => p.toString().slice(0, 50))
                };
            }
        }
    }

    return bestMatch;
}

// ================================================================
// LLM DECISION LOGIC
// ================================================================

function shouldCallLLM(keywordResult) {
    const { family, confidence, matches } = keywordResult;

    if (family === 'OtherUnknown') {
        return { callLLM: true, reason: 'OtherUnknown requires LLM' };
    }

    if (LLM_CONFIG.ALWAYS_LLM_FAMILIES.includes(family)) {
        return { callLLM: true, reason: `${family} requires LLM verification` };
    }

    if (confidence >= LLM_CONFIG.KEYWORD_TRUST_THRESHOLD &&
        LLM_CONFIG.KEYWORD_RELIABLE_FAMILIES.includes(family)) {
        return { callLLM: false, reason: 'High-confidence reliable family' };
    }

    if (confidence >= LLM_CONFIG.KEYWORD_TRUST_THRESHOLD && matches && matches.length >= 2) {
        return { callLLM: false, reason: 'Multiple pattern matches' };
    }

    if (confidence < LLM_CONFIG.LLM_REQUIRED_THRESHOLD) {
        return { callLLM: true, reason: `Low confidence: ${confidence}` };
    }

    return { callLLM: false, reason: 'Sufficient keyword confidence' };
}

// ================================================================
// LLM PROMPT BUILDER
// ================================================================

function buildLLMPrompt(clauseText, heading, keywordHint, ragExamples = []) {
    const familyList = CANONICAL_FAMILIES.filter(f => f !== 'OtherUnknown').join(', ');

    const ragContext = ragExamples.length > 0
        ? ragExamples.map((ex, i) =>
            `Example ${i + 1} (${ex.acceptance}):\n"${ex.example_text.substring(0, 200)}..."`
        ).join('\n\n')
        : 'No similar examples found.';

    return `You are a legal contract classifier for Amazon PSA/DSA agreements.

TASK: Classify this clause into exactly ONE family.

FAMILIES:
${familyList}

CLAUSE:
"""
${clauseText}
"""

HEADING: ${heading || 'Not provided'}
KEYWORD HINT: ${keywordHint.family} (${keywordHint.confidence.toFixed(2)})

SIMILAR EXAMPLES:
${ragContext}

OUTPUT JSON only:
{
  "family": "<family_name>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;
}

// ================================================================
// CONFLICT RESOLUTION
// ================================================================

function resolveConflict(keywordResult, llmResult) {
    const kwConf = keywordResult.confidence;
    const llmConf = llmResult.confidence;

    // Agreement
    if (keywordResult.family === llmResult.family) {
        return {
            family: llmResult.family,
            confidence: Math.max(kwConf, llmConf),
            method: 'keyword+llm_agree',
            reasoning: llmResult.reasoning
        };
    }

    // LLM high confidence wins
    if (llmConf >= 0.85) {
        return {
            family: llmResult.family,
            confidence: llmConf,
            method: 'llm_semantic',
            reasoning: llmResult.reasoning
        };
    }

    // Keyword high confidence wins
    if (kwConf >= 0.90 && llmConf < 0.80) {
        return {
            family: keywordResult.family,
            confidence: kwConf,
            method: 'keyword_override',
            reasoning: 'Keyword strong match'
        };
    }

    // Default: LLM
    return {
        family: llmResult.family,
        confidence: llmConf,
        method: 'llm_default',
        reasoning: llmResult.reasoning
    };
}

// ================================================================
// N8N EXECUTION BLOCK
// ================================================================

// Get input from n8n
const input = $input.first().json;
const clauseText = input.clause_text || input.clauseText || '';
const heading = input.heading || input.section_heading || '';
const ragExamples = input.rag_examples || [];

// Stage 1: Keyword Router
const keywordResult = keywordRoute(clauseText, heading);

// Stage 2: LLM Decision
const llmDecision = shouldCallLLM(keywordResult);

if (!llmDecision.callLLM) {
    // Fast path: Keyword only
    return {
        json: {
            family: keywordResult.family,
            confidence: keywordResult.confidence,
            method: 'keyword_only',
            reasoning: llmDecision.reason,
            llm_required: false,
            // Passthrough for downstream
            clause_text: clauseText,
            heading: heading,
            rag_examples: ragExamples
        }
    };
}

// LLM path: Build prompt and flag for HTTP node
const llmPrompt = buildLLMPrompt(clauseText, heading, keywordResult, ragExamples);

return {
    json: {
        llm_required: true,
        keyword_result: keywordResult,
        llm_prompt: llmPrompt,
        // Passthrough
        clause_text: clauseText,
        heading: heading,
        rag_examples: ragExamples
    }
};
