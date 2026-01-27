-- ============================================================================
-- MIGRACIÓN: Playbook Rules para Nueva Planta
-- Ejecutar en: Tu Supabase externo (hvlsuwdqtfiilvampxq)
-- Fecha: 2026-01-17
--
-- Este script inserta las reglas del playbook para contratos EPC Nueva Planta
-- basándose en los archivos YAML de /playbook/rules/nueva_planta/
-- ============================================================================

-- ============================================================================
-- 1. INSERTAR REGLAS DE PLAYBOOK PARA NUEVA PLANTA
-- ============================================================================

-- Asegurar que la tabla existe (por si no se ejecutó 001_create_schema.sql)
CREATE TABLE IF NOT EXISTS public.playbook_rules (
    rule_id TEXT PRIMARY KEY,
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    clause_family TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    analysis_mode TEXT NOT NULL,
    standard_position JSONB NOT NULL,
    fallback_acceptable_fragments JSONB DEFAULT '[]',
    unacceptable_patterns JSONB DEFAULT '[]',
    guidance_internal TEXT,
    anchors JSONB DEFAULT '[]',
    definitions_scope JSONB,
    retrieval_profile JSONB DEFAULT '{"vector_top_k": 3, "coverage_threshold": 0.78, "examples_top_k": 6}',
    routing_policy JSONB NOT NULL,
    decision_policy JSONB DEFAULT '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}',
    models JSONB DEFAULT '{"paranoid": "gpt-4o", "valuator": "gpt-4o", "sanitizer": "gpt-4o-mini"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos
DROP POLICY IF EXISTS "Anyone can view playbook rules" ON public.playbook_rules;
CREATE POLICY "Anyone can view playbook rules" ON public.playbook_rules
    FOR SELECT USING (true);

-- Política de escritura para service_role
DROP POLICY IF EXISTS "Service role manages playbook rules" ON public.playbook_rules;
CREATE POLICY "Service role manages playbook rules" ON public.playbook_rules
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- REGLA 1: PrecioPagos
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:PrecioPagos',
    'nueva_planta',
    '2026-01',
    'Precio y Pagos',
    'NuevaPlanta.PrecioPagos',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "text": "El precio del contrato será un precio alzado firme (lump sum), sin revisiones durante la vigencia del contrato, salvo las expresamente pactadas.\n\nLos pagos se realizarán contra certificaciones mensuales de avance de obra, con un plazo de pago de 60 días desde la aprobación de la certificación.\n\nSe retendrá un 5% de cada certificación como garantía de buena ejecución, a devolver una vez completada la recepción definitiva.",
        "summary": "Precio alzado firme con pagos mensuales a 60 días y retención del 5%"
    }'::jsonb,
    '[
        {"id": "ACCEPT_01", "description": "Ajuste por IPC limitado", "pattern": "ajuste.*IPC.*máximo.*(2|3|4)%"},
        {"id": "ACCEPT_02", "description": "Retención entre 3-7%", "pattern": "retención.*(3|4|5|6|7)%"},
        {"id": "ACCEPT_03", "description": "Plazo de pago entre 30-60 días", "pattern": "pago.*(30|45|60).*días"}
    ]'::jsonb,
    '[
        {"id": "BLOCK_01", "description": "Revisión de precios sin límite", "pattern": "revisión.*precios.*sin.*límite|ajuste.*ilimitado", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_02", "description": "Pago diferido total a fin de obra", "pattern": "pago.*único.*finalización|pago.*total.*entrega", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_03", "description": "Retención superior al 15%", "pattern": "retención.*(15|20|25|30)%", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_04", "description": "Penalizaciones sin límite", "pattern": "penalización.*sin.*límite|penalidades.*ilimitadas", "action": "BLOCK_EXPORT"}
    ]'::jsonb,
    'Analizar cuidadosamente condiciones de pago, retenciones y ajustes de precio. Verificar que los plazos de pago no excedan 60 días y las retenciones estén entre 3-10%.',
    '{"type": "ESCALATE_IF_REQUIRED", "target_group": "legal_review", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    fallback_acceptable_fragments = EXCLUDED.fallback_acceptable_fragments,
    updated_at = NOW();

-- ============================================================================
-- REGLA 2: AlcanceTrabajo
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:AlcanceTrabajo',
    'nueva_planta',
    '2026-01',
    'Alcance del Trabajo',
    'NuevaPlanta.AlcanceTrabajo',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "text": "El alcance del trabajo comprende la ingeniería, suministro, construcción, montaje y puesta en marcha de la instalación según las especificaciones técnicas del Anexo I.\n\nCualquier modificación al alcance deberá ser formalizada mediante una Orden de Cambio, que requerirá acuerdo previo por escrito entre las partes sobre el impacto en plazo y precio.\n\nEl Contratista será responsable de todos los trabajos necesarios para la correcta ejecución del proyecto, incluyendo aquellos implícitamente incluidos según las buenas prácticas de ingeniería y construcción.",
        "summary": "EPC completo con modificaciones mediante Orden de Cambio acordada"
    }'::jsonb,
    '[
        {"id": "ACCEPT_01", "description": "Exclusiones claramente definidas", "pattern": "excluye|no incluye|queda fuera.*alcance"},
        {"id": "ACCEPT_02", "description": "Procedimiento de Orden de Cambio detallado", "pattern": "orden.*cambio|change.*order|modificación.*alcance"},
        {"id": "ACCEPT_03", "description": "Obligaciones implícitas razonables", "pattern": "buenas.*prácticas|estado.*arte|normativa.*aplicable"}
    ]'::jsonb,
    '[
        {"id": "BLOCK_01", "description": "Alcance ilimitado o indefinido", "pattern": "todo.*necesario|cualquier.*trabajo|sin.*limitación", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_02", "description": "Modificaciones unilaterales sin límite", "pattern": "modificar.*unilateralmente|cambiar.*sin.*acuerdo", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_03", "description": "Obligación de resultado garantizado", "pattern": "garantiza.*resultado|asegura.*rendimiento.*específico", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_04", "description": "Scope creep sin compensación", "pattern": "sin.*coste.*adicional|incluido.*precio|sin.*incremento", "action": "ESCALATE_HUMAN"}
    ]'::jsonb,
    'El alcance debe estar claramente definido. Atención especial a cláusulas que amplíen el alcance sin compensación o que permitan modificaciones unilaterales.',
    '{"type": "ESCALATE_IF_REQUIRED", "target_group": "legal_review", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    fallback_acceptable_fragments = EXCLUDED.fallback_acceptable_fragments,
    updated_at = NOW();

-- ============================================================================
-- REGLA 3: Responsabilidades
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:Responsabilidades',
    'nueva_planta',
    '2026-01',
    'Responsabilidades',
    'NuevaPlanta.Responsabilidades',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "text": "El Contratista será responsable de la correcta ejecución de los trabajos y del cumplimiento de todas las obligaciones establecidas en el contrato.\n\nLa responsabilidad del Contratista por daños estará limitada al 100% del valor del contrato, excluyendo en todo caso daños indirectos, consecuenciales o lucro cesante.\n\nEl Propietario será responsable de proporcionar acceso al emplazamiento, los permisos necesarios y la información técnica requerida para la ejecución de los trabajos.",
        "summary": "Responsabilidad limitada al 100% del contrato, sin daños indirectos"
    }'::jsonb,
    '[
        {"id": "ACCEPT_01", "description": "Limitación de responsabilidad razonable", "pattern": "responsabilidad.*limitada.*(50|100|150)%"},
        {"id": "ACCEPT_02", "description": "Exclusión de daños indirectos", "pattern": "excluye.*daños.*indirectos|sin.*lucro.*cesante"},
        {"id": "ACCEPT_03", "description": "Obligaciones recíprocas", "pattern": "propietario.*responsable|obligación.*mutua"}
    ]'::jsonb,
    '[
        {"id": "BLOCK_01", "description": "Responsabilidad ilimitada", "pattern": "responsabilidad.*ilimitada|sin.*límite.*responsabilidad", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_02", "description": "Responsabilidad por daños indirectos", "pattern": "incluye.*lucro.*cesante|daños.*consecuenciales.*incluidos", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_03", "description": "Asunción total de riesgos", "pattern": "asume.*todos.*riesgos|riesgo.*exclusivo.*contratista", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_04", "description": "Exoneración total del Propietario", "pattern": "propietario.*exento|sin.*responsabilidad.*propietario", "action": "BLOCK_EXPORT"}
    ]'::jsonb,
    'Verificar que la responsabilidad esté limitada y que no se asuman daños indirectos. La distribución de riesgos debe ser equitativa entre las partes.',
    '{"type": "ESCALATE_IF_REQUIRED", "target_group": "legal_review", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    fallback_acceptable_fragments = EXCLUDED.fallback_acceptable_fragments,
    updated_at = NOW();

-- ============================================================================
-- REGLA 4: EntregablesHitos
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:EntregablesHitos',
    'nueva_planta',
    '2026-01',
    'Entregables e Hitos',
    'NuevaPlanta.EntregablesHitos',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "text": "Los hitos principales del proyecto se establecen en el Anexo de Calendario. El cumplimiento de cada hito será certificado por la Dirección Facultativa.\n\nLas penalizaciones por retraso se calcularán al 0.5% semanal del valor del hito, con un límite máximo del 10% del valor total del contrato.\n\nLa recepción provisional tendrá lugar tras la finalización de los trabajos y la superación de las pruebas de rendimiento. La recepción definitiva se producirá transcurrido el período de garantía de 24 meses.",
        "summary": "Hitos con penalizaciones limitadas al 10% y garantía de 24 meses"
    }'::jsonb,
    '[
        {"id": "ACCEPT_01", "description": "Penalizaciones limitadas al 10%", "pattern": "penalización.*máximo.*(5|10)%"},
        {"id": "ACCEPT_02", "description": "Período de garantía estándar", "pattern": "garantía.*(12|18|24).*meses"},
        {"id": "ACCEPT_03", "description": "Certificación por tercero", "pattern": "dirección.*facultativa|ingeniero.*independiente"}
    ]'::jsonb,
    '[
        {"id": "BLOCK_01", "description": "Penalizaciones sin límite", "pattern": "penalización.*sin.*límite|penalidades.*ilimitadas", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_02", "description": "Penalizaciones excesivas", "pattern": "penalización.*(15|20|25)%|1%.*diario", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_03", "description": "Garantía excesiva", "pattern": "garantía.*(36|48|60).*meses|garantía.*ilimitada", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_04", "description": "Recepción a satisfacción subjetiva", "pattern": "satisfacción.*exclusiva|criterio.*unilateral.*propietario", "action": "ESCALATE_HUMAN"}
    ]'::jsonb,
    'Los hitos deben ser medibles y las penalizaciones proporcionales. Atención especial a penalizaciones acumulativas sin límite y períodos de garantía excesivos.',
    '{"type": "ESCALATE_IF_REQUIRED", "target_group": "legal_review", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    fallback_acceptable_fragments = EXCLUDED.fallback_acceptable_fragments,
    updated_at = NOW();

-- ============================================================================
-- REGLA 5: TerminacionRescision
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:TerminacionRescision',
    'nueva_planta',
    '2026-01',
    'Terminación y Rescisión',
    'NuevaPlanta.TerminacionRescision',
    true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{
        "text": "El contrato podrá ser resuelto por cualquiera de las partes en caso de incumplimiento grave de las obligaciones contractuales, previa notificación escrita con un plazo de subsanación de 30 días.\n\nEn caso de terminación por conveniencia del Propietario, este deberá abonar al Contratista el valor de los trabajos ejecutados, los materiales acopiados y una compensación del 10% sobre el trabajo no ejecutado.\n\nLa terminación del contrato no exime a las partes del cumplimiento de las obligaciones de confidencialidad y las garantías sobre los trabajos ya ejecutados.",
        "summary": "Resolución con preaviso de 30 días y compensación por terminación por conveniencia"
    }'::jsonb,
    '[
        {"id": "ACCEPT_01", "description": "Preaviso razonable", "pattern": "preaviso.*(15|30|45).*días"},
        {"id": "ACCEPT_02", "description": "Compensación por terminación", "pattern": "compensación.*(5|10|15)%.*trabajo.*no.*ejecutado"},
        {"id": "ACCEPT_03", "description": "Plazo de subsanación", "pattern": "subsanación.*(15|30).*días|oportunidad.*corregir"}
    ]'::jsonb,
    '[
        {"id": "BLOCK_01", "description": "Terminación sin compensación", "pattern": "sin.*indemnización|sin.*compensación.*contratista", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_02", "description": "Terminación inmediata sin causa", "pattern": "terminación.*inmediata|sin.*preaviso.*alguno", "action": "ESCALATE_HUMAN"},
        {"id": "BLOCK_03", "description": "Pérdida de derechos al resolver", "pattern": "pierde.*todos.*derechos|renuncia.*reclamaciones", "action": "BLOCK_EXPORT"},
        {"id": "BLOCK_04", "description": "Abandono forzoso inmediato", "pattern": "abandonar.*inmediatamente|desalojar.*(24|48).*horas", "action": "ESCALATE_HUMAN"}
    ]'::jsonb,
    'Las cláusulas de terminación deben ser equilibradas. Verificar que existe compensación por terminación por conveniencia y plazos razonables de preaviso.',
    '{"type": "ESCALATE_IF_REQUIRED", "target_group": "legal_review", "block_export_if_escalated": true}'::jsonb,
    '{"auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    fallback_acceptable_fragments = EXCLUDED.fallback_acceptable_fragments,
    updated_at = NOW();

-- ============================================================================
-- REGLA 6: OtroDesconocido (fallback)
-- ============================================================================
INSERT INTO public.playbook_rules (
    rule_id,
    playbook_id,
    playbook_version,
    rule_name,
    clause_family,
    required,
    analysis_mode,
    standard_position,
    fallback_acceptable_fragments,
    unacceptable_patterns,
    guidance_internal,
    routing_policy,
    decision_policy
) VALUES (
    'NuevaPlanta:2026-01:OtroDesconocido',
    'nueva_planta',
    '2026-01',
    'Otras Cláusulas',
    'NuevaPlanta.OtroDesconocido',
    false,
    'MODE_POLICY_JUDGMENT_REQUIRED',
    '{
        "text": "Esta cláusula no encaja en las familias principales del playbook. Requiere revisión manual para determinar su clasificación y análisis apropiado.",
        "summary": "Cláusula no clasificada - requiere revisión manual"
    }'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'Cláusula no clasificada automáticamente. Revisar manualmente para determinar si corresponde a alguna familia existente o si requiere una nueva categoría.',
    '{"type": "ALWAYS_ESCALATE", "target_group": "legal_review", "block_export_if_escalated": false}'::jsonb,
    '{"auto_redline_if_unacceptable": false, "anchor_conf_threshold": 0.5, "escalate_if_ambiguous": true, "block_export_if_escalated": false}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    updated_at = NOW();

-- ============================================================================
-- 2. VERIFICACIÓN
-- ============================================================================

-- Verificar reglas insertadas
SELECT
    rule_id,
    clause_family,
    required,
    analysis_mode,
    standard_position->>'summary' as position_summary
FROM public.playbook_rules
WHERE playbook_id = 'nueva_planta'
ORDER BY rule_id;

-- Contar reglas por playbook
SELECT
    playbook_id,
    playbook_version,
    COUNT(*) as total_rules
FROM public.playbook_rules
GROUP BY playbook_id, playbook_version;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
