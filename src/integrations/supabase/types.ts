export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clause_reviews: {
        Row: {
          clause_id: string
          clause_instance_id: string
          clause_text: string | null
          client_comment: string | null
          client_state: string
          client_summary_line: string | null
          confidence_score: number | null
          created_at: string
          detected_family: string | null
          document_id: string
          escalation_reason: string | null
          escalation_recommended: boolean | null
          heading: string | null
          proposed_changes: Json | null
          run_id: string
          sequence_number: number
          updated_at: string
        }
        Insert: {
          clause_id: string
          clause_instance_id: string
          clause_text?: string | null
          client_comment?: string | null
          client_state?: string
          client_summary_line?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_family?: string | null
          document_id: string
          escalation_reason?: string | null
          escalation_recommended?: boolean | null
          heading?: string | null
          proposed_changes?: Json | null
          run_id: string
          sequence_number?: number
          updated_at?: string
        }
        Update: {
          clause_id?: string
          clause_instance_id?: string
          clause_text?: string | null
          client_comment?: string | null
          client_state?: string
          client_summary_line?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_family?: string | null
          document_id?: string
          escalation_reason?: string | null
          escalation_recommended?: boolean | null
          heading?: string | null
          proposed_changes?: Json | null
          run_id?: string
          sequence_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      contract_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          decision: Database["public"]["Enums"]["contract_decision"] | null
          document_id: string
          processed_clauses: number | null
          run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
          total_clauses: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["contract_decision"] | null
          document_id: string
          processed_clauses?: number | null
          run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          total_clauses?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["contract_decision"] | null
          document_id?: string
          processed_clauses?: number | null
          run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          total_clauses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_runs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      contract_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          name: string
          type_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name: string
          type_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name?: string
          type_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          anonymization_mode:
            | Database["public"]["Enums"]["anonymization_mode"]
            | null
          contract_decision:
            | Database["public"]["Enums"]["contract_decision"]
            | null
          contract_type_id: string | null
          created_at: string
          document_id: string
          escalations_pending: number | null
          file_name: string
          file_path: string | null
          output_drive_file_id: string | null
          party_aliases: Json | null
          status: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          anonymization_mode?:
            | Database["public"]["Enums"]["anonymization_mode"]
            | null
          contract_decision?:
            | Database["public"]["Enums"]["contract_decision"]
            | null
          contract_type_id?: string | null
          created_at?: string
          document_id?: string
          escalations_pending?: number | null
          file_name: string
          file_path?: string | null
          output_drive_file_id?: string | null
          party_aliases?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          anonymization_mode?:
            | Database["public"]["Enums"]["anonymization_mode"]
            | null
          contract_decision?:
            | Database["public"]["Enums"]["contract_decision"]
            | null
          contract_type_id?: string | null
          created_at?: string
          document_id?: string
          escalations_pending?: number | null
          file_name?: string
          file_path?: string | null
          output_drive_file_id?: string | null
          party_aliases?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["type_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_comments: {
        Row: {
          author_id: string
          comment_id: string
          content: string
          created_at: string
          escalation_id: string
        }
        Insert: {
          author_id: string
          comment_id?: string
          content: string
          created_at?: string
          escalation_id: string
        }
        Update: {
          author_id?: string
          comment_id?: string
          content?: string
          created_at?: string
          escalation_id?: string
        }
        Relationships: []
      }
      escalation_requests: {
        Row: {
          assigned_to: string | null
          clause_instance_id: string | null
          context: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          escalation_id: string | null
          id: string
          message: string | null
          reason: string | null
          requested_by: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: string
          status: string | null
          urgency: string | null
        }
        Insert: {
          assigned_to?: string | null
          clause_instance_id?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          escalation_id?: string | null
          id?: string
          message?: string | null
          reason?: string | null
          requested_by: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id: string
          status?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_to?: string | null
          clause_instance_id?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          escalation_id?: string | null
          id?: string
          message?: string | null
          reason?: string | null
          requested_by?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string
          status?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_requests_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "contract_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sanitizer_outputs: {
        Row: {
          clause_family: string | null
          clause_id: string
          client_state: Database["public"]["Enums"]["client_state"]
          created_at: string
          document_id: string
          explanation: string | null
          original_text: string | null
          output_id: string
          position: number | null
          run_id: string
          sanitized_text: string | null
          status: Database["public"]["Enums"]["clause_status"]
          updated_at: string
        }
        Insert: {
          clause_family?: string | null
          clause_id: string
          client_state?: Database["public"]["Enums"]["client_state"]
          created_at?: string
          document_id: string
          explanation?: string | null
          original_text?: string | null
          output_id?: string
          position?: number | null
          run_id: string
          sanitized_text?: string | null
          status?: Database["public"]["Enums"]["clause_status"]
          updated_at?: string
        }
        Update: {
          clause_family?: string | null
          clause_id?: string
          client_state?: Database["public"]["Enums"]["client_state"]
          created_at?: string
          document_id?: string
          explanation?: string | null
          original_text?: string | null
          output_id?: string
          position?: number | null
          run_id?: string
          sanitized_text?: string | null
          status?: Database["public"]["Enums"]["clause_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanitizer_outputs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "sanitizer_outputs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "contract_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      anonymization_mode: "OFF" | "DISPLAY_ONLY" | "FULL"
      app_role: "client" | "firm_admin"
      clause_status: "SAFE" | "RISK"
      client_state:
        | "OK"
        | "RECOMMENDED"
        | "REQUIRED"
        | "NEEDS_REVIEW"
        | "BLOCKED"
      contract_decision:
        | "PROCESSING"
        | "AUTO_REDLINEDRAFT"
        | "ESCALATE_HUMAN"
        | "BLOCK_EXPORT"
        | "READY_FOR_EXPORT"
      document_status:
        | "UPLOADING"
        | "UPLOADED"
        | "PROCESSING"
        | "PROCESSED"
        | "ERROR"
      run_status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      anonymization_mode: ["OFF", "DISPLAY_ONLY", "FULL"],
      app_role: ["client", "firm_admin"],
      clause_status: ["SAFE", "RISK"],
      client_state: [
        "OK",
        "RECOMMENDED",
        "REQUIRED",
        "NEEDS_REVIEW",
        "BLOCKED",
      ],
      contract_decision: [
        "PROCESSING",
        "AUTO_REDLINEDRAFT",
        "ESCALATE_HUMAN",
        "BLOCK_EXPORT",
        "READY_FOR_EXPORT",
      ],
      document_status: [
        "UPLOADING",
        "UPLOADED",
        "PROCESSING",
        "PROCESSED",
        "ERROR",
      ],
      run_status: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
    },
  },
} as const
