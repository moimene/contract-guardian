# CG-012-FIX: Deterministic Red Flag Detection Guardrail

## Version: v2.4
## Date: 2026-02-02
## Status: ✅ DEPLOYED AND VALIDATED

---

## 2026-02-02 Production Validation ✅

### Canary Test Results
| Metric | Expected | Actual |
|--------|----------|--------|
| `red_flags_found` | ≥3 | **10** |
| `unacceptable_patterns_found` | >0 | **11** |
| `risk_level` | RED | **RED** |
| `final_status` | UnacceptableDeviation | **UnacceptableDeviation** |
| `decision` | ESCALATE_HUMAN | **ESCALATE_HUMAN** |

### Root Cause of Initial Failure
The "Get Playbook Spec" node was using `$env.SUPABASE_SERVICE_KEY` which was **not configured** in n8n environment, causing the node to return `{}` instead of playbook data with `detection_patterns.red_flags`.

### Fix Applied
Replaced `{{ $env.SUPABASE_SERVICE_KEY }}` with hardcoded valid anon key.

### Current Valid API Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI5MDIsImV4cCI6MjA4Mzg4ODkwMn0.AYhrbvL5OZ5cdG5e5THLEiEAxOD7n8p3eif0sTrzWbg
```

## Problem Statement

The Paranoid Agent was failing to correctly identify critical red flags in indemnity clauses. The LLM was assigning incorrect severity levels (low/medium instead of high) to known red flag patterns, resulting in:
- `risk_level: YELLOW` instead of `RED`
- `final_status: Ambiguous` instead of `UnacceptableDeviation`
- Failed canary test with `canary_indemnity_redflag.json`

## Root Cause

1. **Missing Severity Override**: The `Parse Paranoid` node had deterministic injection for red flags but did NOT override severity on observations already returned by the LLM with wrong severity.

2. **Case-Sensitive Matching**: The `redFlagsFound` counter used exact case-sensitive matching (`redFlags.includes(o.pattern_matched)`), which failed when the LLM returned slightly different casing.

3. **Missing Status Override in Valuator**: The `Parse Valuator` node did not have deterministic logic to force `UnacceptableDeviation` when red flags were detected.

---

## Fixes Applied

### 1. Parse Paranoid Node (CG-012-FIX)

**File**: `W2_ClauseReview - Paranoid v2.1 (CG-012-FIX).json`

#### A. Severity Override for LLM Observations
```javascript
// CG-012-FIX: SEVERITY OVERRIDE FOR LLM OBSERVATIONS
// If LLM returned observations but assigned wrong severity to red flags,
// FORCE severity=high and possible_category=MatchesUnacceptable
let severityOverrideCount = 0;
for (const obs of paranoidOutput.observations) {
    const matchedFlag = matchesRedFlag(obs.evidence, redFlags);
    
    if (matchedFlag) {
        if (obs.severity !== 'high') {
            obs.severity = 'high';
            severityOverrideCount++;
        }
        obs.possible_category = 'MatchesUnacceptable';
        obs.pattern_matched = matchedFlag;
        obs.confidence = Math.max(obs.confidence || 0.7, 0.95);
        obs.reason = obs.reason + ` [GUARDRAIL: Red flag '${matchedFlag}' detected]`;
    }
}
```

#### B. Case-Insensitive Red Flag Counter
```javascript
// CG-012-FIX: Count red flags using case-insensitive partial matching
const redFlagsFound = obs.filter(o => {
    const patLower = String(o.pattern_matched || '').toLowerCase();
    return redFlags.some(rf => 
        patLower.includes(rf.toLowerCase()) || 
        rf.toLowerCase().includes(patLower)
    );
}).length;
```

#### C. Deterministic Risk Level
```javascript
// CG-012-FIX: DETERMINISTIC RISK LEVEL
let risk = 'GREEN';
if (redFlagsFound > 0 || unacceptableFound > 0 || mustHaveMissing > 0) {
    risk = 'RED';
} else if (obs.some(o => o.severity === 'high')) {
    risk = 'RED';
} else if (obs.some(o => o.severity === 'medium')) {
    risk = 'YELLOW';
}
```

### 2. Parse Valuator Node (CG-012-FIX)

#### Deterministic Status Override
```javascript
// CG-012-FIX: DETERMINISTIC STATUS OVERRIDE
// If ANY critical condition is true, FORCE UnacceptableDeviation
if (hasMatchesUnacceptable || hasMissingRequired || redFlagsFound > 0 || mustHaveMissing > 0 || unacceptableFound > 0) {
  valuatorOutput.final_status = 'UnacceptableDeviation';
  valuatorOutput.internal_comment = 
    `[CG-012-FIX] GUARDRAIL OVERRIDE: Status forced from '${originalStatus}' to 'UnacceptableDeviation'. ` +
    `Red flags: ${redFlagsFound}, Unacceptable patterns: ${unacceptableFound}, Missing anchors: ${mustHaveMissing}.`;
  valuatorOutput.needs_review = true;
  valuatorOutput.client_state = 'REQUIRED';
  valuatorOutput.escalation_recommended = true;
  valuatorOutput.escalation_reason = 'GUARDRAIL_OVERRIDE_RED_FLAG';
}
```

---

## Expected Behavior After Fix

For the canary test `canary_indemnity_redflag.json`:

| Metric | Before Fix | After Fix |
|--------|-----------|-----------|
| `observations_count` | Variable (LLM dependent) | ≥3 (deterministic) |
| `risk_level` | `YELLOW` or `GREEN` | `RED` |
| `final_status` | `Ambiguous` or `AcceptableDeviation` | `UnacceptableDeviation` |
| `red_flags_found` | 0-1 (unreliable) | 3 (deterministic) |
| Red flags detected | Inconsistent | `shall not exceed`, `to ProdCo's knowledge`, `consequential` |

---

## Verification Steps

1. **Import the new workflow** to n8n:
   - File: `W2_ClauseReview - Paranoid v2.1 (CG-012-FIX).json`
   - Activate it as the active version

2. **Run canary test**:
   ```bash
   curl -X POST https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag \
     -H "Content-Type: application/json" \
     -d @n8n/test_payloads/canary_indemnity_redflag.json
   ```

3. **Expected response**:
   ```json
   {
     "detected_family": "IndemnityProdCo",
     "client_state": "REQUIRED",
     "decision": "ESCALATE_HUMAN",
     "safety_pass": true,
     "_internal": {
       "observations": {
         "observations": [...],  // length >= 3
         "summary": {
           "red_flags_found": 3,
           "unacceptable_patterns_found": 3
         },
         "risk_level": "RED"
       },
       "final_status": "UnacceptableDeviation"
     }
   }
   ```

---

## Files Modified

| File | Description |
|------|-------------|
| `W2_ClauseReview - Paranoid v2.1 (CG-012-FIX).json` | New workflow with CG-012-FIX applied |
| `W2_ClauseReview - Paranoid v2.0 (CG-012).json` | Original (kept for reference) |

---

## Rollback Instructions

If issues arise, revert to the previous version:
1. Deactivate `W2_ClauseReview - Paranoid v2.1 (CG-012-FIX)`
2. Activate `W2_ClauseReview - Paranoid v2.0 (CG-012)`
