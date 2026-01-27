// supabase/functions/update_run_status/index.ts
// Edge Function: Webhook para que n8n actualice el status de contract_runs
// T-002: Permite que n8n notifique cuando termina el procesamiento

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateRunStatusInput {
    run_id: string
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    decision?: 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | 'PROCESSING' | 'ERROR'
    total_clauses?: number
    processed_clauses?: number
    error_message?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Crear cliente Supabase con service role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Parsear request
        const body: UpdateRunStatusInput = await req.json()
        const {
            run_id,
            status,
            decision,
            total_clauses,
            processed_clauses,
            error_message
        } = body

        // Validar run_id
        if (!run_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'run_id es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validar status
        if (!status) {
            return new Response(
                JSON.stringify({ success: false, error: 'status es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Verificar que el run existe
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

        // 2. Construir update object
        const updateData: Record<string, unknown> = {
            status
        }

        if (decision) updateData.decision = decision
        if (total_clauses !== undefined) updateData.total_clauses = total_clauses
        if (processed_clauses !== undefined) updateData.processed_clauses = processed_clauses
        if (error_message) updateData.error_message = error_message

        // Set completed_at for terminal states
        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
            updateData.completed_at = new Date().toISOString()
        }

        // 3. Actualizar contract_run
        const { error: updateError } = await supabaseClient
            .from('contract_runs')
            .update(updateData)
            .eq('run_id', run_id)

        if (updateError) {
            console.error('Error updating run:', updateError)
            throw new Error('Error al actualizar run')
        }

        // 4. Si completado, actualizar documento también
        if (status === 'COMPLETED' || status === 'FAILED') {
            const docUpdate: Record<string, unknown> = {
                status: status === 'COMPLETED' ? 'reviewed' : 'failed',
                processing_completed_at: new Date().toISOString()
            }

            if (decision) {
                docUpdate.contract_decision = decision
            }

            await supabaseClient
                .from('documents')
                .update(docUpdate)
                .eq('document_id', run.document_id)
        }

        // 5. Audit event
        await supabaseClient
            .from('audit_events')
            .insert({
                run_id,
                document_id: run.document_id,
                clause_instance_id: 'system',
                step: 'persist',
                action: 'run_status_updated',
                payload: {
                    previous_status: run.status,
                    new_status: status,
                    decision,
                    total_clauses,
                    processed_clauses,
                    updated_at: new Date().toISOString()
                },
                actor_type: 'system',
                actor_id: 'n8n:update_run_status'
            })

        // 6. Respuesta exitosa
        return new Response(
            JSON.stringify({
                success: true,
                run_id,
                status,
                decision: decision || run.decision,
                message: `Run actualizado a ${status}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('update_run_status error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Error interno'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
