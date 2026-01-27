# Instrucciones de Ejecución: Migración 3-Layer en Supabase

**Fecha**: 2026-01-20
**Proyecto**: hvlsuwdqtffiilvampxq (RedLiner_amazon)
**Estado**: LISTO PARA EJECUTAR

---

## Resumen de Archivos

| # | Archivo | Tamaño | Propósito |
|---|---------|--------|-----------|
| 1 | `SQL_MIGRACION_COMPLETA_3LAYER.sql` | ~15KB | Schema completo (tablas, enums, triggers) |
| 2 | `SQL_SEEDS_COMPLETOS_3LAYER.sql` | ~8KB | Taxonomía base + Blueprint + Defaults |
| 3 | `20260120061000_seed_harvey_policy_examples_expanded.sql` | ~1.1MB | 1,282 policy_examples de Harvey |

---

## Paso 1: Ejecutar Schema (SQL_MIGRACION_COMPLETA_3LAYER.sql)

### Opción A: Supabase SQL Editor (Recomendado)
1. Ir a https://supabase.com/dashboard/project/hvlsuwdqtffiilvampxq/sql
2. Copiar TODO el contenido de `SQL_MIGRACION_COMPLETA_3LAYER.sql`
3. Pegar en el editor SQL
4. Click en "Run" (o Cmd+Enter)
5. Verificar que no hay errores

### Opción B: psql CLI
```bash
# Conectar
psql "postgresql://postgres:[PASSWORD]@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres"

# Ejecutar
\i SQL_MIGRACION_COMPLETA_3LAYER.sql
```

### Verificación del Schema
Después de ejecutar, deberías ver esta salida:
```
       table_name
-------------------------
 blueprint_versions
 clause_instances
 clause_types
 contract_model_clauses
 contract_model_parameters
 contract_model_versions
 contract_models
 contract_type_review_defaults
 fallback_clauses
 kg_edges
 kg_nodes
 knowledge_graphs
 matter_policies
 matters
 policy_examples
 review_blueprints
 review_findings
 run_steps
(18 rows)
```

---

## Paso 2: Ejecutar Seeds Base (SQL_SEEDS_COMPLETOS_3LAYER.sql)

### En SQL Editor:
1. Copiar contenido de `SQL_SEEDS_COMPLETOS_3LAYER.sql`
2. Pegar y ejecutar

### Verificación de Seeds Base
```
  entity           | count
-------------------+-------
 Matters           |    18
 Clause Types      |    25+
 Blueprints        |     1
 Blueprint Versions|     1
 Matter Policies   |    18
 Defaults          |     3
```

---

## Paso 3: Ejecutar Dataset Harvey (1,282 examples)

### ⚠️ IMPORTANTE: Este archivo es grande (~1.1MB)

### Opción A: SQL Editor (puede timeout)
1. Copiar contenido de `20260120061000_seed_harvey_policy_examples_expanded.sql`
2. Ejecutar en SQL Editor
3. Si hay timeout, usar Opción B

### Opción B: psql CLI (recomendado para archivos grandes)
```bash
psql "postgresql://postgres:[PASSWORD]@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres" \
  -f 20260120061000_seed_harvey_policy_examples_expanded.sql
```

### Opción C: Dividir en chunks
Si el archivo es muy grande, dividir y ejecutar por partes:
```bash
# El archivo ya está organizado por matter/clause_type
# Puedes copiar secciones individuales
```

---

## Paso 4: Verificación Final

Ejecutar estas queries para verificar:

```sql
-- Conteo total
SELECT
  (SELECT COUNT(*) FROM matters) as matters,
  (SELECT COUNT(*) FROM clause_types) as clause_types,
  (SELECT COUNT(*) FROM policy_examples) as policy_examples,
  (SELECT COUNT(*) FROM fallback_clauses) as fallback_clauses,
  (SELECT COUNT(*) FROM matter_policies) as matter_policies;

-- Distribución de policy_examples por acceptance
SELECT acceptance, COUNT(*)
FROM policy_examples
GROUP BY acceptance
ORDER BY acceptance;

-- Verificar Blueprint
SELECT rb.name, bv.version_label, bv.is_active
FROM review_blueprints rb
JOIN blueprint_versions bv ON bv.blueprint_id = rb.id;

-- Verificar Defaults
SELECT * FROM contract_type_review_defaults;
```

### Resultado Esperado
```
 matters | clause_types | policy_examples | fallback_clauses | matter_policies
---------+--------------+-----------------+------------------+-----------------
      18 |          67+ |          1,352+ |              50+ |              18

 acceptance    | count
---------------+-------
 ACCEPTABLE    |   455
 PASSABLE      |   447
 UNACCEPTABLE  |   450
```

---

## Troubleshooting

### Error: "function set_updated_at() does not exist"
**Solución**: El schema se está ejecutando en orden incorrecto. Ejecutar primero:
```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### Error: "type acceptance_level does not exist"
**Solución**: Ejecutar primero los CREATE TYPE statements.

### Error: "relation already exists"
**Solución**: Esto es normal si se re-ejecuta. Los scripts usan `IF NOT EXISTS`.

### Error: "permission denied for schema extensions"
**Solución**: pgvector requiere permisos especiales. El script continúa sin él.

### Timeout en SQL Editor
**Solución**: Usar psql CLI para archivos grandes, o dividir el archivo Harvey en partes.

---

## Orden de Ejecución Completo

```
1. SQL_MIGRACION_COMPLETA_3LAYER.sql     ← Schema (tablas, enums)
2. SQL_SEEDS_COMPLETOS_3LAYER.sql        ← Taxonomía + Blueprint + Defaults
3. 20260120061000_seed_harvey_...sql     ← 1,282 policy_examples
```

---

## Después de la Migración

Una vez completada la migración de BD:

1. **Ejecutar prompt de Lovable** (`PROMPT_LOVABLE_MIGRACION_SUPABASE.md`)
2. **Actualizar n8n workflows** para usar nueva BD
3. **Verificar flujo E2E** (upload → review → export)

---

## Conexión a Supabase

```
Project ID: hvlsuwdqtffiilvampxq
Project Name: RedLiner_amazon
Region: [verificar en dashboard]

URL: https://hvlsuwdqtffiilvampxq.supabase.co
DB Host: db.hvlsuwdqtffiilvampxq.supabase.co
DB Port: 5432
DB Name: postgres

Connection String:
postgresql://postgres:[PASSWORD]@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres
```

---

*Instrucciones generadas: 2026-01-20*
