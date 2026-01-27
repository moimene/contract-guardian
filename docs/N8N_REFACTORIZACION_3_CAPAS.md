# Refactorizacion n8n: Alineacion con Arquitectura 3-Capas

**Fecha**: 2026-01-22
**Proyecto**: Amazon Redliner
**Estado**: ANALISIS COMPLETO - CAMBIOS REQUERIDOS

---

## 1. Resumen Ejecutivo

### Estado Actual de los Workflows

| Workflow | Estado | Problema Principal |
|----------|--------|-------------------|
| W1 (FileUpload) | Parcialmente alineado | Usa `playbook_id` en vez de `blueprint_version_id` |
| W2 (ClauseReview) | **NO alineado** | Usa tabla `playbook_rules` inexistente, router hardcodeado |
| W3 (Orchestrator) | **NO alineado** | 5 clausulas hardcodeadas, no parsea documento real |

### Problemas Criticos Identificados

1. **Sin RAG de policy_examples**: Los agentes NO consultan los 85+ ejemplos de politicas
2. **Router estatico**: 5 familias hardcodeadas vs 67 clause_types en BD
3. **Sin resolucion de Blueprint**: No usa `contract_type_review_defaults` ni `blueprint_versions`
4. **Clausulas de prueba**: W3 tiene 5 clausulas de ejemplo, no extrae del documento
5. **run_id inconsistente**: W2 puede generar su propio run_id, perdiendo trazabilidad

---

## 2. Arquitectura 3-Capas (PRD)

```
+------------------------------------------------------------------+
|                     LAYER 0: ENGINE                               |
|  (Inmutable - Cadena de agentes)                                  |
|  Router -> Paranoid -> Valuator -> Decisor -> Sanitizer           |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     LAYER 1: BLUEPRINT                            |
|  (Configurable por Legal Ops)                                     |
|  - review_blueprints (playbook generico)                          |
|  - blueprint_versions (2026-01)                                   |
|  - matter_policies (18 materias)                                  |
|  - policy_examples (85+ base, 1282 Harvey pendiente)              |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     LAYER 2: CONTRACT MODEL                       |
|  (Especifico por contrato)                                        |
|  - contract_models (Nueva Planta, DSA, PSA...)                    |
|  - contract_model_versions                                        |
|  - contract_model_parameters                                      |
|  - contract_model_clauses                                         |
+------------------------------------------------------------------+
```

### Tablas Clave (Ya Migradas a Supabase)

```sql
-- Taxonomia base
matters (20 registros)          -- Materias juridicas
clause_types (67 registros)     -- Tipos de clausula

-- Blueprint (Layer 1)
review_blueprints               -- Playbooks
blueprint_versions              -- Versiones activas
matter_policies                 -- Politicas por materia
policy_examples (85 registros)  -- Ejemplos RAG (ACCEPTABLE/PASSABLE/UNACCEPTABLE)
fallback_clauses                -- Clausulas por defecto

-- Contract Model (Layer 2)
contract_models
contract_model_versions
contract_type_review_defaults   -- Mapeo contract_type -> blueprint
```

---

## 3. Analisis Detallado: W1_FileUpload

### Estado Actual

```
Webhook Upload -> Create Document -> Insert Document -> Create Run -> Respond Success
```

**Codigo actual en "Create Document"**:
```javascript
// PROBLEMA: usa playbook_id hardcodeado
playbook_id: 'nueva_planta',
playbook_version: '2026-01',
```

### Cambios Requeridos

#### 3.1 Nuevo nodo: "Resolve Blueprint"

Despues de "Create Document", agregar nodo que consulta:

```javascript
// NUEVO: Resolver blueprint_version_id desde contract_type
const contract_type = input.body.contract_type || 'nueva_planta';

// Consultar contract_type_review_defaults
// SELECT d.*, bv.id as blueprint_version_id
// FROM contract_type_review_defaults d
// JOIN blueprint_versions bv ON bv.id = d.default_blueprint_version_id
// WHERE d.contract_type_code = contract_type
// AND d.effective_from <= NOW()
// AND (d.effective_until IS NULL OR d.effective_until > NOW())
// AND bv.is_active = true
// ORDER BY d.effective_from DESC
// LIMIT 1

return [{
  json: {
    ...prevData,
    blueprint_version_id: resolved.blueprint_version_id,
    contract_model_version_id: resolved.default_contract_model_version_id || null
  }
}];
```

#### 3.2 Actualizar "Insert Document"

Agregar campos 3-layer:
- `blueprint_version_id`
- `contract_model_version_id` (nullable)

#### 3.3 Actualizar "Create Run"

Agregar a `contract_runs`:
- `blueprint_version_id`
- `contract_model_version_id`

### W1 Refactorizado

```
Webhook Upload
    -> Create Document (genera UUIDs)
    -> Resolve Blueprint (consulta contract_type_review_defaults)
    -> Insert Document (con blueprint_version_id)
    -> Create Run (con blueprint_version_id)
    -> Respond Success
```

---

## 4. Analisis Detallado: W2_ClauseReview

### Estado Actual

```
Webhook -> Parse Input -> Router Agent -> Parse Router
    -> Context Retriever (playbook_rules) -> Enrich Policy
    -> Paranoid Agent -> Parse Paranoid
    -> Valuator Agent -> Parse Valuator
    -> Decisor -> Sanitizer Agent -> Build Result
    -> Save to clause_reviews -> Respond
```

### Problemas Identificados

#### 4.1 Router Agent (Lineas 36-62)

**PROBLEMA**: Familias hardcodeadas
```javascript
// ACTUAL: Solo 5 familias + OtroDesconocido
"- PrecioPagos: Clausulas sobre precio..."
"- AlcanceTrabajo: Definicion del alcance..."
"- Responsabilidades: Asignacion de responsabilidades..."
"- EntregablesHitos: Hitos del proyecto..."
"- TerminacionRescision: Terminacion anticipada..."
"- OtroDesconocido: ..."
```

**SOLUCION**: Cargar clause_types dinamicamente desde BD

```javascript
// NUEVO: Consultar clause_types activos
// SELECT ct.code, ct.name, ct.definition, m.code as matter_code
// FROM clause_types ct
// JOIN matters m ON m.id = ct.matter_id
// WHERE ct.is_active = true
// ORDER BY m.code, ct.code

// Construir prompt dinamico
const familyDescriptions = clauseTypes.map(ct =>
  `- ${ct.code}: ${ct.definition}`
).join('\n');
```

#### 4.2 Context Retriever (Lineas 76-105)

**PROBLEMA**: Consulta tabla `playbook_rules` que NO EXISTE

```javascript
// ACTUAL - TABLA INEXISTENTE
"tableId": "playbook_rules",
"filters": { "keyName": "rule_id", ... }
```

**SOLUCION**: Consultar `policy_examples` con RAG

```javascript
// NUEVO: Consultar policy_examples por matter_id y clause_type_id
// Paso 1: Resolver IDs desde codigo
const matter_code = routerOutput.matter_code;  // ej: "PRECIO_PAGO"
const clause_type_code = routerOutput.clause_type_code;  // ej: "PAYMENT_TERMS"

// Paso 2: Buscar ejemplos similares (RAG semantico)
// SELECT pe.*, ct.code as clause_type_code, m.code as matter_code
// FROM policy_examples pe
// JOIN clause_types ct ON ct.id = pe.clause_type_id
// JOIN matters m ON m.id = ct.matter_id
// JOIN matter_policies mp ON mp.id = pe.matter_policy_id
// WHERE mp.blueprint_version_id = :blueprint_version_id
// AND (ct.code = :clause_type_code OR m.code = :matter_code)
// LIMIT 10

// Paso 3: Ordenar por similitud semantica (opcional: embeddings)
```

#### 4.3 Paranoid Agent (Lineas 119-147)

**PROBLEMA**: No usa policy_examples como grounding

**ACTUAL**:
```javascript
"=== POSICION ESTANDAR DEL CLIENTE ===\n{{ $json.policySpec.standard_position?.text || 'No definida' }}"
```

**SOLUCION**: Incluir ejemplos RAG como contexto

```javascript
// NUEVO prompt con grounding
`=== EJEMPLOS DE POLITICA (RAG) ===
{{ $json.policyExamples.map(ex =>
  'Acceptance: ' + ex.acceptance +
  '\nClausula: ' + ex.sample_clause +
  '\nRazonamiento: ' + ex.rationale
).join('\n---\n') }}

=== CLAUSULA A ANALIZAR ===
{{ $json.clause_text }}

Basandote en los ejemplos anteriores, identifica desviaciones.`
```

#### 4.4 Valuator Agent (Lineas 161-189)

**PROBLEMA**: No usa acceptance levels de policy_examples

**SOLUCION**: Incluir distribucion de ejemplos por acceptance

```javascript
// NUEVO: Contexto con ejemplos por nivel
`=== EJEMPLOS ACCEPTABLE ===
{{ $json.policyExamples.filter(e => e.acceptance === 'ACCEPTABLE').slice(0,3)... }}

=== EJEMPLOS PASSABLE ===
{{ $json.policyExamples.filter(e => e.acceptance === 'PASSABLE').slice(0,3)... }}

=== EJEMPLOS UNACCEPTABLE ===
{{ $json.policyExamples.filter(e => e.acceptance === 'UNACCEPTABLE').slice(0,3)... }}

Determina si la clausula es ACCEPTABLE, PASSABLE o UNACCEPTABLE basandote en estos ejemplos.`
```

#### 4.5 Build Result (Lineas 246-257)

**PROBLEMA**: No incluye campos 3-layer

**ACTUAL**:
```javascript
const result = {
  clause_instance_id: data.clause_instance_id,
  // ... sin campos 3-layer
};
```

**SOLUCION**: Agregar campos de trazabilidad

```javascript
const result = {
  // ... campos existentes ...

  // NUEVOS campos 3-layer
  blueprint_version_id: data.blueprint_version_id,
  contract_model_version_id: data.contract_model_version_id || null,
  matter_id: data.resolved_matter_id,
  clause_type_id: data.resolved_clause_type_id,
  acceptance: data.valuatorOutput.acceptance,  // ACCEPTABLE/PASSABLE/UNACCEPTABLE
  evidence: {
    policy_examples_used: data.policyExamples.map(e => e.id),
    similarity_scores: data.similarity_scores,
    grounding_quotes: data.paranoidOutput.evidence_spans
  }
};
```

#### 4.6 Save to clause_reviews (Lineas 258-336)

**PROBLEMA**: Faltan campos 3-layer en insert

**SOLUCION**: Agregar campos

```javascript
{
  "fieldId": "blueprint_version_id",
  "fieldValue": "={{ $json.blueprint_version_id }}"
},
{
  "fieldId": "matter_id",
  "fieldValue": "={{ $json.matter_id }}"
},
{
  "fieldId": "acceptance",
  "fieldValue": "={{ $json.acceptance }}"
},
{
  "fieldId": "evidence",
  "fieldValue": "={{ JSON.stringify($json.evidence) }}"
}
```

### W2 Refactorizado

```
Webhook
    -> Parse Input (+ recibe blueprint_version_id del W3)
    -> Load Clause Types (consulta clause_types activos)
    -> Router Agent (prompt dinamico con clause_types)
    -> Parse Router (resuelve matter_id, clause_type_id)
    -> RAG Retriever (consulta policy_examples por similarity)
    -> Enrich Context (estructura ejemplos por acceptance)
    -> Paranoid Agent (con grounding de ejemplos)
    -> Parse Paranoid
    -> Valuator Agent (con distribucion por acceptance)
    -> Parse Valuator (extrae acceptance level)
    -> Decisor (matriz de gating)
    -> Sanitizer Agent
    -> Build Result (con campos 3-layer)
    -> Save to clause_reviews (con blueprint_version_id, matter_id, evidence)
    -> Respond
```

---

## 5. Analisis Detallado: W3_ContractReview

### Estado Actual

```
Webhook -> Workflow Config -> Create Run ID -> Update Status
    -> Fetch Document -> Extract Clauses (5 HARDCODEADAS!)
    -> Prepare Loop -> Loop Clauses -> Call ClauseReview
    -> Collect Results -> Aggregate Decision
    -> Update Document -> Update Run -> Has Escalations?
    -> [Si] Prepare Escalations -> Create Escalations
    -> Respond
```

### Problemas Identificados

#### 5.1 Extract Clauses (Lineas 152-164)

**PROBLEMA CRITICO**: Clausulas hardcodeadas

```javascript
// ACTUAL - 5 CLAUSULAS DE PRUEBA HARDCODEADAS
const sampleClauses = [
  { clause_id: 'clause_precio_1', heading: 'Precio del Contrato', clause_text: '...' },
  { clause_id: 'clause_alcance_1', heading: 'Alcance de los Trabajos', clause_text: '...' },
  { clause_id: 'clause_resp_1', heading: 'Responsabilidades del Contratista', clause_text: '...' },
  { clause_id: 'clause_hitos_1', heading: 'Hitos y Entregables', clause_text: '...' },
  { clause_id: 'clause_term_1', heading: 'Terminacion del Contrato', clause_text: '...' }
];
```

**SOLUCION**: Parsear documento real

```javascript
// NUEVO: Extraer clausulas del documento almacenado
// Opcion A: Si el documento ya tiene clausulas en BD (clause_instances)
// SELECT ci.* FROM clause_instances ci
// WHERE ci.document_id = :document_id
// ORDER BY ci.sequence_number

// Opcion B: Si necesita parsear el documento
// 1. Obtener storage_path del documento
// 2. Descargar de Supabase Storage
// 3. Parsear con servicio de NLP (Azure Document Intelligence, OpenAI, etc.)
// 4. Insertar clausulas en clause_instances
// 5. Retornar clausulas parseadas

// Opcion C: LLM extraction (para MVP)
const document = await fetchDocument(document_id);
const extractionPrompt = `Extrae todas las clausulas del siguiente contrato...`;
const extracted = await callOpenAI(extractionPrompt, document.content);
return extracted.clauses.map((c, idx) => ({
  clause_instance_id: crypto.randomUUID(),
  sequence_number: idx + 1,
  heading: c.heading,
  clause_text: c.text,
  ...
}));
```

#### 5.2 Workflow Config (Lineas 23-35)

**PROBLEMA**: Configuracion estatica

```javascript
// ACTUAL
PLAYBOOK_ID: 'nueva_planta',
PLAYBOOK_VERSION: '2026-01',
CLAUSE_FAMILIES: ['PrecioPagos', 'AlcanceTrabajo', ...] // Hardcodeado
```

**SOLUCION**: Resolver desde contract_type_review_defaults

```javascript
// NUEVO: Cargar configuracion desde BD
const contract_type = input.body.contract_type || 'nueva_planta';

// Consultar defaults
const defaults = await supabase
  .from('contract_type_review_defaults')
  .select(`
    *,
    blueprint_version:blueprint_versions(*)
  `)
  .eq('contract_type_code', contract_type)
  .single();

return [{
  json: {
    config: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      N8N_WEBHOOK_BASE: process.env.N8N_WEBHOOK_BASE,
      blueprint_version_id: defaults.default_blueprint_version_id,
      contract_model_version_id: defaults.default_contract_model_version_id,
      CLAUSE_REVIEW_ENDPOINT: '/webhook/clause-review'
    }
  }
}];
```

#### 5.3 Call ClauseReview (Lineas 194-216)

**PROBLEMA**: No pasa contexto 3-layer al W2

```javascript
// ACTUAL
"jsonBody": "={{ JSON.stringify($json) }}"
```

**SOLUCION**: Incluir contexto resuelto

```javascript
// NUEVO: Agregar contexto 3-layer
const payload = {
  ...$json,
  run_id: $('Create Run ID').first().json.run_id,  // CRITICO: usar run_id del W3
  document_id: $('Create Run ID').first().json.document_id,
  blueprint_version_id: $('Workflow Config').first().json.config.blueprint_version_id,
  contract_model_version_id: $('Workflow Config').first().json.config.contract_model_version_id
};
```

### W3 Refactorizado

```
Webhook
    -> Resolve Config (consulta contract_type_review_defaults)
    -> Create Run ID (con blueprint_version_id)
    -> Update documents.status = 'processing'
    -> Fetch Document (incluye storage_path)
    -> Download Document Content (de Supabase Storage)
    -> Extract Clauses (LLM o parser, NO hardcodeado)
    -> Save clause_instances (persistir clausulas extraidas)
    -> Prepare Loop
    -> Loop Clauses
        -> Call ClauseReview (con run_id, blueprint_version_id)
    -> Collect Results
    -> Aggregate Decision
    -> Update Document (decision global)
    -> Update Run (stats finales)
    -> Has Escalations?
        -> [Si] Create Escalations
    -> Respond
```

---

## 6. Nuevos Nodos Requeridos

### 6.1 Nodo: "Load Clause Types" (para W2)

```javascript
// Consulta dinamica de clause_types
const clauseTypes = await supabase
  .from('clause_types')
  .select(`
    id,
    code,
    name,
    definition,
    matter:matters(id, code, name)
  `)
  .eq('is_active', true);

// Formatear para prompt del Router
const routerContext = clauseTypes.map(ct => ({
  code: ct.code,
  matter_code: ct.matter.code,
  description: `${ct.name}: ${ct.definition}`
}));

return [{ json: { clauseTypes, routerContext } }];
```

### 6.2 Nodo: "RAG Retriever" (para W2)

```javascript
// Buscar policy_examples similares
const { matter_code, clause_type_code } = $json.routerOutput;

// Consulta por coincidencia exacta + fuzzy
const examples = await supabase
  .from('policy_examples')
  .select(`
    *,
    clause_type:clause_types(code, name),
    matter_policy:matter_policies(
      matter:matters(code, name)
    )
  `)
  .eq('matter_policy.blueprint_version_id', blueprint_version_id)
  .or(`clause_type.code.eq.${clause_type_code},matter_policy.matter.code.eq.${matter_code}`)
  .limit(15);

// Agrupar por acceptance
const grouped = {
  ACCEPTABLE: examples.filter(e => e.acceptance === 'ACCEPTABLE').slice(0, 5),
  PASSABLE: examples.filter(e => e.acceptance === 'PASSABLE').slice(0, 5),
  UNACCEPTABLE: examples.filter(e => e.acceptance === 'UNACCEPTABLE').slice(0, 5)
};

return [{ json: { policyExamples: examples, groupedExamples: grouped } }];
```

### 6.3 Nodo: "Document Parser" (para W3)

```javascript
// Parsear documento con LLM
const document = $json;
const content = document.raw_content || await downloadFromStorage(document.storage_path);

const extractionPrompt = `Eres un experto en contratos. Extrae TODAS las clausulas del siguiente documento.

Para cada clausula, identifica:
1. Numero o identificador de clausula
2. Titulo/encabezado
3. Texto completo de la clausula
4. Tipo probable (precio, alcance, responsabilidad, plazos, terminacion, otro)

Responde en JSON:
{
  "clauses": [
    {
      "clause_number": "1.1",
      "heading": "Precio del Contrato",
      "text": "El precio total sera...",
      "probable_type": "PRECIO_PAGO"
    }
  ],
  "total_clauses": 25,
  "document_type": "EPC Contract"
}

DOCUMENTO:
${content}`;

const response = await callOpenAI(extractionPrompt);
return response.clauses.map((c, idx) => ({
  json: {
    clause_instance_id: crypto.randomUUID(),
    sequence_number: idx + 1,
    clause_number: c.clause_number,
    heading: c.heading,
    clause_text: c.text,
    probable_type: c.probable_type,
    run_id: $('Create Run ID').first().json.run_id,
    document_id: $('Create Run ID').first().json.document_id
  }
}));
```

---

## 7. Matriz de Cambios por Workflow

### W1_FileUpload

| Nodo | Accion | Prioridad |
|------|--------|-----------|
| Create Document | Eliminar playbook_id hardcodeado | Alta |
| **NUEVO** Resolve Blueprint | Consultar contract_type_review_defaults | Alta |
| Insert Document | Agregar blueprint_version_id | Alta |
| Create Run | Agregar blueprint_version_id | Alta |

### W2_ClauseReview

| Nodo | Accion | Prioridad |
|------|--------|-----------|
| Parse Input | Recibir blueprint_version_id del W3 | Critica |
| **NUEVO** Load Clause Types | Cargar clause_types desde BD | Alta |
| Router Agent | Prompt dinamico con clause_types | Alta |
| Parse Router | Resolver matter_id, clause_type_id | Alta |
| Context Retriever | **REEMPLAZAR** por RAG Retriever | Critica |
| **NUEVO** RAG Retriever | Consultar policy_examples | Critica |
| Enrich Policy | Estructurar ejemplos por acceptance | Alta |
| Paranoid Agent | Prompt con grounding de ejemplos | Alta |
| Valuator Agent | Prompt con distribucion por acceptance | Alta |
| Build Result | Agregar campos 3-layer | Alta |
| Save to clause_reviews | Agregar blueprint_version_id, matter_id, evidence | Alta |

### W3_ContractReview

| Nodo | Accion | Prioridad |
|------|--------|-----------|
| Workflow Config | **REEMPLAZAR** por Resolve Config | Critica |
| **NUEVO** Resolve Config | Consultar contract_type_review_defaults | Critica |
| Create Run ID | Agregar blueprint_version_id | Alta |
| Extract Clauses | **REEMPLAZAR** hardcode por parser real | Critica |
| **NUEVO** Document Parser | Extraer clausulas con LLM | Critica |
| **NUEVO** Save clause_instances | Persistir clausulas extraidas | Media |
| Call ClauseReview | Pasar run_id, blueprint_version_id | Critica |

---

## 8. Orden de Implementacion Recomendado

### Fase 1: Infraestructura (1-2 dias)

1. Verificar que todas las tablas 3-layer existen en Supabase
2. Cargar dataset Harvey (1,282 policy_examples)
3. Configurar contract_type_review_defaults para Nueva Planta

### Fase 2: W1 (1 dia)

1. Crear nodo "Resolve Blueprint"
2. Actualizar "Insert Document" con blueprint_version_id
3. Actualizar "Create Run" con blueprint_version_id
4. Testing: verificar que contract_runs tiene blueprint_version_id

### Fase 3: W3 - Extraction (2-3 dias)

1. Reemplazar "Workflow Config" por "Resolve Config"
2. Implementar "Document Parser" con LLM
3. Crear nodo "Save clause_instances"
4. Actualizar "Call ClauseReview" para pasar contexto 3-layer
5. Testing: verificar extraccion de clausulas reales

### Fase 4: W2 - RAG (2-3 dias)

1. Crear nodo "Load Clause Types"
2. Actualizar "Router Agent" con prompt dinamico
3. Reemplazar "Context Retriever" por "RAG Retriever"
4. Actualizar "Paranoid Agent" con grounding
5. Actualizar "Valuator Agent" con acceptance levels
6. Actualizar "Build Result" y "Save to clause_reviews"
7. Testing E2E

### Fase 5: Validacion (1 dia)

1. Test E2E completo: upload -> extraction -> review -> export
2. Verificar trazabilidad en clause_reviews (evidence, matter_id)
3. Verificar que frontend muestra grounding

---

## 9. SQL de Verificacion

```sql
-- Verificar policy_examples disponibles por materia
SELECT
  m.code as matter,
  ct.code as clause_type,
  pe.acceptance,
  COUNT(*) as examples
FROM policy_examples pe
JOIN clause_types ct ON ct.id = pe.clause_type_id
JOIN matter_policies mp ON mp.id = pe.matter_policy_id
JOIN matters m ON m.id = mp.matter_id
GROUP BY m.code, ct.code, pe.acceptance
ORDER BY m.code, ct.code, pe.acceptance;

-- Verificar contract_type_review_defaults
SELECT
  d.contract_type_code,
  rb.name as blueprint_name,
  bv.version_label,
  bv.is_active
FROM contract_type_review_defaults d
JOIN blueprint_versions bv ON bv.id = d.default_blueprint_version_id
JOIN review_blueprints rb ON rb.id = bv.blueprint_id;

-- Verificar clause_reviews con campos 3-layer
SELECT
  cr.run_id,
  cr.clause_text,
  cr.client_state,
  cr.blueprint_version_id,
  cr.matter_id,
  cr.acceptance,
  cr.evidence IS NOT NULL as has_evidence
FROM clause_reviews cr
ORDER BY cr.created_at DESC
LIMIT 10;
```

---

## 10. Conclusiones

### Impacto de los Cambios

| Metrica | Antes | Despues |
|---------|-------|---------|
| Clausulas procesadas | 5 (hardcoded) | Ilimitadas (parsing real) |
| Familias/clause_types | 5 hardcoded | 67 dinamicos |
| Grounding RAG | Ninguno | 85-1,367 ejemplos |
| Trazabilidad | Parcial | Completa (evidence, matter_id) |
| Consistencia run_id | Buggy | Garantizada |

### Riesgos

1. **Parsing de documentos**: Requiere servicio de NLP o LLM robusto
2. **Costo OpenAI**: Mas llamadas por documento (extraction + N clausulas)
3. **Latencia**: Pipeline mas largo, considerar paralelizacion

### Proximos Pasos

1. [ ] Aprobar este plan
2. [ ] Cargar dataset Harvey
3. [ ] Implementar Fase 1 (infraestructura)
4. [ ] Implementar Fase 2 (W1)
5. [ ] Implementar Fase 3 (W3)
6. [ ] Implementar Fase 4 (W2)
7. [ ] Testing E2E
8. [ ] Deploy a produccion

---

*Documento generado: 2026-01-22*
*Autor: Claude (Amazon Redliner Team)*
