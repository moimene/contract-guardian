# CG-002: Decision Semantics Alignment

## Estado: 🔄 IN PROGRESS

---

## Objetivo
Alinear la semántica de decisiones entre el Agent, la base de datos y la UI para eliminar escalaciones artificiales.

## Problema
El Decision Engine produce valores como `AUTO_PASS` o `BLOCK_EXPORT` que no coinciden con los estados esperados en la UI (`ACCEPT_AS_IS`, `REJECT`), causando:
- Cláusulas que aparecen como "escaladas" cuando deberían estar auto-aprobadas
- Discrepancia entre la lógica interna y lo que ve el usuario
- Métricas de escalación infladas artificialmente

## Mapeo Canónico

### Agent Output → DB Enum → UI State

| Agent Decision | DB `decision` | `client_state` | UI Display |
|----------------|---------------|----------------|------------|
| `AUTO_PASS` | `accept` | `accepted` | ✅ Approved |
| `ACCEPT_WITH_NOTES` | `accept` | `pending_review` | 📝 Review Suggested |
| `SUGGEST_REDLINE` | `modify` | `pending_review` | ✏️ Redline Suggested |
| `ESCALATE` | `escalate` | `pending_review` | ⚠️ Needs Attention |
| `BLOCK_EXPORT` | `reject` | `rejected` | 🚫 Rejected |

### Reglas de Normalización

```javascript
const DECISION_NORMALIZE = {
  // Agent outputs → DB enum
  'AUTO_PASS': 'accept',
  'ACCEPT_AS_IS': 'accept',
  'PASS': 'accept',
  'APPROVE': 'accept',
  
  'ACCEPT_WITH_NOTES': 'accept', // pero client_state = 'pending_review'
  
  'SUGGEST_REDLINE': 'modify',
  'REDLINE': 'modify',
  'MODIFY': 'modify',
  
  'ESCALATE': 'escalate',
  'NEEDS_REVIEW': 'escalate',
  'FLAG': 'escalate',
  
  'BLOCK_EXPORT': 'reject',
  'REJECT': 'reject',
  'BLOCK': 'reject'
};

const CLIENT_STATE_MAP = {
  'accept': 'accepted',      // Solo si decision = AUTO_PASS puro
  'modify': 'pending_review',
  'escalate': 'pending_review',
  'reject': 'rejected'
};
```

## Archivos a Modificar

### 1. Decision Engine (W2)
- Normalizar output a valores canónicos antes de guardar
- Asegurar que `client_state` se derive correctamente

### 2. View `clause_reviews_view` (Supabase)
- Eliminar lógica CASE/ELSE que genera estados fallback
- Usar valores normalizados directamente

### 3. W3 Completion Logic
- Al marcar run como COMPLETED, validar que todas las cláusulas tengan estados válidos

## Criterios de Aceptación

- [ ] Todas las decisiones del agent se normalizan antes de INSERT
- [ ] `client_state` siempre derivado del mapeo, nunca hardcoded
- [ ] View no tiene ELSE fallbacks
- [ ] 0% de cláusulas con estado "unknown" o null
- [ ] Métricas de escalación reflejan escalaciones reales

## Dependencias
- ✅ CG-001 (Taxonomy) - Completado
- → CG-004 (Payload) - Puede ejecutarse en paralelo
