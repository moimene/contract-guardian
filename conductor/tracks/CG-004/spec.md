# CG-004: W3→W2 Payload Completo

## Estado: ✅ DONE

---

## Objetivo
Asegurar que W3 envía datos completos y dinámicos a W2 para mejorar el routing y trazabilidad.

## Problemas Resueltos

### 1. `heading` no se pasaba a W2
- W3 extrae `heading` en "Format & Split" pero no lo incluía en el payload
- Sin `heading`, el Router no puede usar heading_boost patterns

### 2. `contract_type` hardcoded
```javascript
// ANTES (línea 203 de W3)
contract_type: 'nueva_planta'

// DESPUÉS
contract_type: $json.contract_type || $json._doc_metadata?.contract_type || 'psa_standard'
```

## Entregables

### 1. `w3_clause_payload_enricher_v4.2.js`
Script con dos opciones de implementación:
- Opción 1: Code node antes de HTTP Request
- Opción 2: Expresión directa en jsonBody

### 2. Payload Actualizado

```json
{
  "clause_instance_id": "uuid",
  "clause_id": "clause_1",
  "clause_text": "...",
  "run_id": "uuid",
  "document_id": "uuid",
  "heading": "7.1 INDEMNIFICATION BY PRODCO",  // NEW
  "contract_type": "psa_amazon",               // DYNAMIC
  "sequence_number": 0                         // NEW
}
```

## Instrucciones de Despliegue

1. Abrir W3 en n8n
2. Encontrar nodo HTTP Request que llama W2
3. Reemplazar `jsonBody` con:

```
={{ JSON.stringify({
  clause_instance_id: $('Format & Split').item.json.clause_instance_id,
  clause_id: $('Format & Split').item.json.clause_id,
  clause_text: $('Format & Split').item.json.clause_text,
  run_id: $('Format & Split').item.json.run_id,
  document_id: $('Format & Split').item.json.document_id,
  heading: $('Format & Split').item.json.heading || '',
  contract_type: $('Format & Split').item.json.contract_type || 'psa_standard',
  sequence_number: $('Format & Split').item.json.clause_index
}) }}
```

4. Guardar workflow

## Criterios de Aceptación
- [x] Campo `heading` incluido en payload
- [x] Campo `contract_type` es dinámico
- [x] Script de migración creado
- [ ] W3 desplegado con cambios
- [ ] W2 recibe y usa `heading` en router
