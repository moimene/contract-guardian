# W2 RAG Enhanced - Guía de Configuración

## Resumen

Esta versión de W2 integra búsqueda semántica RAG usando los 909 `policy_examples` con embeddings.

## Flujo del Workflow

```
Webhook
  → Parse Input
  → Router Agent (clasificación)
  → Parse Router
  → Generate Clause Embedding (OpenAI)    ← NUEVO
  → Parse Embedding
  → RAG: Search Similar Examples          ← NUEVO
  → Parse RAG Results                     ← NUEVO
  → Context Retriever (playbook_rules)
  → Enrich Policy
  → Paranoid Agent (RAG Enhanced)         ← MEJORADO
  → Parse Paranoid
  → Valuator Agent (RAG Enhanced)         ← MEJORADO
  → Parse Valuator
  → Decisor
  → Sanitizer Agent
  → Build Result
  → Save to clause_reviews
  → Respond
```

## Configuración Requerida en n8n

### 1. Credencial HTTP Header para Supabase RPC

El nodo "RAG: Search Similar Examples" llama a la función PostgreSQL vía REST API.

**Crear credencial "Supabase API Key":**

| Campo | Valor |
|-------|-------|
| Name | `apikey` |
| Value | Tu `SUPABASE_ANON_KEY` o `SERVICE_ROLE_KEY` |

### 2. Variable de Entorno

Añadir en n8n Settings → Variables:

```
SUPABASE_URL = https://hvlsuwdqtffiilvampxq.supabase.co
```

### 3. Importar el Workflow

1. Ir a n8n → Workflows → Import
2. Subir `W2_ClauseReview_RAG.json`
3. Actualizar ID de credencial "Supabase API Key" en nodo "RAG: Search Similar Examples"

## Cómo Funciona el RAG

### 1. Generar Embedding de la Cláusula

```
POST https://api.openai.com/v1/embeddings
{
  "model": "text-embedding-3-small",
  "input": "<clause_text>",
  "dimensions": 1536
}
```

### 2. Buscar Ejemplos Similares

```
POST https://<supabase>/rest/v1/rpc/search_policy_examples
{
  "query_embedding": [0.123, ...],
  "match_threshold": 0.6,
  "match_count": 5
}
```

### 3. Enriquecer Prompts

Los agentes Paranoid y Valuator reciben:

```
=== SIMILAR EXAMPLES FROM PAST REVIEWS (RAG) ===

--- ACCEPTABLE Examples ---
[ACCEPTABLE] (similarity: 87%)
Amazon shall own exclusively, in perpetuity...

--- PASSABLE Examples ---
[PASSABLE] (similarity: 82%)
Amazon shall own all rights subject to...

--- UNACCEPTABLE Examples ---
[UNACCEPTABLE] (similarity: 79%)
ProdCo retains all ownership rights...
```

## Decisiones Basadas en RAG

El Decisor ajusta la confianza basándose en RAG:

```javascript
// Boost confidence if RAG found very similar acceptable example
if (ragSimilarity > 0.85 && topAcceptance === 'ACCEPTABLE') {
  adjustedConf = Math.min(1, anchorConf + 0.1);
}
```

## Metadata RAG en Resultado

El resultado incluye información RAG:

```json
{
  "_rag": {
    "examples_found": 5,
    "top_similarity": 0.87,
    "top_acceptance": "ACCEPTABLE",
    "decision_factor": "Similar clause was previously accepted"
  }
}
```

## Prueba Manual

```bash
curl -X POST "https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag" \
  -H "Content-Type: application/json" \
  -d '{
    "clause_text": "Amazon shall own exclusively, in perpetuity, throughout the universe, all right, title and interest in and to the Program.",
    "clause_id": "test_rag_1",
    "document_id": "test-doc-123"
  }'
```
