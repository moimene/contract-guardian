# Guía: Añadir Failure Detection a W2

## Prerequisitos
- Acceso a n8n Cloud: https://moimene.app.n8n.cloud
- Workflow: `W2_ClauseReview - RAG Enhanced v3`

---

## Paso 1: Abrir el Workflow

1. Ir a n8n Cloud → Workflows
2. Abrir **W2_ClauseReview - RAG Enhanced v3 (Multi-Family + Decision Engine v2)**
3. Hacer scroll a la derecha hasta ver los nodos finales:
   - `Save to sanitizer_outputs`
   - `Respond`

---

## Paso 2: Añadir Nodo "Detect Failures"

1. **Click derecho** en el canvas cerca de `Save to sanitizer_outputs`
2. Seleccionar **Add Node** → **Code**
3. Configurar el nodo:
   - **Name**: `Detect Failures`
   - **Language**: JavaScript

4. **Pegar este código**:

```javascript
// Detect potential routing failures for logging
const data = $json;
const routerOutput = data.routerOutput || {};
const internalData = data._internal || {};

// Detect failure conditions
const failures = [];

// 1. Low confidence routing (< 0.65)
if (routerOutput.confidence && routerOutput.confidence < 0.65) {
  failures.push({
    type: 'low_confidence',
    agent: 'router',
    confidence: routerOutput.confidence,
    route: routerOutput.route,
    method: routerOutput._routing_method
  });
}

// 2. LLM fallback when keyword should have matched
if (routerOutput._routing_method === 'LLM' && routerOutput._keyword_confidence > 0.4) {
  failures.push({
    type: 'keyword_fallback',
    agent: 'router',
    confidence: routerOutput.confidence,
    keyword_conf: routerOutput._keyword_confidence
  });
}

// 3. OtherUnknown classification (potentially missed family)
if (routerOutput.route === 'OtherUnknown') {
  failures.push({
    type: 'unknown_classification',
    agent: 'router',
    confidence: routerOutput.confidence,
    clause_text_preview: (data.clause_text || '').substring(0, 200)
  });
}

// 4. Escalation due to low anchor confidence
if (internalData.escalation_recommended && internalData.anchor_confidence < 0.7) {
  failures.push({
    type: 'low_anchor_confidence',
    agent: 'decision_engine',
    confidence: internalData.anchor_confidence,
    anchor_reason: internalData.escalation_reason
  });
}

// Build failure payload if any failures detected
const hasFailures = failures.length > 0;
const failurePayload = hasFailures ? {
  run_id: data.run_id,
  clause_instance_id: data.clause_instance_id,
  agent_name: failures[0].agent,
  failure_type: failures[0].type,
  original_input: (data.clause_text || '').substring(0, 1000),
  actual_output: JSON.stringify(routerOutput),
  confidence: failures[0].confidence,
  route_assigned: routerOutput.route
} : null;

return [{
  json: {
    ...data,
    _failure_detection: {
      has_failures: hasFailures,
      failures: failures,
      payload: failurePayload
    }
  }
}];
```

---

## Paso 3: Añadir Nodo "Has Failures?"

1. **Añadir nodo** → **If**
2. Configurar:
   - **Name**: `Has Failures?`
   - **Condition**: 
     - Left Value: `{{ $json._failure_detection.has_failures }}`
     - Operation: `equals`
     - Right Value: `true` (boolean)

---

## Paso 4: Añadir Nodo "Log Agent Failure"

1. **Añadir nodo** → **HTTP Request**
2. Configurar:
   - **Name**: `Log Agent Failure`
   - **Method**: `POST`
   - **URL**: `https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/log_agent_failure`

3. **Headers** (Settings → Headers):
   | Header | Value |
   |--------|-------|
   | Content-Type | application/json |
   | apikey | `{{ $env.SUPABASE_SERVICE_KEY }}` |
   | Authorization | `Bearer {{ $env.SUPABASE_SERVICE_KEY }}` |
   | Prefer | return=minimal |

4. **Body** (Settings → Body → JSON):
```json
={{ JSON.stringify({
  p_run_id: $json._failure_detection.payload?.run_id || null,
  p_clause_instance_id: null,
  p_agent_name: $json._failure_detection.payload?.agent_name || 'unknown',
  p_failure_type: $json._failure_detection.payload?.failure_type || 'unknown',
  p_original_input: $json._failure_detection.payload?.original_input || '',
  p_actual_output: $json._failure_detection.payload?.actual_output || '',
  p_confidence: $json._failure_detection.payload?.confidence || 0,
  p_route_assigned: $json._failure_detection.payload?.route_assigned || ''
}) }}
```

5. **Settings** → **On Error**: `Continue Regular Output`

---

## Paso 5: Reconectar el Flujo

### Desconectar:
- ❌ `Save to sanitizer_outputs` → `Respond` (eliminar esta conexión)

### Reconectar:
1. ✅ `Save to sanitizer_outputs` → `Detect Failures`
2. ✅ `Detect Failures` → `Has Failures?`
3. ✅ `Has Failures?` (TRUE - salida superior) → `Log Agent Failure`
4. ✅ `Has Failures?` (FALSE - salida inferior) → `Respond`
5. ✅ `Log Agent Failure` → `Respond`

### Diagrama del flujo final:
```
Save to sanitizer_outputs
        ↓
   Detect Failures
        ↓
   Has Failures?
      ↓      ↓
    TRUE   FALSE
      ↓      ↓
Log Agent  → Respond
Failure ────→
```

---

## Paso 6: Guardar y Activar

1. Click **Save** (Ctrl+S)
2. Verificar que el workflow sigue **Active**
3. Hacer un test manual para verificar

---

## Verificación

Después de configurar, ejecutar una cláusula de prueba y verificar en Supabase:

```sql
SELECT * FROM agent_failures ORDER BY created_at DESC LIMIT 5;
```

Si no hay fallos detectados (routing > 0.65, no OtherUnknown), la tabla estará vacía - esto es comportamiento esperado.

---

*Generado: 31 enero 2026*
