# Arquitectura Unificada: Migración a Supabase Externo

**Fecha**: 2026-01-20
**Proyecto**: Contract Guardian / Amazon Redliner
**Estado**: PROPUESTA - Decisión de arquitectura

---

## 1. Problema Actual

### Arquitectura Fragmentada (Estado Actual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL (FRAGMENTADA)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │  LOVABLE CLOUD  │     │ SUPABASE EXTERNO│     │  n8n CLOUD   │  │
│  │  (jirgkdvajlh)  │     │ (hvlsuwdqtffi)  │     │              │  │
│  ├─────────────────┤     ├─────────────────┤     ├──────────────┤  │
│  │                 │     │                 │     │              │  │
│  │ • documents     │     │ • n8n-proxy     │     │ • W1 file    │  │
│  │ • contract_runs │     │   (Edge Func)   │     │ • W3 review  │  │
│  │ • clause_reviews│     │                 │     │              │  │
│  │ • escalations   │     │ ❌ Sin BD propia│     │              │  │
│  │ • profiles      │     │                 │     │              │  │
│  │ • organizations │     │                 │     │              │  │
│  │                 │     │                 │     │              │  │
│  │ Storage:        │     │                 │     │              │  │
│  │ • contracts     │     │                 │     │              │  │
│  │   bucket        │     │                 │     │              │  │
│  │                 │     │                 │     │              │  │
│  └─────────────────┘     └─────────────────┘     └──────────────┘  │
│                                                                     │
│  PROBLEMAS:                                                         │
│  ❌ Lovable Cloud no permite migraciones personalizadas             │
│  ❌ No podemos añadir tablas 3-layer (matters, blueprints, etc.)    │
│  ❌ No podemos añadir extensiones (pgvector para RAG)               │
│  ❌ Sin control sobre Edge Functions                                │
│  ❌ El dataset RAG (1,352 examples) no tiene dónde vivir            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Limitaciones de Lovable Cloud

| Característica | Lovable Cloud | Supabase Externo |
|----------------|---------------|------------------|
| Migraciones SQL custom | ❌ No | ✅ Sí |
| Extensiones (pgvector) | ❌ No | ✅ Sí |
| Edge Functions custom | ⚠️ Limitado | ✅ Full control |
| Triggers/Functions | ❌ No | ✅ Sí |
| Acceso CLI (supabase db push) | ❌ No | ✅ Sí |
| RLS custom | ⚠️ Limitado | ✅ Full control |

---

## 2. Solución Propuesta: Unificar en Supabase Externo

### Arquitectura Unificada

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ARQUITECTURA PROPUESTA (UNIFICADA)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                          ┌──────────────┐      │
│  │  LOVABLE CLOUD  │                          │  n8n CLOUD   │      │
│  │   (Frontend)    │                          │              │      │
│  ├─────────────────┤                          ├──────────────┤      │
│  │                 │                          │              │      │
│  │ React App       │                          │ • W1 file    │      │
│  │ (solo UI)       │                          │ • W3 review  │      │
│  │                 │                          │              │      │
│  │ ❌ Sin BD local │                          │              │      │
│  │                 │                          │              │      │
│  └────────┬────────┘                          └──────┬───────┘      │
│           │                                          │              │
│           │  Supabase Client                         │ Webhooks     │
│           │  (VITE_SUPABASE_URL → externo)           │              │
│           │                                          │              │
│           ▼                                          ▼              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  SUPABASE EXTERNO (hvlsuwdqtffi)            │    │
│  │                    === BACKEND UNIFICADO ===                │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  DATABASE (PostgreSQL + pgvector)                           │    │
│  │  ─────────────────────────────────                          │    │
│  │                                                             │    │
│  │  CORE (existente):              3-LAYER (nuevo):            │    │
│  │  • organizations                • matters                   │    │
│  │  • profiles                     • clause_types              │    │
│  │  • user_roles                   • review_blueprints         │    │
│  │  • documents                    • blueprint_versions        │    │
│  │  • contract_runs                • matter_policies           │    │
│  │  • clause_reviews               • policy_examples (1,352)   │    │
│  │  • escalation_requests          • fallback_clauses (50)     │    │
│  │  • escalation_comments          • contract_models           │    │
│  │  • contract_types               • contract_model_clauses    │    │
│  │                                 • contract_type_defaults    │    │
│  │                                 • review_findings           │    │
│  │                                 • clause_instances          │    │
│  │                                 • knowledge_graphs          │    │
│  │                                                             │    │
│  │  STORAGE                        EDGE FUNCTIONS              │    │
│  │  ─────────                      ───────────────             │    │
│  │  • contracts (bucket)           • n8n-proxy ✅              │    │
│  │  • exports (bucket)             • export_doc (nuevo)        │    │
│  │                                 • rag_retriever (nuevo)     │    │
│  │                                                             │    │
│  │  REALTIME                       EXTENSIONS                  │    │
│  │  ─────────                      ──────────                  │    │
│  │  • clause_reviews               • pgvector                  │    │
│  │  • review_findings              • pg_trgm                   │    │
│  │  • contract_runs                • uuid-ossp                 │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Plan de Migración

### Fase 0: Preparación (1 día)

1. **Backup de Lovable Cloud**
   ```bash
   # Exportar datos actuales
   pg_dump $LOVABLE_DB_URL > backup_lovable_$(date +%Y%m%d).sql
   ```

2. **Inventario de datos actuales**
   ```sql
   -- En Lovable Cloud
   SELECT 'documents' as table, COUNT(*) FROM documents
   UNION ALL SELECT 'contract_runs', COUNT(*) FROM contract_runs
   UNION ALL SELECT 'clause_reviews', COUNT(*) FROM clause_reviews
   UNION ALL SELECT 'escalation_requests', COUNT(*) FROM escalation_requests
   UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
   UNION ALL SELECT 'profiles', COUNT(*) FROM profiles;
   ```

### Fase 1: Crear Esquema en Supabase Externo (1 día)

1. **Ejecutar migraciones base**
   ```bash
   cd contract-guardian-lovable

   # Configurar conexión a Supabase externo
   export SUPABASE_DB_URL="postgresql://..."  # hvlsuwdqtffi

   # Ejecutar todas las migraciones
   supabase db push
   ```

2. **Verificar extensiones**
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm');
   ```

3. **Ejecutar seeds 3-layer**
   ```bash
   psql $SUPABASE_DB_URL -f supabase/seed/20260119121000_seed_3layer_amazon_v1.sql
   psql $SUPABASE_DB_URL -f supabase/seed/20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql
   # ... etc
   ```

### Fase 2: Migrar Datos Core (2 días)

1. **Migrar organizations**
   ```sql
   -- Exportar de Lovable
   \copy organizations TO 'organizations.csv' CSV HEADER;

   -- Importar a externo
   \copy organizations FROM 'organizations.csv' CSV HEADER;
   ```

2. **Migrar en orden de dependencias**
   ```
   1. organizations
   2. profiles
   3. user_roles
   4. org_memberships
   5. contract_types
   6. documents
   7. contract_runs
   8. clause_reviews
   9. escalation_requests
   10. escalation_comments
   11. sanitizer_outputs
   ```

3. **Migrar Storage bucket**
   ```bash
   # Descargar archivos de Lovable
   supabase storage download contracts/ --project-ref jirgkdvajlh

   # Subir a externo
   supabase storage upload contracts/ --project-ref hvlsuwdqtffi
   ```

### Fase 3: Actualizar Frontend (1 día)

1. **Cambiar variables de entorno**
   ```env
   # ANTES (Lovable Cloud)
   VITE_SUPABASE_URL=https://jirgkdvajlhsnydxybpi.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[lovable-anon-key]

   # DESPUÉS (Supabase Externo)
   VITE_SUPABASE_URL=https://hvlsuwdqtffiilvampxq.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[externo-anon-key]
   ```

2. **Eliminar dual-client**
   ```typescript
   // ANTES: Dos clientes
   // src/integrations/supabase/client.ts - Lovable
   // src/services/n8nService.ts - externalSupabase

   // DESPUÉS: Un solo cliente
   // src/integrations/supabase/client.ts - Apunta a externo
   ```

3. **Actualizar n8nService.ts**
   ```typescript
   // Ya no necesitamos externalSupabase separado
   import { supabase } from '@/integrations/supabase/client';

   // El cliente principal ahora es el externo
   ```

### Fase 4: Actualizar n8n Workflows (1 día)

1. **W1 (file-upload)**: Actualizar connection string a Supabase externo
2. **W3 (contract-review)**: Actualizar connection string + añadir RAG retriever

### Fase 5: Deploy Edge Functions (1 día)

1. **n8n-proxy**: Ya existe, verificar
2. **rag_retriever**: Nueva función para consultar policy_examples
3. **export_doc**: Implementar exportación DOCX

### Fase 6: Testing E2E (2 días)

1. Flujo completo: Upload → Review → Export
2. Verificar Realtime funciona
3. Verificar RLS policies
4. Test de performance con dataset completo

---

## 4. Cambios en Código

### 4.1 Eliminar Dual-Client

```typescript
// ANTES: src/services/n8nService.ts
import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://hvlsuwdqtffiilvampxq.supabase.co';
const EXTERNAL_SUPABASE_KEY = '...';

export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_KEY
);

// DESPUÉS: src/services/n8nService.ts
import { supabase } from '@/integrations/supabase/client';

// Usar el cliente principal (que ahora apunta a externo)
export async function uploadContractToN8n(payload: FileUploadPayload) {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { workflow: 'file-upload', ...payload }
  });
  // ...
}
```

### 4.2 Actualizar client.ts

```typescript
// src/integrations/supabase/client.ts

// ANTES (auto-generado por Lovable)
const SUPABASE_URL = "https://jirgkdvajlhsnydxybpi.supabase.co";
const SUPABASE_KEY = "[lovable-key]";

// DESPUÉS (manual, apuntando a externo)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || "https://hvlsuwdqtffiilvampxq.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || "[externo-anon-key]";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### 4.3 Regenerar Tipos

```bash
# Desde Supabase externo
supabase gen types typescript --project-id hvlsuwdqtffiilvampxq > src/types/database.ts
```

---

## 5. Nueva Edge Function: rag_retriever

```typescript
// supabase/functions/rag_retriever/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RetrieveRequest {
  clause_text: string;
  matter_code?: string;
  clause_type_code?: string;
  blueprint_version_id: string;
  top_k?: number;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { clause_text, matter_code, clause_type_code, blueprint_version_id, top_k = 5 }
    = await req.json() as RetrieveRequest;

  // 1. Buscar policy_examples similares
  let query = supabase
    .from('policy_examples')
    .select(`
      id,
      acceptance,
      example_text,
      normalized_terms,
      source_ref,
      matter_policies!inner(
        blueprint_version_id,
        matters!inner(code, name)
      ),
      clause_types(code, name)
    `)
    .eq('matter_policies.blueprint_version_id', blueprint_version_id);

  // Filtrar por matter si se especifica
  if (matter_code) {
    query = query.eq('matter_policies.matters.code', matter_code);
  }

  // Filtrar por clause_type si se especifica
  if (clause_type_code) {
    query = query.eq('clause_types.code', clause_type_code);
  }

  // TODO: Implementar búsqueda semántica con pgvector
  // Por ahora usamos búsqueda por texto
  query = query.textSearch('example_text', clause_text.split(' ').slice(0, 10).join(' | '));

  const { data: examples, error } = await query.limit(top_k);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Buscar fallback_clauses si hay coincidencias UNACCEPTABLE
  const unacceptableMatters = examples
    ?.filter(e => e.acceptance === 'UNACCEPTABLE')
    .map(e => e.matter_policies?.matters?.code)
    .filter(Boolean);

  let fallbacks = [];
  if (unacceptableMatters?.length) {
    const { data: fallbackData } = await supabase
      .from('fallback_clauses')
      .select(`
        id,
        fallback_type,
        clause_text,
        requires_approval,
        approval_gate,
        matter_policies!inner(
          matters!inner(code)
        )
      `)
      .in('matter_policies.matters.code', unacceptableMatters)
      .eq('matter_policies.blueprint_version_id', blueprint_version_id);

    fallbacks = fallbackData || [];
  }

  return new Response(JSON.stringify({
    examples: examples || [],
    fallbacks,
    query_info: {
      blueprint_version_id,
      matter_code,
      clause_type_code,
      top_k
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 6. Consideraciones de Seguridad

### RLS Policies para 3-Layer

```sql
-- policy_examples: Solo lectura para usuarios autenticados del mismo org
CREATE POLICY "policy_examples_read" ON policy_examples
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matter_policies mp
      JOIN blueprint_versions bv ON bv.id = mp.blueprint_version_id
      JOIN review_blueprints rb ON rb.id = bv.blueprint_id
      WHERE mp.id = policy_examples.matter_policy_id
      AND (
        rb.organization_id IS NULL  -- Blueprints públicos
        OR rb.organization_id = auth.jwt() ->> 'organization_id'
      )
    )
  );

-- review_findings: Solo el owner del documento o admin
CREATE POLICY "review_findings_read" ON review_findings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clause_instances ci
      JOIN contract_runs cr ON cr.id = ci.run_id
      JOIN documents d ON d.document_id = cr.document_id
      WHERE ci.id = review_findings.clause_instance_id
      AND d.organization_id = auth.jwt() ->> 'organization_id'
    )
  );
```

### Variables de Entorno

```env
# Supabase Externo (único backend)
VITE_SUPABASE_URL=https://hvlsuwdqtffiilvampxq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]

# Para desarrollo local
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # Solo en .env.local, nunca en frontend
```

---

## 7. Timeline Completo

| Día | Fase | Tareas |
|-----|------|--------|
| 1 | Preparación | Backup, inventario, documentación |
| 2 | Schema | Migraciones 3-layer en externo |
| 3-4 | Datos | Migrar core + storage |
| 5 | Frontend | Cambiar cliente, eliminar dual |
| 6 | n8n | Actualizar workflows |
| 7 | Edge Functions | Deploy rag_retriever, export_doc |
| 8-9 | Testing | E2E, performance, RLS |
| 10 | Producción | Cutover final |

---

## 8. Rollback Plan

Si algo falla:

1. **Restaurar variables de entorno** a Lovable Cloud
2. **Los datos en Lovable Cloud** no se modificaron (solo copiamos)
3. **n8n workflows** pueden revertir connection strings

```bash
# Rollback frontend
VITE_SUPABASE_URL=https://jirgkdvajlhsnydxybpi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[lovable-key]
```

---

## 9. Beneficios Post-Migración

| Antes | Después |
|-------|---------|
| ❌ No se podía añadir tablas | ✅ Control total del schema |
| ❌ Sin pgvector para RAG | ✅ Embeddings semánticos |
| ❌ Dataset RAG sin hogar | ✅ 1,352 policy_examples listos |
| ❌ Dual-client confuso | ✅ Un solo cliente Supabase |
| ❌ Edge Functions limitadas | ✅ rag_retriever, export_doc |
| ❌ Sin CLI para migrations | ✅ supabase db push |

---

## 10. Decisión Requerida

### Opción A: Migración Completa (Recomendada)
- Mover TODO a Supabase externo
- Un solo backend
- Control total

### Opción B: Híbrido
- Mantener core en Lovable
- Solo 3-layer en externo
- Más complejidad, menos beneficios

### Opción C: Mantener Statu Quo
- No migrar
- No se puede implementar 3-layer correctamente
- ❌ No recomendado

---

**Recomendación**: **Opción A** - Migrar todo a Supabase externo para tener control completo y poder implementar la arquitectura 3 capas correctamente.

---

*Documento generado: 2026-01-20*
