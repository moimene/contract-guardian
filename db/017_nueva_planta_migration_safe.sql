-- ============================================================================
-- MIGRACIÓN SEGURA: Nueva Planta
-- Ejecutar en: Tu Supabase externo (hvlsuwdqtfiilvampxq)
-- Fecha: 2026-01-17
--
-- Esta migración detecta la estructura existente y añade lo necesario
-- sin errores por duplicados
-- ============================================================================

-- ============================================================================
-- PASO 1: Añadir columnas faltantes a playbook_rules en schema PUBLIC
-- ============================================================================

-- Añadir playbook_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'playbook_rules'
        AND column_name = 'playbook_id'
    ) THEN
        ALTER TABLE public.playbook_rules ADD COLUMN playbook_id TEXT DEFAULT 'amazon_psa';
    END IF;
END $$;

-- Añadir playbook_version si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'playbook_rules'
        AND column_name = 'playbook_version'
    ) THEN
        ALTER TABLE public.playbook_rules ADD COLUMN playbook_version TEXT DEFAULT '1.0.0';
    END IF;
END $$;

-- Añadir rule_name si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'playbook_rules'
        AND column_name = 'rule_name'
    ) THEN
        ALTER TABLE public.playbook_rules ADD COLUMN rule_name TEXT;
        -- Copiar clause_family a rule_name para registros existentes
        UPDATE public.playbook_rules SET rule_name = clause_family WHERE rule_name IS NULL;
    END IF;
END $$;

-- Añadir fallback_acceptable_fragments si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'playbook_rules'
        AND column_name = 'fallback_acceptable_fragments'
    ) THEN
        ALTER TABLE public.playbook_rules ADD COLUMN fallback_acceptable_fragments JSONB DEFAULT '[]';
    END IF;
END $$;

-- ============================================================================
-- PASO 2: Crear/actualizar tabla clause_reviews en PUBLIC con estructura correcta
-- ============================================================================

-- Si clause_reviews no existe, crearla
CREATE TABLE IF NOT EXISTS public.clause_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_instance_id TEXT NOT NULL,
    clause_id TEXT,
    document_id UUID,
    run_id UUID,
    sequence_number INTEGER DEFAULT 0,
    heading TEXT,
    clause_text TEXT,
    detected_family TEXT,
    confidence_score NUMERIC(5,4) DEFAULT 0,
    client_state TEXT DEFAULT 'NEEDS_REVIEW' CHECK (client_state IN ('OK', 'RECOMMENDED', 'REQUIRED', 'NEEDS_REVIEW', 'BLOCKED')),
    client_comment TEXT,
    client_summary_line TEXT,
    proposed_changes JSONB DEFAULT '[]',
    escalation_recommended BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columnas faltantes a clause_reviews si ya existía con otra estructura
DO $$
BEGIN
    -- client_state
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'client_state'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN client_state TEXT DEFAULT 'NEEDS_REVIEW';
    END IF;

    -- clause_instance_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'clause_instance_id'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN clause_instance_id TEXT;
    END IF;

    -- client_comment
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'client_comment'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN client_comment TEXT;
    END IF;

    -- client_summary_line
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'client_summary_line'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN client_summary_line TEXT;
    END IF;

    -- proposed_changes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'proposed_changes'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN proposed_changes JSONB DEFAULT '[]';
    END IF;

    -- escalation_recommended
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'escalation_recommended'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN escalation_recommended BOOLEAN DEFAULT false;
    END IF;

    -- escalation_reason
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'escalation_reason'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN escalation_reason TEXT;
    END IF;

    -- detected_family
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'detected_family'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN detected_family TEXT;
    END IF;

    -- confidence_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clause_reviews'
        AND column_name = 'confidence_score'
    ) THEN
        ALTER TABLE public.clause_reviews ADD COLUMN confidence_score NUMERIC(5,4) DEFAULT 0;
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_clause_reviews_document ON public.clause_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_state ON public.clause_reviews(client_state);
CREATE INDEX IF NOT EXISTS idx_clause_reviews_instance ON public.clause_reviews(clause_instance_id);

-- ============================================================================
-- PASO 3: Crear/actualizar tabla escalation_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escalation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_instance_id TEXT,
    run_id UUID,
    document_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
    message TEXT,
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columnas faltantes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'escalation_requests'
        AND column_name = 'clause_instance_id'
    ) THEN
        ALTER TABLE public.escalation_requests ADD COLUMN clause_instance_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'escalation_requests'
        AND column_name = 'document_id'
    ) THEN
        ALTER TABLE public.escalation_requests ADD COLUMN document_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'escalation_requests'
        AND column_name = 'urgency'
    ) THEN
        ALTER TABLE public.escalation_requests ADD COLUMN urgency TEXT DEFAULT 'medium';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON public.escalation_requests(status);

-- ============================================================================
-- PASO 4: Crear tabla escalation_comments si no existe
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escalation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escalation_id UUID REFERENCES public.escalation_requests(id) ON DELETE CASCADE,
    user_id UUID,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_comments_escalation ON public.escalation_comments(escalation_id);

-- ============================================================================
-- PASO 5: Asegurar tabla documents tiene columnas necesarias
-- ============================================================================

DO $$
BEGIN
    -- contract_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'contract_type'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN contract_type TEXT DEFAULT 'amazon_psa';
    END IF;

    -- playbook_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'playbook_id'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN playbook_id TEXT DEFAULT 'amazon_psa';
    END IF;

    -- playbook_version
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'playbook_version'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN playbook_version TEXT DEFAULT '1.0.0';
    END IF;

    -- contract_decision
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'contract_decision'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN contract_decision TEXT;
    END IF;

    -- escalations_pending
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'escalations_pending'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN escalations_pending INTEGER DEFAULT 0;
    END IF;

    -- processing_started_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'processing_started_at'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN processing_started_at TIMESTAMPTZ;
    END IF;

    -- processing_completed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = 'processing_completed_at'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN processing_completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================================================
-- PASO 6: Crear tabla contract_runs si no existe
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID UNIQUE DEFAULT gen_random_uuid(),
    document_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'blocked', 'review_pending')),
    playbook_id TEXT,
    playbook_version TEXT,
    total_clauses INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_runs_document ON public.contract_runs(document_id);
CREATE INDEX IF NOT EXISTS idx_contract_runs_status ON public.contract_runs(status);

-- ============================================================================
-- PASO 7: Habilitar RLS y políticas permisivas para desarrollo
-- ============================================================================

ALTER TABLE public.clause_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_runs ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (sin auth)
DROP POLICY IF EXISTS "Allow all for dev" ON public.clause_reviews;
CREATE POLICY "Allow all for dev" ON public.clause_reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dev" ON public.escalation_requests;
CREATE POLICY "Allow all for dev" ON public.escalation_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dev" ON public.escalation_comments;
CREATE POLICY "Allow all for dev" ON public.escalation_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dev" ON public.contract_runs;
CREATE POLICY "Allow all for dev" ON public.contract_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dev" ON public.playbook_rules;
CREATE POLICY "Allow all for dev" ON public.playbook_rules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dev" ON public.documents;
CREATE POLICY "Allow all for dev" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PASO 8: Habilitar Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.clause_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contract_runs;

-- ============================================================================
-- PASO 9: INSERTAR REGLAS DE PLAYBOOK PARA NUEVA PLANTA
-- ============================================================================

-- PrecioPagos
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:PrecioPagos',
    'nueva_planta', '2026-01', 'Precio y Pagos', 'NuevaPlanta.PrecioPagos', true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"text": "El precio del contrato será un precio alzado firme (lump sum), sin revisiones durante la vigencia del contrato. Los pagos se realizarán contra certificaciones mensuales con plazo de 60 días. Retención del 5% como garantía.", "summary": "Precio alzado firme con pagos mensuales a 60 días y retención del 5%"}'::jsonb,
    '[{"id": "BLOCK_01", "description": "Revisión de precios sin límite", "pattern": "revisión.*precios.*sin.*límite", "action": "BLOCK_EXPORT"}, {"id": "BLOCK_02", "description": "Pago diferido total a fin de obra", "pattern": "pago.*único.*finalización", "action": "BLOCK_EXPORT"}]'::jsonb,
    'Analizar condiciones de pago, retenciones y ajustes de precio.',
    '{"type": "ESCALATE_IF_REQUIRED", "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- AlcanceTrabajo
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:AlcanceTrabajo',
    'nueva_planta', '2026-01', 'Alcance del Trabajo', 'NuevaPlanta.AlcanceTrabajo', true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"text": "El alcance comprende ingeniería, suministro, construcción, montaje y puesta en marcha según especificaciones del Anexo I. Modificaciones mediante Orden de Cambio con acuerdo previo.", "summary": "EPC completo con modificaciones mediante Orden de Cambio acordada"}'::jsonb,
    '[{"id": "BLOCK_01", "description": "Alcance ilimitado", "pattern": "todo.*necesario|cualquier.*trabajo|sin.*limitación", "action": "ESCALATE_HUMAN"}, {"id": "BLOCK_02", "description": "Modificaciones unilaterales", "pattern": "modificar.*unilateralmente|cambiar.*sin.*acuerdo", "action": "BLOCK_EXPORT"}]'::jsonb,
    'Verificar que el alcance esté claramente definido.',
    '{"type": "ESCALATE_IF_REQUIRED", "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- Responsabilidades
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:Responsabilidades',
    'nueva_planta', '2026-01', 'Responsabilidades', 'NuevaPlanta.Responsabilidades', true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"text": "Responsabilidad del Contratista limitada al 100% del valor del contrato, excluyendo daños indirectos y lucro cesante.", "summary": "Responsabilidad limitada al 100% del contrato, sin daños indirectos"}'::jsonb,
    '[{"id": "BLOCK_01", "description": "Responsabilidad ilimitada", "pattern": "responsabilidad.*ilimitada|sin.*límite.*responsabilidad", "action": "BLOCK_EXPORT"}, {"id": "BLOCK_02", "description": "Incluye daños indirectos", "pattern": "incluye.*lucro.*cesante|daños.*consecuenciales.*incluidos", "action": "ESCALATE_HUMAN"}]'::jsonb,
    'Verificar límites de responsabilidad y exclusión de daños indirectos.',
    '{"type": "ESCALATE_IF_REQUIRED", "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- EntregablesHitos
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:EntregablesHitos',
    'nueva_planta', '2026-01', 'Entregables e Hitos', 'NuevaPlanta.EntregablesHitos', true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"text": "Hitos según Anexo de Calendario. Penalizaciones por retraso al 0.5% semanal con límite del 10% total. Garantía de 24 meses.", "summary": "Hitos con penalizaciones limitadas al 10% y garantía de 24 meses"}'::jsonb,
    '[{"id": "BLOCK_01", "description": "Penalizaciones sin límite", "pattern": "penalización.*sin.*límite|penalidades.*ilimitadas", "action": "BLOCK_EXPORT"}, {"id": "BLOCK_02", "description": "Penalizaciones excesivas", "pattern": "penalización.*(15|20|25)%|1%.*diario", "action": "ESCALATE_HUMAN"}]'::jsonb,
    'Los hitos deben ser medibles y las penalizaciones proporcionales.',
    '{"type": "ESCALATE_IF_REQUIRED", "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- TerminacionRescision
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:TerminacionRescision',
    'nueva_planta', '2026-01', 'Terminación y Rescisión', 'NuevaPlanta.TerminacionRescision', true,
    'MODE_ENUMERATED_DEVIATIONS',
    '{"text": "Resolución por incumplimiento grave con preaviso de 30 días y plazo de subsanación. Compensación del 10% por terminación por conveniencia.", "summary": "Resolución con preaviso de 30 días y compensación por terminación por conveniencia"}'::jsonb,
    '[{"id": "BLOCK_01", "description": "Terminación sin compensación", "pattern": "sin.*indemnización|sin.*compensación.*contratista", "action": "BLOCK_EXPORT"}, {"id": "BLOCK_02", "description": "Terminación inmediata sin causa", "pattern": "terminación.*inmediata|sin.*preaviso.*alguno", "action": "ESCALATE_HUMAN"}]'::jsonb,
    'Verificar equilibrio en cláusulas de terminación.',
    '{"type": "ESCALATE_IF_REQUIRED", "block_export_if_escalated": true}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    unacceptable_patterns = EXCLUDED.unacceptable_patterns,
    updated_at = NOW();

-- OtroDesconocido (fallback)
INSERT INTO public.playbook_rules (
    rule_id, playbook_id, playbook_version, rule_name, clause_family, required,
    analysis_mode, standard_position, unacceptable_patterns, guidance_internal, routing_policy
) VALUES (
    'NuevaPlanta:2026-01:OtroDesconocido',
    'nueva_planta', '2026-01', 'Otras Cláusulas', 'NuevaPlanta.OtroDesconocido', false,
    'MODE_POLICY_JUDGMENT_REQUIRED',
    '{"text": "Cláusula no clasificada. Requiere revisión manual.", "summary": "Requiere revisión manual"}'::jsonb,
    '[]'::jsonb,
    'Cláusula no clasificada automáticamente.',
    '{"type": "ALWAYS_ESCALATE", "block_export_if_escalated": false}'::jsonb
) ON CONFLICT (rule_id) DO UPDATE SET
    standard_position = EXCLUDED.standard_position,
    updated_at = NOW();

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 'Verificación de tablas:' as info;

SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public'
AND table_name IN ('documents', 'playbook_rules', 'clause_reviews', 'escalation_requests', 'contract_runs');

SELECT 'Reglas de Nueva Planta insertadas:' as info;
SELECT rule_id, clause_family, required FROM public.playbook_rules WHERE playbook_id = 'nueva_planta';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
