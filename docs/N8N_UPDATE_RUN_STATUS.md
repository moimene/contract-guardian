# Integración n8n - Webhook update_run_status

## Endpoint

```
POST https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/update_run_status
```

## Cuándo llamar

Llamar al final del workflow W3 (Contract Review) para actualizar el estado de `contract_runs`.

## Request Body

```json
{
  "run_id": "uuid",
  "status": "COMPLETED",        // PROCESSING | COMPLETED | FAILED | CANCELLED
  "decision": "APPROVED",       // APPROVED | REJECTED | NEEDS_REVIEW | ERROR
  "total_clauses": 15,          // Total de cláusulas en el contrato
  "processed_clauses": 15,      // Cláusulas procesadas
  "error_message": null         // Solo si status = FAILED
}
```

## Ejemplos n8n

### Éxito (todas las cláusulas procesadas)
```json
{
  "run_id": "{{ $json.run_id }}",
  "status": "COMPLETED",
  "decision": "{{ $json.needs_review ? 'NEEDS_REVIEW' : 'APPROVED' }}",
  "total_clauses": "{{ $json.total_clauses }}",
  "processed_clauses": "{{ $json.processed_clauses }}"
}
```

### Error
```json
{
  "run_id": "{{ $json.run_id }}",
  "status": "FAILED",
  "decision": "ERROR",
  "error_message": "{{ $json.error }}"
}
```

## Response

```json
{
  "success": true,
  "run_id": "uuid",
  "status": "COMPLETED",
  "decision": "APPROVED",
  "message": "Run actualizado a COMPLETED"
}
```

## Configuración n8n

Añadir nodo HTTP Request al final de W3:

1. **Method**: POST
2. **URL**: `https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/update_run_status`
3. **Headers**: `Content-Type: application/json`
4. **Body**: JSON con run_id, status, decision, etc.
