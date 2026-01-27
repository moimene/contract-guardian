// supabase/functions/request_review/index.ts
// Edge Function: Solicita revision humana (escalado)
// PRD v1.2 - Cliente puede solicitar revision cuando hay bloqueo o requiere atencion

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestReviewInput {
  run_id: string
  clause_instance_id?: string  // Si es null, es escalado a nivel de contrato
  message?: string             // Mensaje opcional del cliente
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parsear request
    const body: RequestReviewInput = await req.json()
    const { run_id, clause_instance_id, message } = body

    // Validar run_id
    if (!run_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'run_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verificar que el run existe
    const { data: run, error: runError } = await supabaseClient
      .from('contract_runs')
      .select('run_id, document_id, decision, status')
      .eq('run_id', run_id)
      .single()

    if (runError || !run) {
      return new Response(
        JSON.stringify({ success: false, error: 'Run no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Generar ID de escalacion
    const escalation_id = crypto.randomUUID()

    // 3. Registrar audit event (interno)
    await supabaseClient
      .from('audit_events')
      .insert({
        run_id,
        document_id: run.document_id,
        clause_instance_id: clause_instance_id || 'contract_level',
        step: 'persist',
        action: 'review_requested',
        payload: {
          escalation_id,
          message: message || null,
          previous_decision: run.decision,
          requested_at: new Date().toISOString()
        },
        actor_type: 'human',
        actor_id: 'client_user'
      })

    // 4. Actualizar decision del run si es escalado a nivel de contrato
    if (!clause_instance_id) {
      await supabaseClient
        .from('contract_runs')
        .update({
          decision: 'ESCALATE_HUMAN'
        })
        .eq('run_id', run_id)

      // Actualizar documento tambien
      await supabaseClient
        .from('documents')
        .update({
          contract_decision: 'ESCALATE_HUMAN',
          escalations_pending: 1
        })
        .eq('document_id', run.document_id)
    } else {
      // Incrementar contador de escalaciones en documento
      await supabaseClient
        .rpc('increment_escalations', { doc_id: run.document_id })
        .catch(() => {
          // Si no existe la funcion, actualizar manualmente
          supabaseClient
            .from('documents')
            .update({ escalations_pending: 1 })
            .eq('document_id', run.document_id)
        })
    }

    // 5. Respuesta exitosa (mensaje neutral para cliente)
    return new Response(
      JSON.stringify({
        success: true,
        escalation_id,
        message: 'Solicitud de revision enviada correctamente'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('request_review error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al procesar la solicitud'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
