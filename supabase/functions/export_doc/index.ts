// supabase/functions/export_doc/index.ts
// Edge Function: Exporta documento DOCX con markup
// PRD v1.2 - SOLO permite export si decision = READY_FOR_EXPORT

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportDocInput {
  run_id: string
  format?: 'docx'
  include_comments?: boolean
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
    const body: ExportDocInput = await req.json()
    const {
      run_id,
      format = 'docx',
      include_comments = true
    } = body

    // Validar run_id
    if (!run_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'run_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verificar que el run existe y esta READY_FOR_EXPORT
    const { data: run, error: runError } = await supabaseClient
      .from('contract_runs')
      .select('run_id, document_id, decision, status')
      .eq('run_id', run_id)
      .single()

    if (runError || !run) {
      return new Response(
        JSON.stringify({ success: false, error: 'Documento no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CRITICO: Solo permitir export si READY_FOR_EXPORT
    if (run.decision !== 'READY_FOR_EXPORT') {
      // Mensaje neutral (no revelar logica interna)
      const userMessage = run.decision === 'BLOCK_EXPORT'
        ? 'Este documento requiere atencion antes de poder exportarse.'
        : run.decision === 'ESCALATE_HUMAN'
          ? 'Este documento esta pendiente de revision.'
          : 'El documento aun no esta listo para exportar.';

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
          can_request_review: run.decision !== 'READY_FOR_EXPORT'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Obtener documento
    const { data: doc } = await supabaseClient
      .from('documents')
      .select('file_name, storage_path')
      .eq('document_id', run.document_id)
      .single()

    // 3. Llamar a n8n export workflow (URL server-side)
    const n8nExportUrl = Deno.env.get('N8N_WEBHOOK_EXPORT_DOC')
    let download_url: string | null = null

    if (n8nExportUrl) {
      try {
        const exportResponse = await fetch(n8nExportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id,
            document_id: run.document_id,
            format,
            include_comments
          })
        })

        if (exportResponse.ok) {
          const exportResult = await exportResponse.json()
          download_url = exportResult.download_url
        } else {
          console.error('n8n export failed:', await exportResponse.text())
        }
      } catch (n8nError) {
        console.error('n8n export error:', n8nError)
      }
    }

    // 4. Si no hay n8n o fallo, generar URL de storage directo (fallback)
    if (!download_url && doc?.storage_path) {
      const { data: signedUrl } = await supabaseClient
        .storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600) // 1 hora

      download_url = signedUrl?.signedUrl || null
    }

    // 5. Audit event (interno)
    await supabaseClient
      .from('audit_events')
      .insert({
        run_id,
        document_id: run.document_id,
        clause_instance_id: 'system',
        step: 'persist',
        action: 'export_generated',
        payload: {
          format,
          include_comments,
          download_url: download_url ? '[generated]' : null, // No guardar URL real en audit
          exported_at: new Date().toISOString()
        },
        actor_type: 'system',
        actor_id: 'edge_function:export_doc'
      })

    // 6. Actualizar documento con referencia al export
    if (download_url) {
      await supabaseClient
        .from('documents')
        .update({
          output_drive_file_id: `export_${run_id}_${Date.now()}`
        })
        .eq('document_id', run.document_id)
    }

    // 7. Respuesta exitosa
    if (download_url) {
      return new Response(
        JSON.stringify({
          success: true,
          download_url,
          filename: doc?.file_name
            ? `${doc.file_name.replace(/\.[^.]+$/, '')}_REDLINED.docx`
            : `document_${run_id}_REDLINED.docx`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se pudo generar el documento. Intente nuevamente.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('export_doc error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al exportar el documento'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
