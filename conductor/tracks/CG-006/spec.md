# CG-006: Router Evaluation Harness

**Priority**: P1  
**Status**: 🟡 IN_PROGRESS  
**Depends on**: CG-005 ✅

---

## Objective

Create a systematic evaluation framework to measure Router v4.2 accuracy per family, enabling data-driven tuning in CG-007.

## Scope

- **Contract Types**: Amazon PSA/DSA only
- **Families**: 28 canonical families from CANONICAL_FAMILIES
- **Mode**: Evaluation only (no tuning yet)

---

## Evaluation Dataset

### Source 1: Existing clause_reviews
- 38 reviews with detected_family
- Ground truth: human-validated `client_state`

### Source 2: Playbook Specs (34 files)
- Golden examples per family
- Redlines and acceptance patterns

### Source 3: Synthetic Generation
- Extract clauses from sample contracts
- Manual annotation of expected family

---

## Metrics

### Primary KPIs
| Metric | Formula | Target |
|--------|---------|--------|
| **Overall Accuracy** | correct / total | > 85% |
| **Family Precision** | TP / (TP + FP) per family | > 80% |
| **Family Recall** | TP / (TP + FN) per family | > 80% |
| **OtherUnknown Rate** | OtherUnknown / total | < 10% |

### Secondary KPIs
- Confidence correlation with accuracy
- Multi-family detection rate
- LLM fallback rate

---

## Deliverables

1. **Evaluation Script** (`evaluate_router.js`)
   - Run against test dataset
   - Output confusion matrix
   - Calculate per-family metrics

2. **Test Dataset** (`router_eval_dataset.json`)
   - 100+ annotated clauses
   - Coverage of all 28 families

3. **Baseline Report** (`router_baseline_report.md`)
   - Current accuracy vs CG-005 baseline
   - Family-level breakdown
   - GO/NO-GO for CG-007

---

## Success Criteria (GO for CG-007)

| Criterion | Threshold |
|-----------|-----------|
| Overall accuracy | ≥ 70% |
| No family < 50% recall | Must pass |
| OtherUnknown < 15% | Must pass |
| Confidence correlation | r > 0.5 |

---

## Implementation Plan

### Phase 1: Dataset Creation
1. Extract golden examples from playbook specs
2. Annotate with expected family (ground truth)
3. Format as evaluation dataset

### Phase 2: Harness Development
1. Create evaluation script
2. Run router against dataset
3. Generate confusion matrix

### Phase 3: Baseline Report
1. Calculate all metrics
2. Compare vs CG-005 baseline
3. PO review and GO/NO-GO decision

---

## Out of Scope

- Prompt tuning (CG-007)
- Nueva Planta contracts
- UI changes
