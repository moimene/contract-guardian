# Prompt para Lovable: Migración a Supabase Externo Unificado

**Fecha**: 2026-01-20
**Objetivo**: Migrar el backend de Contract Expert a Supabase externo para soportar arquitectura 3 capas

---

## PROMPT PARA LOVABLE

```
Necesito migrar el backend de Contract Expert desde Lovable Cloud a un Supabase externo existente. El objetivo es tener control total del schema para implementar una arquitectura de 3 capas (Engine/Blueprint/Contract Model).

## CONTEXTO

Actualmente tenemos:
- Frontend en Lovable Cloud (React + TypeScript)
- BD en Lovable Cloud (jirgkdvajlhsnydxybpi) - LIMITADA
- Supabase externo (hvlsuwdqtffiilvampxq) - Solo tiene n8n-proxy Edge Function

Necesitamos:
- TODO el backend en Supabase externo
- Control total para migrations, extensiones (pgvector), Edge Functions custom

## CREDENCIALES SUPABASE EXTERNO

URL: https://hvlsuwdqtffiilvampxq.supabase.co
Project ID: hvlsuwdqtffiilvampxq
Anon Key: [Se proporcionará]
Service Role Key: [Se proporcionará - solo para Edge Functions]

## TAREAS A EJECUTAR

### 1. ACTUALIZAR CLIENTE SUPABASE

Modificar `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase Externo (backend unificado)
const SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "[ANON_KEY_AQUÍ]";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

### 2. ELIMINAR DUAL-CLIENT EN n8nService.ts

Modificar `src/services/n8nService.ts` para usar el cliente principal:

```typescript
import { supabase } from '@/integrations/supabase/client';

// ELIMINAR estas líneas:
// const EXTERNAL_SUPABASE_URL = '...';
// const EXTERNAL_SUPABASE_KEY = '...';
// export const externalSupabase = createClient(...);

// URL del proyecto Supabase (ya no es "externo", es el principal)
const SUPABASE_FUNCTIONS_URL = 'https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1';

export async function uploadContractToN8n(payload: FileUploadPayload): Promise<FileUploadResponse> {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/n8n-proxy?workflow=file-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`n8n proxy error: ${response.status}`);
  }

  return response.json();
}

export async function startContractReview(payload: ContractReviewPayload): Promise<ContractReviewResponse> {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/n8n-proxy?workflow=contract-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`n8n proxy error: ${response.status}`);
  }

  return response.json();
}

// NUEVO: Obtener configuración del resolver 3-layer
export async function getReviewConfig(contractTypeId: string): Promise<ReviewConfig | null> {
  const { data, error } = await supabase
    .from('contract_type_review_defaults')
    .select('blueprint_version_id, contract_model_version_id, knowledge_graph_id')
    .eq('contract_type_id', contractTypeId)
    .single();

  if (error || !data) {
    console.warn('No 3-layer config found for', contractTypeId, '- using legacy playbook');
    return null;
  }

  return data;
}

// Interfaces actualizadas
export interface ReviewConfig {
  blueprint_version_id: string;
  contract_model_version_id: string | null;
  knowledge_graph_id: string | null;
}

export interface FileUploadPayload {
  file_name: string;
  file_path: string;
  mime_type: string;
  playbook_id?: string;  // Legacy
  blueprint_version_id?: string;  // 3-layer
  tenant_id: string;
}

export interface ContractReviewPayload {
  document_id: string;
  playbook_id?: string;  // Legacy
  blueprint_version_id?: string;  // 3-layer
  contract_model_version_id?: string;  // 3-layer
  tenant_id: string;
}
```

### 3. ACTUALIZAR NewAnalysis.tsx

Modificar para usar el nuevo resolver:

```typescript
import { getReviewConfig, uploadContractToN8n, startContractReview } from '@/services/n8nService';

// En la función handleSubmit, después de seleccionar contract_type:
const handleSubmit = async () => {
  // ... código existente de upload a storage ...

  // Obtener configuración 3-layer (si existe)
  const reviewConfig = await getReviewConfig(selectedContractType);

  // Preparar payload para W1
  const uploadPayload: FileUploadPayload = {
    file_name: file.name,
    file_path: storagePath,
    mime_type: file.type,
    tenant_id: user.organization_id,
    // Usar 3-layer si disponible, sino legacy
    ...(reviewConfig
      ? { blueprint_version_id: reviewConfig.blueprint_version_id }
      : { playbook_id: getPlaybookId(selectedContractType) }
    ),
  };

  const uploadResult = await uploadContractToN8n(uploadPayload);

  // Preparar payload para W3
  const reviewPayload: ContractReviewPayload = {
    document_id: uploadResult.document_id,
    tenant_id: user.organization_id,
    ...(reviewConfig
      ? {
          blueprint_version_id: reviewConfig.blueprint_version_id,
          contract_model_version_id: reviewConfig.contract_model_version_id,
        }
      : { playbook_id: getPlaybookId(selectedContractType) }
    ),
  };

  await startContractReview(reviewPayload);

  // ... resto del código ...
};
```

### 4. ACTUALIZAR TIPOS EN database.ts

Añadir los nuevos tipos para las tablas 3-layer. Regenerar con:

```bash
# En el servidor de Supabase externo ya están las tablas
# Lovable debería poder regenerar los tipos desde la conexión
```

Añadir manualmente si es necesario:

```typescript
// Añadir a src/integrations/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      // ... tablas existentes ...

      // 3-LAYER: Taxonomía
      matters: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matters']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['matters']['Insert']>;
      };

      clause_types: {
        Row: {
          id: string;
          matter_id: string;
          code: string;
          name: string;
          description: string | null;
          detection_hints: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clause_types']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clause_types']['Insert']>;
      };

      // 3-LAYER: Blueprint
      review_blueprints: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          description: string | null;
          status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['review_blueprints']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['review_blueprints']['Insert']>;
      };

      policy_examples: {
        Row: {
          id: string;
          matter_policy_id: string;
          clause_type_id: string | null;
          acceptance: 'ACCEPTABLE' | 'PASSABLE' | 'UNACCEPTABLE';
          example_text: string;
          normalized_terms: string[];
          source_ref: Record<string, any>;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['policy_examples']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['policy_examples']['Insert']>;
      };

      fallback_clauses: {
        Row: {
          id: string;
          matter_policy_id: string;
          clause_type_id: string | null;
          fallback_type: 'GIVE' | 'ALTERNATE_GIVE';
          clause_text: string;
          requires_approval: boolean;
          approval_gate: 'LEGAL' | 'TAX_FINANCE' | 'BUSINESS_AFFAIRS' | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fallback_clauses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['fallback_clauses']['Insert']>;
      };

      // 3-LAYER: Resolver
      contract_type_review_defaults: {
        Row: {
          id: string;
          contract_type_id: string;
          blueprint_version_id: string;
          contract_model_version_id: string | null;
          knowledge_graph_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contract_type_review_defaults']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contract_type_review_defaults']['Insert']>;
      };
    };
  };
}
```

### 5. VERIFICAR HOOKS EXISTENTES

Los hooks existentes (`useDocuments`, `useClauseReviews`, `useEscalations`) deberían funcionar sin cambios porque ya usan el cliente `supabase` importado. Solo necesitamos asegurar que las tablas existan en el Supabase externo.

### 6. ACTUALIZAR useAuth.tsx

Verificar que el DEV_USER tenga un organization_id válido que exista en Supabase externo:

```typescript
const DEV_USER: AuthUser = {
  id: 'dev-user-00000000-0000-0000-0000-000000000000',
  email: 'dev@test.local',
  full_name: 'Usuario Desarrollo',
  role: 'client',
  organization_id: '00000000-0000-0000-0000-000000000001', // Debe existir en Supabase externo
  organization_name: 'Amazon Studios Dev',
};
```

### 7. STORAGE BUCKET

El bucket `contracts` debe existir en Supabase externo con políticas apropiadas:

```sql
-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura para usuarios autenticados de la misma org
CREATE POLICY "Users can read own org contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'organization_id'
);

-- Política de upload
CREATE POLICY "Users can upload to own org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'organization_id'
);
```

## ORDEN DE EJECUCIÓN

1. ✅ Primero: Ejecutar migraciones SQL en Supabase externo (ya hecho)
2. ⏳ Segundo: Actualizar `client.ts` con nuevas credenciales
3. ⏳ Tercero: Actualizar `n8nService.ts` eliminando dual-client
4. ⏳ Cuarto: Actualizar `NewAnalysis.tsx` para usar resolver
5. ⏳ Quinto: Añadir tipos a `types.ts`
6. ⏳ Sexto: Verificar bucket de storage
7. ⏳ Séptimo: Test de flujo completo

## VERIFICACIÓN

Después de los cambios, verificar:

1. Dashboard carga documentos correctamente
2. NewAnalysis puede subir archivos
3. ContractReview muestra clause_reviews
4. Escalations funciona
5. Realtime subscriptions funcionan

## NOTAS IMPORTANTES

- NO eliminar tablas de Lovable Cloud por ahora (backup)
- El cambio es principalmente de conexión, no de lógica
- Los hooks existentes deberían funcionar sin cambios
- Si algo falla, revertir client.ts a Lovable Cloud
```

---

## CHECKLIST PRE-EJECUCIÓN

Antes de dar este prompt a Lovable, asegúrate de:

- [ ] Tener el Anon Key de Supabase externo
- [ ] Tener el Service Role Key (para Edge Functions)
- [ ] Haber ejecutado las migraciones en Supabase externo
- [ ] Haber ejecutado los seeds (incluyendo Harvey dataset)
- [ ] Haber creado el bucket `contracts` en Supabase externo
- [ ] Haber migrado los datos existentes (documents, profiles, etc.)

---

## CREDENCIALES A COMPLETAR

```
SUPABASE_URL: https://hvlsuwdqtffiilvampxq.supabase.co
SUPABASE_ANON_KEY: [COMPLETAR]
SUPABASE_SERVICE_ROLE_KEY: [COMPLETAR]
```

---

## PROMPT CONDENSADO (COPIAR/PEGAR)

Si Lovable tiene límite de caracteres, usar este prompt condensado:

```
Migrar backend a Supabase externo hvlsuwdqtffiilvampxq.

1. Actualizar src/integrations/supabase/client.ts:
   - SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co"
   - SUPABASE_PUBLISHABLE_KEY = "[ANON_KEY]"

2. Actualizar src/services/n8nService.ts:
   - Eliminar externalSupabase
   - Usar cliente principal importado
   - Añadir getReviewConfig() para resolver 3-layer

3. Actualizar src/pages/NewAnalysis.tsx:
   - Usar getReviewConfig() antes de upload
   - Pasar blueprint_version_id si existe

4. Verificar que bucket 'contracts' existe en storage

El schema 3-layer ya está creado en el Supabase externo con:
- matters, clause_types
- review_blueprints, blueprint_versions
- policy_examples (1,352 registros)
- fallback_clauses (50 registros)
- contract_type_review_defaults (resolver)
```

---

*Documento generado: 2026-01-20*
