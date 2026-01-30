-- ============================================================
-- Seed: PolicySpecs for DSA v1 Playbook (9 Core Families)
-- Contract Guardian - Legal Team Review Implementation
-- ============================================================
-- This seed loads the 9 core legal families for the DSA (Digital
-- Services Agreement) playbook as identified in the PRD v2.0

-- ============================================================
-- FAMILY 1: PaymentCredits (Fees & Payment Conditions)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:Fees-Core',
    'PaymentCredits',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '["Sujeto a los demás términos de este Acuerdo, y siempre que ProdCo no esté en incumplimiento material no subsanado del Acuerdo, Amazon abonará a ProdCo los honorarios y demás importes especificados en el Anexo A.", "Payment of all fees and amounts specified in Exhibit A shall be conditional upon ProdCo not being in material uncured breach of this Agreement."]'::jsonb,
    '["Factura electrónica como requisito de proceso, sin alterar condicionantes.", "Prorrateo por hitos definidos en Anexo A.", "Pagos diferidos 30-60 días tras entrega y aceptación."]'::jsonb,
    '["Pagos incondicionales tras PO.", "Eliminar sujeto a otros términos.", "Pagos garantizados sin relación a desempeño.", "Adelantos sin condiciones de devolución."]'::jsonb,
    'Mantener condición de no-incumplimiento. Los fees siempre están sujetos a cumplimiento. No aceptar pagos incondicionales.',
    '["incumplimiento material no subsanado", "sujeto a otros términos", "Anexo A", "honorarios", "importes especificados"]'::jsonb,
    '{"type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "FinanceLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 2: ThirdPartyCredits
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:ThirdPartyCredits-Core',
    'ThirdPartyCredits',
    false,
    'MODE_ENUMERATED_DEVIATIONS',
    '["ProdCo será responsable de obtener y mantener todos los créditos, permisos y autorizaciones de terceros necesarios para la explotación del Programa por Amazon.", "All third-party credits and clearances shall be the sole responsibility of ProdCo."]'::jsonb,
    '["Coordinación con Amazon para créditos de formato específico.", "Notificación de cambios en créditos dentro de 5 días hábiles."]'::jsonb,
    '["Transferir responsabilidad de créditos a Amazon.", "Eliminar obligación de clearances.", "Condicionar entrega a aprobación de créditos por terceros."]'::jsonb,
    'Responsabilidad de créditos siempre en ProdCo. Amazon solo participa en formato de presentación.',
    '["créditos", "terceros", "autorizaciones", "clearances", "permisos"]'::jsonb,
    '{"type": "ESCALATE_IF_CHANGE", "target_group": "ContentLegal", "block_export": false}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.80, "escalate_if_ambiguous": true, "block_export_if_escalated": false}'::jsonb
);

-- ============================================================
-- FAMILY 3: RepsProdCo (Producer Representations)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:RepsProdCo-Core',
    'RepsProdCo',
    true,
    'MODE_STRICT_NO_DEVIATIONS',
    '["ProdCo representa y garantiza que: (a) tiene plena capacidad y autoridad para celebrar este Acuerdo; (b) la ejecución y cumplimiento de este Acuerdo no viola ningún otro acuerdo; (c) el Programa y los Materiales no infringen derechos de terceros; (d) tiene todos los derechos necesarios para otorgar las licencias aquí contempladas.", "ProdCo represents and warrants full authority, non-infringement, and ownership of all necessary rights."]'::jsonb,
    '["Conocimiento del representante sin calificaciones materiales.", "Representaciones a la fecha del Acuerdo renovadas en cada entrega."]'::jsonb,
    '["Eliminar garantía de no infracción.", "Limitar reps a conocimiento actual sin investigación.", "Calificar reps con excepciones materiales.", "Limitar temporalmente las reps a la fecha de firma."]'::jsonb,
    'Representaciones de ProdCo son fundamentales. No aceptar calificaciones que limiten alcance. MODE_STRICT: cualquier desviación es unacceptable.',
    '["representa y garantiza", "plena capacidad", "no infringen", "derechos de terceros", "licencias"]'::jsonb,
    '{"type": "ESCALATE", "target_group": "CoreLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": false, "anchor_conf_threshold": 0.90, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 4: RepsAmazon (Amazon Representations)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:RepsAmazon-Core',
    'RepsAmazon',
    false,
    'MODE_POLICY_JUDGMENT_REQUIRED',
    '["Amazon representa que tiene la capacidad y autoridad para celebrar este Acuerdo.", "Amazon represents it has authority to enter into this Agreement."]'::jsonb,
    '["Representaciones limitadas de Amazon sobre capacidad corporativa.", "Exclusión de garantías implícitas."]'::jsonb,
    '["Amazon garantiza resultados comerciales.", "Amazon asume responsabilidad por decisiones de contenido de terceros.", "Garantías de exclusividad o preferencia."]'::jsonb,
    'Las reps de Amazon deben ser mínimas. No aceptar compromisos de resultados ni garantías amplias. Requiere juicio legal.',
    '["Amazon representa", "capacidad", "autoridad"]'::jsonb,
    '{"type": "ESCALATE_IF_CHANGE", "target_group": "CoreLegal", "block_export": false}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": false}'::jsonb
);

-- ============================================================
-- FAMILY 5: RepsTruthTerm (Truth & Accuracy Warranties)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:RepsTruth-Core',
    'RepsTruthTerm',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '["ProdCo garantiza que toda la información proporcionada es veraz, completa y exacta.", "All information provided by ProdCo is true, complete, and accurate."]'::jsonb,
    '["Veracidad a su leal saber y entender tras investigación razonable.", "Actualización de información material dentro de 10 días."]'::jsonb,
    '["Limitar garantía a conocimiento sin investigación.", "Excluir documentos de terceros de la garantía.", "Calificar veracidad solo a fecha de firma."]'::jsonb,
    'Garantía de veracidad esencial para due diligence. Aceptar calificación de conocimiento solo con investigación razonable.',
    '["información", "veraz", "completa", "exacta", "garantiza"]'::jsonb,
    '{"type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "CoreLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 6: IndemnityProdCo (Producer Indemnification)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:Indemnity-ProdCo-Core',
    'IndemnityProdCo',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '["ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemnes a Amazon, sus afiliadas, directores, funcionarios, empleados, licenciatarios y cesionarios, frente a pérdidas, daños, costos y gastos (incluidos honorarios razonables de abogados) derivados de reclamaciones de terceros que se originen en o se relacionen con: (a) infracción o presunta infracción de derechos de propiedad intelectual, privacidad o difamación relacionada con el Programa o los Materiales; (b) incumplimiento de este Acuerdo o de las representaciones y garantías de ProdCo; o (c) negligencia o dolo de ProdCo o sus subcontratistas."]'::jsonb,
    '["Notificación escrita; la demora solo libera si causa perjuicio material a la defensa.", "ProdCo puede participar en la defensa a su propio costo con su counsel, sin interferir con el control de Amazon.", "Amazon no aceptará un acuerdo que imponga obligaciones a ProdCo sin su aprobación, que no será irrazonablemente denegada.", "Listas ejemplificativas de pérdidas cubiertas.", "Coordinación con aseguradoras E&O."]'::jsonb,
    '["Eliminar obligación de defender, dejando solo indemnizar.", "Limitar indemnidad a dolo exclusivo de ProdCo.", "Exigir sentencia firme previa para activar defensa/indemnización.", "Excluir reclamaciones por infracción de PI.", "Excluir difamación y privacidad.", "Imponer co-control de defensa.", "Aprobación previa de ProdCo para designar counsel.", "Limitar cuantitativamente la indemnidad por debajo del riesgo."]'::jsonb,
    'Mantener deber de DEFENDER además de indemnizar. Control de defensa siempre a opción de Amazon. No aceptar caps sin aprobación Legal. Esta es una de las cláusulas más críticas del contrato.',
    '["defender (a opción de Amazon)", "reclamaciones de terceros", "costos y gastos razonables", "infracción de propiedad intelectual", "negligencia o dolo", "indemnizará", "mantendrá indemnes"]'::jsonb,
    '{"type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "LitigationLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.86, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 7: IndemnityAmazon (Amazon Indemnification)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:Indemnity-Amazon-Core',
    'IndemnityAmazon',
    false,
    'MODE_POLICY_JUDGMENT_REQUIRED',
    '["Amazon indemnizará a ProdCo frente a reclamaciones de terceros que deriven exclusivamente de la infracción por Amazon de derechos de propiedad intelectual de terceros en la tecnología de streaming propiedad exclusiva de Amazon utilizada para la distribución."]'::jsonb,
    '["Limitar a tecnología core de Amazon, excluyendo componentes de terceros.", "Excluir reclamaciones derivadas de materiales de ProdCo.", "Control de defensa por Amazon con notificación a ProdCo."]'::jsonb,
    '["Indemnidad amplia de Amazon por cualquier reclamación.", "Incluir contenido o derechos de ProdCo en la indemnidad de Amazon.", "Caps o limitaciones que dejen a ProdCo desprotegido.", "Transferir riesgo de contenido a Amazon."]'::jsonb,
    'La indemnidad de Amazon debe ser muy limitada. Solo por su tecnología core, no por contenido. Requiere aprobación de Legal senior.',
    '["Amazon indemnizará", "tecnología de streaming", "propiedad exclusiva de Amazon"]'::jsonb,
    '{"type": "ESCALATE", "target_group": "SeniorLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": false, "anchor_conf_threshold": 0.90, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 8: DefenseSettlement (Defense & Settlement Control)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:DefenseSettlement-Core',
    'DefenseSettlement',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '["Amazon tendrá el derecho exclusivo de controlar la defensa de cualquier reclamación cubierta por la indemnidad, incluyendo la selección de abogados. Amazon podrá aceptar cualquier transacción que no imponga obligaciones a ProdCo más allá del pago monetario cubierto por la indemnidad."]'::jsonb,
    '["ProdCo puede participar a su propio costo.", "Notificación razonable de desenvolvimientos materiales.", "Amazon consultará de buena fe antes de settlements.", "Settlements con reconocimiento de responsabilidad requieren consentimiento de ProdCo."]'::jsonb,
    '["Co-control de defensa.", "Derecho de veto de ProdCo sobre counsel.", "Consentimiento previo de ProdCo para cualquier settlement.", "Limitación del control de Amazon a ciertos tipos de claims."]'::jsonb,
    'Control de defensa es prerrogativa de Amazon. ProdCo puede participar pero no co-controlar. Settlements monetarios sin consentimiento; solo si afectan a ProdCo en otras formas.',
    '["derecho exclusivo", "controlar la defensa", "selección de abogados", "transacción", "settlement"]'::jsonb,
    '{"type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "LitigationLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- FAMILY 9: SurvivalRemedies (Survival & Remedies)
-- ============================================================
INSERT INTO policy_specs (
    playbook_id, playbook_version, rule_id, clause_family, required,
    analysis_mode, standard_position, acceptable_variations, unacceptable_variations,
    guidance_internal, anchors, routing_policy, decision_policy
) VALUES (
    'PB_DSA_V1', '1.0',
    'PB:v2026-01:SurvivalRemedies-Core',
    'SurvivalRemedies',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '["Las siguientes secciones sobrevivirán la terminación o expiración del Acuerdo: Indemnificación, Confidencialidad, Limitación de Responsabilidad, y aquellas que por su naturaleza deben sobrevivir. Amazon tendrá derecho a remedios específicos además de los legales, incluyendo medidas cautelares sin necesidad de fianza."]'::jsonb,
    '["Lista específica de secciones con supervivencia.", "Plazo de supervivencia razonable (2-5 años) para confidencialidad.", "Mutualidad en remedios específicos."]'::jsonb,
    '["Limitar secciones que sobreviven excluyendo indemnidad.", "Requerir fianza para medidas cautelares.", "Limitar remedios a daños monetarios.", "Excluir performance específica."]'::jsonb,
    'Supervivencia de indemnidad y confidencialidad no negociables. Remedios deben incluir específicos sin fianza para proteger IP.',
    '["sobrevivirán", "terminación", "expiración", "remedios específicos", "medidas cautelares", "fianza"]'::jsonb,
    '{"type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "CoreLegal", "block_export": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
);

-- ============================================================
-- SEED VARIATION EXAMPLES (Representative samples)
-- ============================================================

-- Get the ID of IndemnityProdCo for examples
DO $$
DECLARE
    v_indemnity_id UUID;
    v_payment_id UUID;
BEGIN
    -- Get IndemnityProdCo ID
    SELECT id INTO v_indemnity_id FROM policy_specs 
    WHERE rule_id = 'PB:v2026-01:Indemnity-ProdCo-Core';
    
    -- Insert STANDARD example
    INSERT INTO variation_set (policy_spec_id, category, text, origin, metadata) VALUES
    (v_indemnity_id, 'STANDARD',
     'ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemnes a Amazon, sus afiliadas, directores, funcionarios, empleados, licenciatarios y cesionarios, frente a pérdidas, daños, costos y gastos (incluidos honorarios razonables de abogados) derivados de reclamaciones de terceros.',
     'manual', '{"is_canonical": true}'::jsonb);
    
    -- Insert ACCEPTABLE examples
    INSERT INTO variation_set (policy_spec_id, category, text, origin, metadata) VALUES
    (v_indemnity_id, 'ACCEPTABLE',
     'ProdCo indemnizará y defenderá (a opción de Amazon) a Amazon frente a reclamaciones de terceros. La demora en notificación no liberará a ProdCo salvo que cause perjuicio material a la defensa.',
     'real_validated', '{"deviation": "notice_prejudice_clarification", "approved_by": "Legal 2024-11"}'::jsonb),
    (v_indemnity_id, 'ACCEPTABLE',
     'El Productor asumirá la obligación de indemnizar y, a elección de Amazon, defender a Amazon contra reclamaciones derivadas del contenido. Amazon conserva el control de la defensa y selección de counsel.',
     'real_validated', '{"deviation": "spanish_to_english_equivalent", "approved_by": "Legal 2024-08"}'::jsonb);
    
    -- Insert UNACCEPTABLE examples
    INSERT INTO variation_set (policy_spec_id, category, text, origin, metadata) VALUES
    (v_indemnity_id, 'UNACCEPTABLE',
     'ProdCo indemnizará a Amazon exclusivamente por daños finalmente determinados por sentencia firme que deriven del dolo de ProdCo, quedando excluidas reclamaciones por infracción de PI.',
     'synthetic', '{"issues": ["requires_final_judgment", "excludes_IP", "excludes_negligence", "no_defend_obligation"]}'::jsonb),
    (v_indemnity_id, 'UNACCEPTABLE',
     'La Productora solo tendrá obligación de indemnizar, no de defender. Amazon y ProdCo compartirán el control de cualquier defensa en partes iguales.',
     'synthetic', '{"issues": ["no_defend_obligation", "co_control_defense"]}'::jsonb),
    (v_indemnity_id, 'UNACCEPTABLE',
     'La indemnidad de ProdCo estará limitada al 50% de los honorarios pagados y requerirá previa aprobación por escrito de ProdCo para la designación de abogados.',
     'synthetic', '{"issues": ["cap_below_risk", "counsel_approval_required"]}'::jsonb);
    
    -- Insert NOT_COVERED example
    INSERT INTO variation_set (policy_spec_id, category, text, origin, metadata) VALUES
    (v_indemnity_id, 'NOT_COVERED',
     'ProdCo y Amazon compartirán equitativamente las responsabilidades de indemnización derivadas de reclamaciones de terceros relacionadas con el Programa.',
     'synthetic', '{"reason": "shared_indemnity_not_in_playbook"}'::jsonb);
    
    -- Get PaymentCredits ID
    SELECT id INTO v_payment_id FROM policy_specs 
    WHERE rule_id = 'PB:v2026-01:Fees-Core';
    
    -- Insert examples for PaymentCredits
    INSERT INTO variation_set (policy_spec_id, category, text, origin, metadata) VALUES
    (v_payment_id, 'STANDARD',
     'Sujeto a los demás términos de este Acuerdo, y siempre que ProdCo no esté en incumplimiento material no subsanado del Acuerdo, Amazon abonará a ProdCo los honorarios y demás importes especificados en el Anexo A.',
     'manual', '{"is_canonical": true}'::jsonb),
    (v_payment_id, 'ACCEPTABLE',
     'Los pagos se realizarán dentro de los 45 días siguientes a la entrega de factura electrónica válida, siempre que ProdCo cumpla con sus obligaciones bajo este Acuerdo.',
     'real_validated', '{"deviation": "electronic_invoice_requirement"}'::jsonb),
    (v_payment_id, 'UNACCEPTABLE',
     'Amazon pagará todos los honorarios dentro de 15 días desde la recepción de la orden de compra, independientemente del cumplimiento de otros términos del Acuerdo.',
     'synthetic', '{"issues": ["unconditional_payment", "removes_performance_condition"]}'::jsonb);

END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Count PolicySpecs loaded
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM policy_specs WHERE playbook_id = 'PB_DSA_V1';
    RAISE NOTICE 'PolicySpecs loaded for PB_DSA_V1: %', v_count;
END $$;

-- Count VariationSet examples
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM variation_set;
    RAISE NOTICE 'VariationSet examples loaded: %', v_count;
END $$;

-- ============================================================
-- SEED COMPLETE
-- ============================================================
