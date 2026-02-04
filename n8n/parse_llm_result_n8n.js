/**
 * ================================================================
 * PARSE LLM RESULT - CG-007 Hybrid Router
 * ================================================================
 * Processes LLM response and resolves conflicts with Keyword result
 * This is the second node in the Hybrid Router chain
 * ================================================================
 */

// Get input
const input = $input.first().json;
const llmResponse = input.llm_response || '';
const keywordResult = input.keyword_result || { family: 'OtherUnknown', confidence: 0 };

// Parse LLM response
let llmResult;
try {
    // Try to extract JSON from response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        llmResult = JSON.parse(jsonMatch[0]);
    } else {
        throw new Error('No JSON found in response');
    }

    // Validate family
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

    if (!CANONICAL_FAMILIES.includes(llmResult.family)) {
        llmResult.family = 'OtherUnknown';
        llmResult.escalation_required = true;
    }

} catch (e) {
    // Fallback to keyword result
    return {
        json: {
            family: keywordResult.family,
            confidence: keywordResult.confidence,
            method: 'keyword_fallback',
            reasoning: 'LLM parsing failed: ' + e.message,
            escalation_recommended: true,
            clause_text: input.clause_text,
            heading: input.heading,
            rag_examples: input.rag_examples
        }
    };
}

// Conflict resolution
function resolveConflict(kw, llm) {
    const kwConf = kw.confidence || 0;
    const llmConf = llm.confidence || 0;

    if (kw.family === llm.family) {
        return {
            family: llm.family,
            confidence: Math.max(kwConf, llmConf),
            method: 'keyword+llm_agree',
            reasoning: llm.reasoning
        };
    }

    if (llmConf >= 0.85) {
        return {
            family: llm.family,
            confidence: llmConf,
            method: 'llm_semantic',
            reasoning: llm.reasoning
        };
    }

    if (kwConf >= 0.90 && llmConf < 0.80) {
        return {
            family: kw.family,
            confidence: kwConf,
            method: 'keyword_override',
            reasoning: 'Keyword strong match'
        };
    }

    return {
        family: llm.family,
        confidence: llmConf,
        method: 'llm_default',
        reasoning: llm.reasoning
    };
}

const resolved = resolveConflict(keywordResult, llmResult);

return {
    json: {
        ...resolved,
        keyword_guess: keywordResult.family,
        keyword_confidence: keywordResult.confidence,
        llm_raw: llmResult,
        escalation_recommended: resolved.confidence < 0.70,
        clause_text: input.clause_text,
        heading: input.heading,
        rag_examples: input.rag_examples
    }
};
