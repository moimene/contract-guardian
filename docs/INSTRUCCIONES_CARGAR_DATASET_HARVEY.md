# Instrucciones: Cargar Dataset Harvey Expandido

**Fecha**: 2026-01-20
**Proyecto**: hvlsuwdqtffiilvampxq (RedLiner_amazon)
**Estado**: PENDIENTE - Ejecutar cuando se desee expandir el RAG

---

## Contexto

La migración base está completa con **85 policy_examples**. El dataset Harvey contiene **1,282 ejemplos adicionales** que mejorarán significativamente la precisión del sistema RAG.

### Estado Actual vs Expandido

| Entidad | Actual | Después de Harvey | Incremento |
|---------|--------|-------------------|------------|
| policy_examples | 85 | ~1,367 | +1,282 |
| matters cubiertos | 13 | 18 | +5 |
| clause_types cubiertos | ~25 | ~67 | +42 |

### Distribución del Dataset Harvey

```
ACCEPTABLE:    425 ejemplos (posiciones estándar Amazon)
PASSABLE:      432 ejemplos (negociables con aprobación)
UNACCEPTABLE:  425 ejemplos (rechazar/escalar)
─────────────────────────────────────────────────
TOTAL:       1,282 ejemplos
```

---

## Archivos Necesarios

Los archivos están en la carpeta `Dataset /` del proyecto:

```
/AMAZON REDLINER/Dataset /
├── 20260120060000_3layer_taxonomy_extension_harvey.sql   (19KB)
│   └── Extiende taxonomía: 6 nuevas materias + 33 nuevos clause_types
│
└── 20260120061000_seed_harvey_policy_examples_expanded.sql (1.1MB)
    └── 1,282 policy_examples organizados por matter/clause_type
```

---

## Instrucciones de Ejecución

### Paso 1: Extender Taxonomía (si no se hizo antes)

Este paso añade las 6 materias y 33+ clause_types que faltan.

**En Supabase SQL Editor:**
```sql
-- Copiar y ejecutar el contenido de:
-- 20260120060000_3layer_taxonomy_extension_harvey.sql
```

**O via psql:**
```bash
psql "$DATABASE_URL" -f "20260120060000_3layer_taxonomy_extension_harvey.sql"
```

**Verificación:**
```sql
SELECT COUNT(*) FROM matters;        -- Debe ser 18+
SELECT COUNT(*) FROM clause_types;   -- Debe ser 67+
```

---

### Paso 2: Cargar Policy Examples (1,282 registros)

⚠️ **Este archivo es grande (~1.1MB)**. Puede tardar varios segundos.

**Opción A: Supabase SQL Editor**
1. Ir a https://supabase.com/dashboard/project/hvlsuwdqtffiilvampxq/sql
2. Copiar TODO el contenido de `20260120061000_seed_harvey_policy_examples_expanded.sql`
3. Pegar en el editor
4. Click en "Run"
5. Esperar ~10-30 segundos

**Opción B: psql CLI (recomendado para archivos grandes)**
```bash
psql "$DATABASE_URL" -f "20260120061000_seed_harvey_policy_examples_expanded.sql"
```

**Opción C: Si hay timeout, dividir en chunks**
El archivo está organizado por secciones. Puedes copiar y ejecutar cada sección por separado:
- Cada sección empieza con `-- matter_code / clause_type_code (N records)`
- Ejecutar de 5-10 secciones a la vez

---

### Paso 3: Verificación Final

```sql
-- Conteo total de policy_examples
SELECT COUNT(*) FROM policy_examples;
-- Esperado: ~1,367 (85 base + 1,282 Harvey)

-- Distribución por acceptance
SELECT acceptance, COUNT(*)
FROM policy_examples
GROUP BY acceptance
ORDER BY acceptance;
-- Esperado:
-- ACCEPTABLE:    ~455
-- PASSABLE:      ~457
-- UNACCEPTABLE:  ~455

-- Cobertura por materia
SELECT m.name, COUNT(pe.id) as examples
FROM matters m
LEFT JOIN matter_policies mp ON mp.matter_id = m.id
LEFT JOIN policy_examples pe ON pe.matter_policy_id = mp.id
GROUP BY m.name
ORDER BY examples DESC;

-- Top 10 clause_types con más ejemplos
SELECT ct.name, COUNT(pe.id) as examples
FROM clause_types ct
LEFT JOIN policy_examples pe ON pe.clause_type_id = ct.id
GROUP BY ct.name
ORDER BY examples DESC
LIMIT 10;
```

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Causa**: Algunos ejemplos ya existen.
**Solución**: El script usa `ON CONFLICT DO NOTHING`, así que es seguro re-ejecutar.

### Error: "relation matter_policies does not exist"
**Causa**: El schema 3-layer no se ejecutó.
**Solución**: Ejecutar primero `SQL_MIGRACION_COMPLETA_3LAYER.sql`.

### Error: "null value in column matter_policy_id"
**Causa**: El Blueprint no tiene matter_policies para alguna materia.
**Solución**: Ejecutar primero `SQL_SEEDS_COMPLETOS_3LAYER.sql`.

### Timeout en SQL Editor
**Causa**: Archivo muy grande para el timeout del editor.
**Solución**: Usar psql CLI o dividir el archivo.

---

## Rollback (si es necesario)

Para eliminar solo los ejemplos de Harvey (mantener los 85 base):

```sql
-- Eliminar ejemplos con source_ref que contenga 'Harvey'
DELETE FROM policy_examples
WHERE source_ref->>'source' ILIKE '%harvey%'
   OR source_ref->>'generator' ILIKE '%harvey%';

-- Verificar
SELECT COUNT(*) FROM policy_examples;
-- Debe volver a ~85
```

---

## Resumen de Comandos

```bash
# Conexión a Supabase
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.hvlsuwdqtffiilvampxq.supabase.co:5432/postgres"

# Paso 1: Extender taxonomía
psql "$DATABASE_URL" -f "20260120060000_3layer_taxonomy_extension_harvey.sql"

# Paso 2: Cargar ejemplos
psql "$DATABASE_URL" -f "20260120061000_seed_harvey_policy_examples_expanded.sql"

# Verificar
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM policy_examples;"
```

---

## Beneficios del Dataset Expandido

| Aspecto | Con 85 ejemplos | Con 1,367 ejemplos |
|---------|-----------------|---------------------|
| Precisión RAG | Media | Alta |
| Cobertura de materias | 13/18 (72%) | 18/18 (100%) |
| Cobertura clause_types | ~25/67 (37%) | ~67/67 (100%) |
| Variedad por acceptance | Limitada | Balanceada |
| Confianza en evaluaciones | Baja | Alta |

---

*Instrucciones generadas: 2026-01-20*
