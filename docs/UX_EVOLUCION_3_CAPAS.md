# UX Evolution: Arquitectura 3 Capas

**Fecha**: 2026-01-20
**Proyecto**: Contract Guardian / Amazon Redliner
**Estado**: PROPUESTA - Pendiente de aprobación

---

## 1. Resumen Ejecutivo

Este documento describe los cambios de UX necesarios para soportar la arquitectura de 3 capas, incluyendo nuevos roles, páginas y flujos de usuario.

### Cambios Principales

| Área | Estado Actual | Estado Propuesto |
|------|---------------|------------------|
| **Roles** | 2 (client, firm_admin) | 5 roles diferenciados |
| **Páginas** | 6 páginas | 12+ páginas |
| **Sidebar** | Flat list | Secciones por rol |
| **Resolver** | `playbookMap` hardcoded | `contract_type_review_defaults` dinámico |
| **Feedback** | N/A | Loop de mejora continua |

---

## 2. Nuevos Roles

### 2.1 Taxonomía de Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROLES 3-LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │    CLIENT       │   │   LEGAL_OPS     │   │ BLUEPRINT_ADMIN │   │
│  │                 │   │                 │   │                 │   │
│  │ • Upload docs   │   │ • Review escal. │   │ • Create/Edit   │   │
│  │ • Review clauses│   │ • Resolve issues│   │   Blueprints    │   │
│  │ • Accept/Reject │   │ • Feedback loop │   │ • Manage Matter │   │
│  │ • Escalate      │   │ • Quality audit │   │   Policies      │   │
│  │                 │   │                 │   │ • Policy Ex.    │   │
│  └─────────────────┘   └─────────────────┘   │ • Fallbacks     │   │
│                                              └─────────────────┘   │
│  ┌─────────────────┐   ┌─────────────────┐                         │
│  │  MODEL_ADMIN    │   │   SUPER_ADMIN   │                         │
│  │                 │   │                 │                         │
│  │ • Create/Edit   │   │ • All above     │                         │
│  │   Contract      │   │ • Org settings  │                         │
│  │   Models        │   │ • User mgmt     │                         │
│  │ • Clone Models  │   │ • System config │                         │
│  │ • Set defaults  │   │ • Analytics     │                         │
│  └─────────────────┘   └─────────────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Detalle de Roles

| Rol | Código | Descripción | Permisos Clave |
|-----|--------|-------------|----------------|
| **Cliente** | `client` | Usuario final que sube contratos | Upload, Review, Escalate |
| **Legal Ops** | `legal_ops` | Revisor de escalaciones | Resolve, Comment, Quality Audit |
| **Blueprint Admin** | `blueprint_admin` | Gestiona posiciones y ejemplos | CRUD Blueprints, Matter Policies, Examples |
| **Model Admin** | `model_admin` | Gestiona templates de contrato | CRUD Contract Models, Set Defaults |
| **Super Admin** | `super_admin` | Administrador total | All + Org Config + Users |

### 2.3 Migración de Roles

```sql
-- Añadir nuevos roles al enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'legal_ops';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'blueprint_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'model_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Migrar firm_admin existentes a legal_ops
UPDATE user_roles SET role = 'legal_ops' WHERE role = 'firm_admin';
```

---

## 3. Estructura de Navegación

### 3.1 Sidebar por Rol

```
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR - CLIENT                                             │
├──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard                                                 │
│ ➕ Nuevo Análisis                                            │
│ 📄 Mis Documentos                                            │
│ ⚠️ Mis Escalaciones                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR - LEGAL_OPS                                          │
├──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard                                                 │
│ ────────────────────                                         │
│ 📋 COLA DE TRABAJO                                           │
│    ⚠️ Escalaciones Pendientes                                │
│    ✅ Escalaciones Resueltas                                 │
│ ────────────────────                                         │
│ 📈 CALIDAD                                                   │
│    📊 Métricas de Revisión                                   │
│    💬 Feedback Loop                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR - BLUEPRINT_ADMIN                                    │
├──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard                                                 │
│ ────────────────────                                         │
│ 📘 BLUEPRINTS                                                │
│    📋 Blueprints                                             │
│    📁 Materias                                               │
│    🏷️ Tipos de Cláusula                                      │
│ ────────────────────                                         │
│ 📚 DATASET RAG                                               │
│    📝 Policy Examples                                        │
│    🔄 Fallback Clauses                                       │
│    📊 Cobertura del Dataset                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR - MODEL_ADMIN                                        │
├──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard                                                 │
│ ────────────────────                                         │
│ 📑 CONTRACT MODELS                                           │
│    📄 Modelos de Contrato                                    │
│    📋 Cláusulas del Modelo                                   │
│    ⚙️ Parámetros                                             │
│ ────────────────────                                         │
│ 🔗 CONFIGURACIÓN                                             │
│    🎯 Defaults por Tipo                                      │
│    📊 Uso de Modelos                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR - SUPER_ADMIN                                        │
├──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard Global                                          │
│ ────────────────────                                         │
│ 👥 USUARIOS                                                  │
│    👤 Gestión de Usuarios                                    │
│    🏢 Organizaciones                                         │
│    🔐 Permisos                                               │
│ ────────────────────                                         │
│ 📘 BLUEPRINTS (All)                                          │
│ 📑 CONTRACT MODELS (All)                                     │
│ ────────────────────                                         │
│ ⚙️ SISTEMA                                                   │
│    📊 Analytics                                              │
│    🔧 Configuración                                          │
│    📜 Audit Log                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Nuevas Páginas

### 4.1 Matriz de Páginas por Rol

| Página | Ruta | client | legal_ops | blueprint_admin | model_admin | super_admin |
|--------|------|--------|-----------|-----------------|-------------|-------------|
| Dashboard | `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nuevo Análisis | `/new` | ✅ | - | - | - | ✅ |
| Mis Documentos | `/documents` | ✅ | ✅ | - | - | ✅ |
| Revisión Contrato | `/review/:id` | ✅ | ✅ | - | - | ✅ |
| Escalaciones | `/escalations` | ✅ (own) | ✅ (all) | - | - | ✅ |
| **Blueprints** | `/blueprints` | - | - | ✅ | - | ✅ |
| **Blueprint Detail** | `/blueprints/:id` | - | - | ✅ | - | ✅ |
| **Matters** | `/matters` | - | - | ✅ | - | ✅ |
| **Clause Types** | `/clause-types` | - | - | ✅ | - | ✅ |
| **Policy Examples** | `/policy-examples` | - | - | ✅ | - | ✅ |
| **Fallback Clauses** | `/fallback-clauses` | - | - | ✅ | - | ✅ |
| **Contract Models** | `/contract-models` | - | - | - | ✅ | ✅ |
| **Model Detail** | `/contract-models/:id` | - | - | - | ✅ | ✅ |
| **Defaults Config** | `/defaults` | - | - | - | ✅ | ✅ |
| **Users** | `/admin/users` | - | - | - | - | ✅ |
| **Organizations** | `/admin/orgs` | - | - | - | - | ✅ |
| **Analytics** | `/admin/analytics` | - | - | - | - | ✅ |

### 4.2 Nuevas Páginas - Detalle

#### 4.2.1 `/blueprints` - Lista de Blueprints

```
┌─────────────────────────────────────────────────────────────────────┐
│ Blueprints                                            [+ Nuevo]    │
├─────────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar...                          [Estado ▾] [Org ▾]           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📘 Amazon PSA/DSA Blueprint                                     │ │
│ │    v1.0 • PUBLISHED • 12 materias • 1,282 ejemplos              │ │
│ │    Última actualización: 2026-01-20                             │ │
│ │                                      [Editar] [Clonar] [Ver]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📘 Nueva Planta EPC Blueprint                                   │ │
│ │    v1.0 • DRAFT • 5 materias • 45 ejemplos                      │ │
│ │    Última actualización: 2026-01-15                             │ │
│ │                                      [Editar] [Publicar] [Ver]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 `/blueprints/:id` - Detalle de Blueprint

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Blueprints    Amazon PSA/DSA Blueprint            [Editar] [...]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────┬─────────────────────────────────────────────────┐   │
│ │             │                                                 │   │
│ │ VERSIONES   │  MATTER POLICIES                                │   │
│ │             │                                                 │   │
│ │ ● v1.0      │  ┌───────────────────────────────────────────┐  │   │
│ │   PUBLISHED │  │ 🏷️ Rights & Ownership           [12 types]│  │   │
│ │   2026-01-20│  │    • Exclusive ownership                  │  │   │
│ │             │  │    • Non-exclusive license                │  │   │
│ │ ○ v0.9 BETA │  │    • Territory restrictions               │  │   │
│ │             │  └───────────────────────────────────────────┘  │   │
│ │             │                                                 │   │
│ │             │  ┌───────────────────────────────────────────┐  │   │
│ │             │  │ 🏷️ Commercials: Fees & Credit    [8 types]│  │   │
│ │             │  │    • Payment terms                        │  │   │
│ │             │  │    • Credit conditions                    │  │   │
│ │             │  └───────────────────────────────────────────┘  │   │
│ │             │                                                 │   │
│ │             │  ┌───────────────────────────────────────────┐  │   │
│ │             │  │ 🏷️ Indemnity: ProdCo            [6 types] │  │   │
│ │             │  │    • Standard indemnity                   │  │   │
│ │             │  │    • Carve-outs                           │  │   │
│ │             │  └───────────────────────────────────────────┘  │   │
│ │             │                                                 │   │
│ │             │  ... (18 materias total)                        │   │
│ │             │                                                 │   │
│ └─────────────┴─────────────────────────────────────────────────┘   │
│                                                                     │
│ ────────────────────────────────────────────────────────────────── │
│                                                                     │
│ ESTADÍSTICAS                                                        │
│                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │   18         │ │   67         │ │   1,282      │ │   50         ││
│ │   Materias   │ │   Clause     │ │   Policy     │ │   Fallback   ││
│ │              │ │   Types      │ │   Examples   │ │   Clauses    ││
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 `/policy-examples` - Gestión de Ejemplos RAG

```
┌─────────────────────────────────────────────────────────────────────┐
│ Policy Examples                                       [+ Nuevo]    │
├─────────────────────────────────────────────────────────────────────┤
│ Blueprint: [Amazon PSA/DSA ▾]  Matter: [All ▾]  Acceptance: [All▾] │
│ 🔍 Buscar en textos...                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ DISTRIBUCIÓN POR ACEPTACIÓN                                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ███████████████████████████ ACCEPTABLE (425)                    │ │
│ │ ████████████████████████████ PASSABLE (432)                     │ │
│ │ ███████████████████████████ UNACCEPTABLE (425)                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [✅ ACCEPTABLE] rights_ownership / exclusive_ownership          │ │
│ │ "Producer grants to Amazon the exclusive, irrevocable,          │ │
│ │  perpetual right to exploit the Series throughout the           │ │
│ │  universe in all media now known or hereafter devised..."       │ │
│ │                                                                 │ │
│ │ Source: PSA_Principal_Terms • Section: RIGHTS                   │ │
│ │                                        [Editar] [Duplicar] [🗑️] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [⚠️ PASSABLE] fees / payment_net_30                             │ │
│ │ "Payment shall be made within thirty (30) days following        │ │
│ │  receipt of valid invoice, subject to approval..."              │ │
│ │                                                                 │ │
│ │ Source: Counterparty_Proposal • Approval: LEGAL                 │ │
│ │                                        [Editar] [Duplicar] [🗑️] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [❌ UNACCEPTABLE] indemnity / unlimited_liability               │ │
│ │ "Producer shall indemnify Amazon for any and all claims         │ │
│ │  without limitation, including consequential damages..."        │ │
│ │                                                                 │ │
│ │ Source: Counterparty_Proposal • Reasoning: Open-ended exposure  │ │
│ │                                        [Editar] [Duplicar] [🗑️] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Mostrando 1-25 de 1,282                          [< Anterior] [>]  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.4 `/defaults` - Configuración de Defaults por Tipo

```
┌─────────────────────────────────────────────────────────────────────┐
│ Contract Type Defaults                                 [+ Nuevo]   │
├─────────────────────────────────────────────────────────────────────┤
│ Configuración que reemplaza el antiguo `playbookMap`                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📄 amazon-psa                                                   │ │
│ │ Amazon PSA (Production Service Agreement)                       │ │
│ │                                                                 │ │
│ │ Blueprint:        Amazon PSA/DSA Blueprint v1.0 [Cambiar]       │ │
│ │ Contract Model:   Amazon PSA Standard v1.0      [Cambiar]       │ │
│ │ Knowledge Graph:  Amazon Legal KG               [Cambiar]       │ │
│ │                                                                 │ │
│ │                                           [Guardar] [Eliminar]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📄 amazon-dsa                                                   │ │
│ │ Amazon DSA (Digital Services Agreement)                         │ │
│ │                                                                 │ │
│ │ Blueprint:        Amazon PSA/DSA Blueprint v1.0 [Cambiar]       │ │
│ │ Contract Model:   Amazon DSA Standard v1.0      [Cambiar]       │ │
│ │ Knowledge Graph:  -                             [Asignar]       │ │
│ │                                                                 │ │
│ │                                           [Guardar] [Eliminar]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📄 nueva-planta-epc                                             │ │
│ │ Nueva Planta EPC                                                │ │
│ │                                                                 │ │
│ │ Blueprint:        -                             [Asignar]       │ │
│ │ Contract Model:   -                             [Asignar]       │ │
│ │ Knowledge Graph:  -                             [Asignar]       │ │
│ │                                                                 │ │
│ │ ⚠️ Sin Blueprint asignado. Usando playbook legacy.              │ │
│ │                                           [Guardar] [Eliminar]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Cambios en Flujos Existentes

### 5.1 NewAnalysis - Nuevo Flujo con Resolver

```
ANTES (playbookMap):
┌──────────────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona contract_type (amazon-psa)                 │
│ 2. n8nService.getPlaybookId('amazon-psa') → 'amazon-dsa-v1'      │
│ 3. Envía playbook_id a W1/W3                                     │
│ 4. n8n usa playbook hardcoded                                    │
└──────────────────────────────────────────────────────────────────┘

DESPUÉS (resolver):
┌──────────────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona contract_type (amazon-psa)                 │
│ 2. Fetch contract_type_review_defaults WHERE contract_type_id =  │
│    'amazon-psa'                                                  │
│ 3. Obtiene: {                                                    │
│      blueprint_version_id: 'uuid',                               │
│      contract_model_version_id: 'uuid',                          │
│      knowledge_graph_id: 'uuid' | null                           │
│    }                                                             │
│ 4. Envía IDs a W1/W3                                             │
│ 5. n8n carga Blueprint y Contract Model dinámicamente            │
│ 6. RAG retriever usa policy_examples del Blueprint               │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 ContractReview - Nuevo Flujo con review_findings

```
ANTES (clause_reviews):
┌──────────────────────────────────────────────────────────────────┐
│ • Lee clause_reviews (flat list)                                 │
│ • Sin grounding/evidencia                                        │
│ • Sin referencia a policy_examples                               │
└──────────────────────────────────────────────────────────────────┘

DESPUÉS (review_findings + grounding):
┌──────────────────────────────────────────────────────────────────┐
│ • Lee review_findings + clause_instances                         │
│ • Cada finding incluye:                                          │
│   - grounding: [policy_example_id, ...]                          │
│   - proposed_fallback_id                                         │
│   - confidence_score                                             │
│ • UI muestra evidencia expandible                                │
│ • Link a policy_example original                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 ContractReview - UI con Grounding

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Dashboard   Contract Review: PSA_Amazon_2026.pdf                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ CLÁUSULAS                   │ │ DETALLE                         │ │
│ │                             │ │                                 │ │
│ │ 🔍 Buscar...                │ │ § 4.2 Payment Terms             │ │
│ │                             │ │                                 │ │
│ │ ┌─────────────────────────┐ │ │ TEXTO ORIGINAL                  │ │
│ │ │ ⚠️ § 4.2 Payment Terms  │ │ │ ───────────────                 │ │
│ │ │    PASSABLE             │ │ │ "Payment shall be due within    │ │
│ │ │    Fees • Net 60        │ │ │  sixty (60) days of invoice..." │ │
│ │ └─────────────────────────┘ │ │                                 │ │
│ │                             │ │ EVALUACIÓN                      │ │
│ │ ┌─────────────────────────┐ │ │ ───────────────                 │ │
│ │ │ ❌ § 7.1 Indemnity      │ │ │ ⚠️ PASSABLE - Requires Approval │ │
│ │ │    UNACCEPTABLE         │ │ │ Confidence: 87%                 │ │
│ │ │    Indemnity • Open     │ │ │                                 │ │
│ │ └─────────────────────────┘ │ │ EVIDENCIA (RAG GROUNDING)       │ │
│ │                             │ │ ───────────────                 │ │
│ │ ┌─────────────────────────┐ │ │ ┌───────────────────────────┐   │ │
│ │ │ ✅ § 2.1 Rights Grant   │ │ │ │ 📌 Similar Example #1     │   │ │
│ │ │    ACCEPTABLE           │ │ │ │    PASSABLE (92% match)   │   │ │
│ │ │    Rights • Exclusive   │ │ │ │    "Payment within 45..."  │   │ │
│ │ └─────────────────────────┘ │ │ │    [Ver completo]         │   │ │
│ │                             │ │ └───────────────────────────┘   │ │
│ │                             │ │ ┌───────────────────────────┐   │ │
│ │                             │ │ │ 📌 Similar Example #2     │   │ │
│ │                             │ │ │    ACCEPTABLE (78% match) │   │ │
│ │                             │ │ │    "Payment net 30..."     │   │ │
│ │                             │ │ │    [Ver completo]         │   │ │
│ │                             │ │ └───────────────────────────┘   │ │
│ │                             │ │                                 │ │
│ │                             │ │ CAMBIO PROPUESTO                │ │
│ │                             │ │ ───────────────                 │ │
│ │                             │ │ Fallback: NET_30_STANDARD       │ │
│ │                             │ │ "Payment shall be due within    │ │
│ │                             │ │  thirty (30) days of..."        │ │
│ │                             │ │                                 │ │
│ │                             │ │ [✅ Aceptar] [❌ Rechazar]      │ │
│ │                             │ │ [⚠️ Escalar] [💬 Comentar]     │ │
│ └─────────────────────────────┘ └─────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Feedback Loop

### 6.1 Concepto

Cuando un usuario acepta/rechaza un finding o resuelve una escalación, el sistema captura ese feedback para mejorar el dataset RAG.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FEEDBACK LOOP                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuario                  Sistema                   Blueprint Admin │
│     │                        │                            │         │
│     │ [Rechaza finding]      │                            │         │
│     │───────────────────────>│                            │         │
│     │                        │ Registra feedback          │         │
│     │                        │───────────────────────────>│         │
│     │                        │                            │         │
│     │                        │                   [Revisa feedback]  │
│     │                        │                            │         │
│     │                        │                   [Añade ejemplo     │
│     │                        │<───────────────── ACCEPTABLE con     │
│     │                        │                   el texto rechazado]│
│     │                        │                            │         │
│     │                        │ RAG mejorado               │         │
│     │<───────────────────────│                            │         │
│     │                        │                            │         │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Nueva Tabla: `finding_feedback`

```sql
CREATE TABLE finding_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID REFERENCES review_findings(id),
  feedback_type TEXT CHECK (feedback_type IN ('accepted', 'rejected', 'modified', 'escalated')),
  user_id UUID REFERENCES profiles(id),
  original_acceptance TEXT, -- ACCEPTABLE/PASSABLE/UNACCEPTABLE
  user_comment TEXT,
  reviewed_by UUID REFERENCES profiles(id), -- Blueprint Admin que procesó
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT, -- 'added_example', 'modified_policy', 'no_action'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.3 UI - Feedback Queue (Blueprint Admin)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Feedback Queue                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Pendientes: 23    Esta semana: 87    Tasa de acción: 67%           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 REJECTED - Payment Terms                     hace 2 horas    │ │
│ │                                                                 │ │
│ │ Sistema dijo: UNACCEPTABLE                                      │ │
│ │ Usuario dijo: "Este plazo es estándar en nuestra industria"     │ │
│ │                                                                 │ │
│ │ Texto: "Payment within ninety (90) days..."                     │ │
│ │                                                                 │ │
│ │ Grounding usado: policy_example_id=abc123 (72% match)           │ │
│ │                                                                 │ │
│ │ ACCIONES:                                                       │ │
│ │ [+ Añadir como PASSABLE] [+ Añadir como ACCEPTABLE]             │ │
│ │ [Modificar Policy] [Ignorar (explicar)]                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 MODIFIED - Rights Grant                      hace 4 horas    │ │
│ │                                                                 │ │
│ │ Sistema propuso: Fallback A                                     │ │
│ │ Usuario usó: Texto modificado manualmente                       │ │
│ │                                                                 │ │
│ │ Texto modificado: "Rights granted on non-exclusive basis..."    │ │
│ │                                                                 │ │
│ │ ACCIONES:                                                       │ │
│ │ [+ Añadir como Fallback] [Revisar] [Ignorar]                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Cambios en Código

### 7.1 Nuevos Tipos TypeScript

```typescript
// types/roles.ts
export type AppRole = 'client' | 'legal_ops' | 'blueprint_admin' | 'model_admin' | 'super_admin';

export interface UserPermissions {
  canUpload: boolean;
  canReview: boolean;
  canEscalate: boolean;
  canResolveEscalations: boolean;
  canManageBlueprints: boolean;
  canManageModels: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}

export const rolePermissions: Record<AppRole, UserPermissions> = {
  client: {
    canUpload: true,
    canReview: true,
    canEscalate: true,
    canResolveEscalations: false,
    canManageBlueprints: false,
    canManageModels: false,
    canManageUsers: false,
    canViewAnalytics: false,
  },
  legal_ops: {
    canUpload: false,
    canReview: true,
    canEscalate: false,
    canResolveEscalations: true,
    canManageBlueprints: false,
    canManageModels: false,
    canManageUsers: false,
    canViewAnalytics: false,
  },
  blueprint_admin: {
    canUpload: false,
    canReview: false,
    canEscalate: false,
    canResolveEscalations: false,
    canManageBlueprints: true,
    canManageModels: false,
    canManageUsers: false,
    canViewAnalytics: true,
  },
  model_admin: {
    canUpload: false,
    canReview: false,
    canEscalate: false,
    canResolveEscalations: false,
    canManageBlueprints: false,
    canManageModels: true,
    canManageUsers: false,
    canViewAnalytics: true,
  },
  super_admin: {
    canUpload: true,
    canReview: true,
    canEscalate: true,
    canResolveEscalations: true,
    canManageBlueprints: true,
    canManageModels: true,
    canManageUsers: true,
    canViewAnalytics: true,
  },
};
```

### 7.2 Nuevo Hook: useContractDefaults

```typescript
// hooks/useContractDefaults.ts
import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/supabase/client';

interface ContractDefaults {
  contract_type_id: string;
  blueprint_version_id: string | null;
  contract_model_version_id: string | null;
  knowledge_graph_id: string | null;
}

export function useContractDefaults(contractTypeId: string) {
  return useQuery({
    queryKey: ['contract-defaults', contractTypeId],
    queryFn: async (): Promise<ContractDefaults | null> => {
      const { data, error } = await externalSupabase
        .from('contract_type_review_defaults')
        .select('*')
        .eq('contract_type_id', contractTypeId)
        .single();

      if (error) {
        console.warn('No defaults found for', contractTypeId);
        return null;
      }

      return data;
    },
    enabled: !!contractTypeId,
  });
}
```

### 7.3 Actualizar n8nService.ts

```typescript
// services/n8nService.ts

// ANTES: getPlaybookId hardcoded
// export function getPlaybookId(contractTypeId: string): string {
//   return playbookMap[contractTypeId] || 'generic-v1';
// }

// DESPUÉS: Usar defaults del resolver
export interface ReviewConfig {
  blueprint_version_id: string;
  contract_model_version_id: string | null;
  knowledge_graph_id: string | null;
}

export async function getReviewConfig(contractTypeId: string): Promise<ReviewConfig | null> {
  const { data, error } = await externalSupabase
    .from('contract_type_review_defaults')
    .select('blueprint_version_id, contract_model_version_id, knowledge_graph_id')
    .eq('contract_type_id', contractTypeId)
    .single();

  if (error || !data) {
    console.warn('Falling back to legacy playbook for', contractTypeId);
    return null; // Caller decides to use legacy
  }

  return data;
}

// Actualizar payload para W1/W3
export interface ContractReviewPayloadV2 {
  document_id: string;
  tenant_id: string;
  // Legacy (deprecated)
  playbook_id?: string;
  // 3-Layer
  blueprint_version_id?: string;
  contract_model_version_id?: string;
  knowledge_graph_id?: string;
}
```

---

## 8. Plan de Implementación

### 8.1 Fases

| Fase | Descripción | Duración Estimada |
|------|-------------|-------------------|
| **Fase 1** | Nuevos roles + Sidebar dinámico | 1 sprint |
| **Fase 2** | Páginas Blueprint Admin (Blueprints, Matters, Clause Types) | 2 sprints |
| **Fase 3** | Páginas Policy Examples + Fallback Clauses | 1 sprint |
| **Fase 4** | Resolver + Actualizar NewAnalysis | 1 sprint |
| **Fase 5** | ContractReview con grounding | 2 sprints |
| **Fase 6** | Feedback Loop | 1 sprint |
| **Fase 7** | Model Admin pages | 2 sprints |
| **Fase 8** | Super Admin + Analytics | 2 sprints |

### 8.2 Dependencias

```
Fase 1 ──┐
         ├──> Fase 2 ──> Fase 3 ──> Fase 5
Fase 4 ──┘                          │
                                    v
                               Fase 6

Fase 2 ──> Fase 7

Fase 1 ──> Fase 8
```

### 8.3 Backlog Detallado

#### Sprint 1 (Fase 1): Roles + Sidebar

- [ ] Migración: Añadir nuevos roles al enum
- [ ] useAuth: Actualizar para soportar nuevos roles
- [ ] AppSidebar: Renderizado condicional por rol
- [ ] ProtectedRoute: HOC para validar permisos
- [ ] Seed: Crear usuarios de prueba con cada rol

#### Sprint 2-3 (Fase 2): Blueprint Admin Core

- [ ] Página /blueprints (lista)
- [ ] Página /blueprints/:id (detalle)
- [ ] Página /matters (CRUD)
- [ ] Página /clause-types (CRUD)
- [ ] Hooks: useBlueprints, useMatters, useClauseTypes

#### Sprint 4 (Fase 3): Dataset RAG UI

- [ ] Página /policy-examples (lista + filtros + búsqueda)
- [ ] Modal: Nuevo/Editar Policy Example
- [ ] Página /fallback-clauses (lista)
- [ ] Modal: Nuevo/Editar Fallback Clause
- [ ] Componente: Distribución por aceptación (chart)

#### Sprint 5 (Fase 4): Resolver

- [ ] Página /defaults (config por contract_type)
- [ ] Hook: useContractDefaults
- [ ] Actualizar n8nService.ts
- [ ] Actualizar NewAnalysis para usar resolver
- [ ] Fallback a playbook legacy si no hay defaults

#### Sprint 6-7 (Fase 5): Grounding UI

- [ ] Actualizar useClauseReviews para review_findings
- [ ] Componente: GroundingPanel (muestra evidencia)
- [ ] Componente: FallbackPreview
- [ ] Componente: ConfidenceIndicator
- [ ] Actualizar ContractReview page

#### Sprint 8 (Fase 6): Feedback Loop

- [ ] Tabla finding_feedback (migración)
- [ ] Hook: useFeedback
- [ ] Capturar feedback en accept/reject
- [ ] Página /feedback-queue (Blueprint Admin)
- [ ] Acciones: Añadir ejemplo, modificar policy

---

## 9. Archivos a Crear/Modificar

### 9.1 Nuevos Archivos

```
src/
├── types/
│   └── roles.ts                    # Nuevos tipos de roles
├── hooks/
│   ├── useBlueprints.ts            # CRUD blueprints
│   ├── useMatters.ts               # CRUD matters
│   ├── useClauseTypes.ts           # CRUD clause_types
│   ├── usePolicyExamples.ts        # CRUD policy_examples
│   ├── useFallbackClauses.ts       # CRUD fallback_clauses
│   ├── useContractDefaults.ts      # Resolver
│   ├── useFeedback.ts              # Feedback loop
│   └── usePermissions.ts           # Verificar permisos por rol
├── components/
│   ├── admin/
│   │   ├── BlueprintCard.tsx
│   │   ├── MatterForm.tsx
│   │   ├── ClauseTypeForm.tsx
│   │   ├── PolicyExampleForm.tsx
│   │   ├── FallbackClauseForm.tsx
│   │   └── DefaultsForm.tsx
│   ├── review/
│   │   ├── GroundingPanel.tsx      # Muestra evidencia RAG
│   │   ├── FallbackPreview.tsx     # Preview de fallback propuesto
│   │   └── ConfidenceIndicator.tsx # Indicador visual de confianza
│   └── feedback/
│       ├── FeedbackCard.tsx
│       └── FeedbackActions.tsx
├── pages/
│   ├── admin/
│   │   ├── Blueprints.tsx
│   │   ├── BlueprintDetail.tsx
│   │   ├── Matters.tsx
│   │   ├── ClauseTypes.tsx
│   │   ├── PolicyExamples.tsx
│   │   ├── FallbackClauses.tsx
│   │   ├── ContractModels.tsx
│   │   ├── ModelDetail.tsx
│   │   ├── Defaults.tsx
│   │   ├── Users.tsx
│   │   ├── Organizations.tsx
│   │   └── Analytics.tsx
│   └── feedback/
│       └── FeedbackQueue.tsx
```

### 9.2 Archivos a Modificar

```
src/
├── hooks/
│   ├── useAuth.tsx                 # Añadir nuevos roles
│   └── useClauseReviews.ts         # Soportar review_findings
├── components/
│   └── layout/
│       └── AppSidebar.tsx          # Sidebar dinámico por rol
├── services/
│   └── n8nService.ts               # Usar resolver
├── pages/
│   ├── NewAnalysis.tsx             # Usar defaults
│   └── ContractReview.tsx          # Mostrar grounding
└── App.tsx                         # Nuevas rutas
```

---

## 10. Consideraciones de UX

### 10.1 Principios

1. **Progressive Disclosure**: Mostrar solo lo relevante para el rol actual
2. **Grounding Visible**: La evidencia RAG debe ser fácilmente accesible pero no intrusiva
3. **Feedback Natural**: Capturar feedback sin fricción adicional
4. **Backwards Compatible**: Mantener flujo legacy mientras se migra

### 10.2 Estados de Transición

Durante la migración, algunos contratos usarán `clause_reviews` (legacy) y otros `review_findings` (nuevo). La UI debe manejar ambos:

```typescript
// En ContractReview.tsx
const isNewArchitecture = !!run?.blueprint_version_id;

if (isNewArchitecture) {
  return <NewContractReview documentId={documentId} />;
} else {
  return <LegacyContractReview documentId={documentId} />;
}
```

---

## 11. Próximos Pasos Inmediatos

1. **Aprobar este documento** con el equipo
2. **Crear migración** para nuevos roles en enum
3. **Implementar Fase 1** (Roles + Sidebar)
4. **Crear wireframes detallados** para páginas críticas

---

*Documento generado: 2026-01-20*
