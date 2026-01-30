## Análisis de Alineación: PRD Contract Guardian v2.0 vs Arquitectura Diseñada

A continuación presento una evaluación exhaustiva de cómo la PRD implementada se alinea con los objetivos y arquitectura del redliner que diseñamos. El análisis está organizado por dimensiones clave.

### Resumen Ejecutivo

| Dimensión | Alineación | Estado |
|-----------|------------|--------|
| Pipeline multiagente | ✅ Alta | 4 agentes implementados correctamente |
| Separación Internal/Client | ⚠️ Parcial | Sanitizer existe pero faltan controles |
| RAG/PolicySpec | ⚠️ Parcial | RAG funciona pero no hay PolicySpec gobernado |
| Decisor determinista | ✅ Alta | Matriz implementada con thresholds |
| Modelo de datos | ⚠️ Parcial | Falta PolicySpec, VariationSet estructurado |
| UX Cliente/Despacho | ✅ Alta | Separación clara de pantallas |
| Completeness Checker | ❌ Ausente | No mencionado |
| GraphRAG | ❌ Ausente | Roadmap futuro |
| Anonimización | ❌ Ausente | No implementado |

### Análisis Detallado por Componente

## 1) Pipeline Multiagente

**Diseñado:**
Router → Context Retriever (PolicySpec/VariationSet) → Paranoid → Valuator → Validator determinista → Decisor → Sanitizer

**Implementado:**
Embedding → RAG Search → Router → Paranoid → Valuator → Decisor → Sanitizer

| Agente | Diseño | Implementación | Gap |
|--------|--------|----------------|-----|
| Router | Clasificar en familias + candidatos rule_id | Clasifica en 24 matters | ⚠️ No devuelve rule_candidates[] ni coverage_confidence |
| Context Retriever | Recuperar PolicySpec + VariationSet + GraphCtx | RAG genérico por similarity | ❌ No hay PolicySpec estructurado |
| Paranoid | observations[] con quote+offsets+change_type+possible_category | evidence_spans[] con quote+issue+severity | ⚠️ Falta offsets reproducibles y change_type enum |
| Valuator | final_status + proposed_changes con anchors + source_reference | acceptance + proposed_changes | ⚠️ Falta source_reference y anchor_confidence |
| Validator determinista | No new text + anchor confidence | No implementado como paso separado | ❌ Ausente |
| Decisor | Matriz con required/routing_policy/analysis_mode | Matriz simplificada | ⚠️ Falta routing_policy y analysis_mode |
| Sanitizer | blocked_terms + leak_score + policy_leak_flags + redactions | Blocklist básica | ⚠️ Falta leak_score y safety_pass estructurado |

**Recomendación crítica:** Añadir el Validator determinista entre Valuator y Decisor para garantizar "no new text" y validar anchor_confidence.

## 2) Modelo de Datos

**Diseñado:**

| Tabla | Propósito |
|-------|-----------|
| policy_specs | PolicySpec por regla con required, analysis_mode, routing_policy, thresholds |
| variation_set | Ejemplos etiquetados STANDARD/ACCEPTABLE/UNACCEPTABLE/NOT_COVERED |
| clause_reviews_internal | Observaciones, anchors, source_reference (no expuesto) |
| sanitizer_outputs | client_comment, safety_pass, leak_score (expuesto) |

**Implementado:**

| Tabla | Estado | Gap |
|-------|--------|-----|
| policy_examples | ✅ 1,367 ejemplos con embeddings | ⚠️ No tiene structure de VariationSet (falta category NOT_COVERED, origin synthetic/real) |
| matter_policies | ✅ Existe | ⚠️ Falta routing_policy, analysis_mode, decision_policy |
| clause_reviews | ✅ Una sola tabla | ❌ Mezcla internal y client; no hay separación |
| policy_specs | ❌ No existe | Crítico para gobernanza |

**Brecha principal:** No existe PolicySpec como estructura gobernada. Los "matter_policies" tienen policy_config y agent_config genéricos, pero no los campos específicos que diseñamos (required, analysis_mode, routing_policy, standard_position, acceptable_variations, anchors).

## 3) Sistema RAG vs PolicySpec/VariationSet

**Diseñado:**
- PolicySpec por regla con textos estándar/fallback versionados
- VariationSet con ejemplos etiquetados (STANDARD, ACCEPTABLE, UNACCEPTABLE, NOT_COVERED)
- Retrieval gobernado: solo traer PolicySpec y ejemplos de la regla activa
- source_reference obligatorio en proposed_changes

**Implementado:**
- policy_examples con acceptance_level (ACCEPTABLE, PASSABLE, UNACCEPTABLE)
- Búsqueda por similarity genérica (top 10)
- Sin restricción por regla activa
- Sin source_reference en proposed_changes

| Aspecto | Diseño | Implementación | Gap |
|---------|--------|----------------|-----|
| Etiquetas de ejemplos | STANDARD, ACCEPTABLE, UNACCEPTABLE, NOT_COVERED | ACCEPTABLE, PASSABLE, UNACCEPTABLE | ❌ Falta STANDARD y NOT_COVERED |
| Origen de ejemplos | synthetic / real_validated | No registrado | ❌ |
| Retrieval gobernado | Por rule_id activo | Por similarity global | ⚠️ Puede traer ejemplos de otras reglas |
| source_reference | Obligatorio en proposed_changes | No existe | ❌ Crítico para "no new text" |
| Texto estándar | standard_position en PolicySpec | No existe | ❌ |

**Recomendación:** Añadir category = "STANDARD" en policy_examples para los textos canónicos del playbook. Añadir origin (synthetic/real) y rule_id para retrieval gobernado.

## 4) Matriz de Decisión Determinista

**Diseñado:**

| final_status | anchor_confidence | routing_policy | decision |
|--------------|-------------------|----------------|----------|
| NotCoveredByPlaybook | - | - | ESCALATE_HUMAN |
| Ambiguous | - | - | ESCALATE_HUMAN |
| UnacceptableDeviation | ≥ TH_ANCHOR | ESCALATE | ESCALATE_HUMAN |
| UnacceptableDeviation | ≥ TH_ANCHOR | otros | AUTO_REDLINEDRAFT |
| UnacceptableDeviation | < TH_ANCHOR | - | ESCALATE_HUMAN |
| AcceptableDeviation | ≥ TH_CONF | ESCALATE_IF_CHANGE | ESCALATE_HUMAN |
| AcceptableDeviation | ≥ TH_CONF | otros | AUTO_PASS |
| Compliant | - | ESCALATE | ESCALATE_HUMAN |
| Compliant | - | otros | AUTO_PASS |

**Implementado (PRD §4.3):**

| acceptance | confidence | anchor_conf | Acción |
|------------|------------|-------------|--------|
| ACCEPTABLE | >= 0.7 | N/A | AUTO_PASS |
| ACCEPTABLE | < 0.7 | N/A | ESCALATE_HUMAN |
| PASSABLE | >= 0.5 | N/A | AUTO_PASS + RECOMMENDED |
| UNACCEPTABLE | >= 0.7 | >= 0.85 | AUTO_REDLINE |
| UNACCEPTABLE | >= 0.7 | < 0.85 | ESCALATE_HUMAN |
| NotCovered | N/A | N/A | ESCALATE_HUMAN + block_export |

**Análisis:**
- ✅ Thresholds configurados (TH_ANCHOR=0.85, TH_CONF_OVERALL=0.80)
- ✅ Manejo de NotCovered y Ambiguous
- ⚠️ Falta routing_policy (ESCALATE, ESCALATE_IF_CHANGE, ESCALATE_IF_UNACCEPTABLE)
- ⚠️ Falta analysis_mode (MODE_STRICT_NO_DEVIATIONS no está implementado)
- ⚠️ Falta required (bool) por regla para block_export condicional

## 5) Separación Internal vs Client-Facing

**Diseñado:**
- Tablas separadas: clause_reviews_internal (no expuesto) + sanitizer_outputs (expuesto)
- Sanitizer con: blocked_terms_detected[], leak_score, policy_leak_flags[], redactions[], safety_pass
- Si safety_pass = false → BLOCK_EXPORT o ESCALATE_HUMAN

**Implementado:**
- Una sola tabla clause_reviews con campos mezclados
- Sanitizer con blocklist básica
- Sin leak_score ni policy_leak_flags estructurados

| Aspecto | Diseño | Implementación | Gap |
|---------|--------|----------------|-----|
| Tablas separadas | clause_reviews_internal + sanitizer_outputs | Una sola tabla | ❌ |
| Blocklist | Amplia y configurable | Hardcoded en prompt | ⚠️ |
| leak_score | Numérico + threshold | No existe | ❌ |
| policy_leak_flags | Enum array | No existe | ❌ |
| safety_pass | Boolean que bloquea export | No existe | ❌ |
| redactions | Array de {from, to} | No existe | ❌ |

**Recomendación:** Separar clause_reviews en internal/external o añadir flag audience = 'internal' | 'client'. Implementar SanitizerOutput completo con safety checks.

## 6) Completeness Checker (Contrato)

**Diseñado:**
- Verificar que todas las reglas required del playbook estén cubiertas
- Si falta → ESCALATE_HUMAN con reason = MISSING_REQUIRED_CLAUSE
- Opción de auto-insertar si insert_if_missing = true en PolicySpec

**Implementado:**
- ❌ No mencionado en la PRD
- No hay concepto de "required" por regla
- No hay verificación a nivel contrato

**Brecha crítica:** Sin Completeness Checker, un contrato puede exportarse aunque le falten cláusulas requeridas.

## 7) Offsets y Anchors Reproducibles

**Diseñado:**
- observations[] con quote + offsets{start, end} exactos
- proposed_changes con anchor{quote, offsets, anchor_confidence}
- Validador determinista verifica que anchor.quote existe en clause_text

**Implementado:**
- evidence_spans con quote + issue + severity (sin offsets)
- proposed_changes con original + replacement + reason (sin anchor)

**Brecha:** Sin offsets reproducibles, no se puede:
1. Validar que el anchor existe en el texto
2. Aplicar cambios con precisión en el DOCX
3. Calcular anchor_confidence real

## 8) Anonimización

**Diseñado:**
- Tres modos: OFF, DISPLAY_ONLY, FULL
- party_aliases en documents
- Tipologías sin nombres de cliente ("DSA – Streaming Platform (v1)")

**Implementado:**
- ❌ No mencionado en la PRD
- Tipología aún dice "Amazon" en varios lugares

## 9) UX Cliente vs Despacho

**Diseñado:**
- Cliente: Dashboard, Upload, Vista 3 columnas, Export
- Despacho: Consola con PolicySpec UI, VariationSet Manager, métricas

**Implementado:**
- ✅ Cliente: Dashboard, NewAnalysis, ContractReview, Export
- ✅ Despacho: Escalations, métricas básicas
- ⚠️ Falta: PolicySpec UI, VariationSet Manager, vista de evidencia RAG detallada

## 10) Observabilidad y Auditoría

**Diseñado:**
- Logs estructurados por agente (latency, token_usage)
- audit_events con audience = internal | client
- Métricas: leakage_rate, anchor_confidence distribution, escalation_rate

**Implementado:**
- ✅ audit_events existe
- ✅ Vistas de monitoring (monitoring_overview, monitoring_rag_stats)
- ⚠️ Falta audience en audit_events
- ⚠️ Falta leakage_rate como KPI

### Gaps Críticos (Prioridad Alta)

| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| PolicySpec no existe | No hay gobernanza por regla; no se puede implementar "no new text" ni routing_policy | Alto |
| Validator determinista ausente | Texto inventado puede llegar al cliente | Medio |
| source_reference no existe | No se puede validar que proposed_changes viene del estándar | Medio |
| Offsets/anchors no implementados | Cambios no son reproducibles; export DOCX impreciso | Alto |
| Completeness Checker ausente | Contratos incompletos pueden exportarse | Medio |
| Separación tablas internal/client | Riesgo de exponer datos internos | Medio |
| Sanitizer sin safety_pass | No hay bloqueo automático si hay fuga | Bajo |

### Gaps Menores (Prioridad Media)

| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| NOT_COVERED no existe en policy_examples | Sistema no puede entrenar comportamiento de escalado | Bajo |
| origin (synthetic/real) no existe | No se puede distinguir ejemplos validados de generados | Bajo |
| Anonimización no implementada | Demos y pilotos exponen nombres | Medio |
| routing_policy/analysis_mode ausentes | Todas las reglas se tratan igual | Medio |
| GraphRAG ausente | Dependencias/definiciones no se resuelven | Alto (roadmap) |

### Recomendaciones de Implementación

# Especificación Técnica Detallada
## Contract Expert — Playbook-Driven Redliner

**Versión:** 1.0
**Estado:** Para implementación
**Referencia:** PRD v1.1
**Objetivo:** Cerrar gaps entre implementación actual y arquitectura objetivo

---

## Índice

1. Gap Analysis: Estado actual vs Estado objetivo
2. Modelo de datos (DDL Supabase)
3. PolicySpec y VariationSet
4. Flujos n8n
5. Agentes: Prompts y Schemas
6. Validadores deterministas
7. Edge Functions
8. Extractor de cláusulas
9. DocxMaker Service
10. Realtime y subscripciones
11. Observabilidad
12. Configuración y thresholds
13. Plan de migración

---

## 1. Gap Analysis: Estado actual vs Estado objetivo

### 1.1 Resumen de gaps críticos

| Componente | Estado actual | Estado objetivo | Prioridad | Esfuerzo |
|------------|---------------|-----------------|-----------|----------|
| PolicySpec | No existe | Tabla + retrieval gobernado | P0 | Alto |
| VariationSet | No existe | Tabla + embeddings + retrieval | P0 | Alto |
| Context Retriever | No existe | Nodo n8n entre Router y Paranoid | P0 | Medio |
| Paranoid output | Sin offsets/anchors | Con offsets reproducibles | P0 | Medio |
| Valuator output | Sin source_reference | Con anchors + source_reference | P0 | Medio |
| Validador determinista | No existe | Nodo código post-Valuator | P0 | Medio |
| Decisor determinista | Implícito en Valuator | Nodo separado con matriz | P0 | Bajo |
| Sanitizer output | Básico | Con safety completo | P1 | Bajo |
| clause_reviews | Campos básicos | Campos completos de auditoría | P0 | Medio |
| Completeness Checker | No existe | Nodo contract-level | P1 | Medio |
| Realtime channels | No implementado | Subscripciones definidas | P1 | Bajo |
| Historial de runs | Parcial | Completo con comparativa | P2 | Medio |

### 1.2 Arquitectura objetivo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (vercel read)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Dashboard  │  │   Upload    │  │ Vista 3-Col │  │  Consola Despacho   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS (Supabase)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │start_review │  │request_revw │  │ export_doc  │  │   admin_actions     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            n8n WORKFLOWS                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    W1_DriveIngest (existente)                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    W2_ClauseReview (por familia)                     │    │
│  │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌───────┐ │    │
│  │  │ Router │→│Retriever│→│Paranoid│→│Valuator│→│Validator│→│Decisor│ │    │
│  │  └────────┘ └─────────┘ └────────┘ └────────┘ └─────────┘ └───┬───┘ │    │
│  │                                                               │     │    │
│  │  ┌─────────┐ ┌─────────┐                                      │     │    │
│  │  │Sanitizer│→│ Persist │◄─────────────────────────────────────┘     │    │
│  │  └─────────┘ └─────────┘                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    W3_ContractReview (orchestrator)                  │    │
│  │  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌───────────────────┐  │    │
│  │  │ Extract  │→│ Loop W2    │→│Completeness │→│ Contract Decisor  │  │    │
│  │  │ Clauses  │ │ per clause │ │   Checker   │ │   + DocxMaker     │  │    │
│  │  └──────────┘ └────────────┘ └─────────────┘ └───────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Postgres + pgvector                          │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │    │
│  │  │  Core Tables   │  │ Internal Only  │  │   Client-Facing        │ │    │
│  │  │  (documents,   │  │ (policy_specs, │  │   (sanitizer_outputs,  │ │    │
│  │  │   runs, etc.)  │  │  variation_set,│  │    client views)       │ │    │
│  │  │                │  │  clause_reviews│  │                        │ │    │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐     │
│  │     Storage     │  │    Realtime     │  │       Auth + RLS        │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo de datos (DDL Supabase)

### 2.1 Schema principal

```sql
-- ============================================================================
-- EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM ('client_user', 'inhouse_counsel', 'firm_admin');
CREATE TYPE anonymization_mode AS ENUM ('OFF', 'DISPLAY_ONLY', 'FULL');
CREATE TYPE analysis_mode AS ENUM (
  'MODE_STRICT_NO_DEVIATIONS',
  'MODE_ENUMERATED_DEVIATIONS',
  'MODE_POLICY_JUDGMENT_REQUIRED'
);
CREATE TYPE routing_policy_type AS ENUM (
  'AUTO_ACCEPT',
  'ESCALATE',
  'ESCALATE_IF_CHANGE',
  'ESCALATE_IF_UNACCEPTABLE',
  'NONE'
);
CREATE TYPE final_status AS ENUM (
  'Compliant',
  'AcceptableDeviation',
  'UnacceptableDeviation',
  'NotCoveredByPlaybook',
  'Ambiguous'
);
CREATE TYPE contract_decision AS ENUM (
  'PROCESSING',
  'AUTO_PASS',
  'AUTO_REDLINEDRAFT',
  'ESCALATE_HUMAN',
  'BLOCK_EXPORT',
  'READY_FOR_EXPORT',
  'FAILED'
);
CREATE TYPE clause_decision AS ENUM (
  'AUTO_PASS',
  'AUTO_REDLINEDRAFT',
  'ESCALATE_HUMAN',
  'BLOCK_EXPORT',
  'LOG_ONLY'
);
CREATE TYPE escalation_reason AS ENUM (
  'WITH_LEGAL_APPROVAL_REQUIRED',
  'NOT_COVERED_BY_PLAYBOOK',
  'AMBIGUOUS_POLICY_JUDGMENT',
  'UNACCEPTABLE_DEVIATION_STRICT',
  'LOW_CONFIDENCE_ANCHOR',
  'LOW_CONFIDENCE_OVERALL',
  'MISSING_REQUIRED_CLAUSE',
  'VALIDATION_ERROR',
  'LEAKAGE_DETECTED'
);
CREATE TYPE change_action_type AS ENUM ('insert', 'replace', 'delete', 'comment_only');
CREATE TYPE source_type AS ENUM ('STANDARD_POSITION', 'FALLBACK_ACCEPTABLE');
CREATE TYPE variation_category AS ENUM ('STANDARD', 'ACCEPTABLE', 'UNACCEPTABLE', 'NOT_COVERED');
CREATE TYPE variation_origin AS ENUM ('synthetic', 'real_validated', 'manual');
CREATE TYPE audit_audience AS ENUM ('internal', 'client');

-- ============================================================================
-- ORGANIZACIONES Y USUARIOS
-- ============================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  alias_display_name TEXT, -- Para anonimización
  anonymization_mode anonymization_mode DEFAULT 'OFF',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client_user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ============================================================================
-- TIPOLOGÍAS Y PLAYBOOKS
-- ============================================================================
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- ej: 'PB_DSA_V1'
  display_name TEXT NOT NULL, -- ej: 'DSA – Streaming Platform (v1)'
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  contract_review_webhook_url TEXT NOT NULL,
  clause_review_webhook_url TEXT NOT NULL,
  request_review_webhook_url TEXT,
  export_webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  playbook_id UUID NOT NULL REFERENCES playbooks(id),
  workflow_route_id UUID NOT NULL REFERENCES workflow_routes(id),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POLICY SPECS (INTERNO - NUNCA EXPONER A CLIENTE)
-- ============================================================================
CREATE TABLE policy_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL, -- ej: 'PB:v2026-01:Indemnity-ProdCo-Core'
  clause_family TEXT NOT NULL, -- ej: 'IndemnityProdCo'
  required BOOLEAN DEFAULT true,
  analysis_mode analysis_mode NOT NULL,
  
  -- Textos de referencia (NUNCA exponer)
  standard_position JSONB NOT NULL, -- array de textos canónicos
  acceptable_variations JSONB DEFAULT '[]', -- array de fallbacks permitidos
  unacceptable_variations JSONB DEFAULT '[]', -- patrones prohibidos
  guidance_internal TEXT, -- notas internas
  
  -- Configuración de retrieval
  retrieval_profile JSONB DEFAULT '{
    "vector_top_k": 3,
    "coverage_threshold": 0.78,
    "examples_top_k": 6
  }',
  
  -- Configuración de routing
  routing_policy JSONB DEFAULT '{
    "type": "ESCALATE_IF_UNACCEPTABLE",
    "target_group": "AmazonLegal",
    "block_export": true
  }',
  
  -- Configuración de decisión
  decision_policy JSONB DEFAULT '{
    "auto_redline_if_unacceptable": true,
    "anchor_conf_threshold": 0.85,
    "escalate_if_ambiguous": true,
    "block_export_if_escalated": true
  }',
  
  -- Modelos por etapa
  models JSONB DEFAULT '{
    "paranoid": "gpt-4o",
    "valuator": "gpt-4o-mini",
    "sanitizer": "gpt-4o-mini"
  }',
  
  -- Anclas semánticas para detección
  anchors JSONB DEFAULT '[]', -- ej: ["incumplimiento material no subsanado", "a opción de Amazon"]
  
  -- Dependencias GraphRAG
  definitions_scope JSONB DEFAULT '{
    "defined_terms": [],
    "cross_refs": []
  }',
  
  -- Extensiones por familia
  family_extensions JSONB DEFAULT '{}',
  
  -- Metadata
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(playbook_id, rule_id)
);

-- Índice para búsqueda por familia
CREATE INDEX idx_policy_specs_family ON policy_specs(playbook_id, clause_family);

-- ============================================================================
-- VARIATION SET (INTERNO - EJEMPLOS PARA RAG)
-- ============================================================================
CREATE TABLE variation_set (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_spec_id UUID NOT NULL REFERENCES policy_specs(id) ON DELETE CASCADE,
  category variation_category NOT NULL,
  text TEXT NOT NULL,
  text_normalized TEXT, -- para matching
  origin variation_origin NOT NULL DEFAULT 'synthetic',
  metadata JSONB DEFAULT '{}', -- cambio aplicado, contexto, etc.
  embedding VECTOR(1536), -- para retrieval semántico
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índice para búsqueda vectorial
CREATE INDEX idx_variation_set_embedding ON variation_set 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índice para filtrado
CREATE INDEX idx_variation_set_policy ON variation_set(policy_spec_id, category, is_active);

-- ============================================================================
-- DOCUMENTOS Y VERSIONES
-- ============================================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_type_id UUID NOT NULL REFERENCES contract_types(id),
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- path en Supabase Storage
  storage_path_anonymized TEXT, -- versión anonimizada (si FULL)
  file_type TEXT NOT NULL, -- 'docx' | 'pdf'
  file_size_bytes INTEGER,
  anonymization_mode anonymization_mode DEFAULT 'OFF',
  party_aliases JSONB DEFAULT '{}', -- {"ClientParty": "PlatformCo", ...}
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuarios solo ven documentos de su organización
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org documents" ON documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONTRACT RUNS
-- ============================================================================
CREATE TABLE contract_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  run_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PROCESSING', -- para Realtime simple
  contract_decision contract_decision DEFAULT 'PROCESSING',
  
  -- Progreso
  total_clauses INTEGER DEFAULT 0,
  processed_clauses INTEGER DEFAULT 0,
  
  -- Contadores por estado
  clauses_ok INTEGER DEFAULT 0,
  clauses_redline INTEGER DEFAULT 0,
  clauses_escalated INTEGER DEFAULT 0,
  clauses_blocked INTEGER DEFAULT 0,
  
  -- Resultados
  missing_required JSONB DEFAULT '[]', -- familias/reglas faltantes
  completeness_check_passed BOOLEAN,
  
  -- Tiempos
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Errores
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para historial
CREATE INDEX idx_runs_document ON contract_runs(document_id, run_number DESC);

-- RLS
ALTER TABLE contract_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org runs" ON contract_runs
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- CLAUSE INSTANCES (extraídas del documento)
-- ============================================================================
CREATE TABLE clause_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  heading TEXT,
  heading_level INTEGER, -- 1-4
  
  -- Texto
  text_raw TEXT NOT NULL, -- con formato original
  text_normalized TEXT NOT NULL, -- limpio para análisis
  
  -- Offsets para reconstrucción
  offsets_map JSONB, -- mapeo normalizado → original
  start_offset INTEGER,
  end_offset INTEGER,
  
  -- Clasificación inicial (del extractor)
  detected_family TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clauses_document ON clause_instances(document_id, sequence_number);

-- ============================================================================
-- CLAUSE REVIEWS (INTERNO - AUDITORÍA COMPLETA)
-- ============================================================================
CREATE TABLE clause_reviews_internal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES contract_runs(id) ON DELETE CASCADE,
  clause_instance_id UUID NOT NULL REFERENCES clause_instances(id),
  
  -- Clasificación
  detected_family TEXT NOT NULL,
  rule_id TEXT, -- puede ser null si NotCovered
  rule_version TEXT,
  analysis_mode analysis_mode,
  
  -- Router output
  router_candidates JSONB, -- [{rule_id, score}]
  coverage_confidence NUMERIC(4,3),
  
  -- Paranoid output
  observations JSONB, -- array completo de observations
  observations_count INTEGER DEFAULT 0,
  
  -- Valuator output
  final_status final_status NOT NULL,
  proposed_changes JSONB DEFAULT '[]', -- con anchors y source_reference
  
  -- Confidencias
  anchor_confidence NUMERIC(4,3),
  confidence_overall NUMERIC(4,3),
  
  -- Decisión
  decision clause_decision NOT NULL,
  escalation_recommended BOOLEAN DEFAULT false,
  escalation_reason escalation_reason,
  block_export BOOLEAN DEFAULT false,
  
  -- Dependencias (GraphRAG)
  dependencies JSONB DEFAULT '[]',
  
  -- Validación
  validation_passed BOOLEAN,
  validation_errors JSONB,
  
  -- Auditoría
  evidence_spans JSONB, -- spans usados para la decisión
  processing_time_ms INTEGER,
  token_usage JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_run ON clause_reviews_internal(run_id);
CREATE INDEX idx_reviews_status ON clause_reviews_internal(run_id, final_status);

-- ============================================================================
-- SANITIZER OUTPUTS (CLIENT-FACING)
-- ============================================================================
CREATE TABLE sanitizer_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_review_id UUID NOT NULL REFERENCES clause_reviews_internal(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES contract_runs(id) ON DELETE CASCADE,
  clause_instance_id UUID NOT NULL REFERENCES clause_instances(id),
  
  -- Output client-facing
  client_summary_line TEXT, -- una línea para lista
  client_comment TEXT, -- comentario para DOCX
  
  -- Estado UX (para semáforo)
  client_status TEXT NOT NULL, -- 'ok', 'adjustment', 'change_required', 'review', 'blocked'
  
  -- Cambios propuestos (sin internals)
  proposed_changes_client JSONB DEFAULT '[]', -- solo action + texto, sin source_reference
  
  -- Safety
  safety_pass BOOLEAN NOT NULL DEFAULT true,
  blocked_terms_detected JSONB DEFAULT '[]',
  leak_score NUMERIC(4,3) DEFAULT 0,
  policy_leak_flags JSONB DEFAULT '[]',
  redactions JSONB DEFAULT '[]',
  
  -- Locale
  locale TEXT DEFAULT 'es-ES',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sanitizer_run ON sanitizer_outputs(run_id);

-- RLS: clientes solo ven sanitizer_outputs, nunca clause_reviews_internal
ALTER TABLE sanitizer_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org sanitizer outputs" ON sanitizer_outputs
  FOR SELECT USING (
    run_id IN (
      SELECT cr.id FROM contract_runs cr
      JOIN documents d ON cr.document_id = d.id
      WHERE d.organization_id IN (
        SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- EXCEPCIONES Y OVERRIDES
-- ============================================================================
CREATE TABLE exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES contract_runs(id),
  clause_review_id UUID REFERENCES clause_reviews_internal(id),
  
  -- Tipo de acción
  action_type TEXT NOT NULL, -- 'approve_exception', 'promote_acceptable', 'adjust_rule'
  
  -- Detalles
  note TEXT,
  justification TEXT,
  
  -- Si promueve a acceptable
  promoted_to_variation_id UUID REFERENCES variation_set(id),
  
  -- Auditoría
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT EVENTS
-- ============================================================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  run_id UUID REFERENCES contract_runs(id),
  clause_review_id UUID REFERENCES clause_reviews_internal(id),
  
  -- Clasificación
  event_type TEXT NOT NULL, -- 'router', 'paranoid', 'valuator', 'validator', 'decisor', 'sanitizer', 'completeness', 'export', 'error', 'exception'
  audience audit_audience NOT NULL DEFAULT 'internal',
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Metadata
  agent_name TEXT,
  latency_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_run ON audit_events(run_id, event_type);
CREATE INDEX idx_audit_org ON audit_events(organization_id, created_at DESC);

-- ============================================================================
-- BLOCKLIST (términos prohibidos)
-- ============================================================================
CREATE TABLE blocklist_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term TEXT NOT NULL UNIQUE,
  category TEXT, -- 'rule_name', 'technical', 'team', 'classification'
  is_regex BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar términos base
INSERT INTO blocklist_terms (term, category) VALUES
  ('playbook', 'technical'),
  ('policy', 'technical'),
  ('policyspec', 'technical'),
  ('rule_id', 'technical'),
  ('rulename', 'technical'),
  ('aceptable', 'classification'),
  ('inaceptable', 'classification'),
  ('acceptable', 'classification'),
  ('unacceptable', 'classification'),
  ('threshold', 'technical'),
  ('confidence', 'technical'),
  ('anchor_conf', 'technical'),
  ('coverage', 'technical'),
  ('escalate', 'technical'),
  ('escalation', 'technical'),
  ('routing', 'technical'),
  ('gating', 'technical'),
  ('policyowner', 'team'),
  ('amazonlegal', 'team');

-- ============================================================================
-- VISTAS PARA CLIENTE (solo datos sanitizados)
-- ============================================================================
CREATE OR REPLACE VIEW client_clause_reviews AS
SELECT 
  so.id,
  so.run_id,
  so.clause_instance_id,
  ci.sequence_number,
  ci.heading,
  cri.detected_family,
  so.client_status,
  so.client_summary_line,
  so.client_comment,
  so.proposed_changes_client,
  so.created_at
FROM sanitizer_outputs so
JOIN clause_instances ci ON so.clause_instance_id = ci.id
JOIN clause_reviews_internal cri ON so.clause_review_id = cri.id
WHERE so.safety_pass = true;

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para calcular leakage rate de un run
CREATE OR REPLACE FUNCTION calculate_leakage_rate(p_run_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_outputs INTEGER;
  leaked_outputs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_outputs
  FROM sanitizer_outputs WHERE run_id = p_run_id;
  
  IF total_outputs = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO leaked_outputs
  FROM sanitizer_outputs 
  WHERE run_id = p_run_id AND safety_pass = false;
  
  RETURN (leaked_outputs::NUMERIC / total_outputs) * 100;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar completeness
CREATE OR REPLACE FUNCTION check_completeness(p_run_id UUID, p_playbook_id UUID)
RETURNS TABLE (
  is_complete BOOLEAN,
  missing_families TEXT[],
  missing_rule_ids TEXT[]
) AS $$
DECLARE
  required_families TEXT[];
  covered_families TEXT[];
  missing_f TEXT[];
BEGIN
  -- Obtener familias required del playbook
  SELECT ARRAY_AGG(DISTINCT clause_family) INTO required_families
  FROM policy_specs
  WHERE playbook_id = p_playbook_id AND required = true AND is_active = true;
  
  -- Obtener familias cubiertas en el run
  SELECT ARRAY_AGG(DISTINCT detected_family) INTO covered_families
  FROM clause_reviews_internal
  WHERE run_id = p_run_id AND final_status != 'NotCoveredByPlaybook';
  
  -- Calcular faltantes
  SELECT ARRAY_AGG(f) INTO missing_f
  FROM UNNEST(required_families) f
  WHERE f != ALL(COALESCE(covered_families, ARRAY[]::TEXT[]));
  
  RETURN QUERY SELECT 
    (missing_f IS NULL OR ARRAY_LENGTH(missing_f, 1) IS NULL),
    COALESCE(missing_f, ARRAY[]::TEXT[]),
    ARRAY[]::TEXT[]; -- TODO: calcular rule_ids específicos
END;
$$ LANGUAGE plpgsql;
```

---

## 3. PolicySpec y VariationSet

### 3.1 Estructura PolicySpec por familia

```json
// Ejemplo: IndemnityProdCo
{
  "rule_id": "PB:v2026-01:Indemnity-ProdCo-Core",
  "clause_family": "IndemnityProdCo",
  "required": true,
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  
  "standard_position": [
    "ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemnes a Amazon, sus afiliadas, directores, funcionarios, empleados, licenciatarios y cesionarios, frente a pérdidas, daños, costos y gastos (incluidos honorarios razonables de abogados) derivados de reclamaciones de terceros que se originen en o se relacionen con: (a) infracción o presunta infracción de derechos de propiedad intelectual, privacidad o difamación relacionada con el Programa o los Materiales; (b) incumplimiento de este Acuerdo o de las representaciones y garantías de ProdCo; o (c) negligencia o dolo de ProdCo o sus subcontratistas."
  ],
  
  "acceptable_variations": [
    "Notificación escrita; la demora solo libera si causa perjuicio material a la defensa.",
    "ProdCo puede participar en la defensa a su propio costo con su counsel, sin interferir con el control de Amazon.",
    "Amazon no aceptará un acuerdo que imponga obligaciones a ProdCo sin su aprobación, que no será irrazonablemente denegada.",
    "Listas ejemplificativas de pérdidas cubiertas.",
    "Coordinación con aseguradoras E&O."
  ],
  
  "unacceptable_variations": [
    "Eliminar obligación de 'defender', dejando solo 'indemnizar'.",
    "Limitar indemnidad a dolo exclusivo de ProdCo.",
    "Exigir sentencia firme previa para activar defensa/indemnización.",
    "Excluir reclamaciones por infracción de PI.",
    "Excluir difamación y privacidad.",
    "Imponer co-control de defensa.",
    "Aprobación previa de ProdCo para designar counsel.",
    "Limitar cuantitativamente la indemnidad por debajo del riesgo."
  ],
  
  "guidance_internal": "Mantener deber de defender. Control de defensa siempre a opción de Amazon. No aceptar caps sin aprobación Legal.",
  
  "retrieval_profile": {
    "vector_top_k": 3,
    "coverage_threshold": 0.86,
    "examples_top_k": 6
  },
  
  "routing_policy": {
    "type": "ESCALATE_IF_UNACCEPTABLE",
    "target_group": "AmazonLegal",
    "block_export": true
  },
  
  "decision_policy": {
    "auto_redline_if_unacceptable": true,
    "anchor_conf_threshold": 0.86,
    "escalate_if_ambiguous": true,
    "block_export_if_escalated": true
  },
  
  "models": {
    "paranoid": "gpt-4o",
    "valuator": "gpt-4o-mini",
    "sanitizer": "gpt-4o-mini"
  },
  
  "anchors": [
    "defender (a opción de Amazon)",
    "reclamaciones de terceros",
    "costos y gastos razonables",
    "infracción de propiedad intelectual",
    "negligencia o dolo"
  ],
  
  "definitions_scope": {
    "defined_terms": ["Losses", "Affiliate", "Materials"],
    "cross_refs": ["Definiciones", "Representaciones de ProdCo"]
  },
  
  "family_extensions": {
    "IndemnityProdCo": {
      "covered_claim_types": ["IP", "Defamation", "Privacy", "Negligence", "WilfulMisconduct"],
      "defense_control_default": "AmazonOption",
      "notice_prejudice_standard": "material_prejudice",
      "insured_coordination_required": true,
      "settlement_constraint": "no_obligations_on_prodco_without_consent"
    }
  }
}
```

### 3.2 VariationSet ejemplos por categoría

```json
// Ejemplo de registros en variation_set para IndemnityProdCo
[
  {
    "policy_spec_id": "uuid-policy-indemnity-prodco",
    "category": "STANDARD",
    "text": "ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemnes a Amazon, sus afiliadas, directores, funcionarios, empleados, licenciatarios y cesionarios...",
    "origin": "manual",
    "metadata": {"is_canonical": true}
  },
  {
    "policy_spec_id": "uuid-policy-indemnity-prodco",
    "category": "ACCEPTABLE",
    "text": "ProdCo indemnizará y defenderá (a opción de Amazon) a Amazon frente a reclamaciones de terceros. La demora en notificación no liberará a ProdCo salvo que cause perjuicio material a la defensa.",
    "origin": "real_validated",
    "metadata": {"deviation": "notice_prejudice_clarification", "approved_by": "Legal 2024-11"}
  },
  {
    "policy_spec_id": "uuid-policy-indemnity-prodco",
    "category": "UNACCEPTABLE",
    "text": "ProdCo indemnizará a Amazon exclusivamente por daños finalmente determinados por sentencia firme que deriven del dolo de ProdCo, quedando excluidas reclamaciones por infracción de PI.",
    "origin": "synthetic",
    "metadata": {"issues": ["requires_final_judgment", "excludes_IP", "excludes_negligence", "no_defend_obligation"]}
  },
  {
    "policy_spec_id": "uuid-policy-indemnity-prodco",
    "category": "NOT_COVERED",
    "text": "ProdCo y Amazon compartirán equitativamente las responsabilidades de indemnización derivadas de reclamaciones de terceros relacionadas con el Programa.",
    "origin": "synthetic",
    "metadata": {"reason": "shared_indemnity_not_in_playbook"}
  }
]
```

### 3.3 Carga inicial de PolicySpecs

```sql
-- Script de carga para playbook DSA v1
INSERT INTO playbooks (id, code, display_name, version) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'PB_DSA_V1', 'DSA – Streaming Platform (v1)', '1.0');

-- PolicySpec: PaymentCredits
INSERT INTO policy_specs (playbook_id, rule_id, clause_family, required, analysis_mode, standard_position, acceptable_variations, unacceptable_variations, anchors)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'PB:v2026-01:Fees-Core',
  'PaymentCredits',
  true,
  'MODE_ENUMERATED_DEVIATIONS',
  '["Sujeto a los demás términos de este Acuerdo, y siempre que ProdCo no esté en incumplimiento material no subsanado del Acuerdo, Amazon abonará a ProdCo los honorarios y demás importes especificados en el Anexo A."]',
  '["Factura electrónica como requisito de proceso, sin alterar condicionantes.", "Prorrateo por hitos definidos en Anexo A."]',
  '["Pagos incondicionales tras PO.", "Eliminar sujeto a otros términos.", "Pagos garantizados sin relación a desempeño."]',
  '["incumplimiento material no subsanado", "sujeto a otros términos", "Anexo A"]'
);

-- (Repetir para las 9 familias)
```

---

## 4. Flujos n8n

### 4.1 W2_ClauseReview (corregido)

```yaml
# Estructura del workflow corregido
name: W2_ClauseReview
trigger: Webhook POST /clause-review

nodes:
  # 1. Entry point
  - name: Webhook
    type: n8n-nodes-base.webhook
    parameters:
      httpMethod: POST
      path: clause-review
      responseMode: responseNode

  # 2. Parse y validar input
  - name: ParseInput
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const input = $input.first().json;
        
        // Validar campos requeridos
        const required = ['clause_instance_id', 'clause_text', 'run_id', 'document_id', 'playbook_id'];
        for (const field of required) {
          if (!input[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
        
        return [{
          json: {
            clause_instance_id: input.clause_instance_id,
            clause_id: input.clause_id,
            clause_text: input.clause_text,
            clause_heading: input.clause_heading || '',
            run_id: input.run_id,
            document_id: input.document_id,
            playbook_id: input.playbook_id,
            sequence_number: input.sequence_number || 0
          }
        }];

  # 3. Router Agent
  - name: RouterAgent
    type: "@n8n/n8n-nodes-langchain.openAi"
    parameters:
      model: gpt-4o-mini
      messages:
        - role: system
          content: |
            Eres un router contractual. Tu objetivo es clasificar una cláusula en la familia correcta y proponer las reglas candidatas del playbook.
            
            Familias válidas: PaymentCredits, ThirdPartyCredits, RepsProdCo, RepsAmazon, RepsTruthTerm, IndemnityProdCo, IndemnityAmazon, DefenseSettlement, SurvivalRemedies, OtherUnknown
            
            Responde SOLO en JSON válido con este schema:
            {
              "detected_family": "string",
              "rule_candidates": [{"rule_id": "string", "score": number}],
              "coverage_confidence": number
            }
        - role: user
          content: |
            Heading: {{$json.clause_heading}}
            Texto: {{$json.clause_text}}
      temperature: 0
      maxTokens: 500
      options:
        responseFormat: json_object

  # 4. Parse Router output
  - name: ParseRouter
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const routerOutput = JSON.parse($input.first().json.message.content);
        const prevData = $('ParseInput').first().json;
        
        return [{
          json: {
            ...prevData,
            detected_family: routerOutput.detected_family,
            rule_candidates: routerOutput.rule_candidates,
            coverage_confidence: routerOutput.coverage_confidence
          }
        }];

  # 5. Context Retriever (NUEVO - crítico)
  - name: ContextRetriever
    type: n8n-nodes-base.supabase
    parameters:
      operation: select
      table: policy_specs
      filters:
        playbook_id: "={{$json.playbook_id}}"
        clause_family: "={{$json.detected_family}}"
        is_active: true
      returnAll: false
      limit: 2

  # 6. Retrieve VariationSet
  - name: RetrieveVariations
    type: n8n-nodes-base.supabase
    parameters:
      operation: executeQuery
      query: |
        SELECT category, text, metadata
        FROM variation_set
        WHERE policy_spec_id = '{{$json.policy_spec_id}}'
        AND is_active = true
        ORDER BY category
        LIMIT 20

  # 7. Build context for agents
  - name: BuildContext
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const policySpec = $('ContextRetriever').first().json;
        const variations = $('RetrieveVariations').all().map(v => v.json);
        const baseData = $('ParseRouter').first().json;
        
        // Si no hay PolicySpec, marcar como NotCovered
        if (!policySpec || !policySpec.id) {
          return [{
            json: {
              ...baseData,
              has_policy_spec: false,
              final_status: 'NotCoveredByPlaybook',
              skip_to_decisor: true
            }
          }];
        }
        
        // Separar variaciones por categoría
        const variationsByCategory = {
          STANDARD: variations.filter(v => v.category === 'STANDARD'),
          ACCEPTABLE: variations.filter(v => v.category === 'ACCEPTABLE'),
          UNACCEPTABLE: variations.filter(v => v.category === 'UNACCEPTABLE')
        };
        
        return [{
          json: {
            ...baseData,
            has_policy_spec: true,
            policy_spec: policySpec,
            rule_id: policySpec.rule_id,
            analysis_mode: policySpec.analysis_mode,
            standard_position: policySpec.standard_position,
            acceptable_variations: policySpec.acceptable_variations,
            unacceptable_variations: policySpec.unacceptable_variations,
            anchors: policySpec.anchors,
            routing_policy: policySpec.routing_policy,
            decision_policy: policySpec.decision_policy,
            variation_examples: variationsByCategory,
            skip_to_decisor: false
          }
        }];

  # 8. Switch: Skip si NotCovered
  - name: CheckCoverage
    type: n8n-nodes-base.switch
    parameters:
      dataPropertyName: skip_to_decisor
      rules:
        - output: 0  # Continuar con análisis
          value: false
        - output: 1  # Saltar a Decisor
          value: true

  # 9. Paranoid Agent (alto recall)
  - name: ParanoidAgent
    type: "@n8n/n8n-nodes-langchain.openAi"
    parameters:
      model: gpt-4o
      messages:
        - role: system
          content: |
            Eres el Agente Analista Paranoico. Tu función es maximizar la cobertura de hallazgos sobre una cláusula, comparándola contra la posición estándar y variaciones. No decides el estatus final. Produces evidencia con spans reproducibles.
            
            Responde SOLO en JSON válido con este schema:
            {
              "observations": [
                {
                  "obs_id": "string",
                  "evidence": "string (quote exacta)",
                  "offsets": {"start": number, "end": number},
                  "change_type": "missing|added|modified|matches_standard",
                  "possible_category": "MatchesStandard|MatchesAcceptable|MatchesUnacceptable|UnknownChange",
                  "signal_terms": ["string"],
                  "confidence": number
                }
              ],
              "summary": {
                "counts": {"total": number, "missing": number, "added": number, "modified": number},
                "coverage_confidence": number
              }
            }
        - role: user
          content: |
            REGLA ACTIVA: {{$json.rule_id}}
            ANALYSIS_MODE: {{$json.analysis_mode}}
            
            POSICIÓN ESTÁNDAR:
            {{$json.standard_position}}
            
            VARIACIONES ACEPTABLES:
            {{$json.acceptable_variations}}
            
            VARIACIONES INACEPTABLES:
            {{$json.unacceptable_variations}}
            
            ANCLAS A DETECTAR:
            {{$json.anchors}}
            
            EJEMPLOS DEL VARIATIONSET:
            {{JSON.stringify($json.variation_examples)}}
            
            TEXTO DE LA CLÁUSULA A ANALIZAR:
            {{$json.clause_text}}
      temperature: 0
      maxTokens: 2000
      options:
        responseFormat: json_object

  # 10. Parse Paranoid output
  - name: ParseParanoid
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const paranoidOutput = JSON.parse($input.first().json.message.content);
        const prevData = $('BuildContext').first().json;
        
        return [{
          json: {
            ...prevData,
            observations: paranoidOutput.observations,
            observations_count: paranoidOutput.observations?.length || 0,
            paranoid_summary: paranoidOutput.summary
          }
        }];

  # 11. Valuator Agent (alto precision)
  - name: ValuatorAgent
    type: "@n8n/n8n-nodes-langchain.openAi"
    parameters:
      model: gpt-4o-mini
      messages:
        - role: system
          content: |
            Eres el Agente Valuator. Tu función es convertir las observaciones del Paranoico en una decisión conforme al Playbook, proponer cambios seguros y señalar si se requiere escalamiento.
            
            REGLAS CRÍTICAS:
            1. Solo propón texto que exista EXACTAMENTE en standard_position o acceptable_variations.
            2. Si analysis_mode = MODE_STRICT_NO_DEVIATIONS, cualquier cambio relevante es UnacceptableDeviation.
            3. Si no hay match explícito, usa NotCoveredByPlaybook o Ambiguous.
            
            Responde SOLO en JSON válido con este schema:
            {
              "final_status": "Compliant|AcceptableDeviation|UnacceptableDeviation|NotCoveredByPlaybook|Ambiguous",
              "proposed_changes": [
                {
                  "action": {"type": "insert|replace|delete|comment_only", "text": "string (si aplica)"},
                  "anchor": {"quote": "string", "offsets": {"start": number, "end": number}, "anchor_confidence": number},
                  "source_reference": {"source_type": "STANDARD_POSITION|FALLBACK_ACCEPTABLE", "exact_text": "string"},
                  "internal_justification": "string"
                }
              ],
              "escalation": {
                "recommended": boolean,
                "reason": "WITH_LEGAL_APPROVAL_REQUIRED|NOT_COVERED_BY_PLAYBOOK|AMBIGUOUS_POLICY_JUDGMENT|UNACCEPTABLE_DEVIATION_STRICT|LOW_CONFIDENCE_ANCHOR|LOW_CONFIDENCE_OVERALL|null"
              },
              "confidence_overall": number,
              "evidence_spans": [{"text": "string", "offsets": {"start": number, "end": number}}]
            }
        - role: user
          content: |
            REGLA: {{$json.rule_id}}
            ANALYSIS_MODE: {{$json.analysis_mode}}
            ROUTING_POLICY: {{JSON.stringify($json.routing_policy)}}
            
            POSICIÓN ESTÁNDAR:
            {{$json.standard_position}}
            
            VARIACIONES ACEPTABLES:
            {{$json.acceptable_variations}}
            
            OBSERVACIONES DEL PARANOICO:
            {{JSON.stringify($json.observations)}}
            
            TEXTO ORIGINAL:
            {{$json.clause_text}}
      temperature: 0
      maxTokens: 2000
      options:
        responseFormat: json_object

  # 12. Parse Valuator output
  - name: ParseValuator
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const valuatorOutput = JSON.parse($input.first().json.message.content);
        const prevData = $('ParseParanoid').first().json;
        
        return [{
          json: {
            ...prevData,
            final_status: valuatorOutput.final_status,
            proposed_changes: valuatorOutput.proposed_changes,
            escalation: valuatorOutput.escalation,
            confidence_overall: valuatorOutput.confidence_overall,
            evidence_spans: valuatorOutput.evidence_spans
          }
        }];

  # 13. Validador Determinista (NUEVO - crítico)
  - name: ValidatorDeterministic
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const data = $input.first().json;
        const validationErrors = [];
        let validationPassed = true;
        
        // Thresholds
        const TH_ANCHOR = data.decision_policy?.anchor_conf_threshold || 0.85;
        
        // 1. Validar "No new text"
        if (data.proposed_changes && data.proposed_changes.length > 0) {
          for (const change of data.proposed_changes) {
            if (change.action.type === 'insert' || change.action.type === 'replace') {
              const proposedText = change.action.text || change.action.insert_text || change.action.replace_with_text;
              const sourceText = change.source_reference?.exact_text;
              
              if (!sourceText) {
                validationErrors.push({
                  type: 'NO_SOURCE_REFERENCE',
                  change_index: data.proposed_changes.indexOf(change),
                  message: 'Proposed change has no source_reference'
                });
                validationPassed = false;
              } else if (proposedText && !sourceText.includes(proposedText.trim())) {
                validationErrors.push({
                  type: 'NEW_TEXT_VIOLATION',
                  change_index: data.proposed_changes.indexOf(change),
                  message: 'Proposed text not found in source_reference'
                });
                validationPassed = false;
              }
            }
          }
        }
        
        // 2. Validar anchor confidence
        let minAnchorConf = 1.0;
        if (data.proposed_changes) {
          for (const change of data.proposed_changes) {
            if (change.anchor?.anchor_confidence) {
              minAnchorConf = Math.min(minAnchorConf, change.anchor.anchor_confidence);
            }
          }
        }
        
        const anchorConfidenceOk = minAnchorConf >= TH_ANCHOR;
        if (!anchorConfidenceOk && data.proposed_changes?.length > 0) {
          validationErrors.push({
            type: 'LOW_ANCHOR_CONFIDENCE',
            min_confidence: minAnchorConf,
            threshold: TH_ANCHOR
          });
        }
        
        // 3. Validar anchors existen en texto
        if (data.proposed_changes) {
          for (const change of data.proposed_changes) {
            if (change.anchor?.quote) {
              if (!data.clause_text.includes(change.anchor.quote)) {
                validationErrors.push({
                  type: 'ANCHOR_NOT_FOUND',
                  quote: change.anchor.quote
                });
                validationPassed = false;
              }
            }
          }
        }
        
        return [{
          json: {
            ...data,
            validation_passed: validationPassed,
            validation_errors: validationErrors,
            anchor_confidence: minAnchorConf,
            anchor_confidence_ok: anchorConfidenceOk
          }
        }];

  # 14. Decisor Determinista (NUEVO - crítico)
  - name: DecisorDeterministic
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const data = $input.first().json;
        
        // Thresholds
        const TH_ANCHOR = data.decision_policy?.anchor_conf_threshold || 0.85;
        const TH_CONF_OVERALL = 0.80;
        
        // Extraer valores
        const finalStatus = data.final_status;
        const anchorConf = data.anchor_confidence || 0;
        const confOverall = data.confidence_overall || 0;
        const routingType = data.routing_policy?.type || 'NONE';
        const validationPassed = data.validation_passed;
        
        let decision = 'LOG_ONLY';
        let escalationReason = null;
        let blockExport = false;
        
        // Matriz de decisión
        if (!validationPassed) {
          decision = 'ESCALATE_HUMAN';
          escalationReason = 'VALIDATION_ERROR';
          blockExport = data.decision_policy?.block_export_if_escalated || false;
        }
        else if (finalStatus === 'NotCoveredByPlaybook') {
          decision = 'ESCALATE_HUMAN';
          escalationReason = 'NOT_COVERED_BY_PLAYBOOK';
          blockExport = true;
        }
        else if (finalStatus === 'Ambiguous') {
          decision = 'ESCALATE_HUMAN';
          escalationReason = 'AMBIGUOUS_POLICY_JUDGMENT';
          blockExport = data.decision_policy?.block_export_if_escalated || false;
        }
        else if (finalStatus === 'UnacceptableDeviation') {
          if (routingType === 'ESCALATE' || routingType === 'ESCALATE_IF_UNACCEPTABLE') {
            decision = 'ESCALATE_HUMAN';
            escalationReason = 'UNACCEPTABLE_DEVIATION_STRICT';
            blockExport = data.routing_policy?.block_export || false;
          }
          else if (anchorConf >= TH_ANCHOR) {
            decision = 'AUTO_REDLINEDRAFT';
          }
          else {
            decision = 'ESCALATE_HUMAN';
            escalationReason = 'LOW_CONFIDENCE_ANCHOR';
            blockExport = data.decision_policy?.block_export_if_escalated || false;
          }
        }
        else if (finalStatus === 'AcceptableDeviation') {
          if (routingType === 'ESCALATE_IF_CHANGE') {
            decision = 'ESCALATE_HUMAN';
            escalationReason = 'WITH_LEGAL_APPROVAL_REQUIRED';
          }
          else if (confOverall >= TH_CONF_OVERALL) {
            decision = 'AUTO_PASS';
          }
          else {
            decision = 'ESCALATE_HUMAN';
            escalationReason = 'LOW_CONFIDENCE_OVERALL';
          }
        }
        else if (finalStatus === 'Compliant') {
          if (routingType === 'ESCALATE') {
            decision = 'ESCALATE_HUMAN';
            escalationReason = 'WITH_LEGAL_APPROVAL_REQUIRED';
          }
          else {
            decision = 'AUTO_PASS';
          }
        }
        
        return [{
          json: {
            ...data,
            decision: decision,
            escalation_reason: escalationReason,
            block_export: blockExport,
            escalation_recommended: decision === 'ESCALATE_HUMAN'
          }
        }];

  # 15. Sanitizer Agent
  - name: SanitizerAgent
    type: "@n8n/n8n-nodes-langchain.openAi"
    parameters:
      model: gpt-4o-mini
      messages:
        - role: system
          content: |
            Eres el Agente Sanitizer. Tu función es convertir la decisión interna en un comentario client-facing neutral y seguro.
            
            REGLAS CRÍTICAS (NUNCA violar):
            - NO usar: playbook, policy, PolicySpec, rule_id, RuleName
            - NO usar: aceptable, inaceptable, acceptable, unacceptable
            - NO usar: threshold, confidence, anchor_conf, coverage
            - NO usar: escalate, escalation, routing, gating
            - NO usar nombres de equipos internos
            - NO revelar scores ni versiones
            
            USA lenguaje neutral: "alinear con términos estándar", "clarificar", "mejorar consistencia", "asegurar coherencia"
            
            Responde SOLO en JSON:
            {
              "client_summary_line": "string (1 línea)",
              "client_comment": "string (1-3 frases)",
              "client_status": "ok|adjustment|change_required|review|blocked",
              "proposed_changes_client": [{"action_type": "string", "description": "string"}]
            }
        - role: user
          content: |
            DECISIÓN: {{$json.decision}}
            FINAL_STATUS: {{$json.final_status}}
            CAMBIOS PROPUESTOS (interno): {{JSON.stringify($json.proposed_changes)}}
            
            Genera output client-facing neutral.
      temperature: 0
      maxTokens: 500
      options:
        responseFormat: json_object

  # 16. Leakage Guard (NUEVO)
  - name: LeakageGuard
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const sanitizerOutput = JSON.parse($input.first().json.message.content);
        const prevData = $('DecisorDeterministic').first().json;
        
        // Blocklist de términos
        const blocklist = [
          'playbook', 'policy', 'policyspec', 'rule_id', 'rulename',
          'aceptable', 'inaceptable', 'acceptable', 'unacceptable',
          'threshold', 'confidence', 'anchor_conf', 'coverage',
          'escalate', 'escalation', 'routing', 'gating',
          'policyowner', 'amazonlegal', 'legal team'
        ];
        
        const textToCheck = (
          (sanitizerOutput.client_summary_line || '') + ' ' +
          (sanitizerOutput.client_comment || '')
        ).toLowerCase();
        
        const detectedTerms = blocklist.filter(term => textToCheck.includes(term));
        const leakScore = detectedTerms.length / blocklist.length;
        const safetyPass = detectedTerms.length === 0;
        
        // Determinar client_status
        let clientStatus = sanitizerOutput.client_status || 'ok';
        if (prevData.decision === 'BLOCK_EXPORT') {
          clientStatus = 'blocked';
        } else if (prevData.decision === 'ESCALATE_HUMAN') {
          clientStatus = 'review';
        } else if (prevData.decision === 'AUTO_REDLINEDRAFT') {
          clientStatus = 'change_required';
        } else if (prevData.final_status === 'AcceptableDeviation') {
          clientStatus = 'adjustment';
        }
        
        return [{
          json: {
            ...prevData,
            client_summary_line: sanitizerOutput.client_summary_line,
            client_comment: sanitizerOutput.client_comment,
            client_status: clientStatus,
            proposed_changes_client: sanitizerOutput.proposed_changes_client,
            safety_pass: safetyPass,
            blocked_terms_detected: detectedTerms,
            leak_score: leakScore,
            policy_leak_flags: detectedTerms.length > 0 ? ['BLOCKED_TERM_DETECTED'] : []
          }
        }];

  # 17. Persist to Supabase
  - name: PersistReview
    type: n8n-nodes-base.supabase
    parameters:
      operation: insert
      table: clause_reviews_internal
      fieldsToSend:
        run_id: "={{$json.run_id}}"
        clause_instance_id: "={{$json.clause_instance_id}}"
        detected_family: "={{$json.detected_family}}"
        rule_id: "={{$json.rule_id}}"
        rule_version: "={{$json.policy_spec?.version}}"
        analysis_mode: "={{$json.analysis_mode}}"
        router_candidates: "={{$json.rule_candidates}}"
        coverage_confidence: "={{$json.coverage_confidence}}"
        observations: "={{$json.observations}}"
        observations_count: "={{$json.observations_count}}"
        final_status: "={{$json.final_status}}"
        proposed_changes: "={{$json.proposed_changes}}"
        anchor_confidence: "={{$json.anchor_confidence}}"
        confidence_overall: "={{$json.confidence_overall}}"
        decision: "={{$json.decision}}"
        escalation_recommended: "={{$json.escalation_recommended}}"
        escalation_reason: "={{$json.escalation_reason}}"
        block_export: "={{$json.block_export}}"
        validation_passed: "={{$json.validation_passed}}"
        validation_errors: "={{$json.validation_errors}}"
        evidence_spans: "={{$json.evidence_spans}}"

  # 18. Persist Sanitizer Output
  - name: PersistSanitizer
    type: n8n-nodes-base.supabase
    parameters:
      operation: insert
      table: sanitizer_outputs
      fieldsToSend:
        clause_review_id: "={{$('PersistReview').first().json.id}}"
        run_id: "={{$json.run_id}}"
        clause_instance_id: "={{$json.clause_instance_id}}"
        client_summary_line: "={{$json.client_summary_line}}"
        client_comment: "={{$json.client_comment}}"
        client_status: "={{$json.client_status}}"
        proposed_changes_client: "={{$json.proposed_changes_client}}"
        safety_pass: "={{$json.safety_pass}}"
        blocked_terms_detected: "={{$json.blocked_terms_detected}}"
        leak_score: "={{$json.leak_score}}"
        policy_leak_flags: "={{$json.policy_leak_flags}}"

  # 19. Update run progress
  - name: UpdateProgress
    type: n8n-nodes-base.supabase
    parameters:
      operation: executeQuery
      query: |
        UPDATE contract_runs
        SET processed_clauses = processed_clauses + 1,
            clauses_ok = clauses_ok + CASE WHEN '{{$json.decision}}' = 'AUTO_PASS' THEN 1 ELSE 0 END,
            clauses_redline = clauses_redline + CASE WHEN '{{$json.decision}}' = 'AUTO_REDLINEDRAFT' THEN 1 ELSE 0 END,
            clauses_escalated = clauses_escalated + CASE WHEN '{{$json.decision}}' = 'ESCALATE_HUMAN' THEN 1 ELSE 0 END,
            clauses_blocked = clauses_blocked + CASE WHEN '{{$json.decision}}' = 'BLOCK_EXPORT' THEN 1 ELSE 0 END
        WHERE id = '{{$json.run_id}}'

  # 20. Respond
  - name: Respond
    type: n8n-nodes-base.respondToWebhook
    parameters:
      respondWith: json
      responseBody: |
        {
          "success": true,
          "clause_instance_id": "{{$json.clause_instance_id}}",
          "decision": "{{$json.decision}}",
          "final_status": "{{$json.final_status}}",
          "client_status": "{{$json.client_status}}",
          "block_export": {{$json.block_export}}
        }

# Conexiones
connections:
  Webhook: [ParseInput]
  ParseInput: [RouterAgent]
  RouterAgent: [ParseRouter]
  ParseRouter: [ContextRetriever]
  ContextRetriever: [RetrieveVariations]
  RetrieveVariations: [BuildContext]
  BuildContext: [CheckCoverage]
  CheckCoverage:
    0: [ParanoidAgent]  # Continuar análisis
    1: [DecisorDeterministic]  # Skip a Decisor (NotCovered)
  ParanoidAgent: [ParseParanoid]
  ParseParanoid: [ValuatorAgent]
  ValuatorAgent: [ParseValuator]
  ParseValuator: [ValidatorDeterministic]
  ValidatorDeterministic: [DecisorDeterministic]
  DecisorDeterministic: [SanitizerAgent]
  SanitizerAgent: [LeakageGuard]
  LeakageGuard: [PersistReview]
  PersistReview: [PersistSanitizer]
  PersistSanitizer: [UpdateProgress]
  UpdateProgress: [Respond]
```

### 4.2 W3_ContractReview (orchestrator)

```yaml
name: W3_ContractReview
trigger: Webhook POST /contract-review

nodes:
  # 1. Entry
  - name: Webhook
    type: n8n-nodes-base.webhook
    
  # 2. Create run
  - name: CreateRun
    type: n8n-nodes-base.supabase
    parameters:
      operation: insert
      table: contract_runs
      fieldsToSend:
        document_id: "={{$json.document_id}}"
        status: "PROCESSING"
        contract_decision: "PROCESSING"

  # 3. Extract clauses
  - name: ExtractClauses
    type: n8n-nodes-base.httpRequest
    parameters:
      method: POST
      url: "{{$env.EXTRACTOR_SERVICE_URL}}/extract"
      body:
        document_id: "={{$json.document_id}}"
        storage_path: "={{$json.storage_path}}"

  # 4. Update total clauses
  - name: UpdateTotalClauses
    type: n8n-nodes-base.supabase
    parameters:
      operation: update
      table: contract_runs
      id: "={{$('CreateRun').first().json.id}}"
      fieldsToSend:
        total_clauses: "={{$json.clauses.length}}"

  # 5. Loop through clauses
  - name: SplitInBatches
    type: n8n-nodes-base.splitInBatches
    parameters:
      batchSize: 5
      options:
        reset: false

  # 6. Call W2 for each clause
  - name: CallClauseReview
    type: n8n-nodes-base.httpRequest
    parameters:
      method: POST
      url: "{{$env.CLAUSE_REVIEW_WEBHOOK_URL}}"
      body:
        clause_instance_id: "={{$json.id}}"
        clause_id: "={{$json.id}}"
        clause_text: "={{$json.text_normalized}}"
        clause_heading: "={{$json.heading}}"
        run_id: "={{$('CreateRun').first().json.id}}"
        document_id: "={{$json.document_id}}"
        playbook_id: "={{$json.playbook_id}}"
        sequence_number: "={{$json.sequence_number}}"

  # 7. Wait for batch
  - name: Wait
    type: n8n-nodes-base.wait
    parameters:
      amount: 1
      unit: seconds

  # 8. Completeness Checker
  - name: CompletenessChecker
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const runId = $('CreateRun').first().json.id;
        const playbookId = $input.first().json.playbook_id;
        
        // Consultar completeness via función SQL
        const supabase = $env.SUPABASE_URL; // Usar cliente
        
        // Obtener familias required
        const requiredFamilies = await $supabase
          .from('policy_specs')
          .select('clause_family')
          .eq('playbook_id', playbookId)
          .eq('required', true)
          .eq('is_active', true);
        
        // Obtener familias cubiertas
        const coveredFamilies = await $supabase
          .from('clause_reviews_internal')
          .select('detected_family')
          .eq('run_id', runId)
          .neq('final_status', 'NotCoveredByPlaybook');
        
        const required = new Set(requiredFamilies.data.map(r => r.clause_family));
        const covered = new Set(coveredFamilies.data.map(c => c.detected_family));
        
        const missing = [...required].filter(f => !covered.has(f));
        
        return [{
          json: {
            run_id: runId,
            completeness_passed: missing.length === 0,
            missing_required: missing
          }
        }];

  # 9. Contract Decisor
  - name: ContractDecisor
    type: n8n-nodes-base.code
    parameters:
      jsCode: |
        const data = $input.first().json;
        const runId = data.run_id;
        
        // Obtener stats del run
        const stats = await $supabase
          .from('contract_runs')
          .select('*')
          .eq('id', runId)
          .single();
        
        let contractDecision = 'READY_FOR_EXPORT';
        
        // Si hay cláusulas bloqueadas
        if (stats.data.clauses_blocked > 0) {
          contractDecision = 'BLOCK_EXPORT';
        }
        // Si hay cláusulas escaladas
        else if (stats.data.clauses_escalated > 0) {
          contractDecision = 'ESCALATE_HUMAN';
        }
        // Si falta completeness
        else if (!data.completeness_passed) {
          contractDecision = 'ESCALATE_HUMAN';
        }
        // Si hay redlines
        else if (stats.data.clauses_redline > 0) {
          contractDecision = 'AUTO_REDLINEDRAFT';
        }
        
        return [{
          json: {
            ...data,
            contract_decision: contractDecision,
            stats: stats.data
          }
        }];

  # 10. Update run status
  - name: FinalizeRun
    type: n8n-nodes-base.supabase
    parameters:
      operation: update
      table: contract_runs
      id: "={{$json.run_id}}"
      fieldsToSend:
        status: "COMPLETED"
        contract_decision: "={{$json.contract_decision}}"
        completeness_check_passed: "={{$json.completeness_passed}}"
        missing_required: "={{$json.missing_required}}"
        completed_at: "={{new Date().toISOString()}}"

  # 11. Generate DOCX (si procede)
  - name: CheckExportable
    type: n8n-nodes-base.switch
    parameters:
      rules:
        - value: READY_FOR_EXPORT
        - value: AUTO_REDLINEDRAFT

  - name: GenerateDocx
    type: n8n-nodes-base.httpRequest
    parameters:
      method: POST
      url: "{{$env.DOCX_MAKER_URL}}/generate"
      body:
        run_id: "={{$json.run_id}}"
        document_id: "={{$json.document_id}}"

  # 12. Respond
  - name: Respond
    type: n8n-nodes-base.respondToWebhook
    parameters:
      responseBody: |
        {
          "success": true,
          "run_id": "{{$json.run_id}}",
          "contract_decision": "{{$json.contract_decision}}",
          "total_clauses": {{$json.stats.total_clauses}},
          "completeness_passed": {{$json.completeness_passed}}
        }
```

---

## 5. Edge Functions

### 5.1 start_review

```typescript
// supabase/functions/start_review/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface StartReviewRequest {
  document_id: string
  contract_type_id: string
  anonymization_mode: 'OFF' | 'DISPLAY_ONLY' | 'FULL'
  party_aliases?: Record<string, string>
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const body: StartReviewRequest = await req.json()
    
    // 1. Validar documento existe
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*, contract_types!inner(*, workflow_routes(*), playbooks(*))')
      .eq('id', body.document_id)
      .single()
    
    if (docError || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 })
    }
    
    // 2. Crear run
    const { data: run, error: runError } = await supabase
      .from('contract_runs')
      .insert({
        document_id: body.document_id,
        status: 'PROCESSING',
        contract_decision: 'PROCESSING'
      })
      .select()
      .single()
    
    if (runError) {
      return new Response(JSON.stringify({ error: runError.message }), { status: 500 })
    }
    
    // 3. Obtener webhook URL
    const webhookUrl = doc.contract_types.workflow_routes.contract_review_webhook_url
    
    // 4. Llamar a n8n con retry
    const maxRetries = 3
    const retryDelays = [5000, 15000, 30000]
    let lastError: Error | null = null
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: body.document_id,
            run_id: run.id,
            storage_path: doc.storage_path,
            playbook_id: doc.contract_types.playbooks.id,
            anonymization_mode: body.anonymization_mode,
            party_aliases: body.party_aliases
          })
        })
        
        if (response.ok) {
          return new Response(JSON.stringify({ success: true, run_id: run.id }))
        }
        
        lastError = new Error(`n8n returned ${response.status}`)
      } catch (e) {
        lastError = e
      }
      
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, retryDelays[i]))
      }
    }
    
    // 5. Si falló, actualizar run como FAILED
    await supabase
      .from('contract_runs')
      .update({
        status: 'FAILED',
        contract_decision: 'FAILED',
        error_message: lastError?.message
      })
      .eq('id', run.id)
    
    // 6. Registrar en audit
    await supabase
      .from('audit_events')
      .insert({
        run_id: run.id,
        event_type: 'error',
        audience: 'internal',
        payload: { error: lastError?.message, retries: maxRetries }
      })
    
    return new Response(
      JSON.stringify({ success: false, run_id: run.id, error: 'Analysis failed after retries' }),
      { status: 500 }
    )
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
```

### 5.2 export_doc

```typescript
// supabase/functions/export_doc/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ExportDocRequest {
  run_id: string
  format: 'docx'
  include_comments: boolean
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const body: ExportDocRequest = await req.json()
  
  // 1. Verificar que el run es exportable
  const { data: run } = await supabase
    .from('contract_runs')
    .select('*, documents(*)')
    .eq('id', body.run_id)
    .single()
  
  if (!run) {
    return new Response(JSON.stringify({ error: 'Run not found' }), { status: 404 })
  }
  
  if (run.contract_decision === 'BLOCK_EXPORT') {
    return new Response(JSON.stringify({ error: 'Export blocked for this run' }), { status: 403 })
  }
  
  // 2. Verificar leakage score = 0
  const { data: leakCheck } = await supabase
    .from('sanitizer_outputs')
    .select('safety_pass')
    .eq('run_id', body.run_id)
    .eq('safety_pass', false)
  
  if (leakCheck && leakCheck.length > 0) {
    return new Response(JSON.stringify({ error: 'Leakage detected, export blocked' }), { status: 403 })
  }
  
  // 3. Llamar a DocxMaker
  const response = await fetch(Deno.env.get('DOCX_MAKER_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      run_id: body.run_id,
      document_id: run.documents.id,
      storage_path: run.documents.storage_path,
      include_comments: body.include_comments
    })
  })
  
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'DOCX generation failed' }), { status: 500 })
  }
  
  const result = await response.json()
  
  // 4. Registrar export en audit
  await supabase
    .from('audit_events')
    .insert({
      run_id: body.run_id,
      event_type: 'export',
      audience: 'client',
      payload: { format: body.format, download_url: result.download_url }
    })
  
  return new Response(JSON.stringify({
    success: true,
    download_url: result.download_url
  }))
})
```

---

## 6. Observabilidad

### 6.1 Métricas a implementar

```typescript
// Estructura de métricas
interface ClauseMetrics {
  clause_id: string
  run_id: string
  agent: 'router' | 'paranoid' | 'valuator' | 'validator' | 'decisor' | 'sanitizer'
  latency_ms: number
  token_usage: {
    prompt: number
    completion: number
    total: number
  }
  success: boolean
  error?: string
}

interface RunMetrics {
  run_id: string
  total_clauses: number
  processing_time_ms: number
  by_decision: {
    AUTO_PASS: number
    AUTO_REDLINEDRAFT: number
    ESCALATE_HUMAN: number
    BLOCK_EXPORT: number
  }
  by_final_status: {
    Compliant: number
    AcceptableDeviation: number
    UnacceptableDeviation: number
    NotCoveredByPlaybook: number
    Ambiguous: number
  }
  leakage_rate: number
  avg_anchor_confidence: number
  avg_confidence_overall: number
}
```

### 6.2 Dashboard queries (para consola Despacho)

```sql
-- Métricas de calidad por período
SELECT 
  date_trunc('day', cr.created_at) as day,
  COUNT(*) as total_reviews,
  COUNT(*) FILTER (WHERE decision = 'AUTO_PASS') as auto_pass,
  COUNT(*) FILTER (WHERE decision = 'ESCALATE_HUMAN') as escalated,
  COUNT(*) FILTER (WHERE decision = 'BLOCK_EXPORT') as blocked,
  AVG(anchor_confidence) as avg_anchor_conf,
  AVG(confidence_overall) as avg_conf_overall
FROM clause_reviews_internal cr
GROUP BY date_trunc('day', cr.created_at)
ORDER BY day DESC
LIMIT 30;

-- Leakage rate global
SELECT 
  COUNT(*) FILTER (WHERE safety_pass = false)::numeric / 
  NULLIF(COUNT(*), 0) * 100 as leakage_rate_pct
FROM sanitizer_outputs
WHERE created_at > NOW() - INTERVAL '7 days';

-- Top familias con escalados
SELECT 
  detected_family,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE decision = 'ESCALATE_HUMAN') as escalated,
  ROUND(COUNT(*) FILTER (WHERE decision = 'ESCALATE_HUMAN')::numeric / COUNT(*) * 100, 2) as escalation_rate
FROM clause_reviews_internal
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY detected_family
ORDER BY escalation_rate DESC;

-- Distribución de escalation_reason
SELECT 
  escalation_reason,
  COUNT(*) as count
FROM clause_reviews_internal
WHERE escalation_recommended = true
AND created_at > NOW() - INTERVAL '30 days'
GROUP BY escalation_reason
ORDER BY count DESC;
```

---

## 7. Configuración y Thresholds

### 7.1 Tabla de configuración global

```sql
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO system_config (key, value, description) VALUES
  ('TH_ANCHOR', '0.85', 'Threshold mínimo de anchor confidence para auto-redline'),
  ('TH_CONF_OVERALL', '0.80', 'Threshold mínimo de confidence overall para auto-pass'),
  ('TH_COVERAGE', '0.78', 'Threshold mínimo de coverage confidence para routing'),
  ('MAX_RETRIES', '3', 'Máximo de reintentos a n8n'),
  ('RETRY_DELAYS_MS', '[5000, 15000, 30000]', 'Delays entre reintentos'),
  ('CONCURRENCY_PER_CONTRACT', '5', 'Cláusulas en paralelo por contrato'),
  ('TIMEOUT_ROUTER_MS', '30000', 'Timeout para Router Agent'),
  ('TIMEOUT_PARANOID_MS', '60000', 'Timeout para Paranoid Agent'),
  ('TIMEOUT_VALUATOR_MS', '60000', 'Timeout para Valuator Agent'),
  ('TIMEOUT_SANITIZER_MS', '30000', 'Timeout para Sanitizer Agent'),
  ('MAX_CLAUSE_LENGTH', '50000', 'Máximo caracteres por cláusula'),
  ('MAX_CLAUSES_PER_DOC', '100', 'Máximo cláusulas por documento');
```

---

## 8. Plan de migración

### 8.1 Fases de implementación

```
FASE 1 (Semana 1-2): Fundamentos
├── Crear tablas: policy_specs, variation_set, clause_reviews_internal, sanitizer_outputs
├── Cargar PolicySpec inicial para playbook DSA v1 (9 familias)
├── Generar VariationSet sintético (20 ejemplos por categoría por familia)
├── Implementar Context Retriever en W2
└── Implementar Validador determinista en W2

FASE 2 (Semana 3): Decisor y Sanitizer
├── Implementar Decisor determinista completo
├── Implementar Leakage Guard
├── Crear blocklist_terms
├── Ajustar outputs de Paranoid/Valuator a schemas
└── Testing con contrato de ejemplo "inaceptable"

FASE 3 (Semana 4): Contract-level
├── Implementar Completeness Checker
├── Implementar Contract Decisor
├── Crear Edge Functions con retry logic
├── Testing con contrato "escalable"
└── Testing con contrato "aceptable"

FASE 4 (Semana 5): Observabilidad y calidad
├── Implementar audit_events por paso
├── Crear vistas para consola Despacho
├── Implementar métricas y queries
├── Crear sistema de configuración global
└── Documentation y handoff
```

### 8.2 Checklist de validación por fase

```markdown
## Fase 1 - Checklist
- [ ] PolicySpec cargado para 9 familias
- [ ] VariationSet con ≥10 ejemplos por categoría por familia
- [ ] Context Retriever recupera PolicySpec correcto
- [ ] Paranoid output incluye offsets válidos
- [ ] Valuator output incluye source_reference

## Fase 2 - Checklist
- [ ] Validador detecta "new text" violations
- [ ] Validador detecta anchor_confidence < threshold
- [ ] Decisor aplica matriz correctamente
- [ ] Leakage Guard detecta términos prohibidos
- [ ] Contrato inaceptable genera 100% UnacceptableDeviation o BLOCK

## Fase 3 - Checklist
- [ ] Completeness detecta familias faltantes
- [ ] Contract Decisor propaga BLOCK si hay cláusula bloqueada
- [ ] Edge Function retry funciona (simular fallo n8n)
- [ ] Contrato escalable genera ESCALATE_HUMAN
- [ ] Contrato aceptable genera READY_FOR_EXPORT

## Fase 4 - Checklist
- [ ] audit_events se crean por cada paso
- [ ] Queries de métricas funcionan
- [ ] Leakage rate = 0% en contratos de prueba
- [ ] Configuración editable funciona
```

---

## 9. Contratos de prueba

### 9.1 IDs de contratos de referencia

| Contrato | Tipo | Resultado esperado | Uso |
|----------|------|-------------------|-----|
| `contract_unacceptable_001` | Inaceptable | 100% BLOCK_EXPORT o ESCALATE | Validar detección |
| `contract_acceptable_001` | Aceptable | READY_FOR_EXPORT | Validar happy path |
| `contract_escalable_001` | Dudoso | ESCALATE_HUMAN | Validar escalado |
| `contract_mixed_001` | Mixto | Según cláusula | Validar por familia |

---

Esta especificación técnica cubre todos los aspectos necesarios para alinear la implementación con la PRD v1.1 y la arquitectura multiagente diseñada. ¿Quieres que profundice en alguna sección específica?