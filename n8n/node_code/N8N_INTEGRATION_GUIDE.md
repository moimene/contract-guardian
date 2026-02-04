# Paranoid Agent v3.0 — n8n Integration Guide

## Overview

This guide explains how to update the W2_ClauseReview workflow with the new v3.0 node code. The changes implement:

- **4 Operating Modes**: FULL_PLAYBOOK, LIMITED_PLAYBOOK, RAG_ONLY, BLIND
- **Graduated Severity**: CRITICAL (10), MAJOR (7), MINOR (3)
- **Industry Carve-outs**: Standard patterns accepted in specific industries
- **16-Rule Decision Engine**: Deterministic routing with RAG-supported approvals

---

## Files Created

All node code files are located in: `/n8n/node_code/`

| File | Node to Update | Description |
|------|----------------|-------------|
| `Build_Family_Prompt_v3.0.js` | Build Family Prompt | v3.0 prompt with graduated severity |
| `Parse_Paranoid_v3.0.js` | Parse Paranoid | Parser for v3.0 output format |
| `Decision_Engine_v3.0.js` | Decision Engine | 16-rule deterministic gating |

---

## Update Instructions

### Step 1: Open the Workflow

1. Open n8n
2. Navigate to **W2_ClauseReview - CG010 v3.0 (Router v5.1)**
3. Make a backup copy before editing

### Step 2: Update "Build Family Prompt" Node

1. Click on the **Build Family Prompt** node
2. Switch to the **Code** tab
3. Delete all existing code
4. Copy the entire contents of `Build_Family_Prompt_v3.0.js`
5. Paste into the node
6. Click **Save**

### Step 3: Update "Parse Paranoid" Node

1. Click on the **Parse Paranoid** node
2. Switch to the **Code** tab
3. Delete all existing code
4. Copy the entire contents of `Parse_Paranoid_v3.0.js`
5. Paste into the node
6. Click **Save**

### Step 4: Update "Build Result" Node (CRITICAL FIX)

> [!CAUTION]
> This fix resolves the error: `Cannot read properties of undefined (reading 'decision')`

**Source File:** `Build_Result_v3.0.js`
**Target Node:** `Build Result`

Replace the entire code content with v3.0 code. This version:
- Uses robust fallback chain for getting previous node data
- Works with both Decision Engine v2 and v3.0
- Handles missing or undefined properties gracefully with `safeGet()` helper

---

### Step 5: Update "Decision Engine" Node

1. Click on the **Decision Engine** node
2. Switch to the **Code** tab
3. Delete all existing code
4. Copy the entire contents of `Decision_Engine_v3.0.js`
5. Paste into the node
6. Click **Save**

### Step 5: Verify Connections

Ensure the data flow remains:
```
Enrich Policy → Build Family Prompt → [LLM Call] → Parse Paranoid → Decision Engine → Router
```

---

## Database Changes Applied

The following database migration has already been executed:

```sql
ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS critical_red_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS major_red_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS minor_red_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE playbook_specs ADD COLUMN IF NOT EXISTS industry_carveouts JSONB DEFAULT '[]'::jsonb;
```

Existing `detection_patterns.red_flags` were migrated to `major_red_flags` (conservative default).

Industry carve-outs were added for:
- **Confidentiality** (Entertainment industry)
- **ForceMajeure** (Entertainment industry)
- **Assignment** (Technology industry)

---

## Testing After Update

Run these test cases to verify the changes:

### T01: Force Majeure with Industry Carve-out
**Input**: Entertainment clause with "talent unavailability"
**Expected**: APPROVE_WITH_NOTES (not ESCALATE), industry_carveout = true

### T02: Confidentiality Standard
**Input**: Standard NDA language without red flags
**Expected**: AUTO_PASS, risk_level = GREEN

### T03: CRITICAL Red Flag
**Input**: Clause with "waive all claims"
**Expected**: ESCALATE_HUMAN, severity_class = CRITICAL

### T04: RAG-Only Mode
**Input**: Unknown family with similar acceptable example in RAG
**Expected**: If similarity >= 0.92 → AUTO_PASS with rag_supported = true

---

## Expected Improvements

| Metric | Before (v2.1) | Target (v3.0) |
|--------|---------------|---------------|
| Escalation Rate | ~67% | 35-40% |
| False Positives | High | Reduced by 50% |
| Industry Handling | None | Carve-outs applied |
| RAG Utilization | Passive | Active approval |

---

## Rollback

To rollback, restore the backup workflow copy. The database columns are additive and won't affect v2.1 behavior.

---

## Contact

For issues with this integration, refer to:
- `/docs/Legal_Review_RAG_Tests.md` — Full v3.0 specification
- `/docs/v3_architecture.md` — Technical architecture details
