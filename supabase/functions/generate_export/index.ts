// supabase/functions/generate_export/index.ts
// Edge Function: Genera documento exportable con track changes
// T-003: Implementación simplificada para MVP

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateExportInput {
    run_id: string
    format?: 'docx' | 'pdf'
    include_comments?: boolean
}

interface ClauseReview {
    clause_text: string
    proposed_changes: {
        redline?: string
        changes?: Array<{ type: string; text: string }>
    } | null
    heading: string | null
    sequence_number: number
    client_state: string | null
    decision: string | null
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

        const body: GenerateExportInput = await req.json()
        const { run_id, format = 'docx', include_comments = true } = body

        if (!run_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'run_id es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Get run info
        const { data: run, error: runError } = await supabaseClient
            .from('contract_runs')
            .select('run_id, document_id, status, decision')
            .eq('run_id', run_id)
            .single()

        if (runError || !run) {
            return new Response(
                JSON.stringify({ success: false, error: 'Run no encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Get document info
        const { data: doc } = await supabaseClient
            .from('documents')
            .select('file_name, storage_path')
            .eq('document_id', run.document_id)
            .single()

        // 3. Get clause reviews with proposed changes
        const { data: reviews } = await supabaseClient
            .from('clause_reviews')
            .select('clause_text, proposed_changes, heading, sequence_number, client_state, decision')
            .eq('run_id', run_id)
            .order('sequence_number') as { data: ClauseReview[] | null }

        // 4. Build export summary
        const acceptedChanges = (reviews || []).filter(
            (r: ClauseReview) => r.client_state === 'accepted' && r.proposed_changes?.redline
        )

        const totalClauses = reviews?.length || 0
        const changesApplied = acceptedChanges.length

        // 5. Generate Markdown export (MVP - full DOCX requires Aspose on n8n)
        let exportContent = `# Contract Review Export\n\n`
        exportContent += `**Document**: ${doc?.file_name || 'Unknown'}\n`
        exportContent += `**Run ID**: ${run_id}\n`
        exportContent += `**Date**: ${new Date().toISOString()}\n`
        exportContent += `**Total Clauses**: ${totalClauses}\n`
        exportContent += `**Changes Applied**: ${changesApplied}\n\n`
        exportContent += `---\n\n`

        for (const review of (reviews || [])) {
            exportContent += `## ${review.heading || `Clause ${review.sequence_number}`}\n\n`

            if (review.client_state === 'accepted' && review.proposed_changes?.redline) {
                exportContent += `**Status**: ✅ Accepted Changes\n\n`
                exportContent += `### Original:\n${review.clause_text}\n\n`
                exportContent += `### Revised:\n${review.proposed_changes.redline}\n\n`
            } else if (review.client_state === 'rejected') {
                exportContent += `**Status**: ❌ Changes Rejected (Original Retained)\n\n`
                exportContent += `${review.clause_text}\n\n`
            } else {
                exportContent += `**Status**: ⏸️ ${review.decision || 'Pending Review'}\n\n`
                exportContent += `${review.clause_text}\n\n`
            }

            exportContent += `---\n\n`
        }

        // 6. Upload export to storage
        const exportPath = `exports/${run_id}_EXPORT.md`
        const exportBuffer = new TextEncoder().encode(exportContent)

        await supabaseClient.storage.from('contracts').upload(exportPath, exportBuffer, {
            contentType: 'text/markdown',
            upsert: true
        })

        // 7. Get signed URL
        const { data: signedUrl } = await supabaseClient.storage
            .from('contracts')
            .createSignedUrl(exportPath, 3600)

        // 8. Audit event
        await supabaseClient.from('audit_events').insert({
            run_id,
            document_id: run.document_id,
            clause_instance_id: 'system',
            step: 'persist',
            action: 'export_generated',
            payload: {
                format: 'markdown',
                total_clauses: totalClauses,
                changes_applied: changesApplied,
                exported_at: new Date().toISOString()
            },
            actor_type: 'system',
            actor_id: 'edge_function:generate_export'
        })

        // 9. Response
        return new Response(
            JSON.stringify({
                success: true,
                run_id,
                download_url: signedUrl?.signedUrl,
                filename: (doc?.file_name || 'document').replace(/\.[^.]+$/, '') + '_EXPORT.md',
                format: 'markdown',
                total_clauses: totalClauses,
                changes_applied: changesApplied,
                note: 'Para DOCX con track changes, ejecutar scripts/generate_redline.js'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('generate_export error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error al generar exportación'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
