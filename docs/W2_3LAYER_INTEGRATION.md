# Integración 3 Capas en W2_ClauseReview_RAG

## Resumen

Este documento describe los cambios necesarios en el workflow W2 de n8n para usar correctamente la arquitectura de 3 capas del PRD.

## Nuevas Funciones RPC Disponibles

Se han creado 4 funciones SQL para soportar el modelo de 3 capas:

### 1. `create_clause_instance()`
Crea instancia de cláusula en CAPA 0.

```json
{
  "p_document_id": "uuid",
  "p_run_id": "uuid",
  "p_clause_index": 1,
  "p_heading": "Termination",
  "p_original_text": "Either party may terminate..."
}
→ Returns: clause_instance_id (UUID)
```

### 2. `register_agent_step()`
Registra paso de agente para audit trail (CAPA 0 - run_steps).

```json
{
  "p_run_id": "uuid",
  "p_clause_instance_id": "uuid",
  "p_step_name": "router|paranoid|valuator|sanitizer",
  "p_agent_name": "gpt-4o-mini|gpt-4o",
  "p_input_data": {"clause_text": "..."},
  "p_output_data": {"route": "termination", "confidence": 0.95},
  "p_duration_ms": 1200
}
→ Returns: step_id (UUID)
```

### 3. `save_review_finding()`
Guarda findings de agentes (CAPA 0 - review_findings).

```json
{
  "p_clause_instance_id": "uuid",
  "p_agent_name": "paranoid|valuator",
  "p_finding_type": "deviation|risk|ambiguity",
  "p_severity": "high|medium|low",
  "p_evidence": {"quote": "...", "issue": "..."},
  "p_suggested_action": "redline|escalate|accept"
}
→ Returns: finding_id (UUID)
```

### 4. `get_fallback_clause()`
Obtiene texto de fallback para redline (CAPA 1 - fallback_clauses).

```json
{
  "p_matter_policy_id": "uuid",
  "p_target_acceptance": "ACCEPTABLE"
}
→ Returns: { fallback_id, fallback_text, usage_notes, requires_approval, approval_role }
```

---

## Cambios en W2 Workflow

### Paso 1: Parse Input → Crear clause_instance

**AÑADIR NODO** después de "Parse Input":

```
HTTP Request: Supabase RPC
- Method: POST
- URL: https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/create_clause_instance
- Body:
{
  "p_document_id": "{{ $json.document_id }}",
  "p_run_id": "{{ $json.run_id }}",
  "p_clause_index": {{ $json.clause_index || 1 }},
  "p_heading": "{{ $json.heading || 'Unknown' }}",
  "p_original_text": "{{ $json.clause_text }}"
}
```

Guardar el `clause_instance_id` retornado para pasos siguientes.

---

### Paso 2: Después de cada Agente → Registrar paso

**AÑADIR NODO** después de cada agente (Router, Paranoid, Valuator):

```
HTTP Request: Supabase RPC
- Method: POST  
- URL: https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/register_agent_step
- Body:
{
  "p_run_id": "{{ $('Parse Input').json.run_id }}",
  "p_clause_instance_id": "{{ $('Create Instance').json }}",
  "p_step_name": "router",
  "p_agent_name": "gpt-4o-mini",
  "p_input_data": { "clause_text": "{{ $json.clause_text }}" },
  "p_output_data": {{ JSON.stringify($json.routerOutput) }},
  "p_duration_ms": 1200
}
```

---

### Paso 3: Paranoid → Guardar findings

**AÑADIR NODO** después de "Parse Paranoid":

```javascript
// Code node: Save Paranoid Findings
const prevData = $('Parse Paranoid').first().json;
const findings = prevData.paranoidOutput.evidence_spans || [];

// Guardar cada finding
for (const span of findings) {
  await $http.request({
    method: 'POST',
    url: 'https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/save_review_finding',
    headers: {
      'apikey': 'YOUR_KEY',
      'Content-Type': 'application/json'
    },
    body: {
      p_clause_instance_id: prevData.clause_instance_id,
      p_agent_name: 'paranoid',
      p_finding_type: 'deviation',
      p_severity: span.severity,
      p_evidence: span,
      p_suggested_action: span.severity === 'high' ? 'redline' : 'review'
    }
  });
}

return [{ json: prevData }];
```

---

### Paso 4: Valuator UNACCEPTABLE → Obtener fallback

**AÑADIR NODO** condicional cuando `acceptance === 'UNACCEPTABLE'`:

```
HTTP Request: Supabase RPC
- Method: POST
- URL: https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/get_fallback_clause
- Body:
{
  "p_matter_policy_id": "{{ $json.matter_policy_id }}",
  "p_target_acceptance": "ACCEPTABLE"
}
```

Si hay resultado, usar `fallback_text` como `suggested_text` del cambio propuesto.

---

## Flujo Actualizado

```
Webhook
   ↓
Parse Input
   ↓
[NEW] Create Clause Instance → clause_instances
   ↓
Router Agent
   ↓
[NEW] Register Router Step → run_steps
   ↓
Generate Embedding
   ↓
RAG Search
   ↓
Paranoid Agent
   ↓
[NEW] Register Paranoid Step → run_steps
   ↓
[NEW] Save Paranoid Findings → review_findings
   ↓
Valuator Agent
   ↓
[NEW] Register Valuator Step → run_steps
   ↓
[NEW] Get Fallback Clause (if UNACCEPTABLE) → fallback_clauses
   ↓
Build Response
   ↓
Save to clause_reviews
   ↓
Respond
```

---

## Estado Actual de Datos

| Capa | Tabla | Rows | Estado |
|------|-------|------|--------|
| **CAPA 0** | clause_instances | 0 → pending | Función lista |
| **CAPA 0** | run_steps | 0 → pending | Función lista |
| **CAPA 0** | review_findings | 0 → pending | Función lista |
| **CAPA 1** | fallback_clauses | 16 | ✅ Poblada |
| **CAPA 2** | contract_model_clauses | 6 | ✅ Poblada |

---

## Próximos Pasos

1. **Actualizar W2 en n8n** con los nuevos nodos
2. **Probar con un contrato** para verificar que se poblan las tablas CAPA 0
3. **Iterar** ajustando los prompts si es necesario
