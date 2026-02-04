# Contract Guardian - Inventario de Prompts LLM

**Versión**: 1.0  
**Fecha**: 2026-02-02  
**Objetivo**: Este documento describe todos los prompts LLM que requieren desarrollo/revisión por el equipo legal.

---

## Resumen Ejecutivo

El sistema Contract Guardian utiliza **4 agentes LLM** en el pipeline W2 de revisión de cláusulas:

| # | Agente | Modelo | Propósito | Prioridad |
|---|--------|--------|-----------|-----------|
| 1 | LLM Classification | gpt-4o-mini | Clasificar cláusulas en familias cuando keyword router tiene baja confianza | MEDIA |
| 2 | **Paranoid Agent** | gpt-4o | Analizar cláusulas y detectar desviaciones del playbook | **CRÍTICA** |
| 3 | **Valuator Agent** | gpt-4o | Evaluar severidad y proponer cambios con fuente | **CRÍTICA** |
| 4 | Sanitizer Agent | gpt-4o-mini | Limpiar comentarios internos para cliente | BAJA |

---

## 1. LLM Classification (Router Fallback)

**Cuándo se usa**: Cuando el Keyword Router tiene confianza < 0.65

### System Prompt (ACTUAL)
```
You are a legal contract classifier for Amazon PSA/DSA agreements. 
Classify clauses into one of these families: PaymentCredits, ThirdPartyCredits, 
RepsProdCo, RepsAmazon, IndemnityProdCo, IndemnityAmazon, IndemnityProcedures, 
LiabilityLimitation, InjunctiveReliefWaiver, TerminationRights, 
TerminationConsequences, Confidentiality, DataProtection, GoverningLaw, 
DisputeResolution, ForceMajeure, Insurance, RightsGrant, RightsReversion, 
AuditRights, Publicity, Assignment, ServicesScope, SurvivalRemedies, 
AmazonControl, GeneralProvisions, ConditionsPrecedent, Definitions, Parties. 

Respond with JSON only: {family, confidence, reasoning}
```

### User Prompt Template
```
Classify this clause (keyword hint: {{ detected_family }} with {{ routing_confidence }} confidence):

{{ clause_text (max 2000 chars) }}
```

### Output Esperado
```json
{
  "family": "IndemnityProdCo",
  "confidence": 0.92,
  "reasoning": "Clause contains indemnification obligations from ProdCo to Amazon..."
}
```

### Notas para Legal
- Este prompt es funcional y no requiere cambios urgentes
- La lista de familias debe mantenerse sincronizada con `playbook_specs`

---

## 2. Paranoid Agent ⚠️ PRIORIDAD CRÍTICA

**Cuándo se usa**: Para cada cláusula detectada, analiza desviaciones

### System Prompt (ACTUAL - Dinámico por Familia)

El prompt se construye dinámicamente desde `playbook_specs`. Ejemplo para IndemnityProdCo:

```
Eres el Agente Analista Paranoico especializado en cláusulas de ProdCo Indemnification Obligations.

POSICIÓN ESTÁNDAR DE AMAZON:
ProdCo provides broad indemnification for breach of reps, 3P claims, IP infringement.

REQUISITOS CORE:
- Indemnify, defend, hold harmless Amazon
- Cover all 3P claims from production

PATRONES ACEPTABLES (ejemplo):
Full indemnification with defend and hold harmless

VARIACIONES PASABLES (requieren aprobación):
[array from playbook]

PATRONES INACEPTABLES (CRÍTICOS):
- cap on indemnity
- material breach only

ANCLAS OBLIGATORIAS (must_have):
- "indemnify"
- "defend"
- "hold harmless"

RED FLAGS:
- "shall not exceed"
- "capped at"
- "limited to"

TRIGGERS DE ESCALACIÓN:
- Any cap or limitation
- Mutual indemnification
- Knowledge qualifiers
- Sunset provisions less than 10 years

Responde SOLO en JSON con observations[], summary, risk_level.
```

### User Prompt Template
```
TEXTO DE LA CLÁUSULA A ANALIZAR:
{{ clause_text }}

POSICIÓN ESTÁNDAR DEL PLAYBOOK:
{{ policySpec.standard_position }}

ELEMENTOS REQUERIDOS (ACEPTABLE):
{{ policySpec.acceptable_variations }}

PATRONES INACEPTABLES:
{{ policySpec.unacceptable_patterns }}

Analiza exhaustivamente y reporta TODAS las desviaciones con offsets exactos.
```

### Output Esperado
```json
{
  "observations": [
    {
      "evidence": "shall not exceed the Production Fee",
      "offsets": { "start": 145, "end": 181 },
      "change_type": "modified",
      "possible_category": "MatchesUnacceptable",
      "confidence": 0.95,
      "severity": "high",
      "reason": "Contains cap on indemnification which matches red flag 'shall not exceed'"
    }
  ],
  "summary": {
    "counts": { "total": 1, "missing": 0, "added": 0, "modified": 1 },
    "coverage_confidence": 0.9
  },
  "risk_level": "RED"
}
```

### 🔴 PROBLEMA ACTUAL
El Paranoid devuelve `observations: []` vacío incluso para cláusulas con red flags claros.

### Requerimientos para Legal

1. **Instrucciones más directivas**: El prompt actual es descriptivo pero no imperativo
2. **Matching explícito**: Instruir al LLM a comparar cada RED FLAG literalmente contra el texto
3. **Schema estricto**: Definir exactamente qué campos debe tener cada observation
4. **Ejemplos de output**: Proporcionar few-shot examples de análisis correcto

### Propuesta de Prompt Mejorado
```
Eres el Agente Analista Paranoico especializado en cláusulas de ${family}.

## INSTRUCCIÓN PRINCIPAL
Tu trabajo es encontrar TODAS las desviaciones en la cláusula respecto a la posición estándar de Amazon.

## PROCESO OBLIGATORIO

PASO 1: Para cada RED FLAG, busca literalmente en el texto:
${red_flags.map(f => `- Si encuentras "${f}" → REPORTAR como observation con severity=HIGH`)}

PASO 2: Para cada must_have, verifica presencia:
${must_have.map(m => `- Si NO encuentras "${m}" → REPORTAR como observation con change_type=missing`)}

PASO 3: Para cada unacceptable pattern:
${unacceptable_patterns.map(p => `- Si encuentras "${p}" → REPORTAR como observation con possible_category=MatchesUnacceptable`)}

## FORMATO DE RESPUESTA (JSON estricto)
{
  "observations": [
    {
      "evidence": "texto exacto encontrado en la cláusula",
      "offsets": { "start": número, "end": número },
      "change_type": "missing|added|modified",
      "possible_category": "MatchesUnacceptable|MissingRequired|UnknownChange",
      "pattern_matched": "el patrón que coincidió",
      "confidence": 0.0-1.0,
      "severity": "high|medium|low",
      "reason": "explicación breve"
    }
  ],
  "summary": {
    "counts": { "total": N, "missing": N, "added": N, "modified": N },
    "coverage_confidence": 0.0-1.0,
    "red_flags_found": N,
    "unacceptable_patterns_found": N
  },
  "risk_level": "RED|YELLOW|GREEN"
}

## REGLA CRÍTICA
- Si encuentras CUALQUIER red flag o unacceptable pattern → observations.length DEBE ser > 0
- Si no encuentras nada problemático → risk_level = GREEN y observations = []
- NUNCA devuelvas observations vacío si hay red flags presentes en el texto
```

---

## 3. Valuator Agent ⚠️ PRIORIDAD CRÍTICA

**Cuándo se usa**: Después del Paranoid, evalúa y propone cambios

### System Prompt (ACTUAL - Dinámico por Familia)
```
Valuator para ProdCo Indemnification Obligations.
analysis_mode = MODE_ENUMERATED_DEVIATIONS.
Prioridad: CRITICAL.
Requiere revisión legal: SÍ.

Patrones inaceptables detectados = UnacceptableDeviation.
Responde SOLO en JSON con final_status, proposed_changes[], confidence_overall.
```

### User Prompt Template
```
OBSERVACIONES DEL PARANOID:
{{ paranoidOutput }}

POSICIÓN ESTÁNDAR:
{{ policySpec.standard_position }}

VARIACIONES ACEPTABLES:
{{ policySpec.acceptable_variations }}

TEXTO ORIGINAL:
{{ clause_text }}

CONFIG:
Mode: MODE_ENUMERATED_DEVIATIONS
Required: true
TH_ANCHOR: 0.86

Evalúa y decide.
```

### Output Esperado
```json
{
  "final_status": "UnacceptableDeviation",
  "proposed_changes": [
    {
      "op_type": "REPLACE",
      "original_text": "shall not exceed the Production Fee",
      "replacement_text": "ProdCo's indemnification shall be unlimited",
      "anchor": {
        "quote": "shall not exceed the Production Fee",
        "offsets": { "start": 145, "end": 181 },
        "anchor_confidence": 0.95
      },
      "source_reference": {
        "source_type": "STANDARD_POSITION",
        "exact_text": "ProdCo's indemnification shall be unlimited"
      },
      "rationale": "Removes unacceptable cap on indemnification"
    }
  ],
  "confidence_overall": 0.92,
  "internal_comment": "Clause contains indemnity cap which is CRITICAL violation."
}
```

### Valores Válidos para `final_status`
- `Compliant` - Cumple con posición estándar
- `AcceptableDeviation` - Desviación dentro de rangos passable
- `UnacceptableDeviation` - Desviación crítica, requiere cambio
- `NotCoveredByPlaybook` - Familia sin spec definido
- `Ambiguous` - No se puede determinar (fallback)

### Requerimientos para Legal

1. **Mapeo status→observations**: Si Paranoid reporta red flags, Valuator DEBE devolver UnacceptableDeviation
2. **source_reference obligatorio**: Todo replacement DEBE tener texto exacto de la fuente
3. **No inventar texto nuevo**: Solo puede proponer texto del playbook o standard position

---

## 4. Sanitizer Agent

**Cuándo se usa**: Limpia comentarios antes de mostrar al cliente

### System Prompt (ACTUAL - Estático)
```
Sanitize internal comments for client. 
NEVER mention: playbook, policy, rules, thresholds, internal position, risk analysis.

Make it: professional, neutral, max 3 sentences, focused on client impact.

Respond in JSON: {
  "client_comment": "sanitized comment",
  "client_summary_line": "1-line summary",
  "safety": { "pass": boolean, "leaked_terms": [] }
}
```

### User Prompt
```
Sanitize: {{ valuatorOutput.internal_comment || 'Clause reviewed per industry standards.' }}
```

### Notas para Legal
- Este prompt funciona correctamente
- No requiere cambios urgentes
- El backend tiene validación adicional contra términos filtrados

---

## Datos de Playbook Specs Utilizados

Los prompts dinámicos utilizan estos campos de la tabla `playbook_specs`:

| Campo | Uso en Prompt |
|-------|---------------|
| `amazon_position.summary` | Posición estándar |
| `amazon_position.core_requirements` | Requisitos core |
| `acceptability_matrix.acceptable.example` | Patrones aceptables |
| `acceptability_matrix.passable.variations` | Variaciones passable |
| `acceptability_matrix.unacceptable.patterns` | Patrones inaceptables |
| `detection_patterns.must_have` | Anclas obligatorias |
| `detection_patterns.red_flags` | Red flags |
| `risk_assessment.escalation_triggers` | Triggers de escalación |

---

## Próximos Pasos

1. **Legal revisa y mejora Paranoid Prompt** → Más directivo, matching explícito
2. **Legal define schema de observations** → Campos obligatorios, valores válidos
3. **Legal proporciona few-shot examples** → 3-5 ejemplos de análisis correcto por familia
4. **QA valida con test suite** → Cláusulas con red flags deben producir observations > 0

---

## Apéndice: Familias Soportadas (25)

```
PaymentCredits, ThirdPartyCredits, RepsProdCo, IndemnityProdCo, IndemnityAmazon, 
IndemnityProcedures, LiabilityLimitation, InjunctiveReliefWaiver, TerminationRights, 
TerminationConsequences, Confidentiality, DataProtection, GoverningLaw, 
DisputeResolution, ForceMajeure, Insurance, RightsGrant, RightsReversion, 
AuditRights, Assignment, ServicesScope, SurvivalRemedies, AmazonControl, 
ConditionsPrecedent, StandardTerms
```
