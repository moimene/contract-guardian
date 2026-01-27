# Backlog estructurado: Evolución a modelo de 3 capas

> Formato: **Epic → Story → Task** (con **Definition of Done** por Story)

---

## EPIC E0 — Fundaciones DB (3 capas + ejecución + GraphRAG)

### Story E0.S1 — Revisar y aplicar migraciones 3-layer en entorno Dev
**Objetivo:** incorporar nuevas tablas sin romper lo existente.

**Tasks**
1. Copiar migraciones a `/supabase/migrations/` (timestamped) y ejecutar en Dev.
2. Verificar que las migraciones son idempotentes en un `supabase db reset`.
3. Verificar extensiones `pgcrypto` y `vector` disponibles.
4. Verificar que no hay conflictos de nombres con migraciones existentes (14 actuales).
5. Crear/confirmar índices principales (run_id, clause_instance_id, matter_id, etc.).

**DoD**
- Migraciones aplicadas sin errores.
- `matters`, `review_blueprints*`, `contract_models*`, `clause_instances`, `review_findings`, `run_steps`, `knowledge_graphs` existen.
- Medición básica: explicación del query plan de (run_id → findings) no hace seq scan.

### Story E0.S2 — Cargar seeds E2E (materias + Blueprint Amazon v1 + Model PSA v1)
**Objetivo:** habilitar un entorno determinista para E2E.

**Tasks**
1. Ejecutar seed en una DB limpia.
2. Confirmar que `contract_type_review_defaults` resuelve `amazon-psa`.
3. Confirmar que existen ejemplos y fallbacks mínimos.
4. Documentar cómo ejecutar seeds (CLI/psql).

**DoD**
- Seeds se ejecutan sin errores.
- Hay al menos 12 `matters`.
- Existe 1 blueprint publicado (v1) y 1 contract model publicado (v1).
- Existe 1 knowledge_graph stub.

---

## EPIC E1 — Sustituir `playbookMap` por “resolver” DB

### Story E1.S1 — Implementar resolver `contract_type_review_defaults`
**Objetivo:** que frontend y n8n dejen de depender de mapeos hardcode.

**Tasks**
1. Definir contrato de API interno:
   - Input: `tenant_id` (organization_id), `contract_type_id`
   - Output: `blueprint_version_id`, `contract_model_version_id`, `knowledge_graph_id?`
2. Implementar Edge Function `resolve_review_config` (Supabase Edge) **o** endpoint en n8n (según preferencia técnica).
3. Añadir fallback si no hay mapping:
   - error controlado con mensaje accionable
   - estado de documento/run a `ERROR`

**DoD**
- Para un tenant con seed, el resolver devuelve IDs correctos.
- El frontend deja de usar `playbookMap` para determinar configuración.
- Hay logging (run_id + tenant + contract_type) en cada resolución.

### Story E1.S2 — Cambios en `n8nService.ts`
**Objetivo:** que `/new` y “start review” envíen configuración 3-layer.

**Tasks**
1. Añadir llamada al resolver antes de `startContractReview()`.
2. Incluir en payload a n8n:
   - `blueprint_version_id`
   - `contract_model_version_id`
   - `knowledge_graph_id` (opcional)
3. Mantener compatibilidad: seguir enviando `playbook_id` mientras W3 esté en modo híbrido.

**DoD**
- Un upload + start review envía IDs 3-layer y sigue funcionando.
- No existen referencias a `playbookMap` en el flujo principal.

---

## EPIC E2 — Capa de ejecución canónica (salidas por cláusula × materia)

### Story E2.S1 — Persistir `clause_instances` como fuente de verdad
**Objetivo:** separar segmentación (clause_instances) de outputs (findings).

**Tasks**
1. En W3 (o W2 si existe), tras segmentación, escribir `clause_instances`.
2. Asegurar offsets `start_offset/end_offset` consistentes con el extractor actual.
3. Añadir `run_id` en clause_instances para trazabilidad.

**DoD**
- Para una run, existen N clause_instances (N>0) con texto original.
- Se puede reconstruir la cláusula en UI con offsets sin inconsistencias.

### Story E2.S2 — Escribir `review_findings` por (cláusula × materia)
**Objetivo:** que la salida canónica viva en `review_findings`.

**Tasks**
1. Cambiar pipeline para que por cada cláusula se produzcan findings por materia.
2. Persistir:
   - `client_state`, `risk_score`, `issue_summary`, `rationale`
   - `proposed_changes` (ChangeSet)
   - `evidence` (IDs y citas)
3. Índices: (run_id), (clause_instance_id), (client_state), (matter_id).

**DoD**
- Para una run, existen findings por varias materias.
- `evidence` no está vacío cuando `client_state != OK`.
- No hay duplicados por constraint `unique (run_id, clause_instance_id, matter_id)`.

### Story E2.S3 — Auditoría por paso con `run_steps`
**Objetivo:** trazabilidad de grounding, prompts y decisiones.

**Tasks**
1. Loggear al menos: ROUTER, RAG_RETRIEVE, PARANOID, VALUATOR, SANITIZER, CHANGESET.
2. En caso de error: status + error string + output parcial.
3. Añadir métricas por paso: tokens/latencia/costes (si están disponibles).

**DoD**
- Cada cláusula procesada tiene run_steps correspondientes.
- Se puede diagnosticar por qué un finding salió como BLOCKED.

---

## EPIC E3 — “Cadena de agentes por materia” + configuraciones por materia

### Story E3.S1 — Definir contrato de configuración por materia (`matter_policies.agent_config`)
**Objetivo:** que paranoico/valuator/sanitizer sean “per-matter configurable”.

**Tasks**
1. Definir JSON schema de `agent_config` (por materia):
   - modelos
   - thresholds
   - prompts/versiones
   - gates/validators a ejecutar
2. Añadir validación en pipeline (rechazar config inválida).

**DoD**
- `agent_config` tiene schema documentado.
- Pipeline rechaza (con error explícito) configuraciones inválidas.

### Story E3.S2 — Implementar variaciones “por materia” en pipeline
**Objetivo:** permitir instancias personalizadas de paranoico/valuator/sanitizer por materia.

**Tasks**
1. Router asigna materias candidatas.
2. Por cada materia, cargar `matter_policy` (blueprint_version).
3. Ejecutar subpipeline con prompts/modelos específicos.
4. Persistir en `run_steps` qué config se usó.

**DoD**
- Cambiando `agent_config` en DB (y publicando versión) cambia el comportamiento de la materia en runs futuras.
- Runs pasadas siguen reproduciéndose (por blueprint_version_id en contract_runs).

---

## EPIC E4 — Grounding robusto (RAG + GraphRAG desde el inicio)

### Story E4.S1 — RAG unificado (policy_examples + fallback_clauses + contract_model_clauses)
**Objetivo:** retrieval consistente y explicable.

**Tasks**
1. Implementar retrieval por materia:
   - TopK examples + fallbacks + model clauses
2. Definir formato de `evidence`:
   - ids y snippets
   - score
   - tipo de fuente
3. Integrar “leakage_guard / validate_anchor_conf / no-new-text” en sanitizer.

**DoD**
- Cada finding incluye evidence con IDs trazables.
- Sanitizer no introduce texto fuera de anclas (o falla en modo BLOCKED).

### Story E4.S2 — GraphRAG: builder y consulta mínima viable
**Objetivo:** introducir grafos sin bloquear el roadmap.

**Tasks**
1. Builder: generar `knowledge_graphs` + nodes/edges desde fuentes seed.
2. Query: dado un finding, recuperar una ruta corta (paths) y devolverla como evidence.
3. Diseñar estrategia híbrida: vector search → graph expansion → re-rank.

**DoD**
- Existe un flujo que crea un KG para blueprint/model v1.
- Retrieval devuelve al menos 1 ruta/cita cuando existe.

---

## EPIC E5 — UI: transición de `clause_reviews` a `review_findings`

### Story E5.S1 — Mantener compatibilidad (dual-write + rollup)
**Objetivo:** no romper la UI actual.

**Tasks**
1. En pipeline, seguir escribiendo `clause_reviews` (mientras UI v1 lo use).
2. Definir lógica de rollup por cláusula:
   - severidad máxima por materia
   - link a `source_finding_ids`
3. Añadir columnas compat (si se usan): blueprint_version_id, contract_model_version_id, evidence.

**DoD**
- UI actual funciona sin cambios funcionales.
- Cada clause_review referencia findings subyacentes (si está habilitado).

### Story E5.S2 — UI Review v2 (vista por materias)
**Objetivo:** explotar 3 capas en la experiencia del usuario.

**Tasks**
1. Nueva vista: listar clause_instances y mostrar findings agrupados por materia.
2. Panel detalle: evidence + rutas GraphRAG + fallback sugerido.
3. Acciones: aceptar/rechazar por finding (y recalcular estado de cláusula).

**DoD**
- Se puede revisar por materia y ver grounding.
- Aceptación/rechazo persiste y se refleja en export.

---

## EPIC E6 — Mantenimiento por usuario: Blueprints y Modelos

### Story E6.S1 — Admin UI mínima: Blueprints/versiones
**Objetivo:** que el usuario mantenga su blueprint sin tocar código.

**Tasks**
1. CRUD blueprint + versiones (draft/publish).
2. CRUD matter_policies (policy_config + agent_config).
3. Import/export JSON (para no construir editor complejo de golpe).

**DoD**
- Un usuario admin puede publicar una nueva versión.
- Runs posteriores usan la nueva versión (si default mapping apunta a ella).

### Story E6.S2 — Admin UI mínima: Contract Models/versiones
**Objetivo:** que el usuario mantenga el modelo por tipología.

**Tasks**
1. CRUD contract_models + versiones.
2. Ingestión mínima:
   - pegar cláusulas canónicas por tipo
   - o subir plantilla (futuro)
3. Publicar versión.

**DoD**
- Se puede cambiar cláusula canónica y verla reflejada en sugerencias.

---

## EPIC E7 — Exportación DOCX (Track Changes) alineada a 3 capas

### Story E7.S1 — Implementar `export_doc` usando findings aceptados
**Objetivo:** export reproducible desde outputs canónicos.

**Tasks**
1. Definir cómo se guardan “accepted changes” (por finding/cambio).
2. Implementar Edge Function `export_doc`:
   - input: document_id/run_id
   - aplica changeSets aceptados
   - genera DOCX con track changes
3. UI: botón export y descarga.

**DoD**
- Export genera DOCX descargable.
- El documento refleja exactamente las aceptaciones del usuario.

---

## EPIC E8 — Calidad, seguridad y operación

### Story E8.S1 — RLS/policies para nuevas tablas
**Objetivo:** multi-tenant seguro sin fricción para n8n (service role).

**Tasks**
1. Definir patrón de RLS para tablas org-scoped.
2. Policies de SELECT para miembros del org.
3. Policies de UPDATE/DELETE restringidas a rol admin (si aplica).

**DoD**
- RLS habilitado en nuevas tablas sin romper UI.
- Tests básicos de acceso cruzado tenant.

### Story E8.S2 — Tests E2E (upload → review → export)
**Objetivo:** pipeline estable en cada refactor.

**Tasks**
1. Añadir fixtures usando seeds.
2. Probar flujo completo.
3. Probar al menos 1 caso con escalación.

**DoD**
- Suite E2E ejecutable en CI.
- 0 flaky tests en 10 runs consecutivas.

