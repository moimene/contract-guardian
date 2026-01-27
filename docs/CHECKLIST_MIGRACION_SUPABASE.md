# Checklist de Migración a Supabase Externo

**Fecha**: 2026-01-20
**Objetivo**: Migrar Contract Expert a Supabase externo unificado

---

## Pre-requisitos

- [ ] Acceso a Supabase externo (hvlsuwdqtffiilvampxq)
- [ ] Credenciales: Anon Key, Service Role Key
- [ ] Acceso a Lovable para editar código

---

## FASE 1: Preparar Supabase Externo (Base de Datos)

### 1.1 Ejecutar SQL de Tablas Core
```bash
# Conectar a Supabase externo
psql "postgresql://postgres:[PASSWORD]@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres"

# Ejecutar script
\i SQL_PREPARAR_SUPABASE_EXTERNO.sql
```

- [ ] Extensiones creadas (uuid-ossp, pgcrypto, pg_trgm)
- [ ] Enums creados
- [ ] Tablas core creadas (organizations, profiles, documents, etc.)
- [ ] Índices creados
- [ ] Seed de organización de desarrollo
- [ ] Seed de contract_types (12 tipos)
- [ ] RLS policies básicas
- [ ] Realtime habilitado

### 1.2 Ejecutar Migraciones 3-Layer
```bash
# En orden
psql $DB_URL -f 20260119120000_3layer_extensions.sql
psql $DB_URL -f 20260119120100_3layer_matters_clause_types.sql
psql $DB_URL -f 20260119120200_3layer_blueprints.sql
psql $DB_URL -f 20260119120300_3layer_contract_models.sql
psql $DB_URL -f 20260119120350_3layer_contract_type_defaults.sql
psql $DB_URL -f 20260119120400_3layer_run_layer.sql
psql $DB_URL -f 20260119120500_3layer_graphrag.sql
psql $DB_URL -f 20260119120550_3layer_defaults_add_knowledge_graph.sql
psql $DB_URL -f 20260119120600_3layer_compat_clause_reviews.sql
psql $DB_URL -f 20260120060000_3layer_taxonomy_extension_harvey.sql
```

- [ ] 10 migraciones ejecutadas sin errores

### 1.3 Ejecutar Seeds 3-Layer
```bash
psql $DB_URL -f 20260119121000_seed_3layer_amazon_v1.sql
psql $DB_URL -f 20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql
psql $DB_URL -f 20260119124000_seed_amazon_psa_policy_examples_v1.sql
psql $DB_URL -f 20260119125000_seed_amazon_psa_fallback_clauses_v1.sql
psql $DB_URL -f 20260120061000_seed_harvey_policy_examples_expanded.sql
```

- [ ] Seeds ejecutados
- [ ] Verificar: `SELECT COUNT(*) FROM policy_examples;` → ~1,352

### 1.4 Verificación Base de Datos
```sql
-- Ejecutar estas queries para verificar
SELECT COUNT(*) FROM matters;           -- 18
SELECT COUNT(*) FROM clause_types;      -- ~67
SELECT COUNT(*) FROM policy_examples;   -- ~1,352
SELECT COUNT(*) FROM fallback_clauses;  -- ~50
SELECT COUNT(*) FROM contract_types;    -- 12
SELECT * FROM organizations;            -- 1 (dev)
```

- [ ] Todas las verificaciones pasan

---

## FASE 2: Preparar Storage

### 2.1 Crear Bucket
- [ ] Ir a Supabase Dashboard → Storage
- [ ] Verificar que existe bucket `contracts`
- [ ] Si no existe, crearlo manualmente o con SQL

### 2.2 Políticas de Storage
- [ ] Políticas de lectura configuradas
- [ ] Políticas de upload configuradas

---

## FASE 3: Migrar Datos Existentes (Si Hay)

### 3.1 Exportar de Lovable Cloud
```bash
# Si hay documentos existentes que migrar
pg_dump --data-only --table=documents $LOVABLE_DB_URL > documents_backup.sql
pg_dump --data-only --table=contract_runs $LOVABLE_DB_URL > runs_backup.sql
# etc.
```

- [ ] Backup de datos existentes (si aplica)

### 3.2 Importar a Supabase Externo
```bash
psql $EXTERNAL_DB_URL < documents_backup.sql
# etc.
```

- [ ] Datos migrados (si aplica)

---

## FASE 4: Actualizar Frontend en Lovable

### 4.1 Dar Prompt a Lovable
Copiar y pegar el contenido de `PROMPT_LOVABLE_MIGRACION_SUPABASE.md`

- [ ] Prompt dado a Lovable

### 4.2 Verificar Cambios en client.ts
```typescript
// Debe apuntar a:
const SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co";
```

- [ ] client.ts actualizado

### 4.3 Verificar Cambios en n8nService.ts
- [ ] externalSupabase eliminado
- [ ] Usa cliente principal
- [ ] getReviewConfig() añadido

### 4.4 Verificar Cambios en NewAnalysis.tsx
- [ ] Usa getReviewConfig()
- [ ] Pasa blueprint_version_id si existe

---

## FASE 5: Testing

### 5.1 Test de Conexión
- [ ] Abrir app en navegador
- [ ] Abrir DevTools → Network
- [ ] Verificar requests van a `hvlsuwdqtffiilvampxq.supabase.co`

### 5.2 Test de Dashboard
- [ ] Dashboard carga sin errores
- [ ] Lista de documentos aparece (puede estar vacía)

### 5.3 Test de NewAnalysis
- [ ] Página carga correctamente
- [ ] Dropdown de contract_types funciona
- [ ] Upload de archivo funciona
- [ ] Archivo se sube a Storage

### 5.4 Test de Realtime
- [ ] Crear un documento
- [ ] Verificar que aparece en Dashboard sin refresh

### 5.5 Test de ContractReview
- [ ] Seleccionar un documento con clause_reviews
- [ ] Verificar que cláusulas cargan
- [ ] Accept/Reject funciona

### 5.6 Test de Escalaciones
- [ ] Lista de escalaciones carga
- [ ] Crear escalación funciona
- [ ] Comentarios funcionan

---

## FASE 6: Actualizar n8n Workflows

### 6.1 Actualizar W1 (file-upload)
- [ ] Cambiar connection string a Supabase externo
- [ ] Verificar que escribe a `documents` correctamente

### 6.2 Actualizar W3 (contract-review)
- [ ] Cambiar connection string a Supabase externo
- [ ] Verificar que escribe a `clause_reviews` correctamente
- [ ] (Opcional) Añadir lectura de `policy_examples` para RAG

### 6.3 Test E2E con n8n
- [ ] Subir documento nuevo
- [ ] Verificar que W1 registra documento
- [ ] Verificar que W3 procesa y escribe clause_reviews
- [ ] Verificar que UI muestra resultados

---

## FASE 7: Producción

### 7.1 Actualizar RLS Policies
- [ ] Reemplazar políticas "dev_allow_all" por políticas restrictivas
- [ ] Verificar que cada tabla tiene políticas apropiadas

### 7.2 Desactivar Modo Desarrollo
```typescript
// En useAuth.tsx
const IS_DEV_MODE = false;
```

- [ ] IS_DEV_MODE = false

### 7.3 Configurar Autenticación Real
- [ ] Verificar auth.users configurado
- [ ] Verificar email templates
- [ ] Verificar redirect URLs

### 7.4 Final Verification
- [ ] Flujo completo funciona con usuario real
- [ ] No hay errores en consola
- [ ] Performance es aceptable

---

## Rollback Plan

Si algo falla:

1. **Revertir client.ts**:
```typescript
const SUPABASE_URL = "https://jirgkdvajlhsnydxybpi.supabase.co";
```

2. **Revertir n8nService.ts**:
   - Restaurar externalSupabase

3. **Los datos en Lovable Cloud no se tocaron**

---

## Comandos Útiles

```bash
# Verificar conexión a Supabase externo
curl https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/ \
  -H "apikey: [ANON_KEY]"

# Verificar Edge Function n8n-proxy
curl -X POST "https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1/n8n-proxy?workflow=test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Contar registros
psql $DB_URL -c "SELECT COUNT(*) FROM policy_examples;"
```

---

## Credenciales (COMPLETAR)

```
SUPABASE_URL: https://hvlsuwdqtffiilvampxq.supabase.co
SUPABASE_ANON_KEY: _____________
SUPABASE_SERVICE_ROLE_KEY: _____________
DATABASE_URL: postgresql://postgres:_____________@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres
```

---

*Checklist generado: 2026-01-20*
