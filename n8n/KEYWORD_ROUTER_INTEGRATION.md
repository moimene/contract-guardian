# W2 Workflow Update Instructions - Keyword Router Integration

## Overview

This document provides instructions for integrating the Keyword Router into the W2_ClauseReview_RAG workflow in n8n Cloud.

## Changes Required

### Step 1: Add Keyword Router Code Node

After "Parse Input" and BEFORE "Router Agent":

1. Add a new **Code** node named "Keyword Router"
2. Position: Between Parse Input (5392, -15456) and Router Agent (5616, -15456)
3. Paste the following code:

```javascript
/**
 * KEYWORD ROUTER - Deterministic pre-LLM classification
 * Runs BEFORE the LLM Router to catch obvious patterns
 */

const KEYWORD_PATTERNS = {
  RightsGrant: {
    patterns: [
      /work[s]?\s+made\s+for\s+hire/i,
      /irrevocably\s+assign/i,
      /Amazon\s+shall\s+(own|be\s+the\s+author|be\s+the\s+owner)/i,
      /all\s+right[s]?,?\s+title,?\s+(and|&)\s+interest/i,
      /throughout\s+the\s+universe/i,
      /in\s+perpetuity/i,
      /shall\s+be\s+owned\s+by\s+Amazon/i,
      /vest\s+in\s+Amazon/i,
      /results\s+and\s+proceeds/i
    ],
    min_matches: 2,
    confidence: 0.92
  },
  
  RepsProdCo: {
    patterns: [
      /ProdCo\s+represents?\s*(,?\s*warrants?)?(\s+and\s+agrees)?/i,
      /REPRESENTATIONS?\/?WARRANTIES?/i,
      /will\s+not\s+infringe/i,
      /free\s+and\s+clear/i,
      /full\s+right,?\s+power,?\s+(and|&)\s+authority/i
    ],
    min_matches: 1,
    confidence: 0.88,
    negative: [/Amazon\s+represents/i]
  },
  
  IndemnityProdCo: {
    patterns: [
      /ProdCo\s+(shall|will|agrees?\s+to)\s+indemnify/i,
      /indemnify,?\s+defend,?\s+(and\s+)?hold\s+harmless\s+Amazon/i,
      /Amazon\s+Indemnitees/i
    ],
    min_matches: 1,
    confidence: 0.92,
    negative: [/Amazon\s+(shall|will)\s+indemnify/i]
  },
  
  IndemnityAmazon: {
    patterns: [
      /Amazon\s+(shall|will)\s+indemnify/i,
      /Amazon\s+agrees?\s+to\s+indemnify/i,
      /indemnify\s+ProdCo/i
    ],
    min_matches: 1,
    confidence: 0.92
  },
  
  LiabilityLimitation: {
    patterns: [
      /IN\s+NO\s+EVENT\s+SHALL/i,
      /CONSEQUENTIAL\s+DAMAGES/i,
      /INDIRECT\s+DAMAGES/i,
      /TOTAL\s+AGGREGATE\s+LIABILITY/i,
      /SHALL\s+NOT\s+EXCEED/i
    ],
    min_matches: 1,
    confidence: 0.92
  },
  
  PaymentCredits: {
    patterns: [
      /production\s+fee/i,
      /Amazon\s+(shall|will)\s+pay/i,
      /in\s+full\s+consideration/i,
      /payment\s+schedule/i,
      /\bFEES:\s/i
    ],
    min_matches: 1,
    confidence: 0.85
  },
  
  ServicesScope: {
    patterns: [
      /ProdCo\s+will\s+render\s+services/i,
      /render\s+all\s+production\s+services/i,
      /produce\s+the\s+Program/i,
      /\bSERVICES:\s/i
    ],
    min_matches: 1,
    confidence: 0.85
  },
  
  Confidentiality: {
    patterns: [
      /maintain\s+in\s+strict\s+confidence/i,
      /confidential\s+information/i,
      /\bDATA\s+PROTECTION\b/i,
      /personal\s+data/i,
      /\bGDPR\b/i
    ],
    min_matches: 1,
    confidence: 0.82
  },
  
  DisputeResolution: {
    patterns: [
      /GOVERNING\s+LAW/i,
      /JURISDICTION/i,
      /binding\s+arbitration/i,
      /governed\s+by\s+the\s+laws\s+of/i
    ],
    min_matches: 2,
    confidence: 0.88
  },
  
  TerminationRights: {
    patterns: [
      /may\s+terminate/i,
      /termination\s+for\s+(cause|convenience)/i,
      /right\s+to\s+terminate/i
    ],
    min_matches: 2,
    confidence: 0.85
  },
  
  SurvivalRemedies: {
    patterns: [
      /shall\s+survive\s+termination/i,
      /provisions?\s+shall\s+survive/i,
      /by\s+its\s+nature\s+should\s+survive/i
    ],
    min_matches: 1,
    confidence: 0.88
  }
};

// Get input
const prevData = $('Parse Input').first().json;
const clauseText = prevData.clause_text || '';

// Run keyword matching
let keywordResult = { routed: false, family: null, confidence: 0, method: 'NEEDS_LLM' };

for (const [family, config] of Object.entries(KEYWORD_PATTERNS)) {
  // Check negative patterns
  if (config.negative) {
    const hasNegative = config.negative.some(p => p.test(clauseText));
    if (hasNegative) continue;
  }
  
  // Count matches
  const matchedPatterns = config.patterns.filter(p => p.test(clauseText));
  const matchCount = matchedPatterns.length;
  
  if (matchCount >= config.min_matches) {
    const matchRatio = matchCount / config.patterns.length;
    const adjustedConfidence = config.confidence * (0.7 + 0.3 * matchRatio);
    
    if (adjustedConfidence > (keywordResult.confidence || 0)) {
      keywordResult = {
        routed: true,
        family: family,
        confidence: Math.round(adjustedConfidence * 100) / 100,
        matched_patterns: matchCount,
        method: 'KEYWORD'
      };
    }
  }
}

// Return with keyword routing result
return [{
  json: {
    ...prevData,
    _keyword_router: keywordResult,
    skip_llm_router: keywordResult.routed && keywordResult.confidence >= 0.75
  }
}];
```

### Step 2: Add Switch Node for Routing Decision

After "Keyword Router":

1. Add a **Switch** node named "Route Decision"
2. Configure two outputs:
   - **Output 1 (Keyword Match)**: When `{{ $json.skip_llm_router }}` equals `true`
   - **Output 2 (Need LLM)**: Default/fallback

### Step 3: Wire the Nodes

```
Parse Input → Keyword Router → Route Decision
                                    ├─→ [Keyword Match] → Skip to "Parse Router" (with modified data)
                                    └─→ [Need LLM] → Router Agent → Parse Router
```

### Step 4: Modify "Parse Router" Node

Update the code to accept both keyword and LLM routing results:

```javascript
const prevData = $('Keyword Router').first().json;
const keywordRouter = prevData._keyword_router;

let routerOutput = { route: 'OtherUnknown', confidence: 0, reasoning: '' };

// If keyword router succeeded, use that
if (keywordRouter?.routed && keywordRouter.confidence >= 0.75) {
  routerOutput = {
    route: keywordRouter.family,
    confidence: keywordRouter.confidence,
    reasoning: 'Keyword pattern match: ' + keywordRouter.method
  };
} else {
  // Parse LLM result if present
  try {
    const llmData = $('Router Agent').first().json;
    const content = llmData.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    routerOutput = {
      route: parsed.route || 'OtherUnknown',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM classification'
    };
  } catch (e) {
    // Fallback if no valid LLM response
    routerOutput.route = keywordRouter?.family || 'OtherUnknown';
    routerOutput.confidence = keywordRouter?.confidence || 0;
    routerOutput.reasoning = 'Fallback to keyword or unknown';
  }
}

// ... rest of normalization logic ...
```

---

## Quick Integration Option

For a faster integration, simply replace the "Router Agent" LLM prompt to include keyword pre-check logic in the system prompt. The LLM is already set to temperature: 0 which ensures deterministic output.

The current workflow in n8n Cloud should be updated by:

1. Importing the `keyword_router.js` code as a Code node
2. Adding a Switch node to bypass LLM when confidence > 0.75
3. Merging the results before "Parse Router"

---

## Testing

After integration, test with:
```bash
curl -s -X POST "https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag" \
  -H "Content-Type: application/json" \
  -d '{
    "clause_text": "RIGHTS: All rights in the Program shall be owned by Amazon exclusively throughout the universe in perpetuity. The Materials constitute works made for hire.",
    "clause_instance_id": "test-keyword-001",
    "run_id": "test-001",
    "playbook_id": "PB_DSA_V1"
  }' | jq '.detected_family, ._internal.routing_method'
```

Expected: `"RightsGrant"` with `"KEYWORD"` method
