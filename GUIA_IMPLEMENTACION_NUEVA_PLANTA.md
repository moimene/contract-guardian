# Guía de Implementación - Sistema de Revisión de Contratos Nueva Planta

## Resumen Ejecutivo

Este documento describe cómo implementar y probar el sistema de revisión de contratos EPC (Engineering, Procurement, Construction) para el proyecto "Nueva Planta".

### Arquitectura del Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   LOVABLE UI    │────▶│    n8n Cloud    │────▶│    SUPABASE     │
│  (File Upload)  │     │   (Workflows)   │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   OpenAI API    │
                        │   (Agentes)     │
                        └─────────────────┘
```

### Flujo de Procesamiento

1. **W1_FileUpload**: Usuario sube contrato → Crea registro en DB
2. **W3_ContractReview**: Orquesta análisis del documento completo
3. **W2_ClauseReview**: Analiza cada cláusula individualmente (Router → Paranoid → Valuator → Sanitizer)

---

## Paso 1: Configurar Base de Datos (Supabase)

### 1.1 Ejecutar Migraciones

Ejecuta estos SQL en tu Supabase externo (`hvlsuwdqtfiilvampxq`):

```bash
# Orden de ejecución:
1. 001_create_schema.sql       (si no existe)
2. 006_tenancy_lovable.sql     (si no existe)
3. 015_clause_review_frontend.sql  (YA EJECUTADO)
4. 016_nueva_planta_playbook_rules.sql  (NUEVO - ejecutar ahora)
```

### 1.2 Verificar Playbook Rules

Después de ejecutar `016_nueva_planta_playbook_rules.sql`, verifica:

```sql
SELECT rule_id, clause_family, required
FROM public.playbook_rules
WHERE playbook_id = 'nueva_planta';
```

Deberías ver 6 reglas:
- `NuevaPlanta:2026-01:PrecioPagos`
- `NuevaPlanta:2026-01:AlcanceTrabajo`
- `NuevaPlanta:2026-01:Responsabilidades`
- `NuevaPlanta:2026-01:EntregablesHitos`
- `NuevaPlanta:2026-01:TerminacionRescision`
- `NuevaPlanta:2026-01:OtroDesconocido`

---

## Paso 2: Importar Workflows en n8n

### 2.1 Acceder a n8n Cloud

1. Ir a `https://mmenendeza.app.n8n.cloud`
2. Iniciar sesión

### 2.2 Importar Workflows

Para cada archivo JSON en `/n8n/`:

1. Click en "Add Workflow" → "Import from File"
2. Seleccionar el archivo JSON
3. Guardar el workflow

**Archivos a importar:**
- `W1_FileUpload_NuevaPlanta.json` → Webhook: `/webhook/file-upload`
- `W2_ClauseReview_NuevaPlanta.json` → Webhook: `/webhook/clause-review-nueva-planta`
- `W3_ContractReview_NuevaPlanta.json` → Webhook: `/webhook/contract-review-nueva-planta`

### 2.3 Configurar Credenciales

#### Supabase
```
Name: Supabase
Host: https://hvlsuwdqtfiilvampxq.supabase.co
Service Role Key: [tu service role key]
```

#### OpenAI
```
Name: OpenAI
API Key: [tu API key de OpenAI]
```

### 2.4 Activar Workflows

1. Abrir cada workflow
2. Toggle "Active" en la esquina superior derecha
3. Verificar que los webhooks están disponibles

---

## Paso 3: Probar el Sistema

### 3.1 Prueba Manual con cURL

#### Paso 1: Subir documento
```bash
curl -X POST https://mmenendeza.app.n8n.cloud/webhook/file-upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "contrato_epc_prueba.docx",
    "contract_type": "nueva_planta"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "document_id": "uuid-del-documento",
  "run_id": "uuid-del-run",
  "file_name": "contrato_epc_prueba.docx",
  "status": "ingested"
}
```

#### Paso 2: Iniciar revisión del contrato
```bash
curl -X POST https://mmenendeza.app.n8n.cloud/webhook/contract-review-nueva-planta \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "[document_id del paso anterior]"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "run_id": "uuid",
  "document_id": "uuid",
  "contract_decision": "NEEDS_REVIEW",
  "state_counts": {
    "OK": 0,
    "RECOMMENDED": 1,
    "REQUIRED": 3,
    "NEEDS_REVIEW": 0,
    "BLOCKED": 1
  },
  "escalations_pending": 4,
  "total_clauses": 5
}
```

#### Paso 3: Probar cláusula individual
```bash
curl -X POST https://mmenendeza.app.n8n.cloud/webhook/clause-review-nueva-planta \
  -H "Content-Type: application/json" \
  -d '{
    "clause_instance_id": "test_clause_1",
    "clause_id": "precio_1",
    "clause_text": "El precio del contrato es de 10 millones de euros. El pago se realizará en un único pago al finalizar completamente las obras.",
    "run_id": "test-run-123",
    "document_id": "test-doc-456"
  }'
```

### 3.2 Verificar Resultados en Supabase

```sql
-- Ver clause_reviews creadas
SELECT
  clause_instance_id,
  detected_family,
  client_state,
  client_comment,
  escalation_recommended
FROM public.clause_reviews
ORDER BY created_at DESC
LIMIT 10;

-- Ver escalations pendientes
SELECT
  id,
  clause_instance_id,
  status,
  reason,
  urgency
FROM public.escalation_requests
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## Paso 4: Integrar con Lovable (Frontend)

### 4.1 Componente de Upload

En tu aplicación Lovable, crea un componente que llame al webhook:

```typescript
// hooks/useContractUpload.ts
export const useContractUpload = () => {
  const uploadContract = async (fileName: string) => {
    const response = await fetch(
      'https://mmenendeza.app.n8n.cloud/webhook/file-upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          contract_type: 'nueva_planta'
        })
      }
    );
    return response.json();
  };

  const startReview = async (documentId: string) => {
    const response = await fetch(
      'https://mmenendeza.app.n8n.cloud/webhook/contract-review-nueva-planta',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId })
      }
    );
    return response.json();
  };

  return { uploadContract, startReview };
};
```

### 4.2 Suscripción Realtime

```typescript
// hooks/useClauseReviewsRealtime.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useClauseReviewsRealtime = (documentId: string) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Cargar reviews existentes
    const loadReviews = async () => {
      const { data } = await supabase
        .from('clause_reviews')
        .select('*')
        .eq('document_id', documentId)
        .order('sequence_number');
      setReviews(data || []);
    };
    loadReviews();

    // Suscribirse a cambios
    const channel = supabase
      .channel(`clause_reviews:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clause_reviews',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReviews(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setReviews(prev =>
              prev.map(r => r.clause_instance_id === payload.new.clause_instance_id ? payload.new : r)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  return reviews;
};
```

---

## Familias de Cláusulas Nueva Planta

| Familia | Descripción | Patrones Bloqueantes |
|---------|-------------|---------------------|
| **PrecioPagos** | Precio, pagos, retenciones, ajustes IPC | Revisión sin límite, pago único final, retención >15%, penalizaciones ilimitadas |
| **AlcanceTrabajo** | Scope, modificaciones, órdenes de cambio | Alcance indefinido, modificaciones unilaterales, scope creep sin compensación |
| **Responsabilidades** | Obligaciones, riesgos, limitación responsabilidad | Responsabilidad ilimitada, daños indirectos incluidos, asunción total riesgos |
| **EntregablesHitos** | Hitos, plazos, penalizaciones, garantía | Penalizaciones sin límite, garantía >36 meses, recepción subjetiva |
| **TerminacionRescision** | Terminación, rescisión, consecuencias | Sin compensación, terminación inmediata, pérdida de derechos |

---

## Estados de Cliente (RAG)

| Estado | Color | Significado | Acción |
|--------|-------|-------------|--------|
| `OK` | 🟢 Verde | Conforme a estándar | Ninguna |
| `RECOMMENDED` | 🟡 Ámbar claro | Desviación menor | Revisar opcionalmente |
| `REQUIRED` | 🟠 Ámbar | Requiere atención | Negociar cambio |
| `NEEDS_REVIEW` | 🔵 Azul | Pendiente análisis | En proceso |
| `BLOCKED` | 🔴 Rojo | Inaceptable | Rechazar o escalar |

---

## Troubleshooting

### Error: "clause_text is required"
- Verifica que el JSON del webhook incluye el campo `clause_text`

### Error: "rule_id not found"
- Ejecuta `016_nueva_planta_playbook_rules.sql` en Supabase

### Cláusulas no se guardan
- Verifica credenciales de Supabase en n8n
- Comprueba que la tabla `clause_reviews` existe
- Revisa logs de ejecución en n8n

### OpenAI timeout
- Aumenta el timeout en los nodos HTTP Request
- Considera usar `gpt-4o-mini` para Router y Sanitizer

---

## Próximos Pasos

1. **Extracción real de cláusulas**: Integrar servicio de parsing de DOCX/PDF
2. **Autenticación**: Conectar auth de Lovable con Supabase
3. **UI de revisión**: Completar componentes de RedlineViewer
4. **Exportación**: Generar documento Word con track changes

---

## Archivos Creados

```
/AMAZON REDLINER/
├── n8n/
│   ├── W1_FileUpload_NuevaPlanta.json      # Upload sin Drive
│   ├── W2_ClauseReview_NuevaPlanta.json    # Pipeline por cláusula
│   └── W3_ContractReview_NuevaPlanta.json  # Orquestador
├── db/
│   └── 016_nueva_planta_playbook_rules.sql # Reglas de playbook
└── playbook/rules/nueva_planta/
    ├── precio_pagos.yaml
    ├── alcance_trabajo.yaml
    ├── responsabilidades.yaml
    ├── entregables_hitos.yaml
    └── terminacion_rescision.yaml
```
