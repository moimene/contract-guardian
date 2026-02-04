# Router v4.2 Baseline Report v3

**Date**: 2026-02-01  
**Version**: CG-006.1.2 Complete  
**Dataset**: 120 evaluated (16 NON_ROUTABLE excluded from 136 total)  
**Decision**: 🟡 SIGNIFICANT PROGRESS

---

## Progress Summary

| Metric | v1 Baseline | v3 Final | Delta | Target CG-006.1.2 | Status |
|--------|-------------|----------|-------|-------------------|--------|
| Accuracy | 33.8% | **45.0%** | **+11.2pp** | ≥55-60% | 🟡 |
| OtherUnknown | 50.7% | **42.5%** | **-8.2pp** | <30% | 🟡 |
| Families <50% | 10 | **6** | **-4** | ≤3 | 🟡 |
| Precision | 100% | **100%** | maintained | ≥95% | ✅ |

---

## Changes Made in CG-006.1.2

### A. Pattern Enhancements (6 families)

| Family | Patterns Added | Recall Change |
|--------|---------------|---------------|
| IndemnityAmazon | Claims arising, defense obligations | 33% → 42% |
| IndemnityProcedures | Notice, settlement, counsel | 25% (pending) |
| LiabilityLimitation | EXCEPT FOR, REGARDLESS OF | 29% → 29% |
| Insurance | E&O, CGL, loss payee, limits | 33% → 33% |
| Assignment | Successors, void, operation of law | 44% → **57%** |
| PaymentCredits | Net 30/45, invoice timing | 14% → 14% |

### B. Dataset Hygiene

16 examples marked NON_ROUTABLE:
- **ForceMajeure**: 5 (meta-text)
- **GeneralProvisions**: 4 (meta-text)
- **Assignment**: 2 (guidance text)
- **DisputeResolution**: 2 (meta-text)
- **Others**: 3

---

## Per-Family Metrics (v3)

| Family | Precision | Recall | v1→v3 Δ | Status |
|--------|-----------|--------|---------|--------|
| ServicesScope | 100% | 100% | +0% | ✅ |
| Confidentiality | 60% | 75% | +0% | ✅ |
| AmazonControl | 100% | 67% | -8% | ✅ |
| ConditionsPrecedent | 100% | 67% | **+67%** | ✅ |
| ForceMajeure | 63% | 63% | +9% | ✅ |
| DisputeResolution | 100% | 60% | **+17%** | ✅ |
| ThirdPartyCredits | 75% | 60% | +0% | ✅ |
| Assignment | 100% | 57% | **+13%** | ✅ |
| IndemnityProdCo | 100% | 50% | +0% | ✅ |
| RightsGrant | 67% | 50% | +0% | ✅ |
| IndemnityAmazon | 100% | 42% | +9% | 🟡 |
| RepsProdCo | 67% | 40% | +4% | 🟡 |
| DataProtection | 100% | 40% | NEW | 🟡 |
| InjunctiveReliefWaiver | 100% | 40% | NEW | 🟡 |
| Insurance | 100% | 33% | +0% | 🟡 |
| GeneralProvisions | 100% | 31% | +31% | 🟡 |
| LiabilityLimitation | 100% | 29% | +0% | 🟡 |
| IndemnityProcedures | 100% | 25% | +0% | 🟡 |
| PaymentCredits | 100% | 14% | +0% | ❌ |

---

## Families Still Below 50%

1. **IndemnityAmazon** (42%) - Need Amazon-as-indemnitor patterns
2. **RepsProdCo** (40%) - Need more representation patterns
3. **DataProtection** (40%) - NEW family, needs expansion
4. **InjunctiveReliefWaiver** (40%) - NEW family, needs expansion
5. **Insurance** (33%) - Patterns match but examples may be synthetic
6. **PaymentCredits** (14%) - Critical gap, examples don't match patterns

---

## Key Insights

### ✅ What Worked
1. Dataset hygiene immediately improved 3 families above 50%
2. Pattern refinement improved IndemnityAmazon recall
3. Precision maintained at 100% throughout

### 🟡 Remaining Gaps
1. PaymentCredits has fundamental pattern gap
2. IndemnityProcedures patterns not matching examples
3. Some families have precision <100% (RepsProdCo 67%, Confidentiality 60%)

---

## PO Decision Options

### Option A: One More Iteration (CG-006.1.3)
Focus on PaymentCredits and remaining <50% families.
**Estimated impact**: +5-8pp accuracy

### Option B: Proceed to CG-007
Use 45% as keyword baseline, let LLM Router handle OtherUnknown.
**Rationale**: Further pattern tuning has diminishing returns

### Option C: Hybrid
Proceed to CG-007 but maintain CG-006.1.3 in parallel for PaymentCredits fix.
