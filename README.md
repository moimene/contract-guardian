# Contract Guardian v2.2 🛡️

**Sistema Inteligente de Revisión de Contratos con IA**

> 📋 **Estado Actual**: Ver [ESTADO_ACTUAL_SISTEMA.md](./ESTADO_ACTUAL_SISTEMA.md) para la arquitectura real implementada (Vite/React, NO Lovable).

Plataforma de revisión automatizada de contratos empresariales mediante un pipeline de agentes de IA especializados, búsqueda semántica RAG, y sistema de gobernanza basado en políticas. Diseñado para contratos Amazon PSA/DSA (Program Service Agreement / Distribution Service Agreement).

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura de Directorios](#-estructura-de-directorios)
- [Base de Datos](#-base-de-datos)
- [Agentes de IA](#-agentes-de-ia)
- [Sistema RAG](#-sistema-rag)
- [Edge Functions](#-edge-functions)
- [Workflows n8n](#-workflows-n8n)
- [Frontend](#-frontend)
- [Monitoreo](#-monitoreo)
- [Configuración](#-configuración)
- [Testing](#-testing)
- [Uso](#-uso)
- [Roadmap](#-roadmap)

---

## 🎯 Visión General

Contract Guardian automatiza la revisión de cláusulas contractuales, identificando desviaciones de términos estándar y proponiendo redlines profesionales mediante IA.

### Características Principales

| Feature | Descripción |
|---------|-------------|
| **Multi-Agent Pipeline** | 4 agentes especializados (Router, Paranoid, Valuator, Sanitizer) |
| **RAG Semántico** | 1,367 policy examples con embeddings OpenAI para búsqueda de similitud |
| **Taxonomía 3-Layer** | Matters → Clause Types → Policy Examples con relaciones jerárquicas |
| **Edge Functions** | 9 funciones Supabase para operaciones críticas |
| **Row Level Security** | RLS en 8 tablas con bypass para superusuarios |
| **Auditoría Completa** | Persistencia de cada paso con audit_events |
| **Leakage Protection** | Sanitización de comentarios para evitar filtración de playbook interno |
| **Exportación Dual** | Markdown rápido + DOCX con track changes via Aspose |

### Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Policy Examples | **1,367** |
| Matters (Materias) | **24** |
| Clause Types (Tipos) | **95** |
| Embeddings Coverage | **100%** |
| Edge Functions | **9 activas** |
| Tests E2E | **9/9 pasados** |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite + Vercel)                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │  Dashboard   │  │ NewAnalysis  │  │ContractReview│  │  Escalations │   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└──────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
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
│  │    (RAG)      │  │ │  • matters          │ │                     │
│  ├───────────────┤  │ │  • clause_types     │ │                     │
│  │W3_ContractRev │  │ │  • policy_examples  │ │                     │
│  └───────────────┘  │ │  • audit_events     │ │                     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENAI API                                         │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│   │ Embeddings │  │   Router   │  │  Paranoid  │  │  Valuator  │            │
│   │text-embed-3│  │ gpt-4o-mini│  │   gpt-4o   │  │ gpt-4o-mini│            │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Backend
| Componente | Tecnología | Versión |
|------------|------------|---------|
| Base de Datos | PostgreSQL (Supabase) | 15+ |
| Vector Search | pgvector | 0.5+ |
| Edge Functions | Deno (Supabase) | 1.x |
| Workflow Engine | n8n Cloud | 1.x |
| LLM Provider | OpenAI | GPT-4o/GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small | 1536 dims |
| Document Processing | Aspose.Words Cloud | 24.x |

### Frontend
| Componente | Tecnología |
|------------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 7 |
| UI Library | shadcn/ui |
| Styling | Tailwind CSS v4 |
| Design System | Garrigues UX (Pantone 3308 C) |
| Hosting | Vercel |
| State | React Context + Supabase Realtime |

---

## 📁 Estructura de Directorios

```
AMAZON REDLINER/
├── 📁 web/                          # Frontend React + Vite
│   ├── 📁 src/
│   │   ├── 📁 components/           # Componentes React
│   │   │   ├── 📁 layout/           # AppSidebar, Layout
│   │   │   └── 📁 ui/               # shadcn/ui (Button, Card, Badge...)
│   │   ├── 📁 pages/                # Páginas principales
│   │   │   ├── Dashboard.tsx        # Vista principal con stats
│   │   │   ├── NewAnalysis.tsx      # Subir contratos
│   │   │   ├── ContractReview.tsx   # Revisar cláusulas
│   │   │   └── Escalations.tsx      # Gestión escalaciones
│   │   ├── 📁 lib/                  # Utilidades
│   │   │   ├── supabase.ts          # Cliente Supabase
│   │   │   └── utils.ts             # Helpers
│   │   └── 📁 types/                # TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json                  # Config deploy
│
├── 📁 supabase/                     # Backend Supabase
│   └── 📁 functions/                # Edge Functions
│       ├── 📁 start_review/         # Iniciar revisión
│       ├── 📁 update_run_status/    # Webhook retorno n8n
│       ├── 📁 generate_export/      # Exportación documentos
│       ├── 📁 monitoring/           # Dashboard métricas
│       ├── 📁 request_review/       # Solicitar revisión humana
│       ├── 📁 export_doc/           # Exportar DOCX
│       └── 📁 n8n-proxy/            # Proxy para n8n
│
├── 📁 n8n/                          # Workflows n8n
│   ├── W1_DriveIngest.json          # Ingesta desde Drive
│   ├── W2_ClauseReview_RAG.json     # Pipeline con RAG
│   └── W3_ContractReview.json       # Orquestación contrato
│
├── 📁 extractors/                   # Procesadores de documentos
│   ├── docx_clause_extractor.ts     # Extractor DOCX
│   ├── pdf_clause_extractor.ts      # Extractor PDF
│   ├── aspose_redline_builder.ts    # Generador redlines Aspose
│   └── embedding_generator.ts       # Generador embeddings
│
├── 📁 validators/                   # Validadores
│   ├── gating_matrix.ts             # Matriz de decisión
│   ├── leakage_guard.ts             # Protección filtración
│   └── validate_anchor_conf.ts      # Validación anclajes
│
├── 📁 playbook/                     # Reglas de negocio
│   ├── PolicySpec.ts                # Interfaces TypeScript
│   ├── PolicySpecLoader.ts          # Loader con cache
│   └── 📁 rules/                    # Reglas YAML por materia
│
├── 📁 scripts/                      # Scripts utilidades
│   ├── generate_redline.js          # Generador DOCX Aspose
│   ├── test_e2e_pipeline.js         # Suite tests E2E
│   ├── generate_embeddings.js       # Generador batch embeddings
│   └── load_harvey_data.js          # Cargador dataset Harvey
│
├── 📁 docs/                         # Documentación
│   ├── MONITORING.md                # Guía monitoreo
│   └── N8N_UPDATE_RUN_STATUS.md     # Integración n8n
│
├── 📁 data/                         # Datasets
│   └── policy_examples_harvey.jsonl # Dataset Harvey (1,367 ejemplos)
│
├── prd.json                         # Product Requirements Document
├── progress.txt                     # Log de progreso Ralph
└── .env                             # Variables de entorno
```

---

## 🗄️ Base de Datos

### Esquema Principal

#### Tablas Core

| Tabla | Propósito | RLS |
|-------|-----------|-----|
| `documents` | Metadatos de contratos | ✅ |
| `contract_runs` | Ejecuciones de revisión | ✅ |
| `clause_reviews` | Resultados por cláusula | ✅ |
| `audit_events` | Log de auditoría | ✅ (solo superusers) |

#### Taxonomía 3-Layer

| Tabla | Propósito | Registros |
|-------|-----------|-----------|
| `matters` | Categorías legales (ej: IP Rights, Indemnification) | 24 |
| `clause_types` | Tipos específicos de cláusula | 95 |
| `matter_policies` | Relación matter ↔ policy | 24 |
| `policy_examples` | Ejemplos con embeddings para RAG | 1,367 |

#### Estructura policy_examples

```sql
CREATE TABLE policy_examples (
    id UUID PRIMARY KEY,
    matter_policy_id UUID REFERENCES matter_policies(id),
    clause_type_id UUID REFERENCES clause_types(id),
    text TEXT NOT NULL,                    -- Texto de la cláusula
    acceptance acceptance_enum,            -- ACCEPTABLE | PASSABLE | UNACCEPTABLE
    embedding vector(1536),                -- OpenAI text-embedding-3-small
    rationale TEXT,                        -- Explicación del nivel
    proposed_redline TEXT,                 -- Texto alternativo sugerido
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Distribución de Ejemplos

| Acceptance | Count | % |
|------------|-------|---|
| ACCEPTABLE | 456 | 33.4% |
| PASSABLE | 458 | 33.5% |
| UNACCEPTABLE | 453 | 33.1% |

### Vistas de Monitoreo

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

### Funciones RPC

| Función | Propósito |
|---------|-----------|
| `search_policy_examples()` | Búsqueda semántica por embedding |
| `get_monitoring_dashboard()` | Dashboard completo de métricas |
| `is_superuser()` | Verificar permisos de superusuario |

---

## 🤖 Agentes de IA

### Pipeline de 4 Agentes

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  ROUTER  │ → │ PARANOID │ → │ VALUATOR │ → │SANITIZER │
│ Classify │    │  Analyze │    │  Decide  │    │  Clean   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
  gpt-4o-mini      gpt-4o       gpt-4o-mini    gpt-4o-mini
    ~30s            ~60s          ~60s           ~30s
```

### 1. Router Agent
**Modelo**: `gpt-4o-mini` | **Timeout**: 30s

Clasifica la cláusula en una de 24 familias legales:
- `rights_ownership` - Derechos y propiedad
- `indemnity_prodco` - Indemnización ProdCo
- `termination_and_remedies` - Terminación y remedios
- `confidentiality_and_publicity` - Confidencialidad
- ... (20 más)

**Output**:
```json
{
  "route": "indemnity_prodco",
  "confidence": 0.92,
  "detected_family": "Indemnification"
}
```

### 2. Paranoid Agent
**Modelo**: `gpt-4o` | **Timeout**: 60s

Encuentra TODAS las desviaciones de términos estándar.

**Input**: Cláusula + Policy Examples similares (RAG)

**Output**:
```json
{
  "evidence_spans": [
    {
      "quote": "Amazon may terminate immediately...",
      "issue": "No cure period specified",
      "severity": "high",
      "policy_reference": "Standard requires 30-day cure"
    }
  ],
  "escalation_recommended": true,
  "block_export": false
}
```

### 3. Valuator Agent
**Modelo**: `gpt-4o-mini` | **Timeout**: 60s

Decide la acción y propone cambios basándose en la evidencia.

**Decisiones**:
| Decision | Significado |
|----------|-------------|
| `ACCEPT` | Cláusula conforme |
| `ESCALATE_HUMAN` | Requiere revisión humana |
| `BLOCK_EXPORT` | Inaceptable, bloquea export |
| `READY_FOR_EXPORT` | Listo para exportar |

**Output**:
```json
{
  "decision": "ESCALATE_HUMAN",
  "acceptance": "PASSABLE",
  "proposed_changes": {
    "redline": "Amazon may terminate upon 30 days written notice...",
    "changes": [
      { "type": "INSERT", "text": "30 days written" }
    ]
  },
  "internal_comment": "Missing cure period violates policy 4.2"
}
```

### 4. Sanitizer Agent
**Modelo**: `gpt-4o-mini` | **Timeout**: 30s

Convierte comentarios internos en texto profesional para cliente.

**NUNCA mencionar**: playbook, policy, thresholds, rule names, internal references.

**Output**:
```json
{
  "client_comment": "This clause may benefit from review to ensure alignment with standard practices.",
  "safety_pass": true,
  "leaked_terms": []
}
```

---

## 🔍 Sistema RAG

### Flujo de Búsqueda Semántica

```
1. Cláusula del contrato
        ↓
2. Generar embedding (OpenAI text-embedding-3-small)
        ↓
3. Búsqueda en policy_examples (pgvector cosine similarity)
        ↓
4. Top 5 ejemplos similares con acceptance levels
        ↓
5. Contexto para Paranoid Agent
```

### Función de Búsqueda

```sql
SELECT * FROM search_policy_examples(
    query_embedding := $embedding,
    match_threshold := 0.5,
    match_count := 5
);
```

### Resultado Típico

```json
[
  {
    "id": "uuid",
    "text": "Amazon shall own exclusively...",
    "acceptance": "ACCEPTABLE",
    "similarity": 0.983,
    "matter_code": "rights_ownership",
    "clause_type": "Exclusive Ownership Universe Perpetuity"
  }
]
```

---

## ⚡ Edge Functions

### Funciones Disponibles

| Función | Endpoint | JWT | Propósito |
|---------|----------|-----|-----------|
| `start_review` | POST /start_review | ✅ | Iniciar revisión de contrato |
| `update_run_status` | POST /update_run_status | ❌ | Webhook retorno de n8n |
| `generate_export` | POST /generate_export | ❌ | Exportar documento (Markdown) |
| `monitoring` | POST /monitoring | ❌ | Dashboard de métricas |
| `request_review` | POST /request_review | ✅ | Solicitar revisión humana |
| `export_doc` | POST /export_doc | ✅ | Exportar DOCX (via n8n) |
| `n8n-proxy` | POST /n8n-proxy | ❌ | Proxy seguro para n8n |
| `admin_setup` | POST /admin_setup | ❌ | Configuración admin |

### Ejemplo: Iniciar Revisión

```bash
curl -X POST "https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/start_review" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid",
    "contract_type_id": "dsa_streaming_v1"
  }'
```

### Ejemplo: Obtener Métricas

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

---

## 🔄 Workflows n8n

### W1_DriveIngest
**Trigger**: Nuevo archivo en Google Drive

```
Watch Folder → Download → Extract Clauses → Store in Supabase → Trigger W2
```

### W2_ClauseReview_RAG ⭐
**Trigger**: Webhook POST `/clause-review`

```
Webhook → Parse → Router → RAG Search → Paranoid → Valuator 
       → Sanitizer → Build Result → Save Review → Respond
```

**Nodos principales**:

| # | Nodo | Función |
|---|------|---------|
| 1 | Webhook | Entry point |
| 2 | Router Agent | Clasificar cláusula |
| 3 | RAG Search | Buscar ejemplos similares |
| 4 | Paranoid Agent | Analizar desviaciones |
| 5 | Valuator Agent | Decidir y proponer |
| 6 | Sanitizer Agent | Limpiar comentarios |
| 7 | Save Review | Persistir en Supabase |
| 8 | Update Run Status | Llamar webhook retorno |

### W3_ContractReview
**Trigger**: Webhook POST `/contract-review`

```
Fetch Clauses → Loop W2 → Aggregate → Generate Report → Export DOCX
```

---

## 🖥️ Frontend

### URLs de Producción

| Entorno | URL |
|---------|-----|
| **Producción** | https://web-tan-mu-35.vercel.app |
| **Local dev** | http://localhost:5173 |

### Páginas Principales

| Página | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | Vista principal con stats y documentos |
| NewAnalysis | `/new` | Subir nuevo contrato |
| ContractReview | `/review/:id` | Revisar cláusulas |
| Escalations | `/escalations` | Panel de escalaciones |

### Autenticación

El sistema soporta dos modos:
- **Dev Mode** (`USE_DEV_MODE = true`): Usuario de desarrollo automático
- **Auth Mode** (`USE_DEV_MODE = false`): Autenticación real Supabase

#### Superusuarios de Prueba

| Email | Role | Permisos |
|-------|------|----------|
| admin@test.com | admin | `["all"]` - full access |
| client@test.com | client | `["all"]` - full access |

```typescript
// src/hooks/useAuth.tsx
const { user, isSuperuser } = useAuth();

if (isSuperuser) {
  // Acceso completo sin restricciones
}
```

---

## 📊 Monitoreo

### Dashboard Endpoint

```bash
curl https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/monitoring
```

### Métricas Disponibles

| Categoría | Métricas |
|-----------|----------|
| **Overview** | documents, runs, reviews, examples |
| **RAG Stats** | examples por matter, distribución acceptance |
| **Recent Runs** | últimos 10 con duración y status |
| **Errors** | runs fallidos con mensajes |

### Vistas SQL

```sql
-- Dashboard completo
SELECT get_monitoring_dashboard();

-- Stats por materia
SELECT * FROM monitoring_rag_stats WHERE example_count > 0;
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# Supabase
SUPABASE_URL=https://hvlsuwdqtffiilvampxq.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# OpenAI
OPENAI_API_KEY=sk-...

# n8n (opcional, configurado en Edge Functions)
N8N_WEBHOOK_CONTRACT_REVIEW=https://...
N8N_WEBHOOK_EXPORT_DOC=https://...

# Aspose (para DOCX export)
ASPOSE_CLIENT_ID=...
ASPOSE_CLIENT_SECRET=...

# Google Drive (configurado en n8n)
DRIVE_INPUT_FOLDER_ID=1abc...
DRIVE_OUTPUT_FOLDER_ID=1xyz...
```

### Credenciales n8n

| Credential | Propósito |
|------------|-----------|
| OpenAI API | Agentes y embeddings |
| Supabase | Base de datos |
| Google Drive | Ingesta/exportación |
| Aspose Cloud | Generación DOCX |

---

## 🧪 Testing

### Suite E2E

```bash
node scripts/test_e2e_pipeline.js
```

**Tests incluidos**:
1. ✅ Database connection
2. ✅ Monitoring dashboard RPC
3. ✅ RAG search function
4. ✅ Policy examples embeddings
5. ✅ Matters taxonomy
6. ✅ Clause types taxonomy
7. ✅ Contract runs
8. ✅ Superuser function
9. ✅ Edge Functions

### Test RAG

```bash
node test_rag_real.js
```

### Verificar Embeddings

```sql
SELECT 
  COUNT(*) as total,
  COUNT(embedding) as with_embeddings,
  ROUND(100.0 * COUNT(embedding) / COUNT(*), 1) as pct
FROM policy_examples;
```

---

## 🚀 Uso

### Flujo Típico

1. **Subir contrato** en NewAnalysis
2. Sistema extrae cláusulas automáticamente
3. Pipeline W2 procesa cada cláusula con RAG
4. Resultados visibles en ContractReview
5. Escalaciones en panel dedicado
6. **Exportar** documento con cambios

### API: Iniciar Revisión

```bash
curl -X POST "$SUPABASE_URL/functions/v1/start_review" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "uuid"}'
```

### API: Obtener Estado

```bash
curl "$SUPABASE_URL/rest/v1/contract_runs?document_id=eq.uuid" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

---

## 📍 Roadmap

### Completado ✅

- [x] Pipeline 4 agentes (Router, Paranoid, Valuator, Sanitizer)
- [x] Sistema RAG con 1,367 policy examples
- [x] Taxonomía 3-layer (matters, clause_types, examples)
- [x] Edge Functions (9 activas)
- [x] Row Level Security con superusuarios
- [x] Monitoreo y dashboard
- [x] Tests E2E (9/9 pasados)
- [x] Frontend React + Vite desplegado en Vercel
- [x] Exportación Markdown

### En Progreso 🔄

- [ ] Visualización interactiva Knowledge Graph
- [ ] Exportación DOCX con track changes producción
- [ ] CI/CD con tests automáticos

### Próximo 📋

- [ ] Multi-tenant con organizaciones
- [ ] Dashboard analytics avanzado
- [ ] Integración Slack para escalaciones
- [ ] API pública documentada

---

## 📞 Soporte

Para issues o mejoras, contactar al equipo de desarrollo.

---

## 📄 Licencia

**Propiedad Exclusiva**

© 2026 **g-digital**, División de Negocio Digital de **J&A GARRIGUES, S.L.P.**

Todos los derechos reservados. Este software es propiedad exclusiva de g-digital y está protegido por las leyes de propiedad intelectual aplicables. Queda prohibida su reproducción, distribución, modificación o uso no autorizado sin el consentimiento expreso por escrito de g-digital.

---

*Última actualización: 2026-01-28 | Contract Guardian v2.1*
