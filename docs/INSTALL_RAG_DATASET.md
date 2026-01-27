# Dataset RAG Amazon PSA/DSA v1 - Guía de Instalación

## Resumen del Paquete

Este paquete contiene el dataset completo para alimentar el sistema RAG de Contract Guardian con las posiciones Amazon PSA/DSA.

### Contenido

| Archivo | Propósito | Registros |
|---------|-----------|-----------|
| `20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql` | Taxonomía (12 materias + ~50 clause_types) + Blueprint v1 | ~65 registros |
| `20260119124000_seed_amazon_psa_policy_examples_v1.sql` | Ejemplos ACCEPTABLE/PASSABLE/UNACCEPTABLE | ~70 ejemplos |
| `20260119125000_seed_amazon_psa_fallback_clauses_v1.sql` | GIVE / ALTERNATE GIVE con approval gates | ~50 fallbacks |
| `amazon_psa_policy_examples_v1.csv` | CSV importable para análisis/extensión | ~70 filas |

---

## Prerequisitos

1. **Migraciones 3-Layer ejecutadas** (ver `INSTALL_NOTES.md`)
   - Tablas requeridas: `matters`, `clause_types`, `review_blueprints`, `review_blueprint_versions`, `matter_policies`, `policy_examples`, `fallback_clauses`

2. **Al menos una organización existente** en la tabla `organizations`

---

## Orden de Ejecución

```bash
# 1. Taxonomía + Blueprint (PRIMERO)
psql "$SUPABASE_DB_URL" -f supabase/seed/20260119123000_seed_amazon_psa_taxonomy_blueprint_v1.sql

# 2. Policy Examples (después de taxonomía)
psql "$SUPABASE_DB_URL" -f supabase/seed/20260119124000_seed_amazon_psa_policy_examples_v1.sql

# 3. Fallback Clauses (después de taxonomía)
psql "$SUPABASE_DB_URL" -f supabase/seed/20260119125000_seed_amazon_psa_fallback_clauses_v1.sql
```

**Alternativa con Supabase CLI:**
```bash
# Si prefieres usar supabase db reset (borra y recrea todo)
supabase db reset
```

---

## Verificaciones Post-Instalación

### 1. Materias (12 esperadas)
```sql
SELECT code, name, sort_order FROM matters ORDER BY sort_order;
```

Resultado esperado:
```
rights_ownership          | Rights & Ownership                    | 10
moral_rights              | Moral Rights                          | 20
commercials_fees_credit   | Commercials: Fees & Entitlements/... | 30
third_party_credit        | Third-Party Credit Obligations        | 40
control_publicity_...     | Control, Publicity & Trademarks       | 50
confidentiality_npi_ai    | Confidentiality, NPI & AI Restric...  | 60
prodco_reps_title_...     | ProdCo Reps: Title/Non-Infringement   | 70
compliance_policies_laws  | Compliance: Control Laws & Amazon...  | 80
indemnity_prodco          | Indemnity: ProdCo                     | 90
indemnity_amazon          | Indemnity: Amazon                     | 100
defense_settlement        | Defense & Settlement                  | 110
misc_legal_ops            | Misc & Legal Ops                      | 120
```

### 2. Clause Types (~50 esperados)
```sql
SELECT m.code as matter, ct.code as clause_type, ct.name
FROM clause_types ct
JOIN matters m ON m.id = ct.matter_id
ORDER BY m.sort_order, ct.code;
```

### 3. Blueprint Amazon
```sql
SELECT rb.name, rbv.version_int, rbv.published_at
FROM review_blueprints rb
JOIN review_blueprint_versions rbv ON rbv.blueprint_id = rb.id
WHERE rb.name = 'Amazon PSA/DSA Blueprint';
```

### 4. Policy Examples por nivel de aceptación
```sql
SELECT pe.acceptance, COUNT(*) as count
FROM policy_examples pe
GROUP BY pe.acceptance
ORDER BY pe.acceptance;
```

Resultado esperado:
```
ACCEPTABLE   | ~30
PASSABLE     | ~15
UNACCEPTABLE | ~25
```

### 5. Fallback Clauses con approval gates
```sql
SELECT
  fc.acceptance,
  fc.requires_approval,
  fc.approval_role,
  COUNT(*) as count
FROM fallback_clauses fc
GROUP BY fc.acceptance, fc.requires_approval, fc.approval_role
ORDER BY fc.acceptance;
```

---

## Estructura de Datos para RAG

### Policy Examples (corpus de entrenamiento/retrieval)

```json
{
  "matter_policy_id": "uuid",
  "clause_type_id": "uuid",
  "acceptance": "ACCEPTABLE | PASSABLE | UNACCEPTABLE",
  "example_text": "Texto de ejemplo de cláusula",
  "source_ref": {
    "doc": "PSA_Principal_Terms | PSA_Fallbacks | Counterparty_Proposal",
    "section": "FEES | RIGHTS | INDEMNITY | ...",
    "note": "Nota opcional",
    "approval": "AMAZON_LEGAL | TAX_FINANCE (si aplica)"
  }
}
```

### Fallback Clauses (lenguaje preferido para redlines)

```json
{
  "matter_policy_id": "uuid",
  "clause_type_id": "uuid",
  "acceptance": "ACCEPTABLE | PASSABLE",
  "fallback_text": "Texto GIVE o ALTERNATE GIVE",
  "usage_notes": "Instrucciones de uso",
  "requires_approval": true | false,
  "approval_role": "LEGAL | TAX_FINANCE | null"
}
```

---

## Uso en el Pipeline de Agentes

### 1. Router (detección de materia/clause_type)

```sql
-- Obtener hints de detección para routing
SELECT ct.code, ct.detection_hints->'keywords' as keywords
FROM clause_types ct
JOIN matters m ON m.id = ct.matter_id
WHERE m.code = 'indemnity_prodco';
```

### 2. Valuator (clasificación ACCEPTABLE/PASSABLE/UNACCEPTABLE)

```sql
-- Recuperar ejemplos para RAG similarity search
SELECT pe.example_text, pe.acceptance, pe.source_ref
FROM policy_examples pe
JOIN clause_types ct ON ct.id = pe.clause_type_id
WHERE ct.code = 'fees_condition_not_in_uncured_material_breach'
ORDER BY pe.acceptance;
```

### 3. ChangeSet (proponer redline con fallback)

```sql
-- Obtener fallback preferido para proponer cambio
SELECT fc.fallback_text, fc.usage_notes, fc.requires_approval, fc.approval_role
FROM fallback_clauses fc
JOIN clause_types ct ON ct.id = fc.clause_type_id
WHERE ct.code = 'third_party_credit_privity_reasonable_efforts_no_liability'
  AND fc.acceptance = 'ACCEPTABLE';
```

---

## Extensión del Dataset

### Agregar nuevos ejemplos (CSV)

1. Editar `amazon_psa_policy_examples_v1.csv`
2. Importar con script ETL o SQL:

```sql
-- Ejemplo de insert manual
INSERT INTO policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
SELECT
  mp.id,
  ct.id,
  'UNACCEPTABLE',
  'Nuevo ejemplo de cláusula inaceptable...',
  '{"doc":"Internal_Review","note":"Added 2026-01"}'::jsonb
FROM matter_policies mp
JOIN matters m ON m.id = mp.matter_id
JOIN clause_types ct ON ct.matter_id = m.id
JOIN review_blueprint_versions rbv ON rbv.id = mp.blueprint_version_id
JOIN review_blueprints rb ON rb.id = rbv.blueprint_id
WHERE m.code = 'indemnity_prodco'
  AND ct.code = 'prodco_indemnity_alleged_breach_handling'
  AND rb.name = 'Amazon PSA/DSA Blueprint'
  AND rbv.version_int = 1;
```

### Crear nueva versión de Blueprint

```sql
-- Crear nueva versión (v2) para iterar sin perder v1
INSERT INTO review_blueprint_versions (blueprint_id, version_int, changelog, config)
SELECT
  rb.id,
  2,
  'v2: Expanded examples for Fees and Indemnity matters.',
  rbv.config
FROM review_blueprints rb
JOIN review_blueprint_versions rbv ON rbv.blueprint_id = rb.id
WHERE rb.name = 'Amazon PSA/DSA Blueprint'
  AND rbv.version_int = 1;
```

---

## Mapeo de Tipologías Actuales → Nuevos Clause Types

Si ya tenéis ejemplos en formato legacy, aquí está el mapping:

| Tipología Legacy | Matter Code | Clause Type Code |
|------------------|-------------|------------------|
| Honorarios (Fees) | `commercials_fees_credit` | `fees_condition_not_in_uncured_material_breach` |
| Créditos | `commercials_fees_credit` | `credit_sole_discretion`, `credit_inadvertent_failure_not_breach_prospective_cure` |
| Créditos terceros | `third_party_credit` | `third_party_credit_privity_reasonable_efforts_no_liability` |
| R&Ws ProdCo | `prodco_reps_title_noninfringement` | `prodco_rw_*` |
| R&Ws Amazon | `compliance_policies_laws` | `amazon_rw_right_and_power_to_perform` |
| Indemnidad ProdCo | `indemnity_prodco` | `prodco_indemnity_*` |
| Indemnidad Amazon | `indemnity_amazon` | `amazon_indemnity_*` |
| Defensa/Settlement | `defense_settlement` | `defense_*`, `settlement_*` |
| Confidencialidad/AI | `confidentiality_npi_ai` | `ai_restriction_no_input_npi_program_materials` |
| Daños indirectos | `misc_legal_ops` | `damages_waiver_indirect_consequential_carveouts` |
| Injunctive relief | `misc_legal_ops` | `remedies_monetary_only_waiver_injunctive_equitable_relief` |

---

## Soporte

Para preguntas sobre el dataset o extensiones:
- Ver `BACKLOG_3_CAPAS.md` para roadmap de funcionalidades
- Ver `PRD_EVOLUCION_3_CAPAS.md` para arquitectura objetivo
