# CG-017: Router v5.0 - Revisión Equipo Legal

**Fecha**: 3 Febrero 2026  
**Versión Router**: v5.0  
**Accuracy Actual**: 93.8%  
**Objetivo**: Reforzar patrones de clasificación con input del equipo legal

---

## 1. Resumen Ejecutivo

El Router v5.0 clasifica cláusulas contractuales en 30 familias usando patrones de texto. 
Actualmente alcanza **93.8% de accuracy** sin depender de LLM.

**Solicitamos al equipo legal** que revise y aporte patrones de texto adicionales para mejorar la clasificación.

---

## 2. Estado Actual por Familia

### ✅ Familias con Alta Precisión (>90%)

| Familia | Accuracy | Patrones Actuales |
|---------|----------|-------------------|
| ForceMajeure | 99% | `force majeure`, `act of god`, `pandemic`, `war`, `government action` |
| Confidentiality | 96% | `confidential`, `non-disclosure`, `proprietary information`, `trade secrets` |
| IndemnityProdCo | 94% | `prodco shall indemnify`, `amazon indemnitees`, `hold harmless` |
| KeyPersons | 94% | `key person`, `essential element`, `key talent`, `creative lead` |
| ServicesScope | 93% | `production services`, `services include`, `scope of work`, `deliverables` |

### ⚠️ Familias con Precisión Media (80-90%)

| Familia | Accuracy | Posibles Mejoras |
|---------|----------|------------------|
| PaymentCredits | 88% | ¿Más patrones de milestone payments? |
| Insurance | ~85% | ¿Tipos de pólizas específicas de producción? |
| LiabilityLimitation | ~85% | ¿Fraseo de caps de responsabilidad? |

### ❓ Familias que Necesitan Revisión

| Familia | Problema Detectado |
|---------|-------------------|
| RepsProdCo vs RepsAmazon | Confusión en dirección (quién hace la representación) |
| TerminationRights vs TerminationConsequences | Solapamiento en patrones |
| RightsGrant vs RightsReversion | Necesitan más contexto direccional |

---

## 3. Preguntas Específicas para el Equipo Legal

### 3.1 PaymentCredits
**Contexto**: Cláusulas de pago/compensación a veces se confunden con otras familias.

> ¿Qué frases específicas de Amazon indican términos de pago?
> - Ejemplo actual: `"net 30"`, `"upon delivery"`, `"production fee"`
> - ¿Hay frases como `"Amazon shall pay within..."` específicas?

### 3.2 Insurance
**Contexto**: Detectamos E&O, CGL, Workers Comp pero podemos estar perdiendo tipos específicos.

> ¿Qué tipos de seguros son obligatorios en contratos Amazon PSA/DSA?
> - ¿Producer's Liability?
> - ¿Completion Bond?
> - ¿Umbrella Coverage?

### 3.3 IndemnityProdCo vs IndemnityAmazon
**Contexto**: El sistema distingue por dirección (`ProdCo shall` vs `Amazon shall`).

> ¿Hay frases que indiquen indemnización recíproca?
> - ¿Cómo se expresa `"each party shall indemnify..."`?
> - ¿Hay variaciones de `"mutual indemnification"`?

### 3.4 Términos de Terminación
**Contexto**: TerminationRights (derecho a terminar) vs TerminationConsequences (qué pasa después).

> ¿Qué palabras clave distinguen claramente estos conceptos?
> - Derechos: `"may terminate"`, `"right to terminate"`, `"upon breach"`
> - Consecuencias: `"upon termination"`, `"surviving obligations"`, `"wind-down"`

### 3.5 Cláusulas "OtherUnknown"
**Contexto**: Algunas cláusulas no encajan en ninguna familia definida.

> ¿Hay tipos de cláusulas que deberían tener su propia familia?
> - ¿Cláusulas de `AI/ML usage`?
> - ¿`Moral Rights waivers`?
> - ¿`Creative Control`?

---

## 4. Formato de Respuesta Solicitado

Para cada familia donde tengan input, por favor proporcionen:

```
### [Nombre de Familia]

**Patrones a AÑADIR** (frases que indican esta familia):
- "frase exacta 1"
- "frase exacta 2"

**Patrones a EXCLUIR** (frases que NO deben clasificarse aquí):
- "frase que pertenece a otra familia"

**Notas adicionales**:
- Contexto relevante
```

### Ejemplo de Respuesta:

```
### Insurance

**Patrones a AÑADIR**:
- "producer's errors and omissions"
- "production insurance package"
- "completion guarantee"
- "media liability coverage"

**Patrones a EXCLUIR**:
- "insurance proceeds" (esto es PaymentCredits)
- "insured party" (esto puede ser otras familias)

**Notas adicionales**:
- La cobertura E&O es crítica para PSA/DSA
- Workers Comp solo aplica en jurisdicciones específicas
```

---

## 5. Próximos Pasos

1. **Equipo Legal**: Revisar este documento y proporcionar input
2. **Equipo Técnico**: Incorporar patrones al Router v5.1
3. **Validación**: Ejecutar batch test con contratos reales
4. **Deploy**: Actualizar Router en producción

**Deadline sugerido**: 1 semana desde recepción

---

## Contacto

Para dudas sobre este documento o el sistema de clasificación:
- **Sistema**: Contract Guardian v6.2
- **Workflow**: W2_ClauseReview (Paranoid v2.5)
- **Documentación técnica**: `/docs/CG-015_GAP_ANALYSIS.md`
