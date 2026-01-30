export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Type for proposed changes stored as JSON
export interface ProposedChangeDB {
    change_id: string;
    op_type: 'INSERT' | 'DELETE' | 'REPLACE';
    anchor: {
        quote: string;
        start: number;
        end: number;
    };
    original_text?: string;
    suggested_text?: string;
    reason?: string;
    rule_id?: string;
    accepted: boolean;
    rejected: boolean;
    modified_text?: string;
}

export interface Database {
    public: {
        Tables: {
            // Core tables
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
            };

            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                };
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };

            org_memberships: {
                Row: {
                    id: string;
                    user_id: string;
                    organization_id: string;
                    role: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['org_memberships']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['org_memberships']['Insert']>;
            };

            contract_types: {
                Row: {
                    type_id: string;
                    name: string;
                    description: string | null;
                    icon: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['contract_types']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['contract_types']['Insert']>;
            };

            documents: {
                Row: {
                    document_id: string;
                    file_name: string;
                    file_path: string | null;
                    tenant_id: string;
                    uploaded_by: string;
                    contract_type_id: string | null;
                    status: 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
                    contract_decision: 'PROCESSING' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'READY_FOR_EXPORT' | null;
                    party_aliases: Json | null;
                    anonymization_mode: 'OFF' | 'DISPLAY_ONLY' | 'FULL' | null;
                    escalations_pending: number | null;
                    output_drive_file_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    document_id?: string;
                    file_name: string;
                    file_path?: string | null;
                    tenant_id: string;
                    uploaded_by: string;
                    contract_type_id?: string | null;
                    status?: 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
                    contract_decision?: 'PROCESSING' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'READY_FOR_EXPORT' | null;
                    party_aliases?: Json | null;
                    anonymization_mode?: 'OFF' | 'DISPLAY_ONLY' | 'FULL' | null;
                    escalations_pending?: number | null;
                    output_drive_file_id?: string | null;
                };
                Update: Partial<Database['public']['Tables']['documents']['Insert']>;
            };

            contract_runs: {
                Row: {
                    run_id: string;
                    document_id: string;
                    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
                    decision: 'PROCESSING' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'READY_FOR_EXPORT' | null;
                    total_clauses: number | null;
                    processed_clauses: number | null;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    run_id?: string;
                    document_id: string;
                    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
                    decision?: 'PROCESSING' | 'AUTO_REDLINEDRAFT' | 'ESCALATE_HUMAN' | 'BLOCK_EXPORT' | 'READY_FOR_EXPORT' | null;
                    total_clauses?: number | null;
                    processed_clauses?: number | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                };
                Update: Partial<Database['public']['Tables']['contract_runs']['Insert']>;
            };

            clause_reviews: {
                Row: {
                    clause_instance_id: string;
                    clause_id: string;
                    document_id: string;
                    run_id: string;
                    sequence_number: number;
                    heading: string | null;
                    clause_text: string | null;
                    detected_family: string | null;
                    confidence_score: number | null;
                    client_state: 'OK' | 'RECOMMENDED' | 'REQUIRED' | 'NEEDS_REVIEW' | 'BLOCKED';
                    client_comment: string | null;
                    client_summary_line: string | null;
                    proposed_changes: Json | null;
                    escalation_recommended: boolean | null;
                    escalation_reason: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    clause_instance_id: string;
                    clause_id: string;
                    document_id: string;
                    run_id: string;
                    sequence_number?: number;
                    heading?: string | null;
                    clause_text?: string | null;
                    detected_family?: string | null;
                    confidence_score?: number | null;
                    client_state?: 'OK' | 'RECOMMENDED' | 'REQUIRED' | 'NEEDS_REVIEW' | 'BLOCKED';
                    client_comment?: string | null;
                    client_summary_line?: string | null;
                    proposed_changes?: Json | null;
                    escalation_recommended?: boolean | null;
                    escalation_reason?: string | null;
                };
                Update: Partial<Database['public']['Tables']['clause_reviews']['Insert']>;
            };

            escalation_requests: {
                Row: {
                    id: string;
                    escalation_id: string | null;
                    clause_instance_id: string | null;
                    document_id: string | null;
                    run_id: string;
                    requested_by: string;
                    reason: string | null;
                    context: string | null;
                    urgency: string | null;
                    status: string | null;
                    assigned_to: string | null;
                    message: string | null;
                    resolution: string | null;
                    resolution_notes: string | null;
                    created_by: string | null;
                    created_at: string;
                    resolved_at: string | null;
                    resolved_by: string | null;
                };
                Insert: {
                    id?: string;
                    escalation_id?: string | null;
                    clause_instance_id?: string | null;
                    document_id?: string | null;
                    run_id: string;
                    requested_by: string;
                    reason?: string | null;
                    context?: string | null;
                    urgency?: string | null;
                    status?: string | null;
                    assigned_to?: string | null;
                    message?: string | null;
                    resolution?: string | null;
                    resolution_notes?: string | null;
                    created_by?: string | null;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                };
                Update: Partial<Database['public']['Tables']['escalation_requests']['Insert']>;
            };

            escalation_comments: {
                Row: {
                    comment_id: string;
                    escalation_id: string;
                    author_id: string;
                    content: string;
                    created_at: string;
                };
                Insert: {
                    comment_id?: string;
                    escalation_id: string;
                    author_id: string;
                    content: string;
                };
                Update: Partial<Database['public']['Tables']['escalation_comments']['Insert']>;
            };

            // 3-LAYER: Taxonomía
            matters: {
                Row: {
                    id: string;
                    code: string;
                    name: string;
                    description: string | null;
                    sort_order: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['matters']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['matters']['Insert']>;
            };

            clause_types: {
                Row: {
                    id: string;
                    matter_id: string;
                    code: string;
                    name: string;
                    description: string | null;
                    detection_hints: string[];
                    sort_order: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['clause_types']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['clause_types']['Insert']>;
            };

            // 3-LAYER: Blueprint
            review_blueprints: {
                Row: {
                    id: string;
                    organization_id: string | null;
                    name: string;
                    description: string | null;
                    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['review_blueprints']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['review_blueprints']['Insert']>;
            };

            blueprint_versions: {
                Row: {
                    id: string;
                    blueprint_id: string;
                    version_number: number;
                    is_active: boolean;
                    release_notes: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['blueprint_versions']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['blueprint_versions']['Insert']>;
            };

            matter_policies: {
                Row: {
                    id: string;
                    blueprint_version_id: string;
                    matter_id: string;
                    review_depth: 'SKIP' | 'MINIMAL' | 'STANDARD' | 'ENHANCED';
                    policy_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['matter_policies']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['matter_policies']['Insert']>;
            };

            policy_examples: {
                Row: {
                    id: string;
                    matter_policy_id: string;
                    clause_type_id: string | null;
                    acceptance: 'ACCEPTABLE' | 'PASSABLE' | 'UNACCEPTABLE';
                    example_text: string;
                    normalized_terms: string[];
                    source_ref: Json;
                    embedding: number[] | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['policy_examples']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['policy_examples']['Insert']>;
            };

            fallback_clauses: {
                Row: {
                    id: string;
                    matter_policy_id: string;
                    clause_type_id: string | null;
                    fallback_type: 'GIVE' | 'ALTERNATE_GIVE';
                    clause_text: string;
                    requires_approval: boolean;
                    approval_gate: 'LEGAL' | 'TAX_FINANCE' | 'BUSINESS_AFFAIRS' | null;
                    sort_order: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['fallback_clauses']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['fallback_clauses']['Insert']>;
            };

            // 3-LAYER: Resolver
            contract_type_review_defaults: {
                Row: {
                    organization_id: string;
                    contract_type_id: string;
                    blueprint_version_id: string;
                    contract_model_version_id: string | null;
                    knowledge_graph_id: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    organization_id: string;
                    contract_type_id: string;
                    blueprint_version_id: string;
                    contract_model_version_id?: string | null;
                    knowledge_graph_id?: string | null;
                    is_active?: boolean;
                };
                Update: Partial<Database['public']['Tables']['contract_type_review_defaults']['Insert']>;
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
