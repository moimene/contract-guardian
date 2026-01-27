# Prompt para Harvey: Expansión Dataset RAG Amazon PSA/DSA

## Contexto para Harvey

```
Eres un experto legal especializado en contratos de producción audiovisual y acuerdos de servicios de programa (PSA/DSA) con estudios de streaming. Tu tarea es generar ejemplos exhaustivos de cláusulas contractuales para entrenar un sistema RAG de revisión de contratos.

El sistema clasifica cláusulas en tres niveles de aceptabilidad desde la perspectiva de Amazon Studios:
- ACCEPTABLE: Posición Amazon estándar o variantes aceptables sin aprobación adicional
- PASSABLE: Requiere aprobación (Legal, Tax/Finance) pero es negociable
- UNACCEPTABLE: Posición que Amazon rechazaría o requiere escalación significativa
```

---

## PROMPT PRINCIPAL

```
# TAREA: Generación de Ejemplos para Dataset RAG de Revisión de Contratos PSA/DSA

## Tu Rol
Actúas como abogado senior de entretenimiento con 15+ años de experiencia negociando PSAs (Program Services Agreements) y DSAs (Development Services Agreements) para estudios de streaming. Conoces profundamente:
- Posiciones estándar de Amazon Studios
- Tácticas de negociación de productoras (ProdCo)
- Variantes jurisdiccionales (US, UK, EU, LATAM)
- Precedentes de mercado y estándares de la industria

## Objetivo
Generar **20 ejemplos por cada combinación de clause_type × acceptance_level** para nutrir un sistema RAG que asiste en la revisión automatizada de contratos.

## Formato de Salida Requerido
Para cada ejemplo, proporciona un JSON con esta estructura:

```json
{
  "matter_code": "string (código de materia)",
  "clause_type_code": "string (código de tipo de cláusula)",
  "acceptance": "ACCEPTABLE | PASSABLE | UNACCEPTABLE",
  "example_text": "string (texto literal de la cláusula, 1-4 oraciones)",
  "normalized_terms": "string (términos clave separados por |)",
  "source_ref": {
    "doc": "PSA_Principal_Terms | PSA_Fallbacks | DSA_Template | Counterparty_Markup | Counterparty_Proposal | Industry_Standard | Jurisdiction_Variant",
    "section": "nombre de sección",
    "note": "nota explicativa breve",
    "approval": "AMAZON_LEGAL | TAX_FINANCE | BUSINESS_AFFAIRS | null",
    "jurisdiction": "US | UK | EU | LATAM | APAC | null",
    "risk_level": "LOW | MEDIUM | HIGH | CRITICAL"
  },
  "reasoning": "string (1-2 oraciones explicando por qué este nivel de aceptabilidad)"
}
```

## Taxonomía de Materias y Clause Types

### 1. RIGHTS_OWNERSHIP (Derechos y Titularidad)
Clause Types:
- `rights_exclusive_ownership_universe_perpetuity`: Titularidad exclusiva Amazon, universo, perpetuidad
- `rights_work_made_for_hire_and_assignment_backstop`: WMFH + cesión subsidiaria
- `rights_all_media_now_known_future`: Todos los medios conocidos y futuros
- `rights_further_assurances_registration_assignment`: Documentos adicionales, registro, cesión
- `rights_power_of_attorney_recording`: Poder para registro si ProdCo incumple

Para cada clause_type, genera:
- 7 ejemplos ACCEPTABLE (variantes de redacción, jurisdicciones)
- 6 ejemplos PASSABLE (con approval gates específicos)
- 7 ejemplos UNACCEPTABLE (posiciones de ProdCo que Amazon rechazaría)

### 2. MORAL_RIGHTS (Derechos Morales)
Clause Types:
- `moral_rights_waiver_or_non_exercise`: Renuncia o compromiso de no ejercicio

Genera ejemplos considerando:
- Jurisdicciones donde el waiver es válido (US, UK)
- Jurisdicciones donde solo aplica non-exercise (Francia, Alemania, España, LATAM)
- Intentos de ProdCo de reservar derechos morales

### 3. COMMERCIALS_FEES_CREDIT (Honorarios y Créditos)
Clause Types:
- `fees_condition_not_in_uncured_material_breach`: Condición "uncured, material breach"
- `fees_subject_to_other_terms_and_conditions`: Sujeto a otros términos
- `entitlements_condition_completion_and_not_in_uncured_material_breach`: Entitlements condicionados
- `credit_sole_discretion`: Créditos a discreción de Amazon
- `credit_inadvertent_failure_not_breach_prospective_cure`: Fallo inadvertido no es breach

Variantes a considerar:
- Calificadores adicionales de breach (final adjudication, persistent, willful)
- Pay-or-play vs. condicionado
- Milestone payments vs. completion
- Guild/union requirements

### 4. THIRD_PARTY_CREDIT (Créditos a Terceros)
Clause Types:
- `third_party_credit_privity_reasonable_efforts_no_liability`: Esfuerzos razonables, sin responsabilidad
- `third_party_credit_contractually_bind_no_police_no_liability`: Obligar contractualmente (con approval)

Variantes:
- "Reasonable efforts" vs. "best efforts" vs. "commercially reasonable efforts"
- Scope de "contractual privity"
- Obligaciones de policía/enforcement
- Responsabilidad por incumplimiento de terceros

### 5. CONTROL_PUBLICITY_TRADEMARKS (Control, Publicidad, Marcas)
Clause Types:
- `program_control_sole_final_control`: Control total Amazon
- `publicity_marketing_no_release_without_approval`: Sin publicidad sin aprobación
- `trademark_use_prior_written_approval`: Uso de marcas requiere aprobación

Variantes:
- Excepciones para premios/festivales
- Social media del talento
- Behind-the-scenes content
- Co-branding scenarios

### 6. CONFIDENTIALITY_NPI_AI (Confidencialidad, NPI, Restricciones IA)
Clause Types:
- `confidentiality_npi_general_obligation`: Obligación general NPI
- `confidentiality_exceptions_need_to_know_affiliates_advisors`: Excepciones need-to-know
- `confidentiality_required_by_law_notice`: Divulgación requerida por ley
- `ai_restriction_no_input_npi_program_materials`: Restricción de input a herramientas IA

**CRÍTICO para AI restriction**: Esta es una cláusula de alta prioridad post-2023. Genera variantes que cubran:
- Prohibición absoluta
- Excepciones con compliance policy
- Herramientas aprobadas vs. no aprobadas
- Intentos de ProdCo de usar IA en producción
- Output vs. input restrictions
- Training data concerns

### 7. PRODCO_REPS_TITLE_NONINFRINGEMENT (R&Ws ProdCo: Título/No Infracción)
Clause Types:
- `prodco_rw_originality_full_copyright`: Originalidad, protección copyright
- `prodco_rw_no_infringement_defamation_privacy`: No infracción, difamación, privacidad
- `prodco_rw_no_encumbrances_third_party_interest`: Sin gravámenes, intereses de terceros
- `prodco_rw_exceptions_amazon_supplied_or_requested`: Excepciones para material Amazon
- `prodco_rw_no_knowledge_qualifiers`: SIN calificadores "to the best of knowledge"

**RED FLAG**: `prodco_rw_no_knowledge_qualifiers` - Genera múltiples ejemplos de cómo ProdCo intenta introducir knowledge qualifiers y por qué son inaceptables.

### 8. COMPLIANCE_POLICIES_LAWS (Cumplimiento: Leyes y Políticas)
Clause Types:
- `prodco_compliance_control_laws_sanctions_export_antiboycott_tax_evasion`: Control laws
- `prodco_compliance_amazon_policies_kickoff_packet`: Políticas Amazon, kickoff packet
- `mutual_compliance_measures_or_material_compliance`: Cumplimiento mutuo (con approval)
- `amazon_rw_right_and_power_to_perform`: R&W Amazon capacidad (con approval)

Variantes:
- OFAC sanctions
- Export control (ITAR, EAR)
- Anti-boycott (Arab League)
- UK Bribery Act
- FCPA
- Tax evasion facilitation (UK Criminal Finance Act)

### 9. INDEMNITY_PRODCO (Indemnidad ProdCo)
Clause Types:
- `prodco_indemnity_indemnify_defend_option_hold_harmless`: Core indemnity
- `prodco_indemnity_scope_third_party_claim_development_production`: Scope de claims
- `prodco_indemnity_triggers_breach_reps_warranties_negligence_willful_misconduct`: Triggers
- `prodco_indemnity_indemnitees_amazon_assignees_licensees_affiliates`: Indemnitees
- `prodco_indemnity_alleged_breach_handling`: Manejo de "alleged breach"

**CRITICAL**:
- "Defend at Amazon's option" vs. obligación de defender
- "Alleged breach" - preferencia por DELETE
- Scope de indemnitees (assignees, licensees, successors)
- Caps y exclusiones que ProdCo intenta introducir

### 10. INDEMNITY_AMAZON (Indemnidad Amazon)
Clause Types:
- `amazon_indemnity_scope_distribution_marketing_advertising_exploitation_ancillary`: Scope
- `amazon_indemnity_exclusion_losses_prodco_indemnifies`: Carveout para losses de ProdCo
- `amazon_indemnity_indemnitees_prodco_affiliates_optional_persons`: Indemnitees
- `amazon_indemnity_add_breach_trigger`: Añadir breach trigger (con approval)
- `amazon_indemnity_exclude_successors_assignees`: Excluir successors/assignees

**RED FLAG**: `amazon_indemnity_exclude_successors_assignees` - Amazon NO indemnifica a successors/assignees de ProdCo. Genera ejemplos de intentos de añadirlos.

### 11. DEFENSE_SETTLEMENT (Defensa y Settlement)
Clause Types:
- `defense_notice_prompt_delay_only_material_impairment`: Notice y delay
- `defense_control_by_amazon`: Control Amazon de defensa/settlement
- `defense_prodco_cooperation_info_assistance`: Cooperación ProdCo
- `defense_prodco_participation_own_expense_counsel`: Participación ProdCo
- `settlement_prodco_approval_for_admissions_or_obligations`: Consent para admissions

Variantes:
- Timing de notice (prompt, reasonable, X days)
- Consecuencias de delay
- Control exclusivo vs. compartido
- Settlement con admissions vs. sin admissions
- Approval "not to be unreasonably withheld" vs. "sole discretion"

### 12. MISC_LEGAL_OPS (Miscelánea Legal)
Clause Types:
- `conditions_precedent_exhibit_a`: Condiciones precedentes
- `damages_waiver_indirect_consequential_carveouts`: Waiver daños indirectos + carveouts
- `remedies_monetary_only_waiver_injunctive_equitable_relief`: Solo monetary, waiver injunctive
- `assignment_prodco_restricted_amazon_free_assignment`: Assignment restrictions
- `assignment_notification_efforts`: Notificación de assignment
- `suspension_force_majeure_extension`: Suspensión, force majeure
- `no_partnership_joint_venture_agency`: No partnership/JV/agency
- `data_protection_independent_controllers`: Data protection, independent controllers
- `tax_transaction_taxes_inclusive_exclusive`: Transaction taxes
- `tax_withholding_and_reporting_forms`: Withholding, forms (1042-S)
- `governing_law_ny_jurisdiction_nyc_jury_waiver`: NY law, NYC venue, jury waiver

**CRÍTICO para `remedies_monetary_only_waiver_injunctive_equitable_relief`**: Amazon necesita waiver de injunctive relief para evitar que ProdCo pueda detener explotación del Program. Genera variantes de:
- Waiver completo
- Intentos de ProdCo de preservar injunctive relief
- Carveouts para confidentiality
- "Irreparable harm" language

**CRÍTICO para `governing_law_ny_jurisdiction_nyc_jury_waiver`**: Genera variantes para:
- UK governing law (para producciones UK)
- EU variations (Germany, France, Spain)
- LATAM (Mexico, Brazil, Argentina)
- Arbitration vs. litigation
- Jury waiver enforceability por jurisdicción

## Instrucciones Adicionales

1. **Variedad de redacción**: Para ejemplos ACCEPTABLE, usa diferentes formas de expresar la misma posición (sinónimos, estructura de oración, nivel de detalle).

2. **Tácticas reales de negociación**: Para ejemplos UNACCEPTABLE, usa lenguaje que realmente aparece en markups de productoras, no ejemplos artificiales.

3. **Jurisdictional awareness**: Indica cuando una variante es específica de una jurisdicción (e.g., moral rights en Francia, data protection en EU, withholding en UK).

4. **Escalation paths**: Para ejemplos PASSABLE, especifica siempre qué tipo de approval se requiere.

5. **Risk scoring**: Asigna risk_level basado en:
   - CRITICAL: Podría exponer a Amazon a litigation significativo o pérdida de derechos
   - HIGH: Requiere escalación a Legal senior
   - MEDIUM: Negociable con approval estándar
   - LOW: Variante menor, generalmente aceptable

6. **Reasoning quality**: El campo "reasoning" debe explicar el impacto legal/comercial específico, no solo restatar el nivel de aceptabilidad.

## Entrega

Genera los ejemplos en batches por materia. Para cada materia:
1. Lista todos los clause_types
2. Para cada clause_type, genera 20 ejemplos (7 ACCEPTABLE, 6 PASSABLE, 7 UNACCEPTABLE)
3. Incluye variantes jurisdiccionales donde aplique
4. Marca claramente los RED FLAGS y posiciones críticas

Comienza con la materia: [ESPECIFICAR MATERIA]
```

---

## PROMPTS DE SEGUIMIENTO (por materia)

### Para ejecutar por batches:

```
Genera los 20 ejemplos para la materia RIGHTS_OWNERSHIP, cubriendo los 5 clause_types.
Asegúrate de incluir:
- Variantes UK para WMFH (commissioned works)
- Variantes EU para further assurances
- Intentos de ProdCo de retener derechos de librería/remake
- POA limitations por jurisdicción
```

```
Genera los 20 ejemplos para la materia INDEMNITY_PRODCO, cubriendo los 5 clause_types.
Focus especial en:
- "Defend at Amazon's option" vs. obligación de defender
- Handling de "alleged breach" (DELETE preference)
- Caps on indemnity que ProdCo intenta introducir
- Carveouts por gross negligence/willful misconduct
- Insurance requirements como alternativa
```

```
Genera los 20 ejemplos para la materia CONFIDENTIALITY_NPI_AI, cubriendo los 4 clause_types.
Focus especial en:
- AI restrictions post-2023 (crítico)
- Excepciones para herramientas aprobadas
- Training data concerns
- Output ownership de AI-generated content
- Jurisdicciones con regulación AI emergente (EU AI Act)
```

---

## PROMPT DE VALIDACIÓN

```
Revisa los siguientes ejemplos generados y verifica:

1. CONSISTENCIA LEGAL:
- ¿El lenguaje es consistente con estándares de la industria?
- ¿Los términos legales están usados correctamente?
- ¿Las posiciones reflejan práctica real de negociación?

2. CLASIFICACIÓN CORRECTA:
- ¿Cada ejemplo está en el nivel de aceptabilidad correcto?
- ¿Los PASSABLE realmente requieren approval o deberían ser ACCEPTABLE/UNACCEPTABLE?
- ¿Los UNACCEPTABLE son realmente rechazables o podrían ser PASSABLE con approval?

3. COMPLETITUD:
- ¿Se cubren las principales variantes jurisdiccionales?
- ¿Se incluyen tácticas comunes de negociación?
- ¿Hay suficiente variedad de redacción?

4. UTILIDAD PARA RAG:
- ¿Los ejemplos son suficientemente distintos para similarity search?
- ¿Los normalized_terms capturan los conceptos clave?
- ¿El reasoning proporciona contexto útil para el modelo?

Corrige cualquier error y sugiere ejemplos adicionales si hay gaps.
```

---

## NOTAS PARA EL EQUIPO

### Cómo usar este prompt con Harvey:

1. **Ejecutar por materias** (no todo de una vez): Harvey tiene mejor output con batches focalizados.

2. **Validar con Legal**: Los ejemplos generados deben ser revisados por el equipo legal antes de incorporarlos al RAG.

3. **Iterar**: Si Harvey genera ejemplos con clasificación incorrecta, usa el prompt de validación para corregir.

4. **Formato de importación**: El output JSON de Harvey puede convertirse directamente a CSV o SQL insert para cargar en `policy_examples`.

### Conversión a SQL:

```sql
-- Template para convertir output de Harvey a insert
INSERT INTO policy_examples (matter_policy_id, clause_type_id, acceptance, example_text, source_ref)
SELECT
  mp.id,
  ct.id,
  '[ACCEPTANCE]'::acceptance_level,
  '[EXAMPLE_TEXT]',
  '[SOURCE_REF]'::jsonb
FROM matter_policies mp
JOIN matters m ON m.id = mp.matter_id
JOIN clause_types ct ON ct.matter_id = m.id
JOIN review_blueprint_versions rbv ON rbv.id = mp.blueprint_version_id
JOIN review_blueprints rb ON rb.id = rbv.blueprint_id
WHERE m.code = '[MATTER_CODE]'
  AND ct.code = '[CLAUSE_TYPE_CODE]'
  AND rb.name = 'Amazon PSA/DSA Blueprint'
  AND rbv.version_int = 1
ON CONFLICT DO NOTHING;
```

### Estimación de volumen:

| Materia | Clause Types | Ejemplos (20 × types) |
|---------|--------------|----------------------|
| rights_ownership | 5 | 100 |
| moral_rights | 1 | 20 |
| commercials_fees_credit | 5 | 100 |
| third_party_credit | 2 | 40 |
| control_publicity_trademarks | 3 | 60 |
| confidentiality_npi_ai | 4 | 80 |
| prodco_reps_title_noninfringement | 5 | 100 |
| compliance_policies_laws | 4 | 80 |
| indemnity_prodco | 5 | 100 |
| indemnity_amazon | 5 | 100 |
| defense_settlement | 5 | 100 |
| misc_legal_ops | 11 | 220 |
| **TOTAL** | **55** | **~1,100 ejemplos** |

Con ~1,100 ejemplos de alta calidad, el RAG tendrá cobertura exhaustiva para clasificación y generación de redlines.
