// supabase/functions/monitoring/index.ts
// Edge Function: Dashboard de monitoreo
// T-008: Logs estructurados y métricas

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

        // Get monitoring dashboard
        const { data, error } = await supabaseClient.rpc('get_monitoring_dashboard')

        if (error) {
            console.error('Monitoring error:', error)
            throw error
        }

        return new Response(
            JSON.stringify({
                success: true,
                dashboard: data,
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('monitoring error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error al obtener métricas'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
