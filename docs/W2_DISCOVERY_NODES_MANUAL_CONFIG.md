# W2 Discovery Mode - Configuración Manual de Nodos

> **Problema actual**: Los nodos `Respond Discovery` y `Save Discovered Clause Type` están desconectados del flujo principal.

---

## Flujo Correcto de Conexiones

```
Check Discovery Mode
    ├── [output 0: FALSE] → Match Family (flujo normal)
    └── [output 1: TRUE]  → Parse Discovery → Build Discovery Result → Save Discovered Clause Type → Respond Discovery
```

---

## NODO 1: Parse Discovery

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Code |
| **Nombre** | `Parse Discovery` |
| **Posición aprox.** | Después de "Check Discovery Mode" (rama Discovery) |

### Código JavaScript:

```javascript
/**
 * Parse Discovery Agent Response
 * Extracts structured discovery analysis and prepares for persistence
 */

const inputData = $json;
let discoveryOutput = null;

// Default structure
const defaultDiscovery = {
  discovery_analysis: {
    clause_characterization: { primary_function: 'unknown', legal_concepts: [], subject_matter: 'unclassified' },
    directional_analysis: { benefits: 'Unknown', obligates: 'Unknown', assessment: 'Unknown' },
    risk_identification: { universal_red_flags_found: [], missing_protections: [], risk_level: 'MEDIUM' },
    family_proposal: { suggested_family: 'OtherUnknown', confidence: 0, rationale: 'Parsing failed', similar_to: [] },
    treatment_recommendation: { action: 'ESCALATE_REVIEW', reason: 'Parsing failed', requires_new_spec: true }
  },
  provisional_observations: [],
  human_review_notes: 'Requires manual review'
};

try {
  // Get LLM response
  const responseText = inputData.message?.content || inputData.text || inputData.choices?.[0]?.message?.content || JSON.stringify(inputData);
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
  
  discoveryOutput = JSON.parse(jsonStr);
} catch (e) {
  console.log('Discovery parse error:', e.message);
  discoveryOutput = defaultDiscovery;
}

// Get previous clause data
const prevData = $('Check Discovery Mode').first().json;

// Determine final decision based on discovery
const action = discoveryOutput.discovery_analysis?.treatment_recommendation?.action || 'ESCALATE_REVIEW';
let decision = 'ESCALATE_HUMAN';
let clientState = 'NEEDS_REVIEW';

if (action === 'ESCALATE_CRITICAL') {
  decision = 'BLOCK_EXPORT';
  clientState = 'REJECTED';
} else if (action === 'PROVISIONAL_PASS') {
  decision = 'APPROVE_WITH_NOTES';
  clientState = 'APPROVED_WITH_NOTES';
}

return [{
  json: {
    ...prevData,
    _discovery_output: discoveryOutput,
    _discovery_decision: decision,
    _discovery_client_state: clientState,
    _suggested_family: discoveryOutput.discovery_analysis?.family_proposal?.suggested_family || 'OtherUnknown',
    _requires_new_spec: discoveryOutput.discovery_analysis?.treatment_recommendation?.requires_new_spec || true,
    _discovery_risk_level: discoveryOutput.discovery_analysis?.risk_identification?.risk_level || 'MEDIUM',
    _discovery_observations: discoveryOutput.provisional_observations || [],
    _human_review_notes: discoveryOutput.human_review_notes || 'Requires review'
  }
}];
```

### Conexión Entrada:
- Conectar **desde**: `Check Discovery Mode` → **output 1** (rama TRUE/Discovery)

### Conexión Salida:
- Conectar **hacia**: `Build Discovery Result`

---

## NODO 2: Build Discovery Result

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Code |
| **Nombre** | `Build Discovery Result` |
| **Posición aprox.** | Después de "Parse Discovery" |

### Código JavaScript:

```javascript
/**
 * Build Discovery Result
 * Constructs final output for discovered clause types
 */

const data = $json;
const discovery = data._discovery_output || {};
const analysis = discovery.discovery_analysis || {};

// Build internal record for clause_reviews_internal
const internalResult = {
  clause_instance_id: data.clause_instance_id,
  clause_id: data.clause_id,
  document_id: data.document_id,
  run_id: data.run_id,
  detected_family: data.detected_family,
  routing_method: 'DISCOVERY_MODE',
  routing_confidence: data._routing_confidence || 0,
  discovery_mode: true,
  discovery_reason: data._discovery_reason,
  suggested_family: data._suggested_family,
  risk_level: data._discovery_risk_level,
  decision: data._discovery_decision,
  observations: data._discovery_observations,
  human_review_notes: data._human_review_notes,
  requires_new_spec: data._requires_new_spec,
  completed_at: new Date().toISOString()
};

// Build discovered_clause_types record
const discoveredTypeRecord = {
  clause_instance_id: data.clause_instance_id,
  document_id: data.document_id,
  run_id: data.run_id,
  original_text: data.clause_text,
  detected_family: data.detected_family,
  suggested_family: data._suggested_family,
  discovery_reason: data._discovery_reason,
  routing_confidence: data._routing_confidence,
  risk_level: data._discovery_risk_level,
  characterization: analysis.clause_characterization || {},
  directional_analysis: analysis.directional_analysis || {},
  risk_identification: analysis.risk_identification || {},
  family_proposal: analysis.family_proposal || {},
  treatment_recommendation: analysis.treatment_recommendation || {},
  observations: data._discovery_observations,
  human_review_notes: data._human_review_notes,
  status: 'PENDING_REVIEW',
  created_at: new Date().toISOString()
};

// Build client-facing response
const clientResponse = {
  clause_instance_id: data.clause_instance_id,
  detected_family: data.detected_family,
  decision: data._discovery_decision,
  client_state: data._discovery_client_state,
  client_comment: `This clause type requires legal team review. Suggested classification: ${data._suggested_family}. Risk level: ${data._discovery_risk_level}.`,
  safety_pass: data._discovery_decision !== 'BLOCK_EXPORT',
  discovery_mode: true
};

return [{
  json: {
    ...data,
    _internal: internalResult,
    _discovered_type: discoveredTypeRecord,
    _client_response: clientResponse
  }
}];
```

### Conexión Entrada:
- Conectar **desde**: `Parse Discovery`

### Conexión Salida:
- Conectar **hacia**: `Save Discovered Clause Type`

---

## NODO 3: Save Discovered Clause Type

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Supabase |
| **Nombre** | `Save Discovered Clause Type` |
| **Posición aprox.** | Después de "Build Discovery Result" |

### Configuración del Nodo Supabase:

| Campo | Valor |
|-------|-------|
| **Credential** | `contract-guardian` |
| **Resource** | `Insert` |
| **Table** | `discovered_clause_types` |
| **Data Mode** | `Auto-map input data` ❌ |

> ⚠️ **IMPORTANTE**: NO uses "Auto-map". Usa **"Define Below"** y mapea manualmente estos campos:

### Campos a mapear manualmente:

| Campo | Expresión |
|-------|-----------|
| `clause_instance_id` | `{{ $json._discovered_type.clause_instance_id }}` |
| `document_id` | `{{ $json._discovered_type.document_id }}` |
| `run_id` | `{{ $json._discovered_type.run_id }}` |
| `original_text` | `{{ $json._discovered_type.original_text }}` |
| `detected_family` | `{{ $json._discovered_type.detected_family }}` |
| `suggested_family` | `{{ $json._discovered_type.suggested_family }}` |
| `discovery_reason` | `{{ $json._discovered_type.discovery_reason }}` |
| `routing_confidence` | `{{ $json._discovered_type.routing_confidence }}` |
| `risk_level` | `{{ $json._discovered_type.risk_level }}` |
| `characterization` | `{{ $json._discovered_type.characterization }}` |
| `directional_analysis` | `{{ $json._discovered_type.directional_analysis }}` |
| `risk_identification` | `{{ $json._discovered_type.risk_identification }}` |
| `family_proposal` | `{{ $json._discovered_type.family_proposal }}` |
| `treatment_recommendation` | `{{ $json._discovered_type.treatment_recommendation }}` |
| `observations` | `{{ $json._discovered_type.observations }}` |
| `human_review_notes` | `{{ $json._discovered_type.human_review_notes }}` |
| `status` | `{{ $json._discovered_type.status }}` |

### Conexión Entrada:
- Conectar **desde**: `Build Discovery Result`

### Conexión Salida:
- Conectar **hacia**: `Respond Discovery`

---

## NODO 4: Respond Discovery

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Respond to Webhook |
| **Nombre** | `Respond Discovery` |
| **Posición aprox.** | Final del flujo Discovery |

### Configuración:

| Campo | Valor |
|-------|-------|
| **Respond With** | `JSON` |
| **Response Body** | `{{ $('Build Discovery Result').first().json._client_response }}` |

### Conexión Entrada:
- Conectar **desde**: `Save Discovered Clause Type`

### Conexión Salida:
- Ninguna (nodo terminal)

---

## Resumen Visual de Conexiones

```
┌─────────────────────────┐
│  Check Discovery Mode   │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
[output 0]      [output 1]
    │               │
    ▼               ▼
Match Family   Parse Discovery
                    │
                    ▼
            Build Discovery Result
                    │
                    ▼
            Save Discovered Clause Type
                    │
                    ▼
            Respond Discovery
```

---

## Pasos para Conectar Manualmente

1. **Localiza** `Check Discovery Mode` en el canvas
2. **Arrastra** una conexión desde su **segundo output** (output 1) hacia `Parse Discovery`
3. **Arrastra** una conexión desde `Parse Discovery` hacia `Build Discovery Result`
4. **Arrastra** una conexión desde `Build Discovery Result` hacia `Save Discovered Clause Type`
5. **Arrastra** una conexión desde `Save Discovered Clause Type` hacia `Respond Discovery`
6. **Guarda** el workflow (Ctrl+S)

---

## Verificación

Después de conectar, el flujo Discovery debería verse así en las Executions cuando se activa:

```
Webhook → Parse Input → Hybrid Router → Check Discovery Mode → Parse Discovery → Build Discovery Result → Save Discovered Clause Type → Respond Discovery
```
