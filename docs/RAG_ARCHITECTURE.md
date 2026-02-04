# Contract Guardian - Arquitectura RAG y Modelos LLM

**Versión**: 1.0  
**Fecha**: 2026-02-02  
**Sistema**: Contract Guardian v4.4 (CG-010)

---

## 1. Resumen Ejecutivo

Contract Guardian utiliza una arquitectura híbrida **RAG + Multi-Agent** para revisar contratos PSA/DSA de Amazon. El conocimiento se estructura en tres capas:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE CONOCIMIENTO                     │
├─────────────────────────────────────────────────────────────┤
│  1. Playbook Specs (25 familias)     → Reglas y posiciones │
│  2. Policy Examples (1,367 ejemplos) → RAG vectorial       │
│  3. Detection Patterns               → Keywords y red flags│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE AGENTES LLM                      │
├─────────────────────────────────────────────────────────────┤
│  Router → Paranoid → Valuator → Sanitizer → Decision Engine│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE SALIDA                           │
├─────────────────────────────────────────────────────────────┤
│  Decisión + Sugerencias Redline + Comentario Cliente        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Modelos LLM Utilizados

| Modelo | Uso | Temperatura | Propósito |
|--------|-----|-------------|-----------|
| `text-embedding-3-small` | Embeddings | N/A | Vectorización de cláusulas (1536 dims) |
| `gpt-4o` | Paranoid Agent | 0 | Análisis detallado de desviaciones |
| `gpt-4o` | Valuator Agent | 0 | Evaluación de severidad y propuestas |
| `gpt-4o-mini` | LLM Classification | 0 | Clasificación de familias (fallback) |
| `gpt-4o-mini` | Sanitizer Agent | 0 | Limpieza de comentarios internos |

### Configuración de Modelos

```json
{
  "embedding_model": {
    "name": "text-embedding-3-small",
    "dimensions": 1536,
    "provider": "OpenAI"
  },
  "analysis_models": {
    "paranoid": { "model": "gpt-4o", "temperature": 0, "response_format": "json_object" },
    "valuator": { "model": "gpt-4o", "temperature": 0, "response_format": "json_object" },
    "classifier": { "model": "gpt-4o-mini", "temperature": 0 },
    "sanitizer": { "model": "gpt-4o-mini", "temperature": 0, "response_format": "json_object" }
  }
}
```

---

## 3. Base de Conocimiento RAG

### 3.1 Tabla: `playbook_specs` (25 familias)

Contiene las **reglas de negocio** para cada tipo de cláusula.

| Prioridad | Cantidad | Familias |
|-----------|----------|----------|
| CRITICAL | 15 | IndemnityProdCo, IndemnityAmazon, IndemnityProcedures, LiabilityLimitation, RightsGrant, RightsReversion, TerminationRights, TerminationConsequences, PaymentCredits, ThirdPartyCredits, RepsProdCo, InjunctiveReliefWaiver, Assignment, AmazonControl, SurvivalRemedies |
| HIGH | 4 | ForceMajeure, DisputeResolution, Confidentiality, Insurance |
| MEDIUM | 6 | DataProtection, ServicesScope, PowerOfAttorney, ConditionsPrecedent, StandardTerms, AuditRights |

#### Estructura de cada Playbook Spec

```yaml
family_id: "IndemnityProdCo"
display_name: "ProdCo Indemnification Obligations"
priority: "CRITICAL"
requires_legal_review: true

amazon_position:
  summary: "ProdCo provides broad indemnification for breach of reps, 3P claims, IP infringement"
  core_requirements:
    - "Indemnify, defend, hold harmless Amazon"
    - "Cover all 3P claims from production"
    - "Unlimited liability for IP infringement"

acceptability_matrix:
  acceptable:
    example: "Full indemnification with defend and hold harmless"
  passable:
    variations:
      - "Carve-out for gross negligence"
      - "Notice requirement for claims"
  unacceptable:
    patterns:
      - "cap on indemnity"
      - "material breach only"

detection_patterns:
  must_have: ["indemnify", "defend", "hold harmless"]
  red_flags: ["shall not exceed", "capped at", "limited to"]
  confidence_anchors: ["production company", "producer", "ProdCo"]

risk_assessment:
  escalation_triggers:
    - "Any cap or limitation"
    - "Mutual indemnification"
    - "Knowledge qualifiers"
    - "Sunset provisions less than 10 years"
```

### 3.2 Tabla: `policy_examples` (1,367 ejemplos)

Contiene **ejemplos reales** de cláusulas vectorizados para búsqueda por similitud.

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| ACCEPTABLE | 456 | Cláusulas que cumplen con la posición de Amazon |
| PASSABLE | 458 | Cláusulas con desviaciones aceptables (requieren nota) |
| UNACCEPTABLE | 453 | Cláusulas que violan posiciones críticas |

#### Estructura de cada Policy Example

```json
{
  "id": "uuid",
  "matter_policy_id": "uuid (FK a matter_policies)",
  "clause_type_id": "uuid (FK a clause_types)",
  "acceptance": "ACCEPTABLE | PASSABLE | UNACCEPTABLE",
  "example_text": "Texto completo de la cláusula ejemplo",
  "normalized_terms": ["array", "de", "términos", "normalizados"],
  "source_ref": { "contract": "PSA-2024-001", "section": "7.1" },
  "embedding": "[vector 1536 dims]"
}
```

---

## 4. Flujo RAG en el Pipeline

### 4.1 Diagrama de Flujo

```
┌────────────────┐
│ Cláusula Input │
└───────┬────────┘
        ↓
┌───────────────────────────────────────────────────┐
│ STAGE 1: Classification                           │
│ ┌─────────────────────────────────────────────┐  │
│ │ Hybrid Router                               │  │
│ │ 1. Keyword matching (detection_patterns)    │  │
│ │ 2. If confidence < 0.65 → LLM Classification│  │
│ │ 3. Output: family + confidence              │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────┐
│ STAGE 2: RAG Retrieval                            │
│ ┌─────────────────────────────────────────────┐  │
│ │ Generate Embedding (text-embedding-3-small) │  │
│ └──────────────────┬──────────────────────────┘  │
│                    ↓                              │
│ ┌─────────────────────────────────────────────┐  │
│ │ match_variations RPC                        │  │
│ │ - Similarity search (threshold: 0.6)        │  │
│ │ - Returns top 5 similar examples            │  │
│ │ - Grouped by acceptance level               │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────┐
│ STAGE 3: Policy Enrichment                        │
│ ┌─────────────────────────────────────────────┐  │
│ │ get_playbook_spec RPC                       │  │
│ │ - Fetch family playbook from DB             │  │
│ │ - Returns: amazon_position, matrix, patterns│  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────┐
│ STAGE 4: Agent Analysis                           │
│ ┌─────────────────────────────────────────────┐  │
│ │ Paranoid Agent (gpt-4o)                     │  │
│ │ Input: clause_text + playbook_spec          │  │
│ │ Output: observations[], risk_level          │  │
│ └──────────────────┬──────────────────────────┘  │
│                    ↓                              │
│ ┌─────────────────────────────────────────────┐  │
│ │ Valuator Agent (gpt-4o)                     │  │
│ │ Input: paranoid_output + policy_spec        │  │
│ │ Output: final_status, proposed_changes[]    │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────┐
│ STAGE 5: Decision & Output                        │
│ ┌─────────────────────────────────────────────┐  │
│ │ Decision Engine v2                          │  │
│ │ - Priority-based thresholds                 │  │
│ │ - Escalation rules                          │  │
│ │ - Output: decision, client_state            │  │
│ └──────────────────┬──────────────────────────┘  │
│                    ↓                              │
│ ┌─────────────────────────────────────────────┐  │
│ │ Sanitizer Agent (gpt-4o-mini)               │  │
│ │ - Remove internal terminology               │  │
│ │ - Format client-facing comment              │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### 4.2 Funciones RPC de Supabase

| Función | Propósito |
|---------|-----------|
| `match_variations` | Búsqueda vectorial de ejemplos similares |
| `match_variations_grouped` | Búsqueda agrupada por acceptance level |
| `search_embeddings` | Búsqueda genérica por embedding |
| `get_playbook_spec` | Obtener spec de familia por family_id |
| `get_pending_embeddings` | Ejemplos sin vectorizar (para batch) |
| `update_policy_example_embedding` | Actualizar embedding de ejemplo |

### 4.3 Configuración RAG

```javascript
// En W2: RAG Similarity Search
{
  "query_embedding": clauseEmbedding,    // Vector 1536d
  "match_threshold": 0.6,                // Mínimo 60% similitud
  "match_count": 5,                      // Top 5 resultados
  "filter_matter_policy_id": null,       // Opcional: filtrar por política
  "filter_acceptance": null              // Opcional: filtrar por nivel
}
```

---

## 5. Conocimiento por Agente

### 5.1 Paranoid Agent

**Lo que sabe**:
- Posición estándar de Amazon (amazon_position.summary)
- Requisitos core (amazon_position.core_requirements)
- Patrones aceptables vs inaceptables (acceptability_matrix)
- Anclas obligatorias (detection_patterns.must_have)
- Red flags a detectar (detection_patterns.red_flags)
- Triggers de escalación (risk_assessment.escalation_triggers)

**Lo que NO sabe**:
- Ejemplos RAG similares (no se le pasan actualmente)
- Historial de decisiones previas
- Contexto del contrato completo

### 5.2 Valuator Agent

**Lo que sabe**:
- Observaciones del Paranoid (paranoidOutput)
- Posición estándar (policySpec.standard_position)
- Variaciones aceptables (policySpec.acceptable_variations)
- Texto original de la cláusula
- Modo de análisis (MODE_ENUMERATED_DEVIATIONS)
- Threshold de confianza (TH_ANCHOR)

**Lo que NO sabe**:
- Ejemplos RAG similares
- Detection patterns completos
- Escalation triggers

### 5.3 Contexto RAG (Actualmente Suboptimizado)

Los resultados RAG se recuperan pero **NO se inyectan activamente en los prompts** de Paranoid/Valuator. Están disponibles en `ragContext` pero no se utilizan:

```javascript
// En Parse RAG Results
const ragContext = {
  hasResults: ragResults.length > 0,
  totalFound: ragResults.length,
  acceptableExamples: [...],    // ← No usado en prompts
  passableExamples: [...],      // ← No usado en prompts
  unacceptableExamples: [...],  // ← No usado en prompts
  topSimilarity: ragResults[0]?.similarity || 0,
  topAcceptance: ragResults[0]?.acceptance || 'NONE'
};
```

---

## 6. Archivos de Playbook Specs (Local)

Directorio: `/playbook_specs/` - 34 archivos YAML

| Familia | Archivo | Tamaño |
|---------|---------|--------|
| IndemnityProdCo | `indemnity_prodco.yaml` | 12KB |
| RepsProdCo | `reps_prodco.yaml` | 9.6KB |
| RightsGrant | `rights_grant.yaml` | 8.8KB |
| TerminationRights | `termination_rights.yaml` | 8.5KB |
| TerminationConsequences | `termination_consequences.yaml` | 8.5KB |
| PaymentCredits | `payment_credits.yaml` | 8.3KB |
| SurvivalRemedies | `survival_remedies.yaml` | 8.2KB |
| LiabilityLimitation | `liability_limitation.yaml` | 7.8KB |
| ForceMajeure | `force_majeure.yaml` | 7.4KB |
| IndemnityAmazon | `indemnity_amazon.yaml` | 7.3KB |
| ... | ... | ... |

---

## 7. Métricas del Sistema

| Métrica | Valor |
|---------|-------|
| Familias de cláusulas | 25 |
| Familias CRITICAL | 15 |
| Familias que requieren revisión legal | 15 |
| Ejemplos RAG totales | 1,367 |
| Ejemplos ACCEPTABLE | 456 (33%) |
| Ejemplos PASSABLE | 458 (34%) |
| Ejemplos UNACCEPTABLE | 453 (33%) |
| Dimensiones embedding | 1,536 |
| Threshold similitud RAG | 0.6 |
| Modelo análisis principal | gpt-4o |

---

## 8. Oportunidades de Mejora

### 8.1 RAG Suboptimizado
Los ejemplos RAG se recuperan pero no se usan en prompts. **Acción**: Inyectar ejemplos UNACCEPTABLE similares en el prompt del Paranoid.

### 8.2 Paranoid Sin Instrucciones de Matching
El Paranoid no tiene instrucciones explícitas de comparar red_flags contra el texto. **Acción**: Añadir paso-by-paso de matching.

### 8.3 Valuator No Recibe Patterns
El Valuator solo recibe la salida del Paranoid, no los detection_patterns. **Acción**: Inyectar patrones para validación cruzada.

---

## 9. Diagrama de Tablas de Conocimiento

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐     ┌─────────────────────┐       │
│  │   playbook_specs    │     │   policy_examples   │       │
│  ├─────────────────────┤     ├─────────────────────┤       │
│  │ family_id           │     │ id                  │       │
│  │ display_name        │     │ matter_policy_id    │       │
│  │ priority            │     │ clause_type_id      │       │
│  │ requires_legal_rev  │     │ acceptance          │       │
│  │ amazon_position     │────▶│ example_text        │       │
│  │ acceptability_matrix│     │ normalized_terms    │       │
│  │ detection_patterns  │     │ source_ref          │       │
│  │ risk_assessment     │     │ embedding (1536d)   │       │
│  │ raw_yaml            │     │ created_at          │       │
│  │ embedding           │     └─────────────────────┘       │
│  │ created_at          │                                   │
│  └─────────────────────┘                                   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐       │
│  │ clause_reviews      │     │ redline_suggestions │       │
│  │ (38 registros)      │     │ (0 registros)       │       │
│  └─────────────────────┘     └─────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento generado automáticamente por Contract Guardian v4.4*
