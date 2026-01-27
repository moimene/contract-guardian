-- ============================================================================
-- SEEDS COMPLETOS 3-LAYER PARA SUPABASE EXTERNO
-- Ejecutar DESPUÉS de SQL_MIGRACION_COMPLETA_3LAYER.sql
-- Fecha: 2026-01-20
-- Proyecto: hvlsuwdqtffiilvampxq
-- ============================================================================

-- ============================================================================
-- SEED 1: TAXONOMÍA BASE (18 Materias + Clause Types)
-- ============================================================================

-- Insertar 18 materias
INSERT INTO public.matters (code, name, description, sort_order) VALUES
  ('rights_ownership', 'Rights & Ownership', 'Derechos de propiedad intelectual, licencias, exclusividad, territorio, ventanas', 10),
  ('commercials_fees', 'Commercials: Fees & Credit', 'Tarifas de licencia, pagos, créditos en pantalla, participaciones', 20),
  ('indemnity_prodco', 'Indemnity: ProdCo', 'Indemnización que otorga la productora a Amazon', 30),
  ('indemnity_amazon', 'Indemnity: Amazon', 'Indemnización que otorga Amazon a la productora', 40),
  ('representations_prodco', 'Representations: ProdCo', 'Declaraciones y garantías de la productora', 50),
  ('representations_amazon', 'Representations: Amazon', 'Declaraciones y garantías de Amazon', 60),
  ('delivery_acceptance', 'Delivery & Acceptance', 'Entrega de materiales, criterios de aceptación, rechazos', 70),
  ('production_control', 'Production & Creative Control', 'Control creativo, aprobaciones, cambios de guion', 80),
  ('audit_reporting', 'Audit & Reporting', 'Derechos de auditoría, reportes financieros, acceso a libros', 90),
  ('force_majeure', 'Force Majeure', 'Eventos de fuerza mayor, suspensión, terminación', 100),
  ('governing_law', 'Governing Law & Jurisdiction', 'Ley aplicable, jurisdicción, resolución de disputas', 110),
  ('assignment_transfer', 'Assignment & Transfer', 'Cesión de derechos, transferencia, novación', 120),
  ('termination_and_remedies', 'Termination & Remedies', 'Terminación del contrato, remedios, consecuencias', 130),
  ('dispute_resolution', 'Dispute Resolution', 'Arbitraje, mediación, resolución de conflictos', 140),
  ('miscellaneous_provisions', 'Miscellaneous Provisions', 'Cláusulas varias, notificaciones, modificaciones', 150),
  ('limitation_of_liability', 'Limitation of Liability', 'Limitación de responsabilidad, daños excluidos', 160),
  ('confidentiality_and_publicity', 'Confidentiality & Publicity', 'Confidencialidad, publicidad, comunicados de prensa', 170),
  ('insurance_requirements', 'Insurance Requirements', 'Requisitos de seguro, coberturas, certificados', 180)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Insertar clause_types base (principales por materia)
-- rights_ownership
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('rights_exclusive_ownership_universe_perpetuity', 'Exclusive Ownership Universe Perpetuity', 'Derechos exclusivos perpetuos en todo el universo', ARRAY['exclusive', 'perpetuity', 'universe', 'irrevocable', 'all media'], 1),
  ('rights_exclusive_territory_limited', 'Exclusive Territory Limited', 'Exclusividad limitada a territorios específicos', ARRAY['territory', 'exclusive', 'limited', 'region'], 2),
  ('rights_non_exclusive_license', 'Non-Exclusive License', 'Licencia no exclusiva', ARRAY['non-exclusive', 'license', 'permission'], 3),
  ('rights_holdback_window', 'Holdback Window', 'Ventanas de exclusividad y holdback', ARRAY['holdback', 'window', 'exclusivity period', 'blackout'], 4),
  ('rights_reversion', 'Rights Reversion', 'Reversión de derechos tras período', ARRAY['reversion', 'revert', 'return of rights'], 5),
  ('rights_sequel_remake', 'Sequel Remake Rights', 'Derechos de secuelas y remakes', ARRAY['sequel', 'remake', 'spin-off', 'prequel'], 6)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'rights_ownership'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- commercials_fees
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('fees_license_fee_fixed', 'License Fee Fixed', 'Tarifa de licencia fija', ARRAY['license fee', 'fixed amount', 'flat fee'], 1),
  ('fees_payment_net_30', 'Payment Net 30', 'Pago a 30 días', ARRAY['net 30', 'payment terms', 'thirty days'], 2),
  ('fees_payment_net_45_60', 'Payment Net 45-60', 'Pago a 45-60 días', ARRAY['net 45', 'net 60', 'payment terms'], 3),
  ('fees_backend_participation', 'Backend Participation', 'Participación en backend', ARRAY['backend', 'participation', 'profit share', 'revenue share'], 4),
  ('credit_screen_position', 'Screen Credit Position', 'Posición del crédito en pantalla', ARRAY['screen credit', 'position', 'main titles', 'end credits'], 5),
  ('credit_paid_advertising', 'Paid Advertising Credit', 'Crédito en publicidad pagada', ARRAY['paid advertising', 'marketing', 'promotional'], 6)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'commercials_fees'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detection_hints = EXCLUDED.detection_hints;

-- indemnity_prodco
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('indemnity_prodco_standard', 'Standard ProdCo Indemnity', 'Indemnización estándar de productora', ARRAY['indemnify', 'hold harmless', 'defend'], 1),
  ('indemnity_prodco_ip_claims', 'IP Claims Indemnity', 'Indemnización por reclamos de PI', ARRAY['intellectual property', 'infringement', 'third party claims'], 2),
  ('indemnity_prodco_talent_claims', 'Talent Claims Indemnity', 'Indemnización por reclamos de talento', ARRAY['talent', 'guild', 'union', 'performer'], 3),
  ('indemnity_prodco_unlimited', 'Unlimited Indemnity', 'Indemnización sin límite (riesgo alto)', ARRAY['unlimited', 'without limitation', 'all damages'], 4)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'indemnity_prodco'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name;

-- indemnity_amazon
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('indemnity_amazon_standard', 'Standard Amazon Indemnity', 'Indemnización estándar de Amazon', ARRAY['Amazon indemnifies', 'hold harmless'], 1),
  ('indemnity_amazon_platform', 'Platform Indemnity', 'Indemnización por plataforma', ARRAY['platform', 'service', 'streaming'], 2)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'indemnity_amazon'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name;

-- delivery_acceptance
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('delivery_technical_specs', 'Technical Delivery Specs', 'Especificaciones técnicas de entrega', ARRAY['technical specifications', 'delivery', 'format', 'resolution'], 1),
  ('delivery_acceptance_period', 'Acceptance Period', 'Período de aceptación', ARRAY['acceptance', 'review period', 'approval'], 2),
  ('delivery_rejection_cure', 'Rejection and Cure', 'Rechazo y corrección', ARRAY['rejection', 'cure', 'defect', 'remedy'], 3)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'delivery_acceptance'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name;

-- force_majeure
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, ct.sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('fm_standard', 'Standard Force Majeure', 'Cláusula estándar de fuerza mayor', ARRAY['force majeure', 'act of god', 'beyond control'], 1),
  ('fm_pandemic', 'Pandemic Force Majeure', 'Fuerza mayor por pandemia', ARRAY['pandemic', 'epidemic', 'health emergency'], 2),
  ('fm_suspension_termination', 'Suspension and Termination', 'Suspensión y terminación por FM', ARRAY['suspension', 'terminate', 'extended force majeure'], 3)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'force_majeure'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name;

-- governing_law
INSERT INTO public.clause_types (matter_id, code, name, description, detection_hints, sort_order)
SELECT m.id, ct.code, ct.name, ct.description, ct.detection_hints, sort_order
FROM public.matters m
CROSS JOIN (VALUES
  ('gov_law_california', 'California Law', 'Ley de California', ARRAY['California', 'state of California', 'CA law'], 1),
  ('gov_law_new_york', 'New York Law', 'Ley de Nueva York', ARRAY['New York', 'NY law', 'state of New York'], 2),
  ('gov_law_england', 'England Law', 'Ley de Inglaterra', ARRAY['England', 'English law', 'United Kingdom'], 3),
  ('jurisdiction_exclusive', 'Exclusive Jurisdiction', 'Jurisdicción exclusiva', ARRAY['exclusive jurisdiction', 'courts of'], 4)
) AS ct(code, name, description, detection_hints, sort_order)
WHERE m.code = 'governing_law'
ON CONFLICT (matter_id, code) DO UPDATE SET
  name = EXCLUDED.name;

-- ============================================================================
-- SEED 2: BLUEPRINT AMAZON PSA/DSA
-- ============================================================================

-- Crear Blueprint
INSERT INTO public.review_blueprints (id, organization_id, name, description, status)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  NULL,
  'Amazon PSA/DSA Blueprint',
  'Blueprint de revisión para contratos Amazon Production Service Agreement y Digital Services Agreement',
  'PUBLISHED'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Crear versión activa
INSERT INTO public.blueprint_versions (id, blueprint_id, version_label, description, is_active, published_at)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000100',
  'v1.0',
  'Versión inicial con 18 materias y dataset Harvey expandido',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  published_at = now();

-- Crear matter_policies para cada materia
INSERT INTO public.matter_policies (blueprint_version_id, matter_id, policy_summary, default_acceptance)
SELECT
  '00000000-0000-0000-0000-000000000101'::uuid,
  m.id,
  'Política para ' || m.name,
  'PASSABLE'::acceptance_level
FROM public.matters m
ON CONFLICT (blueprint_version_id, matter_id) DO NOTHING;

-- ============================================================================
-- SEED 3: CONTRACT TYPE DEFAULTS (Resolver)
-- ============================================================================

INSERT INTO public.contract_type_review_defaults (contract_type_id, blueprint_version_id, contract_model_version_id)
VALUES
  ('amazon-psa', '00000000-0000-0000-0000-000000000101', NULL),
  ('amazon-dsa', '00000000-0000-0000-0000-000000000101', NULL),
  ('dsa_streaming', '00000000-0000-0000-0000-000000000101', NULL)
ON CONFLICT (contract_type_id) DO UPDATE SET
  blueprint_version_id = EXCLUDED.blueprint_version_id;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Matters' as entity, COUNT(*) as count FROM public.matters
UNION ALL
SELECT 'Clause Types', COUNT(*) FROM public.clause_types
UNION ALL
SELECT 'Blueprints', COUNT(*) FROM public.review_blueprints
UNION ALL
SELECT 'Blueprint Versions', COUNT(*) FROM public.blueprint_versions
UNION ALL
SELECT 'Matter Policies', COUNT(*) FROM public.matter_policies
UNION ALL
SELECT 'Defaults', COUNT(*) FROM public.contract_type_review_defaults;

-- ============================================================================
-- FIN DE SEEDS BASE
-- Después ejecutar los seeds de policy_examples y fallback_clauses
-- ============================================================================
