# Prompt: Completar Parametrización de Playbook Specs

## Contexto del Sistema

Estás ayudando a completar el **Contract Guardian**, un sistema de revisión automatizada de contratos PSA/DSA de Amazon Studios. El sistema usa un **guardrail determinístico** que detecta cláusulas problemáticas basándose en patrones definidos en cada "playbook spec".

### Cómo Funciona el Guardrail

Para cada familia de cláusula, el sistema necesita:

1. **`detection_patterns.red_flags`**: Frases/patrones que SIEMPRE disparan alerta (words/phrases que indican riesgo crítico)
2. **`detection_patterns.must_have`**: Elementos que DEBEN estar presentes (su ausencia es un problema)
3. **`detection_patterns.strong_indicators`**: Patrones que identifican positivamente la familia de cláusula

Cuando el guardrail encuentra un `red_flag` en el texto de la cláusula, automáticamente:
- Marca `risk_level: RED`
- Fuerza `final_status: UnacceptableDeviation`
- Escala a revisión humana

---

## Estado Actual de Parametrización

### ✅ Familias COMPLETAS (para revisión y confirmación)

A continuación se listan TODAS las familias actualmente parametrizadas. Por favor:
1. **Revisa** si los red_flags y must_have son correctos y completos
2. **Confirma** si falta alguna familia de cláusula típica en contratos PSA/DSA
3. **Sugiere** adiciones o correcciones

---

#### PRIORITY: CRITICAL

**1. IndemnityProdCo** (12 red_flags, 3 must_have)
```yaml
detection_patterns:
  red_flags:
    - "shall not exceed"
    - "capped at"
    - "limited to"
    - "to ProdCo's knowledge"
    - "to Producer's knowledge"
    - "knowledge qualifier"
    - "consequential"
    - "punitive"
    - "indirect damages"
    - "sole remedy"
    - "exclusive remedy"
    - "aggregate liability"
  must_have:
    - "indemnify"
    - "defend"
    - "hold harmless"
  strong_indicators:
    - "ProdCo shall indemnify"
    - "Amazon Indemnitees"
    - "from and against any claims"
```

**2. RightsGrant** (3 red_flags, 3 must_have)
```yaml
detection_patterns:
  red_flags:
    - "revert"
    - "limited license"
    - "non-exclusive"
  must_have:
    - "exclusive"
    - "perpetual"
    - "worldwide"
  strong_indicators:
    - "grants to Amazon"
    - "all rights"
```

**3. RepsProdCo** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "best knowledge"
    - "material breach only"
  must_have:
    - "represents"
    - "warrants"
  strong_indicators:
    - "ProdCo represents"
    - "to the best of ProdCo's knowledge"
```

**4. LiabilityLimitation** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "unlimited liability"
    - "no cap"
  must_have:
    - "liability"
    - "shall not exceed"
  strong_indicators:
    - "IN NO EVENT"
    - "CONSEQUENTIAL DAMAGES"
    - "INDIRECT DAMAGES"
    - "LIMITATION OF LIABILITY"
    - "AGGREGATE LIABILITY"
```

**5. InjunctiveReliefWaiver** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "delete"
    - "preserve"
  must_have:
    - "waives"
    - "injunctive"
  strong_indicators:
    - "enjoin"
    - "restrain"
    - "monetary damages"
```

**6. IndemnityAmazon** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "unlimited"
    - "no cap"
  must_have:
    - "Amazon"
    - "indemnify"
  strong_indicators:
    - "Amazon shall indemnify"
    - "ProdCo Indemnitees"
    - "Amazon agrees to indemnify"
```

**7. PaymentCredits** (2 red_flags, 3 must_have)
```yaml
detection_patterns:
  red_flags:
    - "most favored"
    - "MFN"
  must_have:
    - "payment"
    - "credit"
    - "entitlement"
  strong_indicators:
    - "production fee"
    - "net receipts"
```

**8. ThirdPartyCredits** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "most favored"
    - "MFN"
  must_have:
    - "credit"
    - "entitlement"
```

**9. TerminationRights** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "ProdCo may terminate"
    - "mutual termination"
  must_have:
    - "terminate"
    - "for cause"
```

**10. TerminationConsequences** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "full payment"
    - "kill fee"
  must_have:
    - "upon termination"
    - "consequences"
```

**11. SurvivalRemedies** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "limited survival"
    - "1 year"
  must_have:
    - "survival"
    - "remedies"
```

**12. Assignment** (2 red_flags, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "ProdCo may assign"
    - "mutual consent"
  must_have:
    - "assign"
```

**13. RightsReversion** (1 red_flag, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "automatic reversion"
  must_have:
    - "reversion"
    - "turnaround"
```

**14. AmazonControl** (1 red_flag, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "subject to approval"
  must_have:
    - "sole and final control"
```

---

#### PRIORITY: HIGH

**15. DisputeResolution** (2 red_flags, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "ProdCo jurisdiction"
    - "outside California"
  must_have:
    - "governing law"
    - "jurisdiction"
  strong_indicators:
    - "State of California"
    - "binding arbitration"
    - "exclusive jurisdiction"
    - "JAMS"
    - "AAA"
```

**16. Confidentiality** (1 red_flag, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "may disclose"
  must_have:
    - "confidential"
  strong_indicators:
    - "confidential information"
    - "maintain in strict confidence"
    - "non-disclosure"
    - "NPI"
```

---

#### PRIORITY: MEDIUM

**17. ServicesScope** (2 red_flags, 3 must_have)
```yaml
detection_patterns:
  red_flags:
    - "limited services"
    - "best efforts"
  must_have:
    - "render"
    - "services"
    - "Program"
  strong_indicators:
    - "pre-production"
    - "post-production"
    - "deliver"
```

**18. DataProtection** (1 red_flag, 2 must_have)
```yaml
detection_patterns:
  red_flags:
    - "processor"
  must_have:
    - "data protection"
    - "personal data"
  strong_indicators:
    - "GDPR"
    - "controller"
```

**19. PowerOfAttorney** (2 red_flags, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "remove"
    - "delete POA"
  must_have:
    - "power of attorney"
  strong_indicators:
    - "execute"
    - "documents"
```

**20. ConditionsPrecedent** (1 red_flag, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "delete"
  must_have:
    - "conditions precedent"
  strong_indicators:
    - "Exhibit A"
```

**21. StandardTerms** (1 red_flag, 1 must_have)
```yaml
detection_patterns:
  red_flags:
    - "remove"
  must_have:
    - "standard terms"
  strong_indicators:
    - "industry custom"
```

---

### ❌ Familias SIN PARAMETRIZAR (requieren definición urgente)
| Familia | Priority | Estado |
|---------|----------|--------|
| **IndemnityProcedures** | CRITICAL | ⚠️ Sin red_flags ni must_have |
| **ForceMajeure** | HIGH | ⚠️ Sin red_flags ni must_have |
| **Insurance** | HIGH | ⚠️ Sin red_flags ni must_have |
| **AuditRights** | MEDIUM | ⚠️ Sin red_flags ni must_have |

---

## Tu Tarea

Para CADA familia sin parametrizar, proporciona la siguiente estructura en formato YAML:

```yaml
detection_patterns:
  red_flags:
    - "frase exacta que dispara alerta 1"
    - "frase exacta que dispara alerta 2"
    # Mínimo 3-5 red flags por familia CRITICAL/HIGH
  
  must_have:
    - "elemento obligatorio 1"
    - "elemento obligatorio 2"
    # Elementos cuya AUSENCIA es problemática
  
  strong_indicators:
    - "patrón que identifica esta familia"
    # Para routing/clasificación
```

---

## Criterios para Red Flags

Los red flags deben ser **frases cortas y específicas** que:
- Aparecen literalmente en contratos problemáticos
- Son case-insensitive (el sistema hace matching con minúsculas)
- Indican violación de la posición estándar de Amazon

### Ejemplos de IndemnityProdCo (como referencia):
```yaml
red_flags:
  - "shall not exceed"          # Cap on indemnification
  - "capped at"                 # Explicit cap
  - "limited to"                # Limitation
  - "to ProdCo's knowledge"     # Knowledge qualifier
  - "consequential"             # Damage exclusion
  - "punitive"                  # Damage exclusion
  - "indirect damages"          # Damage exclusion
  - "sole remedy"               # Remedy limitation
  - "exclusive remedy"          # Remedy limitation
  - "aggregate liability"       # Cap language
```

---

## Familias a Completar

### 1. IndemnityProcedures (CRITICAL)
**Descripción**: Procedimientos para ejercer derechos de indemnización (notificación, defensa, liquidación)
**Amazon Position**: Procedimientos claros, control de defensa, aprobación de settlements

**Proporciona**:
- red_flags (caps o limitaciones en procedimientos)
- must_have (elementos procedimentales requeridos)
- strong_indicators (patrones de identificación)

---

### 2. ForceMajeure (HIGH)
**Descripción**: Cláusulas de fuerza mayor y eventos fuera de control
**Amazon Position**: Definición estrecha, no incluir eventos comerciales ordinarios, obligación de mitigación

**Proporciona**:
- red_flags (definiciones demasiado amplias, falta de mitigación)
- must_have (limitaciones apropiadas)
- strong_indicators

---

### 3. Insurance (HIGH)
**Descripción**: Requisitos de seguro (E&O, GL, umbrella)
**Amazon Position**: Cobertura mínima específica, Amazon como additional insured, certificados

**Proporciona**:
- red_flags (coberturas insuficientes, exclusiones problemáticas)
- must_have (coberturas mínimas requeridas)
- strong_indicators

---

### 4. AuditRights (MEDIUM)
**Descripción**: Derechos de auditoría sobre registros y cumplimiento
**Amazon Position**: Acceso amplio, sin restricciones irrazonables, costos razonables

**Proporciona**:
- red_flags (restricciones excesivas, costos prohibitivos)
- must_have (derechos básicos de acceso)
- strong_indicators

---

## Formato de Respuesta Esperado

Para cada familia, proporciona:

```yaml
# [NOMBRE_FAMILIA]
detection_patterns:
  red_flags:
    - "..."
  must_have:
    - "..."
  strong_indicators:
    - "..."
```

Con breve justificación de por qué cada red_flag es problemático desde la perspectiva de Amazon.

---

## Notas Importantes

1. **Sé específico**: Las frases deben ser exactas, no conceptos abstractos
2. **Piensa en el matching**: El sistema busca estas frases literalmente en el texto
3. **Prioriza lo crítico**: Para CRITICAL families, incluye más red_flags
4. **Considera variaciones**: Incluye sinónimos comunes (ej: "shall not exceed" Y "capped at")
5. **Amazon-centric**: Siempre desde la perspectiva de proteger los intereses de Amazon
