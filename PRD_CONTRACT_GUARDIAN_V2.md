# PRD Contract Guardian v2.0
## Sistema de Revision Automatizada de Contratos con RAG

**Nombre del Producto**: Contract Guardian (anteriormente Amazon Redliner)
**Version**: 2.1
**Fecha**: Enero 2026
**Estado**: Produccion con RAG activo, Edge Functions desplegadas, Tests E2E pasando

---

## Tabla de Contenidos

1. [Vision Ejecutiva](#1-vision-ejecutiva)
2. [Arquitectura de 3 Capas](#2-arquitectura-de-3-capas)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Pipeline de Revision (4 Agentes)](#4-pipeline-de-revision-4-agentes)
5. [Sistema RAG](#5-sistema-rag)
6. [Flujos de Trabajo n8n](#6-flujos-de-trabajo-n8n)
7. [Interfaz de Usuario (Lovable)](#7-interfaz-de-usuario-lovable)
8. [Historias de Usuario](#8-historias-de-usuario)
9. [Especificaciones Tecnicas](#9-especificaciones-tecnicas)
10. [Metricas y KPIs](#10-metricas-y-kpis)
11. [Roadmap](#11-roadmap)

---

## 1. Vision Ejecutiva

### 1.1 Proposito

Contract Guardian es un sistema de revision automatizada de contratos que utiliza **4 agentes de IA especializados** para:

1. **Clasificar** clausulas por materia juridica
2. **Detectar** desviaciones de terminos estandar
3. **Proponer** cambios profesionales (redlines)
4. **Sanitizar** outputs para comunicacion al cliente

### 1.2 Problema que Resuelve

| Problema | Solucion Contract Guardian |
|----------|----------------------------|
| Revision manual consume 4-8 horas por contrato | Revision automatizada en 2-5 minutos |
| Inconsistencia entre revisores | Playbook centralizado con ejemplos RAG |
| Dificultad de escalar el equipo legal | Sistema multi-tenant escalable |
| Falta de trazabilidad | Audit trail completo por clausula |
| Conocimiento no estructurado | 909 policy_examples con embeddings |

### 1.3 Usuarios Objetivo

| Rol | Necesidad Principal |
|-----|---------------------|
| **Abogado Senior** | Dashboard de escalaciones, aprobacion de redlines |
| **Abogado Junior** | Revision asistida, propuestas de cambio |
| **Legal Ops** | Metricas, configuracion de playbooks |
| **Cliente Final** | Documento redlineado limpio, sin jerga interna |

### 1.4 Diferenciadores Clave

- **RAG con 909 ejemplos reales** clasificados por aceptabilidad
- **4 agentes especializados** con roles distintos (no un solo LLM)
- **Arquitectura 3 capas** mantenible por el usuario sin codigo
- **Sanitizacion obligatoria** para proteger politicas internas

---

## 2. Arquitectura de 3 Capas

### 2.1 Diagrama de Arquitectura Completa (v2.1)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Lovable)                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ NewAnalysis  │  │ContractReview│  │  Escalations │  │ KnowledgeGraph│   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└──────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS (9)                          │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│   │  start_review  │  │update_run_status│ │generate_export │                │
│   └────────┬───────┘  └────────┬───────┘  └────────┬───────┘                │
│            │                   │                   │                         │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│   │   monitoring   │  │  request_review │  │   n8n-proxy   │                │
│   └────────────────┘  └────────────────┘  └────────────────┘                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│    n8n WORKFLOWS    │ │  SUPABASE POSTGRES  │ │   SUPABASE STORAGE  │
│  ┌───────────────┐  │ │                     │ │                     │
│  │ W1_DriveIngest│  │ │  • documents        │ │  • /contracts/      │
│  ├───────────────┤  │ │  • contract_runs    │ │  • /exports/        │
│  │W2_ClauseReview│  │ │  • clause_reviews   │ │                     │
│  │    (RAG)      │  │ │  • matters (24)     │ │                     │
│  ├───────────────┤  │ │  • clause_types(95) │ │                     │
│  │W3_ContractRev │  │ │  • policy_examples  │ │                     │
│  └───────────────┘  │ │    (1,367)          │ │                     │
└─────────────────────┘ │  • audit_events     │ │                     │
           │            └─────────────────────┘ └─────────────────────┘
           ▼                       │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENAI API                                         │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│   │ Embeddings │  │   Router   │  │  Paranoid  │  │  Valuator  │            │
│   │text-embed-3│  │ gpt-4o-mini│  │   gpt-4o   │  │ gpt-4o-mini│            │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Diagrama 3 Capas de Datos

```
+------------------------------------------------------------------+
|                     CAPA 0: EJECUCION (Runtime)                  |
|  +------------------+  +------------------+  +------------------+ |
|  | clause_instances |  | review_findings  |  | run_steps        | |
|  | (segmentacion)   |  | (output agentes) |  | (audit trail)    | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                  CAPA 1: BLUEPRINT (Politica)                    |
|  +------------------+  +------------------+  +------------------+ |
|  | matters (24)     |  | matter_policies  |  | policy_examples  | |
|  | clause_types(95) |  | (config/agente)  |  | (1,367 con RAG)  | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+                      |
|  | fallback_clauses |  | blueprint_vers   |                      |
|  | (50 templates)   |  | (versionado)     |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                CAPA 2: MODELO DE CONTRATO                        |
|  +------------------+  +------------------+  +------------------+ |
|  | contract_models  |  | contract_model_  |  | contract_model_  | |
|  | (PSA, DSA, EPC)  |  | clauses          |  | parameters       | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------+
|                   CAPA 3: GRAPHRAG (Opcional)                    |
|  +------------------+  +------------------+  +------------------+ |
|  | knowledge_graphs |  | kg_nodes         |  | kg_edges         | |
|  | (versionado)     |  | (conceptos)      |  | (relaciones)     | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

### 2.2 Beneficios de la Arquitectura

| Capa | Quien la Mantiene | Frecuencia de Cambio |
|------|-------------------|----------------------|
| Ejecucion | Sistema automatico | Cada revision |
| Blueprint | Legal Ops / Abogado Senior | Mensual |
| Contract Model | Equipo Legal | Por tipologia nueva |
| GraphRAG | Sistema + Legal Ops | Trimestral |

### 2.3 Resolucion de Configuracion

```
Input: (organization_id, contract_type_id)
       |
       v
+---------------------------+
| contract_type_review_     |
| defaults                  |
+---------------------------+
       |
       v
Output: {
  blueprint_version_id,
  contract_model_version_id,
  knowledge_graph_id (opcional)
}
```

---

## 3. Modelo de Datos

### 3.1 Tablas Principales (Estado Actual en Produccion)

#### Taxonomia
```sql
-- 18 materias juridicas
CREATE TABLE matters (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- 'rights_ownership', 'payment_terms', etc.
  name TEXT NOT NULL,
  description TEXT,
  display_order INT
);

-- 67 tipos de clausula
CREATE TABLE clause_types (
  id UUID PRIMARY KEY,
  matter_id UUID REFERENCES matters(id),
  code TEXT NOT NULL,               -- 'ip_ownership', 'payment_schedule', etc.
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[]
);
```

#### Blueprint (Politica)
```sql
-- Blueprints versionados
CREATE TABLE blueprint_versions (
  id UUID PRIMARY KEY,
  blueprint_id UUID REFERENCES review_blueprints(id),
  version_int INT NOT NULL,
  config JSONB,                     -- Configuracion global
  published_at TIMESTAMPTZ
);

-- Politica por materia
CREATE TABLE matter_policies (
  id UUID PRIMARY KEY,
  blueprint_version_id UUID REFERENCES blueprint_versions(id),
  matter_id UUID REFERENCES matters(id),
  name TEXT,
  policy_config JSONB,              -- Thresholds, escalation rules
  agent_config JSONB                -- Model selection, prompts
);

-- 909 ejemplos para RAG
CREATE TABLE policy_examples (
  id UUID PRIMARY KEY,
  matter_policy_id UUID REFERENCES matter_policies(id),
  clause_type_id UUID REFERENCES clause_types(id),
  acceptance acceptance_level,       -- ACCEPTABLE, PASSABLE, UNACCEPTABLE
  example_text TEXT NOT NULL,
  normalized_terms TEXT[],
  embedding vector(1536),           -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ
);

-- 50 clausulas fallback para redlines
CREATE TABLE fallback_clauses (
  id UUID PRIMARY KEY,
  matter_policy_id UUID REFERENCES matter_policies(id),
  clause_type_id UUID REFERENCES clause_types(id),
  acceptance acceptance_level,
  fallback_text TEXT NOT NULL,
  usage_notes TEXT,
  requires_approval BOOLEAN,
  approval_role TEXT
);
```

#### Ejecucion
```sql
-- Reviews de clausulas (tabla principal de output)
CREATE TABLE clause_reviews (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  run_id UUID,
  clause_instance_id UUID,

  -- Clasificacion
  heading TEXT,
  clause_text TEXT,
  detected_family TEXT,
  confidence_score FLOAT,

  -- 3-Layer
  blueprint_version_id UUID,
  acceptance acceptance_level,

  -- RAG Evidence
  evidence JSONB,                   -- {rag_examples_used, top_similarity, etc.}

  -- Cliente
  client_state TEXT,                -- OK, RECOMMENDED, REQUIRED, NEEDS_REVIEW, BLOCKED
  client_comment TEXT,
  client_summary_line TEXT,

  -- Cambios
  proposed_changes JSONB,

  -- Escalacion
  escalation_recommended BOOLEAN,
  escalation_reason TEXT,

  created_at TIMESTAMPTZ
);
```

### 3.2 Estadisticas Actuales de Datos (v2.1)

| Entidad | Cantidad | Detalles |
|---------|----------|----------|
| **Matters** | 24 | Categorias legales completas |
| **Clause Types** | 95 | Tipos especificos de clausula |
| **Policy Examples** | 1,367 | 456 ACCEPTABLE, 458 PASSABLE, 453 UNACCEPTABLE |
| **Embeddings** | 1,367/1,367 | 100% generados con text-embedding-3-small |
| **Edge Functions** | 9 | Todas activas y testeadas |
| **Tests E2E** | 9/9 | 100% pasando |
| **Fallback Clauses** | ~50 | Templates para redlines |

### 3.2.1 Distribucion de Policy Examples por Acceptance

```
ACCEPTABLE:   456 (33.4%) ████████████████
PASSABLE:     458 (33.5%) ████████████████
UNACCEPTABLE: 453 (33.1%) ████████████████
```

### 3.3 Enum Types

```sql
-- Nivel de aceptacion de una clausula
CREATE TYPE acceptance_level AS ENUM (
  'ACCEPTABLE',      -- Cumple completamente con la politica
  'PASSABLE',        -- Desviaciones menores, puede proceder con nota
  'UNACCEPTABLE'     -- Requiere cambios obligatorios
);

-- Estado para el cliente
CREATE TYPE client_state AS ENUM (
  'OK',              -- Sin accion requerida
  'RECOMMENDED',     -- Cambio sugerido pero opcional
  'REQUIRED',        -- Cambio obligatorio
  'NEEDS_REVIEW',    -- Requiere revision humana
  'BLOCKED'          -- Bloquea exportacion
);
```

---

## 4. Pipeline de Revision (4 Agentes)

### 4.1 Diagrama del Pipeline W2

```
                    INPUT: clause_text
                           |
                           v
+------------------------------------------------------------------+
|                    1. GENERATE EMBEDDING                         |
|  OpenAI text-embedding-3-small (1536 dims)                       |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    2. RAG SEARCH                                 |
|  search_policy_examples(embedding, threshold=0.6, limit=10)      |
|  Returns: Similar examples grouped by acceptance level           |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    3. ROUTER AGENT (gpt-4o-mini)                 |
|  Input: clause_text                                              |
|  Output: {matter_code, confidence, reasoning}                    |
|  Proposito: Clasificar la clausula en una de 18 materias         |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    4. PARANOID AGENT (gpt-4o)                    |
|  Input: clause_text + RAG examples (ACCEPTABLE/UNACCEPTABLE)     |
|  Output: {evidence_spans[], summary, risk_level, similar_to}     |
|  Proposito: Identificar TODAS las desviaciones (alto recall)     |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    5. VALUATOR AGENT (gpt-4o)                    |
|  Input: clause_text + paranoid_output + RAG context              |
|  Output: {acceptance, confidence, reasoning, proposed_changes[], |
|           client_state, internal_comment}                        |
|  Proposito: Decidir aceptacion final y proponer redlines         |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    6. DECISOR (Determinista)                     |
|  Input: valuator_output                                          |
|  Output: {decision, escalation, client_state}                    |
|  Logica:                                                         |
|    - ACCEPTABLE + confidence >= 0.7 -> AUTO_PASS                 |
|    - PASSABLE -> AUTO_PASS + RECOMMENDED                         |
|    - UNACCEPTABLE -> AUTO_REDLINE + escalation                   |
|    - LOW_CONFIDENCE -> ESCALATE_HUMAN                            |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    7. SANITIZER AGENT (gpt-4o-mini)              |
|  Input: internal_comment                                         |
|  Output: {client_comment, client_summary_line}                   |
|  Proposito: Convertir comentario interno en texto neutral        |
|  Blocklist: playbook, policy, RAG, threshold, reglas internas    |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    8. SAVE TO clause_reviews                     |
|  Incluye: evidence.rag_examples_used, evidence.top_similarity,   |
|           evidence.suggested_by_rag                              |
+------------------------------------------------------------------+
                           |
                           v
                    OUTPUT: clause_review
```

### 4.2 Especificacion de Agentes

#### 4.2.1 Router Agent

| Atributo | Valor |
|----------|-------|
| **Modelo** | gpt-4o-mini |
| **Temperatura** | 0 |
| **Proposito** | Clasificar clausula en 1 de 18 materias |
| **Input** | `clause_text` |
| **Output Schema** | `{matter_code, confidence, reasoning}` |

**Prompt System**:
```
Eres un clasificador de clausulas de contratos Amazon. Clasifica segun estas categorias:

- rights_ownership: Propiedad, derechos de autor, licencias
- payment_terms: Precio, pagos, facturacion
- indemnity_prodco: Indemnizacion del productor
- indemnity_amazon: Indemnizacion de Amazon
- termination: Terminacion, rescision
- confidentiality: Confidencialidad
- liability_limitation: Limitacion de responsabilidad
- delivery_acceptance: Entrega, aceptacion
- insurance: Seguros
- miscellaneous: Otros

Responde SOLO JSON: {"matter_code": "codigo", "confidence": 0.0-1.0, "reasoning": "breve"}
```

#### 4.2.2 Paranoid Agent

| Atributo | Valor |
|----------|-------|
| **Modelo** | gpt-4o |
| **Temperatura** | 0 |
| **Proposito** | Detectar TODAS las desviaciones (alto recall) |
| **Input** | `clause_text + RAG examples` |
| **Output Schema** | `{evidence_spans[], summary, risk_level, similar_to_examples}` |

**Prompt System**:
```
Eres un analizador exhaustivo de contratos Amazon. Tu trabajo es identificar TODAS
las desviaciones y problemas potenciales.

Tienes acceso a EJEMPLOS DE REFERENCIA clasificados por nivel de aceptacion:
- ACCEPTABLE: Clausulas que cumplen con la posicion de Amazon
- PASSABLE: Clausulas con desviaciones menores aceptables
- UNACCEPTABLE: Clausulas que requieren cambios

Responde en JSON: {
  "evidence_spans": [{"quote": "texto", "issue": "problema", "severity": "high|medium|low"}],
  "summary": "resumen",
  "risk_level": "RED|AMBER|GREEN",
  "similar_to_examples": "ACCEPTABLE|PASSABLE|UNACCEPTABLE"
}
```

#### 4.2.3 Valuator Agent

| Atributo | Valor |
|----------|-------|
| **Modelo** | gpt-4o |
| **Temperatura** | 0 |
| **Proposito** | Decidir aceptacion final y proponer cambios |
| **Input** | `clause_text + paranoid_output + RAG context` |
| **Output Schema** | `{acceptance, confidence, reasoning, proposed_changes[], client_state, internal_comment}` |

**Reglas Duras**:
1. **No texto nuevo**: Solo puede proponer texto de STANDARD_POSITION o FALLBACK_ACCEPTABLE
2. **No materialidad inventada**: Si no esta definida en el playbook, no opina
3. **MODE_STRICT**: Cualquier cambio relevante -> UnacceptableDeviation

**Prompt System**:
```
Eres un valuador de contratos. Determina la ACEPTACION final basandote en:
1. Las desviaciones encontradas por el analizador
2. Los ejemplos de referencia similares (RAG)
3. La similitud con ejemplos previos

Niveles de aceptacion:
- ACCEPTABLE: Sin desviaciones significativas, similar a ejemplos aceptables
- PASSABLE: Desviaciones menores, puede proceder con nota
- UNACCEPTABLE: Desviaciones graves, requiere cambios

Responde en JSON: {
  "acceptance": "ACCEPTABLE|PASSABLE|UNACCEPTABLE",
  "confidence": 0.0-1.0,
  "reasoning": "justificacion detallada",
  "proposed_changes": [{"original": "texto", "replacement": "nuevo texto", "reason": "razon"}],
  "client_state": "OK|RECOMMENDED|REQUIRED|NEEDS_REVIEW|BLOCKED",
  "internal_comment": "comentario interno"
}
```

#### 4.2.4 Sanitizer Agent

| Atributo | Valor |
|----------|-------|
| **Modelo** | gpt-4o-mini |
| **Temperatura** | 0 |
| **Proposito** | Crear comentario neutral para cliente |
| **Input** | `internal_comment` |
| **Output Schema** | `{client_comment, client_summary_line}` |

**Blocklist** (nunca mencionar):
- playbook, policy, rule_id, RAG, embedding
- threshold, confidence, similarity, score
- acceptable, unacceptable, passable
- agent, paranoid, valuator, router
- internal, escalation, blocked

**Prompt System**:
```
Convierte comentarios internos en comentarios neutrales para el cliente.
NUNCA mencionar: playbook, politica, RAG, embeddings, similitud, threshold, reglas internas.

Responde JSON: {"client_comment": "comentario", "client_summary_line": "1 linea"}
```

### 4.3 Matriz de Decision (Decisor)

| final_status | confidence | anchor_conf | Accion |
|--------------|------------|-------------|--------|
| ACCEPTABLE | >= 0.7 | N/A | AUTO_PASS, client_state=OK |
| ACCEPTABLE | < 0.7 | N/A | ESCALATE_HUMAN, client_state=NEEDS_REVIEW |
| PASSABLE | >= 0.5 | N/A | AUTO_PASS, client_state=RECOMMENDED |
| PASSABLE | < 0.5 | N/A | ESCALATE_HUMAN, client_state=NEEDS_REVIEW |
| UNACCEPTABLE | >= 0.7 | >= 0.85 | AUTO_REDLINE, client_state=REQUIRED |
| UNACCEPTABLE | >= 0.7 | < 0.85 | ESCALATE_HUMAN, client_state=NEEDS_REVIEW |
| UNACCEPTABLE | < 0.7 | N/A | ESCALATE_HUMAN, client_state=NEEDS_REVIEW |
| NotCovered | N/A | N/A | ESCALATE_HUMAN, block_export=true |
| Ambiguous | N/A | N/A | ESCALATE_HUMAN, block_export=true |

---

## 5. Sistema RAG

### 5.1 Arquitectura RAG

```
+------------------------------------------------------------------+
|                    QUERY: clause_text                            |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                EMBEDDING GENERATION                              |
|  Model: text-embedding-3-small                                   |
|  Dimensions: 1536                                                |
|  API: OpenAI                                                     |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                SIMILARITY SEARCH                                 |
|  Function: search_policy_examples()                              |
|  Index: HNSW (m=16, ef_construction=64)                          |
|  Metric: Cosine similarity (1 - distance)                        |
|  Threshold: 0.6 (configurable)                                   |
|  Limit: 10 results                                               |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                RESULT GROUPING                                   |
|  Group by acceptance level:                                      |
|    - ACCEPTABLE: [examples...]                                   |
|    - PASSABLE: [examples...]                                     |
|    - UNACCEPTABLE: [examples...]                                 |
|  Calculate suggested_acceptance from top 3 by similarity         |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                CONTEXT INJECTION                                 |
|  Inject into Paranoid Agent prompt:                              |
|    - Top 3 ACCEPTABLE examples                                   |
|    - Top 3 UNACCEPTABLE examples                                 |
|  Inject into Valuator Agent prompt:                              |
|    - suggested_acceptance                                        |
|    - top_similarity score                                        |
|    - Top example text                                            |
+------------------------------------------------------------------+
```

### 5.2 Funcion de Busqueda

```sql
CREATE OR REPLACE FUNCTION search_policy_examples(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_matter_policy_id UUID DEFAULT NULL,
  filter_acceptance acceptance_level DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  example_text TEXT,
  acceptance acceptance_level,
  similarity FLOAT,
  clause_type_name TEXT,
  matter_policy_name TEXT
)
```

### 5.3 Estadisticas de Embeddings (v2.1)

| Metrica | Valor |
|---------|-------|
| Total policy_examples | **1,367** |
| Con embedding | **1,367 (100%)** |
| Modelo usado | text-embedding-3-small |
| Dimensiones | 1536 |
| Indice | HNSW (cosine) |

### 5.4 Distribucion por Acceptance Level

```
ACCEPTABLE:   456 (33.4%) ████████████████
PASSABLE:     458 (33.5%) ████████████████
UNACCEPTABLE: 453 (33.1%) ████████████████
```

### 5.5 Evidencia RAG en clause_reviews

```json
{
  "evidence": {
    "rag_examples_used": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
    "top_similarity": 0.983,
    "suggested_by_rag": "ACCEPTABLE",
    "paranoid_risk": "GREEN",
    "valuator_confidence": 0.85
  }
}
```

---

## 6. Flujos de Trabajo n8n

### 6.1 Arquitectura de Workflows

```
+------------------------------------------------------------------+
|                         W1: FILE UPLOAD                          |
|  Trigger: Webhook POST /file-upload                              |
|  Input: {file_id, file_name, contract_type}                      |
|  Process:                                                        |
|    1. Create document record                                     |
|    2. Resolve blueprint_version_id from contract_type            |
|    3. Extract text from DOCX/PDF                                 |
|    4. Create contract_run                                        |
|  Output: {document_id, run_id, blueprint_version_id}             |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                    W3: CONTRACT REVIEW                           |
|  Trigger: Webhook POST /contract-review                          |
|  Input: {document_id, run_id, raw_content}                       |
|  Process:                                                        |
|    1. Resolve config (blueprint, contract_model)                 |
|    2. Extract clauses (LLM or heuristic)                         |
|    3. Save clause_instances                                      |
|    4. For each clause: Call W2                                   |
|    5. Aggregate results                                          |
|    6. Generate report                                            |
|  Output: {run_id, clauses_reviewed, escalations}                 |
+------------------------------------------------------------------+
                           |
                           v (per clause)
+------------------------------------------------------------------+
|                 W2: CLAUSE REVIEW (RAG ENHANCED)                 |
|  Trigger: Webhook POST /clause-review                            |
|  Input: {clause_text, clause_id, blueprint_version_id}           |
|  Process:                                                        |
|    1. Generate embedding (OpenAI)                                |
|    2. RAG Search (search_policy_examples)                        |
|    3. Process RAG results (group by acceptance)                  |
|    4. Router Agent (classify matter)                             |
|    5. Paranoid Agent (with RAG context)                          |
|    6. Valuator Agent (with RAG context)                          |
|    7. Decisor (deterministic)                                    |
|    8. Sanitizer Agent                                            |
|    9. Save to clause_reviews                                     |
|  Output: {clause_review object}                                  |
+------------------------------------------------------------------+
```

### 6.2 W2 Nodos Detallados

| # | Nodo | Tipo | Proposito |
|---|------|------|-----------|
| 1 | Webhook | n8n-nodes-base.webhook | Recibe POST /clause-review |
| 2 | Parse Input | Code | Extrae y valida campos |
| 3 | Generate Embedding | HTTP Request | POST a OpenAI /v1/embeddings |
| 4 | Extract Embedding | Code | Extrae vector del response |
| 5 | RAG Search | Supabase | Ejecuta search_policy_examples() |
| 6 | Process RAG Results | Code | Agrupa por acceptance, calcula suggested |
| 7 | Router Agent | HTTP Request | POST a OpenAI /v1/chat/completions |
| 8 | Parse Router | Code | Parsea JSON response |
| 9 | Paranoid Agent | HTTP Request | POST con RAG context |
| 10 | Parse Paranoid | Code | Parsea JSON response |
| 11 | Valuator Agent | HTTP Request | POST con RAG context |
| 12 | Parse Valuator | Code | Parsea JSON response |
| 13 | Decisor | Code | Matriz de decision determinista |
| 14 | Sanitizer Agent | HTTP Request | POST para sanitizar |
| 15 | Build Result | Code | Construye objeto final |
| 16 | Save to clause_reviews | Supabase | INSERT en DB |
| 17 | Respond | respondToWebhook | Devuelve resultado |

### 6.3 Configuracion de Credenciales

| Credencial | ID | Uso |
|------------|-----|-----|
| OpenAI API | SIqSVUfX83ooZaUa | Embeddings + Agentes |
| Supabase API | 4xA4P6BVQQ2lcvuG | Base de datos |

### 6.4 Endpoints Webhook

| Workflow | Endpoint | Metodo |
|----------|----------|--------|
| W1 | `/webhook/file-upload` | POST |
| W2 | `/webhook/clause-review` | POST |
| W3 | `/webhook/contract-review` | POST |

### 6.5 Edge Functions Supabase

El sistema cuenta con **9 Edge Functions** desplegadas en Supabase:

| Funcion | Endpoint | JWT | Proposito |
|---------|----------|-----|-----------|
| `start_review` | POST /start_review | Si | Iniciar revision de contrato |
| `update_run_status` | POST /update_run_status | No | Webhook retorno de n8n |
| `generate_export` | POST /generate_export | No | Exportar documento (Markdown) |
| `monitoring` | POST /monitoring | No | Dashboard de metricas |
| `request_review` | POST /request_review | Si | Solicitar revision humana |
| `export_doc` | POST /export_doc | Si | Exportar DOCX (via n8n) |
| `n8n-proxy` | POST /n8n-proxy | No | Proxy seguro para n8n |
| `admin_setup` | POST /admin_setup | No | Configuracion admin |

#### Ejemplo: Iniciar Revision
```bash
curl -X POST "https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/start_review" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid",
    "contract_type_id": "dsa_streaming_v1"
  }'
```

#### Ejemplo: Obtener Metricas de Monitoreo
```bash
curl -s "https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/monitoring" | jq '.dashboard.overview'
```

Respuesta:
```json
{
  "total_documents": 14,
  "total_runs": 15,
  "completed_runs": 8,
  "processing_runs": 2,
  "total_examples": 1367,
  "total_reviews": 33
}
```

### 6.6 Vistas de Monitoreo SQL

```sql
-- Overview general
SELECT * FROM monitoring_overview;

-- Actividad reciente (24h)
SELECT * FROM monitoring_recent_activity;

-- Performance de runs
SELECT * FROM monitoring_run_performance;

-- Errores
SELECT * FROM monitoring_errors;

-- Stats RAG por matter
SELECT * FROM monitoring_rag_stats;
```

### 6.7 Funciones RPC

| Funcion | Proposito |
|---------|-----------|
| `search_policy_examples()` | Busqueda semantica por embedding |
| `get_monitoring_dashboard()` | Dashboard completo de metricas |
| `is_superuser()` | Verificar permisos de superusuario |

---

## 7. Interfaz de Usuario (Lovable)

### 7.1 Arquitectura Frontend

La interfaz de usuario esta construida con **Lovable** (plataforma de desarrollo visual) sobre React + TypeScript + shadcn/ui.

```
+------------------------------------------------------------------+
|                      ARQUITECTURA FRONTEND                        |
+------------------------------------------------------------------+
|                                                                  |
|  +-----------------+     +------------------+     +-------------+ |
|  | React 18        |     | TanStack Query   |     | Supabase    | |
|  | TypeScript      |     | (Data Fetching)  |     | Realtime    | |
|  | React Router    |     | Cache + Sync     |     | Subscription| |
|  +-----------------+     +------------------+     +-------------+ |
|           |                      |                      |        |
|           v                      v                      v        |
|  +-------------------------------------------------------+       |
|  |                    COMPONENTES UI                      |       |
|  |  +-------------+  +-------------+  +---------------+   |       |
|  |  | shadcn/ui   |  | Tailwind    |  | Lucide Icons  |   |       |
|  |  | Components  |  | CSS         |  |               |   |       |
|  |  +-------------+  +-------------+  +---------------+   |       |
|  +-------------------------------------------------------+       |
|                                                                  |
+------------------------------------------------------------------+
```

### 7.2 Estructura de Rutas

| Ruta | Componente | Descripcion |
|------|------------|-------------|
| `/` | Dashboard | Pagina principal con documentos recientes |
| `/dashboard` | Dashboard | Alias de pagina principal |
| `/new` | NewAnalysis | Subir nuevo contrato para analisis |
| `/review/:documentId` | ContractReview | Revision de clausulas de un contrato |
| `/escalations` | Escalations | Gestion de escalaciones pendientes |
| `/auth` | Auth | Login/Registro |

### 7.3 Componentes Principales

#### 7.3.1 AppSidebar - Navegacion Principal

```
+---------------------------+
| [Logo] Contract Expert    |
+---------------------------+
| > Dashboard               |
| > Nuevo Analisis          |
| > Escalaciones       [!]  |
+---------------------------+
|                           |
|                           |
+---------------------------+
| Usuario: Juan Garcia      |
| Org: Despacho Legal XYZ   |
| [Cerrar sesion]           |
+---------------------------+
```

**Caracteristicas**:
- Sidebar colapsable (280px -> 56px)
- Responsive: Sheet drawer en mobile
- Indicador de escalaciones pendientes
- Informacion de usuario/organizacion

**Navegacion**:
```typescript
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new', label: 'Nuevo Analisis', icon: FilePlus },
  { href: '/escalations', label: 'Escalaciones', icon: AlertTriangle },
];
```

#### 7.3.2 ContractReview - Revision de Contrato

Layout de dos paneles:

```
+------------------------------------------------------------------+
| [<] Contrato_Amazon_PSA.docx                    [Stats] [Export] |
|     50 clausulas · 75% completado                                |
+------------------------------------------------------------------+
| [Search...]                |                                     |
| [Filter: All v]            |  DETALLE DE CLAUSULA                |
+----------------------------+                                     |
| #1 [OK] Definiciones       |  +-------------------------------+  |
|    Payment                 |  | [OK] Payment                  |  |
+----------------------------+  | Clausula #5                   |  |
| #2 [RECOMMENDED] Pagos     |  +-------------------------------+  |
|    Payment        [1 cambio]  |                                  |
+----------------------------+  | TEXTO ORIGINAL                |  |
| #3 [REQUIRED] Indemnizacion|  | Lorem ipsum dolor sit amet... |  |
|    Indemnity      [2 cambios] |                                  |
+----------------------------+  +-------------------------------+  |
| #4 [NEEDS_REVIEW] Termino  |                                     |
|    Termination             |  | CAMBIOS PROPUESTOS (2)        |  |
+----------------------------+  | +---------------------------+  |  |
| #5 [BLOCKED] Confidencial. |  | | [REPLACE]                 |  |  |
|    Confidentiality         |  | | -"immediately"            |  |  |
+----------------------------+  | | +"upon 30 days notice"    |  |  |
|                            |  | | Razon: Standard policy    |  |  |
|                            |  | | [Accept] [Reject]         |  |  |
|                            |  | +---------------------------+  |  |
+----------------------------+-------------------------------------+
```

**Componentes Internos**:

1. **ReviewSummary** - Barra de estadisticas
```typescript
const stats = [
  { label: 'Conformes', count: summary.ok_count, status: 'OK' },
  { label: 'Recomendados', count: summary.recommended_count, status: 'RECOMMENDED' },
  { label: 'Requeridos', count: summary.required_count, status: 'REQUIRED' },
  { label: 'Revision', count: summary.needs_review_count, status: 'NEEDS_REVIEW' },
  { label: 'Bloqueados', count: summary.blocked_count, status: 'BLOCKED' },
];
```

2. **ClauseListItem** - Item de lista de clausulas
```typescript
interface ClauseListItemProps {
  clause: ClauseReview;
  isSelected: boolean;
  onClick: () => void;
}
// Muestra: numero, badge estado, heading, familia, cambios pendientes
```

3. **ClauseDetailPanel** - Panel de detalle
```typescript
interface ClauseDetailPanelProps {
  clause: ClauseReview;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onEscalate: (reason: string) => void;
}
// Muestra: texto original, cambios propuestos, comentario cliente
```

#### 7.3.3 Escalations - Gestion de Escalaciones

```
+------------------------------------------------------------------+
| ESCALACIONES                                                      |
| Gestiona las clausulas que requieren revision manual              |
+------------------------------------------------------------------+
| [Pendientes: 5] [En revision: 2] [Alta urgencia: 3] [Resueltas: 8]|
+------------------------------------------------------------------+
| [Search...]                |                                      |
| [Estado: All v]            |  DETALLE ESCALACION                  |
| [Urgencia: All v]          |                                      |
+----------------------------+  +--------------------------------+   |
| +------------------------+ |  | Urgencia: Alta  Estado: Pend. |   |
| | [Alta] [Pendiente]     | |  | Escalacion #abc123             |   |
| | Clausula indemnizacion | |  | Creada por: Maria Lopez        |   |
| | Contrato_PSA.docx      | |  +--------------------------------+   |
| | "Requiere revision..." | |                                      |
| | 15 Ene 2026            | |  | MOTIVO                         |   |
| +------------------------+ |  | Clausula presenta desviacion   |   |
|                            |  | no cubierta por playbook...    |   |
| +------------------------+ |  +--------------------------------+   |
| | [Media] [En revision]  | |                                      |
| | Clausula terminacion   | |  | DOCUMENTO                      |   |
| | Contrato_DSA.docx      | |  | [Ver contrato]                 |   |
| +------------------------+ |  +--------------------------------+   |
|                            |                                      |
|                            |  | COMENTARIOS (3)                |   |
|                            |  | +----------------------------+  |   |
|                            |  | | Juan: Revisar con cliente  |  |   |
|                            |  | | 15 Ene 10:30              |  |   |
|                            |  | +----------------------------+  |   |
|                            |  | [Anadir comentario...]         |   |
|                            |  +--------------------------------+   |
|                            |                                      |
|                            |  [Rechazar] [Modificar] [Aprobar]    |
+----------------------------+--------------------------------------+
```

**Configuracion de Urgencia**:
```typescript
const URGENCY_CONFIG = {
  low: { label: 'Baja', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  medium: { label: 'Media', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { label: 'Alta', color: 'text-red-700', bgColor: 'bg-red-100' },
};
```

**Configuracion de Estados**:
```typescript
const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-700' },
  in_review: { label: 'En revision', icon: User, color: 'text-blue-700' },
  resolved: { label: 'Resuelta', icon: CheckCircle, color: 'text-green-700' },
  rejected: { label: 'Rechazada', icon: AlertTriangle, color: 'text-red-700' },
};
```

#### 7.3.4 RedlineViewer - Visor de Cambios

Componente especializado para mostrar cambios propuestos estilo "track changes":

```
+------------------------------------------------------------------+
| 2 cambios: [1 pendiente] [1 aceptado]                            |
+------------------------------------------------------------------+
| [Eliminar] [Insertar] [Click para ver opciones]                  |
+------------------------------------------------------------------+
|                                                                  |
| The Producer shall indemnify Amazon                              |
| [immediately]strikethrough [upon 30 days written notice]green    |
| for any claims arising from...                                   |
|                                                                  |
+------------------------------------------------------------------+
```

**Tipos de Segmento**:
```typescript
type SegmentType =
  | 'unchanged'      // Texto sin cambios
  | 'deleted'        // Texto eliminado (tachado rojo)
  | 'inserted'       // Texto insertado (subrayado verde)
  | 'replaced-old'   // Texto reemplazado original (tachado)
  | 'replaced-new';  // Texto reemplazado nuevo (subrayado)
```

**Estilos Visuales**:
```typescript
// Deleted/Replaced-old
'line-through bg-red-100 text-red-700 decoration-red-500'

// Inserted/Replaced-new
'underline decoration-2 bg-green-100 text-green-700 decoration-green-500'

// Aceptado
'bg-green-50 text-green-600'

// Rechazado
'bg-gray-100 text-gray-400 line-through'
```

### 7.4 Sistema de Estados (ClauseStatus)

```typescript
export const CLAUSE_STATUS_CONFIG: Record<ClauseStatus, ClauseStatusConfig> = {
  OK: {
    label: 'Conforme',
    icon: 'check',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    description: 'Esta clausula cumple con los requisitos',
  },
  RECOMMENDED: {
    label: 'Recomendado',
    icon: 'info',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    description: 'Se sugieren mejoras opcionales',
  },
  REQUIRED: {
    label: 'Cambio requerido',
    icon: 'alert-circle',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    description: 'Se recomienda aplicar el cambio propuesto',
  },
  NEEDS_REVIEW: {
    label: 'Pendiente revision',
    icon: 'eye',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    description: 'Esta clausula requiere revision manual',
  },
  BLOCKED: {
    label: 'Bloqueado',
    icon: 'ban',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Esta clausula impide la exportacion',
  },
};
```

### 7.5 Tipologias de Contrato Soportadas

```typescript
export const CONTRACT_TYPOLOGY_CONFIG = {
  amazon_dsa: {
    label: 'DSA - Streaming Platform',
    description: 'Digital Service Agreement para plataformas de streaming',
    families: ['Payment', 'Reps', 'Indemnity', 'Termination', 'IP', 'Confidentiality'],
    icon: 'play-circle',
  },
  amazon_psa: {
    label: 'PSA - Streaming Platform',
    description: 'Production Service Agreement para contenido',
    families: ['Payment', 'Reps', 'Indemnity', 'Termination', 'IP', 'Confidentiality'],
    icon: 'film',
  },
  nueva_planta: {
    label: 'Proyecto Nueva Planta (EPC)',
    description: 'Contratos de construccion de instalaciones desde cero',
    families: [
      'PrecioPagos', 'AlcanceTrabajo', 'Responsabilidades', 'EntregablesHitos',
      'TerminacionRescision', 'GarantiasPostventa', 'LimitesResponsabilidad', 'FuerzaMayor'
    ],
    icon: 'building-2',
  },
  nda: {
    label: 'NDA - Confidencialidad',
    description: 'Acuerdos de confidencialidad y no divulgacion',
    families: ['Confidentiality', 'Term', 'Exclusions', 'Remedies'],
    icon: 'lock',
  },
  servicios: {
    label: 'Contrato de Servicios',
    description: 'Contratos de prestacion de servicios profesionales',
    families: ['Scope', 'Payment', 'Term', 'Liability', 'IP'],
    icon: 'briefcase',
  },
};
```

### 7.6 Hooks de Datos (React Query + Supabase)

#### useClauseReviews
```typescript
// Fetch clausulas de un documento con realtime
export function useClauseReviews(documentId: string) {
  // Query principal
  const query = useQuery({
    queryKey: ['clause_reviews', documentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clause_reviews')
        .select('*')
        .eq('document_id', documentId)
        .order('sequence_number', { ascending: true });
      return data;
    }
  });

  // Subscripcion realtime
  useEffect(() => {
    const channel = supabase
      .channel(`clause-reviews-${documentId}`)
      .on('postgres_changes', {
        event: '*',
        table: 'clause_reviews',
        filter: `document_id=eq.${documentId}`,
      }, () => queryClient.invalidateQueries(['clause_reviews', documentId]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [documentId]);

  return query;
}
```

#### useClauseActions
```typescript
export function useClauseActions() {
  return {
    // Aceptar un cambio propuesto
    acceptChange: useMutation({
      mutationFn: ({ clauseInstanceId, changeId }) => {
        // Actualiza proposed_changes[changeId].accepted = true
      }
    }),

    // Rechazar un cambio propuesto
    rejectChange: useMutation({
      mutationFn: ({ clauseInstanceId, changeId }) => {
        // Actualiza proposed_changes[changeId].rejected = true
      }
    }),

    // Aceptar todos los cambios
    acceptAllChanges: useMutation({
      mutationFn: (clauseInstanceId) => {
        // Actualiza todos los cambios + client_state = 'OK'
      }
    }),

    // Actualizar estado de clausula
    updateClauseStatus: useMutation({
      mutationFn: ({ clauseInstanceId, status, comment }) => {
        // Actualiza client_state y opcionalmente client_comment
      }
    }),
  };
}
```

#### useEscalations
```typescript
export function useEscalations(filters: EscalationFilters) {
  return useQuery({
    queryKey: ['escalations', filters],
    queryFn: async () => {
      let query = supabase.from('escalation_requests').select('*');
      if (filters.status) query = query.in('status', filters.status);
      if (filters.urgency) query = query.in('urgency', filters.urgency);
      return (await query).data;
    }
  });
}

export function useEscalationActions() {
  return {
    resolveEscalation: useMutation({...}),
    addComment: useMutation({...}),
    createEscalation: useMutation({...}),
  };
}
```

### 7.7 Tipos TypeScript

#### ClauseReview
```typescript
export interface ClauseReview {
  clause_instance_id: string;
  clause_id: string;
  document_id: string;
  run_id: string;
  sequence_number: number;
  heading: string;
  clause_text: string;
  detected_family: string;
  confidence_score: number;
  client_state: ClauseStatus;
  client_comment: string;
  client_summary_line: string;
  proposed_changes: ProposedChange[];
  escalation_recommended: boolean;
  escalation_reason?: string;
  created_at: string;
  updated_at: string;
}
```

#### ProposedChange
```typescript
export interface ProposedChange {
  change_id: string;
  op_type: 'INSERT' | 'DELETE' | 'REPLACE';
  anchor: {
    quote: string;
    start: number;
    end: number;
  };
  original_text?: string;
  suggested_text?: string;
  reason?: string;
  rule_id?: string;
  accepted: boolean;
  rejected: boolean;
  modified_text?: string;
}
```

#### EscalationRequest
```typescript
export interface EscalationRequest {
  escalation_id: string;
  clause_instance_id: string;
  document_id: string;
  run_id: string;
  reason: string;
  context: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  assigned_to?: string;
  resolution?: string;
  resolution_notes?: string;
  created_by: string;
  created_at: string;
  resolved_at?: string;
}
```

### 7.8 Archivos del Frontend

```
lovable-files/
├── App.tsx                    # Router principal
├── AppSidebar.tsx             # Navegacion lateral
├── ContractReview.tsx         # Pagina de revision (614 lineas)
├── Escalations.tsx            # Pagina de escalaciones (551 lineas)
├── contracts.ts               # Types y configuracion (336 lineas)
├── useClauseReviews.ts        # Hooks de clausulas (447 lineas)
├── useEscalations.ts          # Hooks de escalaciones
└── review/
    └── RedlineViewer.tsx      # Componente de redlines (352 lineas)
```

### 7.9 Flujo de Interaccion Usuario

```
1. LOGIN
   Usuario -> /auth -> Supabase Auth -> Redirect /dashboard

2. NUEVO ANALISIS
   /new -> Seleccionar archivo -> Seleccionar tipo contrato
        -> Subir -> W1 webhook -> Procesando...
        -> Redirect /review/:documentId

3. REVISION DE CONTRATO
   /review/:documentId
   |
   +-> Lista de clausulas (izquierda)
   |   |-> Filtrar por estado
   |   |-> Buscar por texto
   |   +-> Click clausula -> Ver detalle
   |
   +-> Detalle de clausula (derecha)
       |-> Ver texto original
       |-> Ver cambios propuestos
       |   |-> Aceptar cambio individual
       |   |-> Rechazar cambio individual
       |   +-> Aceptar todos
       |-> Ver comentario cliente
       +-> Escalar clausula (si necesario)

4. GESTION ESCALACIONES
   /escalations
   |-> Lista de escalaciones pendientes
   |-> Filtrar por estado/urgencia
   |-> Click escalacion -> Ver detalle
   |   |-> Ver motivo
   |   |-> Ver documento relacionado
   |   |-> Anadir comentario
   |   +-> Resolver (Aprobar/Modificar/Rechazar)

5. EXPORTACION
   /review/:documentId -> [Exportar]
   |-> Verificar no hay BLOCKED
   |-> Generar DOCX con track changes
   +-> Descargar
```

---

## 8. Historias de Usuario

### 8.1 Epic: Revision de Contrato

#### US-001: Subir Contrato para Revision

**Como** abogado junior
**Quiero** subir un contrato DOCX para revision automatizada
**Para** obtener un analisis inicial antes de mi revision manual

**Criterios de Aceptacion**:
- [ ] Puedo seleccionar archivo DOCX o PDF
- [ ] Puedo seleccionar tipo de contrato (PSA, DSA, etc.)
- [ ] El sistema inicia procesamiento automaticamente
- [ ] Veo un indicador de progreso
- [ ] Recibo notificacion cuando completa

**Flujo**:
```
1. Usuario selecciona archivo
2. Usuario selecciona contract_type
3. Sistema llama W1 /file-upload
4. W1 crea document, resuelve blueprint
5. W1 llama W3 /contract-review
6. W3 extrae clausulas, llama W2 por cada una
7. W2 ejecuta pipeline 4 agentes con RAG
8. UI muestra resultados
```

---

#### US-002: Ver Resultados de Revision por Clausula

**Como** abogado junior
**Quiero** ver el resultado de revision de cada clausula
**Para** entender que cambios son necesarios

**Criterios de Aceptacion**:
- [ ] Veo lista de clausulas con estado visual (verde/amarillo/rojo)
- [ ] Cada clausula muestra:
  - Heading/titulo
  - Texto original
  - Acceptance level (ACCEPTABLE/PASSABLE/UNACCEPTABLE)
  - Client comment (sanitizado)
  - Cambios propuestos (si aplica)
- [ ] Puedo filtrar por estado
- [ ] Puedo ordenar por severidad

**Mapeo de Colores**:
| acceptance | client_state | Color | Icono |
|------------|--------------|-------|-------|
| ACCEPTABLE | OK | Verde | Check |
| PASSABLE | RECOMMENDED | Amarillo | Info |
| UNACCEPTABLE | REQUIRED | Rojo | Warning |
| N/A | NEEDS_REVIEW | Gris | Clock |
| N/A | BLOCKED | Rojo oscuro | Block |

---

#### US-003: Ver Cambios Propuestos (Redlines)

**Como** abogado junior
**Quiero** ver los cambios propuestos para clausulas inaceptables
**Para** decidir si los aplico o los modifico

**Criterios de Aceptacion**:
- [ ] Veo texto original con tachado (strikethrough)
- [ ] Veo texto propuesto en color (verde)
- [ ] Cada cambio tiene razon (reason)
- [ ] Puedo aceptar/rechazar cada cambio individualmente
- [ ] Puedo editar el texto propuesto

**Estructura de proposed_changes**:
```json
{
  "proposed_changes": [
    {
      "original": "Amazon may terminate immediately",
      "replacement": "Amazon may terminate upon 30 days written notice",
      "reason": "Standard notice period required per policy"
    }
  ]
}
```

---

#### US-004: Ver Evidencia RAG

**Como** abogado senior
**Quiero** ver que ejemplos RAG influyeron en la decision
**Para** validar que el sistema esta usando referencias correctas

**Criterios de Aceptacion**:
- [ ] Veo lista de policy_examples usados
- [ ] Cada ejemplo muestra:
  - Texto del ejemplo
  - Acceptance level
  - Similarity score
- [ ] Veo suggested_by_rag (lo que RAG sugirio)
- [ ] Veo top_similarity (mejor match)

**UI Mockup**:
```
+----------------------------------------------+
| Evidencia RAG                                |
+----------------------------------------------+
| Sugerencia RAG: ACCEPTABLE                   |
| Similitud maxima: 98.3%                      |
+----------------------------------------------+
| Ejemplos similares:                          |
| +------------------------------------------+ |
| | ACCEPTABLE (0.98)                        | |
| | "Producer grants Amazon a non-exclusive  | |
| |  license to..."                          | |
| +------------------------------------------+ |
| | PASSABLE (0.87)                          | |
| | "Producer grants Amazon rights to        | |
| |  distribute..."                          | |
| +------------------------------------------+ |
+----------------------------------------------+
```

---

### 8.2 Epic: Escalaciones

#### US-005: Ver Clausulas Escaladas

**Como** abogado senior
**Quiero** ver todas las clausulas que requieren mi atencion
**Para** priorizar mi trabajo de revision

**Criterios de Aceptacion**:
- [ ] Veo lista de clausulas con escalation_recommended=true
- [ ] Cada escalacion muestra:
  - Documento origen
  - Clausula
  - Razon de escalacion
  - Urgencia (basada en escalation_reason)
- [ ] Puedo filtrar por razon de escalacion
- [ ] Puedo asignarme una escalacion

**Razones de Escalacion**:
| Reason | Urgencia | Descripcion |
|--------|----------|-------------|
| NOT_COVERED_BY_PLAYBOOK | Alta | No hay politica definida |
| AMBIGUOUS_POLICY_JUDGMENT | Alta | Requiere juicio humano |
| UNACCEPTABLE_DEVIATION_STRICT | Media | Desviacion grave en modo estricto |
| LOW_CONFIDENCE_ANCHOR | Media | Baja confianza en ubicacion |
| LOW_CONFIDENCE_OVERALL | Baja | Baja confianza general |

---

#### US-006: Resolver Escalacion

**Como** abogado senior
**Quiero** poder aprobar o rechazar una clausula escalada
**Para** que el documento pueda avanzar

**Criterios de Aceptacion**:
- [ ] Puedo ver todo el contexto de la escalacion
- [ ] Puedo aprobar (con o sin cambios)
- [ ] Puedo rechazar (requiere redline manual)
- [ ] Puedo agregar comentario de resolucion
- [ ] El estado se actualiza en tiempo real

---

### 8.3 Epic: Configuracion de Playbook

#### US-007: Ver Materias y Tipos de Clausula

**Como** Legal Ops
**Quiero** ver la taxonomia de materias y tipos de clausula
**Para** entender como esta organizado el playbook

**Criterios de Aceptacion**:
- [ ] Veo lista de 18 materias con descripcion
- [ ] Para cada materia veo sus clause_types
- [ ] Veo estadisticas de policy_examples por materia
- [ ] Puedo expandir/colapsar secciones

**Vista Jerarquica**:
```
+ rights_ownership (Rights & Ownership)
  |-- ip_ownership (12 ejemplos)
  |-- copyright_assignment (8 ejemplos)
  |-- license_grant (15 ejemplos)
+ payment_terms (Payment Terms)
  |-- payment_schedule (10 ejemplos)
  |-- late_payment (7 ejemplos)
  ...
```

---

#### US-008: Agregar Policy Example

**Como** Legal Ops
**Quiero** agregar un nuevo ejemplo de clausula al playbook
**Para** mejorar el grounding del sistema

**Criterios de Aceptacion**:
- [ ] Puedo seleccionar matter_policy
- [ ] Puedo seleccionar clause_type
- [ ] Puedo ingresar example_text
- [ ] Debo seleccionar acceptance level
- [ ] El sistema genera embedding automaticamente
- [ ] El ejemplo esta disponible inmediatamente para RAG

**Flujo**:
```
1. Usuario navega a Configuracion > Policy Examples
2. Clic en "Agregar Ejemplo"
3. Selecciona materia y tipo
4. Pega texto de ejemplo
5. Selecciona ACCEPTABLE/PASSABLE/UNACCEPTABLE
6. Clic en "Guardar"
7. Sistema genera embedding (async)
8. Ejemplo aparece en lista
```

---

#### US-009: Ver Estadisticas de RAG

**Como** Legal Ops
**Quiero** ver metricas de uso del sistema RAG
**Para** identificar areas que necesitan mas ejemplos

**Criterios de Aceptacion**:
- [ ] Veo total de policy_examples
- [ ] Veo distribucion por acceptance level
- [ ] Veo distribucion por materia
- [ ] Veo % de ejemplos con embedding
- [ ] Veo promedio de similarity en busquedas recientes

**Dashboard**:
```
+--------------------------------------------------+
|                RAG Dashboard                      |
+--------------------------------------------------+
| Total Examples: 909                               |
| With Embeddings: 909 (100%)                       |
+--------------------------------------------------+
| Distribution by Acceptance:                       |
| ACCEPTABLE   [████████████████] 309 (34.0%)       |
| PASSABLE     [████████████████] 304 (33.4%)       |
| UNACCEPTABLE [███████████████ ] 296 (32.6%)       |
+--------------------------------------------------+
| Top Materias por ejemplos:                        |
| 1. rights_ownership: 145 ejemplos                 |
| 2. payment_terms: 98 ejemplos                     |
| 3. indemnity_prodco: 87 ejemplos                  |
+--------------------------------------------------+
```

---

### 8.4 Epic: Exportacion

#### US-010: Exportar Documento Redlineado

**Como** abogado junior
**Quiero** exportar el contrato con todos los cambios propuestos
**Para** enviarlo al cliente o a la contraparte

**Criterios de Aceptacion**:
- [ ] Puedo exportar solo si no hay escalaciones pendientes
- [ ] El documento DOCX tiene:
  - Track changes activado
  - Cambios marcados en rojo (deletion) y verde (insertion)
  - Comentarios sanitizados (sin jerga interna)
- [ ] Puedo elegir formato (DOCX con track changes, PDF clean)

---

#### US-011: Generar Reporte Ejecutivo

**Como** abogado senior
**Quiero** generar un resumen ejecutivo de la revision
**Para** presentar a stakeholders no legales

**Criterios de Aceptacion**:
- [ ] Reporte incluye:
  - Nombre del documento
  - Fecha de revision
  - Total de clausulas revisadas
  - Resumen por estado (OK/RECOMMENDED/REQUIRED)
  - Lista de cambios propuestos
  - Lista de escalaciones
- [ ] Formato PDF profesional
- [ ] No contiene informacion interna del playbook

---

## 9. Especificaciones Tecnicas

### 9.1 Stack Tecnologico

| Capa | Tecnologia | Version |
|------|------------|---------|
| Frontend | React + TypeScript | 18.x |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 3.x |
| Backend | Supabase (PostgreSQL) | latest |
| Vector DB | pgvector | 0.5+ |
| Orchestration | n8n | 1.x |
| LLM | OpenAI API | gpt-4o, gpt-4o-mini |
| Embeddings | OpenAI | text-embedding-3-small |
| Auth | Supabase Auth | built-in |

### 9.2 Variables de Entorno

```env
# Supabase
SUPABASE_URL=https://hvlsuwdqtffiilvampxq.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# Modelos
MODEL_ROUTER=gpt-4o-mini
MODEL_PARANOID=gpt-4o
MODEL_VALUATOR=gpt-4o
MODEL_SANITIZER=gpt-4o-mini
EMBED_MODEL=text-embedding-3-small
EMBED_DIM=1536

# Thresholds
TH_ANCHOR=0.85
TH_CONF_OVERALL=0.80
TH_COVERAGE=0.78
TH_RAG_SIMILARITY=0.6

# n8n
N8N_WEBHOOK_BASE=https://n8n.example.com/webhook
```

### 9.3 JSON Schemas

#### ClauseReviewOutput
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["clause_id", "acceptance", "client_state"],
  "properties": {
    "clause_id": {"type": "string"},
    "heading": {"type": "string"},
    "clause_text": {"type": "string"},
    "detected_family": {"type": "string"},
    "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
    "acceptance": {"enum": ["ACCEPTABLE", "PASSABLE", "UNACCEPTABLE"]},
    "client_state": {"enum": ["OK", "RECOMMENDED", "REQUIRED", "NEEDS_REVIEW", "BLOCKED"]},
    "client_comment": {"type": "string", "maxLength": 280},
    "client_summary_line": {"type": "string", "maxLength": 100},
    "proposed_changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "original": {"type": "string"},
          "replacement": {"type": "string"},
          "reason": {"type": "string"}
        }
      }
    },
    "evidence": {
      "type": "object",
      "properties": {
        "rag_examples_used": {"type": "array", "items": {"type": "string"}},
        "top_similarity": {"type": "number"},
        "suggested_by_rag": {"enum": ["ACCEPTABLE", "PASSABLE", "UNACCEPTABLE"]},
        "paranoid_risk": {"enum": ["RED", "AMBER", "GREEN"]},
        "valuator_confidence": {"type": "number"}
      }
    },
    "escalation_recommended": {"type": "boolean"},
    "escalation_reason": {"type": "string"}
  }
}
```

### 9.4 Indices de Base de Datos

```sql
-- policy_examples (RAG)
CREATE INDEX idx_policy_examples_embedding_hnsw
ON policy_examples USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_policy_examples_policy_idx
ON policy_examples(matter_policy_id);

CREATE INDEX idx_policy_examples_clause_type_idx
ON policy_examples(clause_type_id);

-- clause_reviews (Consultas frecuentes)
CREATE INDEX idx_clause_reviews_run
ON clause_reviews(run_id);

CREATE INDEX idx_clause_reviews_document
ON clause_reviews(document_id);

CREATE INDEX idx_clause_reviews_escalation
ON clause_reviews(escalation_recommended)
WHERE escalation_recommended = true;
```

---

## 10. Metricas y KPIs

### 10.1 Metricas de Rendimiento

| Metrica | Target | Actual |
|---------|--------|--------|
| Tiempo revision por clausula | < 10s | ~8s |
| Tiempo revision contrato completo (50 clausulas) | < 5 min | ~4 min |
| Embeddings generation (909) | < 10 min | ~5 min |
| RAG search latency | < 200ms | ~150ms |

### 10.2 Metricas de Calidad

| Metrica | Target | Medicion |
|---------|--------|----------|
| Precision de clasificacion (Router) | > 90% | Por validar |
| Recall de desviaciones (Paranoid) | > 95% | Por validar |
| Consistency con ejemplos RAG | > 85% | top_similarity promedio |
| Tasa de escalacion | < 15% | escalation_recommended / total |

### 10.3 Metricas de Negocio

| Metrica | Target | Descripcion |
|---------|--------|-------------|
| Reduccion tiempo revision | 70% | vs revision manual |
| Contratos procesados/dia | 50+ | escalabilidad |
| Satisfaccion usuario | > 4.5/5 | NPS interno |

---

## 11. Roadmap

### 11.1 Completado (v2.1) ✅

**Backend & RAG**:
- [x] Arquitectura 3 capas implementada
- [x] Dataset expandido: **1,367 policy_examples**
- [x] Taxonomia completa: **24 matters**, **95 clause_types**
- [x] Embeddings 100% generados (text-embedding-3-small)
- [x] RAG funcional con `search_policy_examples()`
- [x] W2 refactorizado con RAG integration
- [x] 4 agentes con contexto RAG
- [x] Evidencia RAG guardada en clause_reviews

**Edge Functions**:
- [x] 9 Edge Functions desplegadas y activas
- [x] `start_review` - Iniciar revision
- [x] `update_run_status` - Webhook retorno n8n
- [x] `generate_export` - Exportacion Markdown
- [x] `monitoring` - Dashboard metricas
- [x] `request_review` - Solicitar revision humana
- [x] `export_doc` - Exportar DOCX
- [x] `n8n-proxy` - Proxy seguro n8n

**Seguridad & Testing**:
- [x] Row Level Security en 8 tablas
- [x] Sistema de superusuarios (bypass RLS)
- [x] Tests E2E completos: **9/9 pasados**
- [x] Auditoria con `audit_events`
- [x] Leakage protection (Sanitizer blocklist)

**Frontend**:
- [x] Frontend Lovable funcional
- [x] NewAnalysis - Subir contratos
- [x] ContractReview - Revisar clausulas
- [x] Escalations - Gestion escalaciones
- [x] ConfigKnowledgeGraph - Visualizar taxonomia

### 11.2 En Progreso (v2.2) 🔄

- [ ] Visualizacion interactiva Knowledge Graph
- [ ] Exportacion DOCX con track changes (Aspose produccion)
- [ ] CI/CD con tests automaticos
- [ ] UI para ver evidencia RAG detallada

### 11.3 Proximo (v2.3) 📋

- [ ] Multi-tenant con organizaciones
- [ ] Dashboard analytics avanzado
- [ ] Integracion Slack para escalaciones
- [ ] CRUD de policy_examples en UI
- [ ] Auto-regeneracion de embeddings en cambios

### 11.4 Futuro (v3.0) 🚀

- [ ] API publica documentada (OpenAPI)
- [ ] GraphRAG para dependencias entre clausulas
- [ ] Multi-language support (EN/ES)
- [ ] Fine-tuning de embeddings domain-specific
- [ ] A/B testing de prompts
- [ ] Modelo on-premise (sin OpenAI)

---

## Apendices

### A. Glosario

| Termino | Definicion |
|---------|------------|
| **Blueprint** | Coleccion versionada de politicas por materia |
| **Matter** | Categoria juridica de alto nivel (ej: indemnity) |
| **Clause Type** | Subcategoria dentro de una materia (ej: indemnity_prodco) |
| **Policy Example** | Texto de ejemplo clasificado por aceptabilidad |
| **Fallback Clause** | Texto template para proponer como redline |
| **RAG** | Retrieval Augmented Generation |
| **Embedding** | Vector numerico que representa semantica del texto |
| **HNSW** | Hierarchical Navigable Small World (algoritmo de busqueda) |

### B. Referencias

- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [pgvector](https://github.com/pgvector/pgvector)
- [Supabase](https://supabase.com/docs)
- [n8n](https://docs.n8n.io/)

---

*Documento generado: Enero 2026*
*Ultima actualizacion: 2026-01-27 | Contract Guardian v2.1*
*RAG: 1,367 policy_examples | Edge Functions: 9 activas | Tests E2E: 9/9 pasados*
