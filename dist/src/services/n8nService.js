"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadContractToN8n = uploadContractToN8n;
exports.startContractReview = startContractReview;
exports.getReviewConfig = getReviewConfig;
exports.getPlaybookId = getPlaybookId;
const client_1 = require("@/integrations/supabase/client");
const SUPABASE_FUNCTIONS_URL = 'https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1';
async function uploadContractToN8n(payload) {
    const { data: sessionData } = await client_1.supabase.auth.getSession();
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/n8n-proxy?workflow=file-upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`n8n proxy error: ${response.status}`);
    }
    return response.json();
}
async function startContractReview(payload) {
    const { data: sessionData } = await client_1.supabase.auth.getSession();
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/n8n-proxy?workflow=contract-review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`n8n proxy error: ${response.status}`);
    }
    return response.json();
}
// NUEVO: Obtener configuración del resolver 3-layer
async function getReviewConfig(contractTypeId) {
    const { data, error } = await client_1.supabase
        .from('contract_type_review_defaults')
        .select('blueprint_version_id, contract_model_version_id, knowledge_graph_id')
        .eq('contract_type_id', contractTypeId)
        .eq('is_active', true)
        .maybeSingle();
    if (error || !data) {
        console.warn(`No 3-layer config for ${contractTypeId}, using legacy playbook`);
        return null;
    }
    return data;
}
// Legacy: Mapeo estático para playbooks (fallback)
function getPlaybookId(contractTypeId) {
    const legacyMap = {
        'amazon-psa': 'amazon_psa_v1',
        'amazon-dsa': 'amazon_dsa_v1',
        'dsa_streaming_v1': 'dsa_streaming_v1',
        'nueva-planta-epc': 'nueva_planta_epc_v1',
    };
    return legacyMap[contractTypeId] || 'default_playbook';
}
//# sourceMappingURL=n8nService.js.map