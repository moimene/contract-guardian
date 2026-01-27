# Monitoreo - Contract Guardian

## Dashboard Endpoint

```bash
# Obtener métricas completas
curl https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/monitoring | jq .

# Desde Supabase client
const { data } = await supabase.rpc('get_monitoring_dashboard')
```

## Métricas Disponibles

### Overview
- `total_documents` - Documentos subidos
- `total_runs` - Ejecuciones totales
- `completed_runs` / `failed_runs` / `processing_runs`
- `total_reviews` - Cláusulas revisadas
- `total_examples` - Policy examples en RAG

### RAG Stats (por matter)
- `example_count` - Ejemplos por materia
- `embedding_pct` - % con embeddings
- `acceptable` / `passable` / `unacceptable` - Distribución

### Recent Runs
- Últimas 10 ejecuciones con duración, estado, errores

### Errors
- Runs fallidos con mensaje de error

## Vistas SQL

```sql
-- En Supabase Dashboard o pgAdmin
SELECT * FROM monitoring_overview;
SELECT * FROM monitoring_recent_activity;
SELECT * FROM monitoring_run_performance;
SELECT * FROM monitoring_errors;
SELECT * FROM monitoring_rag_stats;
```
