# Instrucciones para Cargar Harvey Dataset

## Opción 1: Supabase SQL Editor (Recomendada)

### Paso 1: Acceder al SQL Editor
1. Ve a: https://supabase.com/dashboard/project/hvlsuwdqtffiilvampxq/sql/new
2. Login si es necesario

### Paso 2: Ejecutar los 7 batches secuencialmente

Desde la carpeta `sql_batches/`, copia y ejecuta cada archivo en orden:

| Archivo | Líneas | Tamaño |
|---------|--------|--------|
| `batch_001.sql` | 403 | 164KB |
| `batch_002.sql` | 402 | 170KB |
| `batch_003.sql` | 388 | 167KB |
| `batch_004.sql` | 395 | 172KB |
| `batch_005.sql` | 392 | 169KB |
| `batch_006.sql` | 391 | 171KB |
| `batch_007.sql` | 291 | 117KB |

**Para cada batch:**
```bash
# En Terminal, copia el contenido:
cat /Users/moisesmenendez/Downloads/DESARROLLO/AMAZON\ REDLINER/sql_batches/batch_001.sql | pbcopy
```
Luego pégalo en el SQL Editor y ejecuta.

---

## Opción 2: Instalar psql y ejecutar automático

```bash
# Instalar PostgreSQL client
brew install libpq
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ejecutar todos los batches
cd "/Users/moisesmenendez/Downloads/DESARROLLO/AMAZON REDLINER"
for batch in sql_batches/batch_00*.sql; do
  echo "Ejecutando $batch..."
  PGPASSWORD='tu_password_aqui' psql "postgresql://postgres.hvlsuwdqtffiilvampxq@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f "$batch"
done
```

---

## Verificación

Después de cargar, ejecuta en SQL Editor:
```sql
SELECT 'MATTERS' as entity, COUNT(*) as count FROM matters
UNION ALL SELECT 'CLAUSE_TYPES', COUNT(*) FROM clause_types
UNION ALL SELECT 'POLICY_EXAMPLES', COUNT(*) FROM policy_examples;
```

**Resultado esperado:**
- MATTERS: ~26
- CLAUSE_TYPES: ~100
- POLICY_EXAMPLES: ~1,367
