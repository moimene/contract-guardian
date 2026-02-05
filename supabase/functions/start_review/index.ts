import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { document_id, contract_type_id, anonymization_mode, party_aliases } = await req.json()

    if (!document_id) throw new Error('document_id is required')

    // 1. Get Document
    const { data: doc, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('document_id', document_id)
      .single()

    if (docError || !doc) throw new Error('Document not found')

    // 2. Create Run
    const { data: run, error: runError } = await supabaseClient
      .from('contract_runs')
      .insert({
        document_id: document_id,
        status: 'CREATED',
        stage: 'INITIALIZATION',
        contract_type_id: contract_type_id || 'amazon-psa',
        metadata: {
          anonymization_mode,
          party_aliases,
          triggered_by: 'ui_v2',
        }
      })
      .select('run_id') // Important: Return run_id
      .single()

    if (runError) throw new Error(`Failed to create run: ${runError.message}`)

    // 3. Call n8n Workflow (W3 v3)
    // Canonical Path: contract-review-v3
    const N8N_WEBHOOK_URL = 'https://mmenendeza.app.n8n.cloud/webhook/contract-review-v3'

    console.log(`Triggering W3 at ${N8N_WEBHOOK_URL} for run ${run.run_id}`)

    const n8nPayload = {
      document_id,
      run_id: run.run_id,
      contract_type_id: contract_type_id || 'amazon-psa',
      file_name: doc.file_name,
      file_path: doc.file_path,
      storage_path: doc.storage_path, // For W3 v4.0 native extraction
      anonymization_mode,
      party_aliases
    }

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    })

    let n8nData = {}
    try {
      n8nData = await n8nResponse.json()
    } catch (e) {
      console.warn('n8n response parsing failed or timed out', e)
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.run_id,
        n8n_status: n8nResponse.status,
        n8n_data: n8nData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error starting review:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
