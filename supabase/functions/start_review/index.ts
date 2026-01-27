// supabase/functions/start_review/index.ts
// Edge Function: Inicia revision de contrato
// PRD v1.2 - Proxy obligatorio (frontend NO conoce n8n)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartReviewInput {
  document_id: string
  contract_type_id?: string
  source_file_ref?: string
  anonymization_mode?: 'OFF' | 'DISPLAY_ONLY' | 'FULL'
  party_aliases?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente Supabase con service role (acceso completo)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parsear request
    const body: StartReviewInput = await req.json()
    const {
      document_id,
      contract_type_id = 'dsa_streaming_v1',
      anonymization_mode = 'OFF',
      party_aliases = {}
    } = body

    // Validar document_id
    if (!document_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'document_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verificar que el documento existe
    const { data: doc, error: docError } = await supabaseClient
      .from('documents')
      .select('document_id, file_name, status')
      .eq('document_id', document_id)
      .single()

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ success: false, error: 'Documento no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Crear contract_run
    const { data: run, error: runError } = await supabaseClient
      .from('contract_runs')
      .insert({
        document_id,
        status: 'CREATED',
        decision: 'PROCESSING',
        total_clauses: 0,
        processed_clauses: 0
      })
      .select()
      .single()

    if (runError) {
      console.error('Error creating run:', runError)
      throw new Error('Error al crear run de revision')
    }

    // 3. Actualizar documento a PROCESSING
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        contract_decision: 'PROCESSING',
        processing_started_at: new Date().toISOString(),
        status: 'processing'
      })
      .eq('document_id', document_id)

    if (updateError) {
      console.error('Error updating document:', updateError)
    }

    // 4. Llamar a n8n Contract Review workflow (URL server-side, NUNCA expuesta)
    const n8nUrl = Deno.env.get('N8N_WEBHOOK_CONTRACT_REVIEW')

    if (n8nUrl) {
      try {
        const n8nResponse = await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id,
            run_id: run.run_id,
            contract_type_id,
            anonymization_mode,
            party_aliases
          })
        })

        if (!n8nResponse.ok) {
          console.error('n8n webhook failed:', await n8nResponse.text())
        }
      } catch (n8nError) {
        console.error('n8n call error:', n8nError)
        // No fallar la request, el run ya esta creado
      }
    } else {
      console.warn('N8N_WEBHOOK_CONTRACT_REVIEW not configured')
    }

    // 5. Audit event (interno - solo visible para despacho)
    await supabaseClient
      .from('audit_events')
      .insert({
        run_id: run.run_id,
        document_id,
        clause_instance_id: 'system',
        step: 'persist',
        action: 'start_review_triggered',
        payload: {
          contract_type_id,
          anonymization_mode,
          party_aliases,
          triggered_at: new Date().toISOString()
        },
        actor_type: 'system',
        actor_id: 'edge_function:start_review'
      })

    // 6. Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.run_id,
        document_id,
        status: 'PROCESSING'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('start_review error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
