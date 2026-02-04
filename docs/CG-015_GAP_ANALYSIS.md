# CG-015: Análisis de Gaps del Router v4.2

**Fecha**: 3 febrero 2026  
**Dataset**: 120 ejemplos (16 NON_ROUTABLE excluidos)  
**Accuracy actual**: 45%

---

## 📊 Resumen de Errores

| Tipo de Error | Count | % del Total |
|---------------|-------|-------------|
| **OtherUnknown** (sin patrones) | 51 | 77% |
| **Misclassification** (familia incorrecta) | 15 | 23% |
| **Total errores** | 66 | 100% |

---

## 🔴 Top 6 Familias Problemáticas

### 1. PaymentCredits (14% recall) ❌ CRÍTICO

| Error ID | Predicted | Tipo |
|----------|-----------|------|
| PaymentCredits-STD-001 | OtherUnknown | Sin patrones |
| PaymentCredits-GUIDE-001 | TerminationRights | Misclass |
| PaymentCredits-AMZPOS-001 | OtherUnknown | Sin patrones |
| PaymentCredits-UNACC-002 | ThirdPartyCredits | Misclass |
| PaymentCredits-UNACC-003 | OtherUnknown | Sin patrones |
| PaymentCredits-TRIG-002 | OtherUnknown | Sin patrones |

**🎯 Patrones faltantes sugeridos**:
- Frases específicas de Amazon PSA: ¿cómo expresan términos de pago?
- Variantes de "net 30/45/60"
- Milestone payments específicos

---

### 2. IndemnityProcedures (25% recall)

| Error ID | Predicted | Tipo |
|----------|-----------|------|
| IndemnityProcedures-ACC-001 | OtherUnknown | Sin patrones |
| IndemnityProcedures-GUIDE-001 | OtherUnknown | Sin patrones |
| IndemnityProcedures-GUIDE-002 | OtherUnknown | Sin patrones |
| IndemnityProcedures-AMZPOS-002 | OtherUnknown | Sin patrones |
| IndemnityProcedures-TRIG-001 | OtherUnknown | Sin patrones |
| IndemnityProcedures-TRIG-002 | OtherUnknown | Sin patrones |

**🎯 Patrones faltantes sugeridos**:
- "prompt notice", "assume the defense", "settlement consent"
- Control of defense language

---

### 3. LiabilityLimitation (29% recall)

| Error ID | Predicted | Tipo |
|----------|-----------|------|
| LiabilityLimitation-GUIDE-002 | OtherUnknown | Sin patrones |
| LiabilityLimitation-UNACC-001 | OtherUnknown | Sin patrones |
| LiabilityLimitation-UNACC-003 | OtherUnknown | Sin patrones |
| LiabilityLimitation-TRIG-001 | OtherUnknown | Sin patrones |
| LiabilityLimitation-TRIG-002 | OtherUnknown | Sin patrones |

**🎯 Problema**: Patrones ALL CAPS no matchean texto normalizado

---

### 4. IndemnityAmazon (42% recall)

| Error ID | Predicted | Tipo |
|----------|-----------|------|
| IndemnityAmazon-GUIDE-001 | OtherUnknown | Sin patrones |
| IndemnityAmazon-ACC-002 | Publicity | Misclass |
| IndemnityAmazon-GUIDE-002 | Publicity | Misclass |
| IndemnityAmazon-ACC-003 | OtherUnknown | Sin patrones |
| IndemnityAmazon-GUIDE-003 | OtherUnknown | Sin patrones |
| IndemnityAmazon-ACC-004 | ForceMajeure | Misclass |
| IndemnityAmazon-GUIDE-004 | ForceMajeure | Misclass |

**🎯 Problema clave**: Confusión con IndemnityProdCo (¿quién indemnifica a quién?)

---

### 5. Insurance (33% recall)

| Error ID | Predicted | Tipo |
|----------|-----------|------|
| Insurance-STD-001 | RepsProdCo | Misclass |
| Insurance-TRIG-001 | OtherUnknown | Sin patrones |

---

### 6. GeneralProvisions (31% recall)

9 errores → 8 OtherUnknown + 1 Misclass (RepsProdCo)

---

## ❓ Preguntas para Equipo Legal

### PaymentCredits
1. ¿Qué frases usa Amazon para términos de pago en PSAs?
2. ¿Existen variantes regionales (US vs EU)?

### Indemnity*
3. ¿Cómo distinguir cuándo Amazon indemnifica vs. cuándo ProdCo indemnifica?
4. ¿Son los ejemplos sintéticos representativos del lenguaje real?

### LiabilityLimitation
5. ¿El texto de liability caps en contratos reales es ALL CAPS o mixed case?
6. ¿Qué patterns de "exclusion of damages" son más comunes?

### Insurance
7. ¿Se listan pólizas específicas (E&O, CGL) o solo "appropriate insurance"?

---

## 📋 Próximos Pasos

1. **Sesión con Legal** (2h) - Revisar este documento y aportar ejemplos reales
2. **Actualizar patrones** en `keyword_router_v4.2.js`
3. **Re-ejecutar test suite**
