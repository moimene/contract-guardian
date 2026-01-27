# Guía Detallada: Configurar W2 RAG Enhanced en n8n

## Paso 1: Acceder a n8n

1. Abre tu navegador
2. Ve a: `https://mmenendeza.app.n8n.cloud`
3. Inicia sesión si es necesario

---

## Paso 2: Crear Credencial "Header Auth" para Supabase

### 2.1 Abrir Configuración de Credenciales

1. En el menú lateral izquierdo, haz clic en **"Credentials"** (icono de llave)
2. Clic en el botón **"+ Add Credential"** (arriba a la derecha)

### 2.2 Buscar Tipo de Credencial

1. En el buscador, escribe: `Header Auth`
2. Selecciona **"Header Auth"** de la lista

### 2.3 Configurar la Credencial

Rellena los campos:

| Campo | Valor |
|-------|-------|
| **Credential Name** | `Supabase Service Key` |
| **Name** | `apikey` |
| **Value** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMjkwMiwiZXhwIjoyMDgzODg4OTAyfQ.fiPHwoYlT3aW6MRrRTMvF7H6zKSiiUdS3pyOd8tT0ok` |

### 2.4 Guardar

1. Clic en **"Save"**
2. Verás un mensaje verde confirmando que se guardó

---

## Paso 3: Abrir el Workflow W2 RAG

1. En el menú lateral, clic en **"Workflows"**
2. Busca **"W2_ClauseReview - RAG Enhanced"**
3. Clic para abrirlo

---

## Paso 4: Asignar Credencial al Nodo RAG

### 4.1 Localizar el Nodo

1. En el canvas del workflow, busca el nodo llamado **"RAG: Search Similar Examples"**
   - Es de color naranja (HTTP Request)
   - Está después de "Parse Embedding"

### 4.2 Configurar Credencial

1. **Doble clic** en el nodo "RAG: Search Similar Examples"
2. Se abre el panel de configuración a la derecha
3. Busca la sección **"Credential for Header Auth"**
4. Clic en el dropdown
5. Selecciona **"Supabase Service Key"** (la que creaste en Paso 2)

### 4.3 Verificar Configuración

Asegúrate de que el nodo tenga:

- **Method**: POST
- **URL**: `https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/search_policy_examples`
- **Authentication**: Header Auth
- **Credential**: Supabase Service Key

### 4.4 Guardar Cambios

1. Clic en **"Save"** (Ctrl+S o botón guardar)

---

## Paso 5: Activar el Workflow

1. En la esquina superior derecha del workflow, verás un **toggle** (interruptor)
2. Actualmente debería estar en **"Inactive"** (gris)
3. Clic en el toggle para cambiarlo a **"Active"** (verde)
4. Aparecerá un mensaje confirmando que el workflow está activo

---

## Paso 6: Obtener URL del Webhook

1. Clic en el nodo **"Webhook"** (el primero del workflow)
2. En el panel derecho, verás **"Webhook URLs"**
3. Copia la URL de **"Production"**:
   ```
   https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag
   ```

---

## Paso 7: Probar el Endpoint

### Opción A: Desde Terminal

```bash
curl -X POST "https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag" \
  -H "Content-Type: application/json" \
  -d '{
    "clause_instance_id": "test_rag_001",
    "clause_id": "ownership_test",
    "clause_text": "Amazon shall own exclusively, in perpetuity, throughout the universe, all right, title and interest in and to the Program and all Materials.",
    "run_id": "test-run",
    "document_id": "test-doc"
  }'
```

### Opción B: Desde n8n

1. Clic en el nodo **"Webhook"**
2. En el panel, clic en **"Listen for Test Event"**
3. Abre otra pestaña y ejecuta el curl de arriba
4. Verás el evento aparecer en n8n

---

## Paso 8: Ver Ejecuciones

1. En el menú lateral, clic en **"Executions"**
2. Verás la lista de ejecuciones recientes
3. Clic en una para ver el detalle de cada nodo
4. Si hay error, el nodo fallido aparecerá en rojo

---

## Troubleshooting

### Error "Invalid API key" en RAG Search

- Verifica que la credencial "Supabase Service Key" tenga el valor correcto
- El campo "Name" debe ser exactamente `apikey` (minúsculas)

### Error en nodo OpenAI

- Verifica que la credencial "amazon redliner" de OpenAI esté configurada

### Workflow no responde

- Verifica que el toggle esté en verde (Active)
- Revisa Executions para ver si hay ejecuciones pendientes

---

## Resumen Visual del Workflow

```
[Webhook] → [Parse Input] → [Router Agent] → [Parse Router]
    ↓
[Generate Clause Embedding] → [Parse Embedding]
    ↓
[RAG: Search Similar Examples] ← ESTE NODO NECESITA CREDENCIAL
    ↓
[Parse RAG Results] → [Context Retriever] → [Enrich Policy]
    ↓
[Paranoid Agent] → [Parse Paranoid] → [Valuator Agent] → [Parse Valuator]
    ↓
[Decisor] → [Sanitizer Agent] → [Build Result] → [Save to clause_reviews]
    ↓
[Respond]
```

---

Una vez que completes estos pasos, avísame y ejecutaré una prueba para verificar que todo funciona.
