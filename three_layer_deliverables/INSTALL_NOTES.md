# Notas de instalación (migraciones + seeds)

## 1) Migraciones

1. Copia todos los ficheros de `three_layer_deliverables/supabase/migrations/` a tu repo en:
   - `supabase/migrations/`
2. Ejecuta las migraciones con tu flujo habitual:
   - Supabase CLI: `supabase db reset` (dev) o `supabase db push`
   - O tu pipeline de CI/CD de migraciones.

**Notas**
- Todas las migraciones usan `create ... if not exists` y/o `add column if not exists` para ser idempotentes.
- `20260119120600_3layer_compat_clause_reviews.sql` solo hace cambios aditivos y está guardada por `to_regclass(...)`.

## 2) Seeds E2E

- El seed está en `three_layer_deliverables/supabase/seed/20260119121000_seed_3layer_amazon_v1.sql`.
- Recomendación: ejecutar seeds solo en entornos Dev/Test (DB limpia).

Ejemplo (psql):
```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/20260119121000_seed_3layer_amazon_v1.sql
```

## 3) Verificaciones mínimas

- `select count(*) from matters;` (>=12)
- `select * from contract_type_review_defaults where contract_type_id='amazon-psa';`
- `select * from review_blueprints;` (1)
- `select * from contract_models;` (1)

