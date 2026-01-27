# Instrucciones: Generación de Embeddings para RAG

## Resumen

Este documento explica cómo generar embeddings vectoriales para los 909 `policy_examples` cargados, habilitando búsqueda semántica (RAG) en el sistema Amazon Redliner.

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `sql/EMBEDDINGS_SETUP_POLICY_EXAMPLES.sql` | Schema, índices y funciones |
| `n8n/UTIL_GenerateEmbeddings.json` | Workflow n8n para generar embeddings |

---

## Paso 1: Ejecutar SQL Setup

1. Abre Supabase SQL Editor
2. Ejecuta `sql/EMBEDDINGS_SETUP_POLICY_EXAMPLES.sql`
3. Verifica que retorne stats de embeddings (0 con embedding inicialmente)

### Qué crea el SQL:

- **Columna `embedding vector(1536)`** en policy_examples
- **Índice HNSW** para búsqueda rápida (cosine similarity)
- **Funciones**:
  - `search_policy_examples()` - Búsqueda semántica principal
  - `get_similar_examples_by_clause_type()` - Ejemplos similares por tipo
  - `get_pending_embeddings()` - Obtener batch pendiente
  - `update_policy_example_embedding()` - Actualizar embedding individual
  - `get_policy_examples_stats()` - Estadísticas por materia
- **Vista `policy_examples_embedding_stats`** - Tracking de progreso

---

## Paso 2: Configurar n8n Workflow

1. Importa `n8n/UTIL_GenerateEmbeddings.json` en tu instancia n8n
2. Configura las credenciales:
   - **Postgres**: Connection string de Supabase
   - **OpenAI**: API key con acceso a embeddings

### Flujo del workflow:

```
[Manual Trigger] 
    → [Get Pending Examples (50)]
    → [Has Results?]
        → YES → [Batch Items (10)]
                    → [Generate Embedding (OpenAI)]
                    → [Update in DB]
                    → [Loop until batch done]
        → NO  → [All Done]
```

---

## Paso 3: Generar Embeddings

### Opción A: Via n8n

1. Ejecuta el workflow manualmente
2. Repite hasta que no queden pendientes
3. ~19 ejecuciones para 909 ejemplos

### Opción B: Via Script (alternativa)

```javascript
// generate_embeddings.js
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings(batchSize = 50) {
  while (true) {
    // Get pending
    const { data: pending } = await supabase
      .from('policy_examples')
      .select('id, example_text')
      .is('embedding', null)
      .limit(batchSize);
    
    if (!pending || pending.length === 0) {
      console.log('All done!');
      break;
    }
    
    console.log(`Processing ${pending.length} examples...`);
    
    for (const item of pending) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: item.example_text,
        dimensions: 1536
      });
      
      await supabase
        .from('policy_examples')
        .update({ embedding: response.data[0].embedding })
        .eq('id', item.id);
    }
    
    console.log(`Batch complete. Waiting 1s...`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

generateEmbeddings();
```

---

## Paso 4: Verificar Embeddings

```sql
-- Ver progreso
SELECT * FROM policy_examples_embedding_stats;

-- Ver stats por materia
SELECT * FROM get_policy_examples_stats();
```

---

## Paso 5: Probar Búsqueda Semántica

```sql
-- Primero genera embedding para tu query (via OpenAI)
-- Luego usa la función de búsqueda:

SELECT * FROM search_policy_examples(
  '[0.123, 0.456, ...]'::vector,  -- tu query embedding
  0.7,   -- threshold mínimo de similitud
  10     -- número de resultados
);
```

---

## Costos Estimados

| Modelo | Costo/1K tokens | Total (~909 ejemplos) |
|--------|-----------------|----------------------|
| text-embedding-3-small | $0.00002 | ~$0.02 |
| text-embedding-3-large | $0.00013 | ~$0.13 |

Recomendación: Usar `text-embedding-3-small` con 1536 dimensiones.

---

## Integración con W2 (RAG Retriever)

Una vez generados los embeddings, W2 puede:

1. Recibir una cláusula de contrato
2. Generar embedding de la cláusula
3. Llamar `search_policy_examples()` para encontrar ejemplos similares
4. Usar los niveles de acceptance para guiar la negociación
