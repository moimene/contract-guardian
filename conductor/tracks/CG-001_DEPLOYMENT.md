# 🚀 CG-001 Deployment Instructions

**Track**: CG-001 Taxonomy Single Source of Truth  
**Status**: Ready for Deployment  
**Date**: 2026-02-01

---

## Files Updated

| File | Changes | Location |
|------|---------|----------|
| `keyword_router_v4.1.js` | Upgraded to v4.2 with CANONICAL_FAMILIES (28 families) + DataPrivacy, Publicity, GoverningLaw patterns | `/n8n/` |
| `parse_router_v4.2.js` | NEW - Parse Router with synced validFamilies | `/n8n/` |

---

## Deployment Steps

### 1. Update Keyword Router in W2

1. Open n8n workflow **W2_ClauseReview - RAG Enhanced v4.1**
2. Find node **"Keyword Router"** (Code node)
3. Replace code with contents of `/n8n/keyword_router_v4.1.js`
4. Save node

### 2. Update Parse Router in W2

1. In same workflow, find node **"Parse Router"** (Code node)
2. Replace code with contents of `/n8n/parse_router_v4.2.js`
3. Save node

### 3. Activate Workflow

1. Save workflow
2. If not active, activate it

---

## Verification Checklist

After deployment, run these tests:

- [ ] **Force Majeure clause** → Should route to `ForceMajeure` (not OtherUnknown)
- [ ] **GDPR/Privacy clause** → Should route to `DataPrivacy`
- [ ] **Press Release clause** → Should route to `Publicity`
- [ ] **Standard Indemnity clause** → Should route to `IndemnityProdCo` or `IndemnityAmazon`

---

## Rollback

If issues occur, revert to previous version of W2 workflow from n8n version history.
