export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            documents: {
                Row: {
                    document_id: string
                    created_at: string
                    // Add other fields as needed
                }
                Insert: {
                    document_id?: string
                    created_at?: string
                }
                Update: {
                    document_id?: string
                    created_at?: string
                }
            }
            clause_reviews: {
                Row: {
                    clause_instance_id: string
                    // Add other fields as needed
                }
            }
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

            policy_examples: {
                Row: {
                    id: string;
                    matter_policy_id: string;
                    clause_type_id: string | null;
                    acceptance: 'ACCEPTABLE' | 'PASSABLE' | 'UNACCEPTABLE';
                    example_text: string;
                    normalized_terms: string[];
                    source_ref: Record<string, any>;
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
                    id: string;
                    contract_type_id: string;
                    blueprint_version_id: string;
                    contract_model_version_id: string | null;
                    knowledge_graph_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['contract_type_review_defaults']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['contract_type_review_defaults']['Insert']>;
            };
        }
    }
}
