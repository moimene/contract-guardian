import { supabase } from '@/integrations/supabase/client';

const SUPABASE_FUNCTIONS_URL = 'https://hvlsuwdqtffiilvampxq.supabase.co/functions/v1';

export interface ReviewConfig {
    blueprint_version_id: string;
    contract_model_version_id: string | null;
    knowledge_graph_id: string | null;
}

export interface FileUploadPayload {
    file_name: string;
    file_path: string;
    mime_type: string;
    playbook_id?: string;  // Legacy
    blueprint_version_id?: string;  // 3-layer
    tenant_id: string;
}

export interface ContractReviewPayload {
    document_id: string;
    playbook_id?: string;  // Legacy
    blueprint_version_id?: string;  // 3-layer
    contract_model_version_id?: string;  // 3-layer
    tenant_id: string;
}

export interface FileUploadResponse {
    document_id: string;
    status: string;
}

export interface ContractReviewResponse {
    run_id: string;
    status: string;
}

export async function uploadContractToN8n(payload: FileUploadPayload): Promise<FileUploadResponse> {
    const { data: sessionData } = await supabase.auth.getSession();

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

export async function startContractReview(payload: ContractReviewPayload): Promise<ContractReviewResponse> {
    const { data: sessionData } = await supabase.auth.getSession();

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
export async function getReviewConfig(contractTypeId: string): Promise<ReviewConfig | null> {
    const { data, error } = await supabase
        .from('contract_type_review_defaults')
        .select('blueprint_version_id, contract_model_version_id, knowledge_graph_id')
        .eq('contract_type_id', contractTypeId)
        .single();

    if (error || !data) {
        console.warn('No 3-layer config found for', contractTypeId, '- using legacy playbook');
        return null;
    }

    return data;
}
