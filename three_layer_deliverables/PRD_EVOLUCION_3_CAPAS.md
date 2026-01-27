# PRD redefinida: Evolución de Amazon Redliner → Modelo de 3 capas

## 1. Propósito

Evolucionar lo ya construido (Redliner + UI + n8n) hacia un **blueprint universal mantenible por el usuario**, separando claramente:

1) **Capa de Proceso (Arquitectura de razonamiento y validación)**
- Pipeline estable (ingestión, segmentación, routing por materia, RAG/GraphRAG, paranoid/valuator/sanitizer, changeset, agregación, exportación).
- Observabilidad y controles de grounding.

2) **Capa de Blueprint (posiciones generales por materia)**
- Política/criterios por materia (10–12 materias), ejemplos aceptables/pasables/inaceptables, fallbacks, criterios de escalación.
- Versionada, editable por usuario (o por equipos legales internos).

3) **Capa de Modelo de Contrato (contrato concreto / tipología concreta)**
- Modelo versionado por tipología (p. ej. PSA, DSA, EPC, MSA), con cláusulas canónicas, plantillas/parametrización y “fallback guides”.

El resultado debe permitir **refactor incremental**, evitando romper lo que ya funciona:
- Mantener `clause_reviews` durante transición.
- Introducir nuevas tablas canónicas (`clause_instances`, `review_findings`, `run_steps`) y hacer dual-write progresivo.

## 2. Estado actual resumido (base para el plan)

Lo actual (según el README/plan aportado por el equipo) ya tiene:
- UI completa de review por cláusula, estados RAG, escalaciones, y visor de redlines.
- Integración con n8n mediante `n8n-proxy`.
- Workflows n8n productivos (W1 upload + W3 review, y W2 si aplica).
- Playbooks por familias (ej. nueva planta) y schemas de Router/Paranoid/Valuator/Sanitizer/ChangeSet.

Gap principal respecto a 3 capas:
- **`playbook_id`** y lógica “playbook-centric” mezclan política (posiciones) + contrato modelo + pipeline.
- No existe un repositorio versionado y editable por usuario para:
  - materias
  - ejemplos/fallbacks por materia
  - modelos de contrato por tipología
- Falta una capa canónica de outputs por (cláusula × materia) para soportar múltiples materias y grounding consistente.

## 3. Arquitectura objetivo

### 3.1 Entidades (visión)

- **Matters (materias)**: taxonomía estable (10–12). Cada materia puede tener varios `clause_types`.
- **Blueprint**: colección versionada de `matter_policies` por materia:
  - policy_config (criterios)
  - agent_config (config per-matter del pipeline)
  - policy_examples (grounding de clasificación)
  - fallback_clauses (grounding de redlines)
- **Contract Model**: por tipología, versionado:
  - contract_model_clauses (cláusulas canónicas / fallback text)
  - parameters_schema (placeholders/parametrización)
- **Execution**:
  - clause_instances (segmentación normalizada, offsets)
  - review_findings (salida canónica por cláusula × materia)
  - run_steps (auditoría por paso/agente)
- **GraphRAG (opcional desde el inicio)**:
  - knowledge_graphs, kg_nodes, kg_edges

### 3.2 Flujo de ejecución

1) **Upload**
- Se crea `documents`.
- Se determina `contract_type_id`.

2) **Resolver de configuración**
- Dado (organization_id, contract_type_id):
  - blueprint_version_id
  - contract_model_version_id
  - knowledge_graph_id (opcional)

3) **Run reproducible**
- `contract_runs` guarda esos IDs + `run_config`.

4) **Segmentación**
- Se crean `clause_instances` con offsets.

5) **Cadena por materia**
- Por cada `clause_instance` el router decide materias candidatas.
- Para cada materia candidata se ejecuta:
  - Retrieve: policy_examples/fallbacks + contract_model_clauses + GraphRAG (si existe)
  - Paranoid: leakage/anchoring/negatives
  - Valuator: clasificación, riesgo, racional
  - Sanitizer: redline seguro y consistente
  - ChangeSet: propuesta estructurada

6) **Persistencia**
- Se escriben `review_findings`.
- Se escribe `run_steps` (audit trail).
- En transición: se mantiene `clause_reviews` vía dual-write o rollup.

7) **UI**
- Por defecto la UI puede seguir leyendo `clause_reviews`.
- En paralelo se habilita una UI por materias basada en `review_findings`.

## 4. Principios de diseño para “mantenible por usuario”

- Todo lo editable por negocio debe ser **dato** (DB), no YAML ni hardcode:
  - mapping tipología → blueprint/model
  - umbrales y escalaciones
  - ejemplos y fallbacks
  - versiones publicadas
- Versionado estricto:
  - runs siempre guardan IDs de versión (no “latest”).
- Observabilidad:
  - cada paso deja rastro (`run_steps`).
- Grounding obligatorio:
  - `review_findings.evidence` debe incluir ids/citas de:
    - policy_examples
    - fallback_clauses
    - contract_model_clauses
    - rutas GraphRAG

## 5. Plan de evolución incremental (high-level)

### Fase A — Base DB + seeds
- Crear tablas de 3 capas + ejecución.
- Añadir tabla `contract_type_review_defaults` para sustituir `playbookMap`.
- Seed: 12 materias + Blueprint Amazon v1 + Contract Model PSA v1.

### Fase B — Resolver de configuración + cambios mínimos en n8n
- Nueva función/servicio: `resolve_review_config(tenant, contract_type_id)`.
- W1/W3: aceptar `blueprint_version_id` y `contract_model_version_id` además de `playbook_id` (modo híbrido).
- Crear `contract_runs` con esos IDs.

### Fase C — Salida canónica (dual-write)
- n8n pasa a escribir `clause_instances` + `review_findings` + `run_steps`.
- Mantener `clause_reviews` (compatibilidad) agregando por cláusula el estado más severo.

### Fase D — UI y mantenimiento
- UI Admin para:
  - gestionar materias/clause_types (mínimo)
  - gestionar blueprints/versiones
  - gestionar modelos/versiones
- UI Review v2:
  - vista por materia
  - trazabilidad con evidence

### Fase E — GraphRAG
- Builder que crea/actualiza `knowledge_graphs` desde:
  - policy_examples
  - fallback_clauses
  - contract_model_clauses
- Retrieval híbrido: vector + graph traversal.

## 6. Requisitos funcionales (extracto)

### RF1 — Multi-tipología sin hardcode
- El frontend no debe mapear `contract_type → playbook_id` en código.
- Debe resolver por tenant.

### RF2 — Output por materia
- Para cada cláusula, el sistema debe poder producir findings por múltiples materias.

### RF3 — Grounding auditable
- Cada finding relevante debe incluir evidence con IDs de fuentes.

### RF4 — Versioning
- Blueprint y Contract Model deben ser versionados y las runs deben ser reproducibles.

### RF5 — Mantenimiento por usuario
- CRUD básico (o import/export) para ejemplos/fallbacks y publicación de versiones.

## 7. Requisitos no funcionales

- Backward compatibility durante transición (mantener UI actual funcionando).
- Performance:
  - índices por run_id y clause_instance_id
  - paginación en UI
- Seguridad:
  - separación multi-tenant
  - RLS revisada antes de producción

## 8. Artefactos técnicos entregables

- Migraciones Supabase numeradas (`/supabase/migrations/*.sql`).
- Seeds E2E (`/supabase/seed/*.sql`).
- Backlog de ejecución (Epic/Story/Task + DoD).

