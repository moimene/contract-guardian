# Observabilidad y Self-Improvement (FMA)

**Fecha de Implementación**: 31 enero 2026  
**Versión**: 1.0.0

---

## Resumen

Este documento describe las tablas, funciones y patrones implementados para:
- **Fase 2**: Métricas y Observabilidad del pipeline
- **Fase 3**: Failure Mode Analysis (FMA) y Self-Improvement

---

## Nuevas Tablas

### `pipeline_metrics`

Almacena métricas de rendimiento por cada ejecución del pipeline.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `run_id` | UUID | FK a `contract_runs` |
| `total_duration_ms` | INTEGER | Duración total en ms |
| `extraction_duration_ms` | INTEGER | Tiempo de extracción de texto |
| `parsing_duration_ms` | INTEGER | Tiempo de parsing AI |
| `review_duration_ms` | INTEGER | Tiempo de revisión W2 |
| `aggregation_duration_ms` | INTEGER | Tiempo de agregación |
| `total_tokens_used` | INTEGER | Tokens totales consumidos |
| `tokens_by_agent` | JSONB | Desglose por agente |
| `total_clauses` | INTEGER | Total cláusulas procesadas |
| `clauses_auto_passed` | INTEGER | Cláusulas auto-aprobadas |
| `clauses_escalated` | INTEGER | Cláusulas escaladas |
| `clauses_blocked` | INTEGER | Cláusulas bloqueadas |
| `avg_rag_score` | FLOAT | Score RAG promedio |

### `agent_failures`

Registro de fallos para Failure Mode Analysis.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `run_id` | UUID | FK a `contract_runs` |
| `agent_name` | TEXT | router, paranoid, valuator, sanitizer |
| `failure_type` | TEXT | misclassification, timeout, invalid_output, low_confidence |
| `original_input` | TEXT | Input que causó el fallo |
| `actual_output` | TEXT | Output erróneo |
| `human_override` | BOOLEAN | Si fue corregido manualmente |
| `human_correction` | TEXT | Corrección aplicada |
| `route_assigned` | TEXT | Ruta asignada erróneamente |
| `route_expected` | TEXT | Ruta esperada |

---

## Funciones RPC

### `log_pipeline_metrics`

```sql
SELECT log_pipeline_metrics(
    p_run_id := 'uuid',
    p_total_duration_ms := 5000,
    p_total_tokens := 1500,
    p_tokens_by_agent := '{"router": 100, "paranoid": 600, "valuator": 500, "sanitizer": 300}',
    p_total_clauses := 10,
    p_clauses_auto_passed := 7,
    p_clauses_escalated := 2,
    p_clauses_blocked := 1
);
```

### `log_agent_failure`

```sql
SELECT log_agent_failure(
    p_run_id := 'uuid',
    p_clause_instance_id := 'uuid',
    p_agent_name := 'router',
    p_failure_type := 'misclassification',
    p_original_input := 'texto de la cláusula...',
    p_actual_output := 'IndemnityAmazon',
    p_confidence := 0.65,
    p_keywords := ARRAY['indemnify', 'Amazon'],
    p_route_assigned := 'IndemnityAmazon'
);
```

### `get_pipeline_stats`

Obtiene estadísticas agregadas de los últimos N días.

```sql
SELECT * FROM get_pipeline_stats(7);

-- Retorna:
-- avg_total_duration_ms | avg_tokens_per_clause | auto_pass_rate | escalation_rate | block_rate | avg_rag_score | total_runs
```

### `analyze_failure_patterns`

Identifica patrones recurrentes de fallo y sugiere correcciones.

```sql
SELECT * FROM analyze_failure_patterns(30);

-- Retorna:
-- agent_name | failure_type | route_assigned | occurrence_count | suggested_fix
```

---

## Vistas

### `pending_human_review`

Cláusulas que requieren revisión humana.

```sql
SELECT * FROM pending_human_review;
```

### `failure_dashboard`

Dashboard de fallos por día/agente/tipo.

```sql
SELECT * FROM failure_dashboard;
```

---

## Integración con Workflows

### W3 - Logging de Métricas

Al final del workflow W3, añadir nodo HTTP que llame:

```javascript
// Nodo: Log Pipeline Metrics
const startTime = $('Create Run ID').first().json.started_at;
const endTime = new Date().toISOString();
const durationMs = new Date(endTime) - new Date(startTime);

return [{
  json: {
    run_id: $json.run_id,
    total_duration_ms: durationMs,
    total_clauses: $json.total_clauses,
    // ... more metrics
  }
}];
```

### W2 - Logging de Fallos

En los nodos de error handling de W2:

```javascript
// Cuando router.confidence < 0.65 y llm_fallback fue usado
if (routerOutput.confidence < 0.65 && routerOutput.method === 'LLM') {
  // Registrar como low_confidence
  await logFailure('router', 'low_confidence', ...);
}
```

---

## Campos de Feedback (UI)

Se añadieron campos a `clause_reviews_internal`:

| Campo | Tipo | Uso |
|-------|------|-----|
| `human_override_decision` | TEXT | Decisión corregida por humano |
| `human_feedback` | TEXT | Comentario de feedback |
| `feedback_submitted_at` | TIMESTAMPTZ | Cuándo se dio feedback |
| `feedback_submitted_by` | UUID | Quién dio feedback |

---

## Casos de Uso

### 1. Dashboard de Métricas

```sql
-- Métricas de últimos 7 días
SELECT * FROM get_pipeline_stats(7);

-- Métricas por día
SELECT 
    DATE_TRUNC('day', created_at) as date,
    AVG(total_duration_ms) as avg_duration,
    SUM(total_clauses) as total_clauses,
    AVG(avg_rag_score) as avg_rag
FROM pipeline_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### 2. Identificar Mejoras de Router

```sql
-- Familias con mayor tasa de misclassification
SELECT 
    route_assigned,
    COUNT(*) as errors,
    array_agg(DISTINCT unnested_kw) as common_keywords
FROM agent_failures, 
     LATERAL UNNEST(keywords_detected) as unnested_kw
WHERE failure_type = 'misclassification'
GROUP BY route_assigned
ORDER BY errors DESC
LIMIT 5;
```

### 3. Feedback Loop

```sql
-- Cláusulas corregidas por humanos (para entrenar modelo)
SELECT 
    ci.original_text,
    cri.detected_family,
    cri.human_override_decision,
    cri.human_feedback
FROM clause_reviews_internal cri
JOIN clause_instances ci ON ci.id::text = cri.clause_instance_id
WHERE cri.human_override_decision IS NOT NULL
ORDER BY cri.feedback_submitted_at DESC;
```

---

## Próximos Pasos

1. **Implementar nodos en n8n** para llamar a las funciones RPC
2. **Crear dashboard en UI** con gráficos de métricas
3. **Automatizar análisis** de patrones de fallo semanalmente
4. **A/B Testing** de prompts basado en métricas de performance
