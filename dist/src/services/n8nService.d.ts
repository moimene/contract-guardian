export interface ReviewConfig {
    blueprint_version_id: string;
    contract_model_version_id: string | null;
    knowledge_graph_id: string | null;
}
export interface FileUploadPayload {
    file_name: string;
    file_path: string;
    mime_type: string;
    playbook_id?: string;
    blueprint_version_id?: string;
    tenant_id: string;
}
export interface ContractReviewPayload {
    document_id: string;
    playbook_id?: string;
    blueprint_version_id?: string;
    contract_model_version_id?: string;
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
export declare function uploadContractToN8n(payload: FileUploadPayload): Promise<FileUploadResponse>;
export declare function startContractReview(payload: ContractReviewPayload): Promise<ContractReviewResponse>;
export declare function getReviewConfig(contractTypeId: string): Promise<ReviewConfig | null>;
export declare function getPlaybookId(contractTypeId: string): string;
//# sourceMappingURL=n8nService.d.ts.map