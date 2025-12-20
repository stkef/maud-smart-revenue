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
      nudges: {
        Row: {
          created_at: string
          created_by: string
          delivered_at: string | null
          id: string
          message: string
          nudge_type: Database["public"]["Enums"]["nudge_type"]
          response_date: string | null
          response_received: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          sent_at: string | null
          status: Database["public"]["Enums"]["nudge_status"]
          taxpayer_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivered_at?: string | null
          id?: string
          message: string
          nudge_type: Database["public"]["Enums"]["nudge_type"]
          response_date?: string | null
          response_received?: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["nudge_status"]
          taxpayer_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          id?: string
          message?: string
          nudge_type?: Database["public"]["Enums"]["nudge_type"]
          response_date?: string | null
          response_received?: boolean | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["nudge_status"]
          taxpayer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudges_taxpayer_id_fkey"
            columns: ["taxpayer_id"]
            isOneToOne: false
            referencedRelation: "taxpayers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          ward_assigned: string | null
          zone_assigned: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          ward_assigned?: string | null
          zone_assigned?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          ward_assigned?: string | null
          zone_assigned?: string | null
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          behavior_segment: Database["public"]["Enums"]["behavior_segment"]
          calculated_at: string
          created_by: string | null
          id: string
          model_version: string
          risk_factors: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          taxpayer_id: string
        }
        Insert: {
          behavior_segment: Database["public"]["Enums"]["behavior_segment"]
          calculated_at?: string
          created_by?: string | null
          id?: string
          model_version?: string
          risk_factors?: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          taxpayer_id: string
        }
        Update: {
          behavior_segment?: Database["public"]["Enums"]["behavior_segment"]
          calculated_at?: string
          created_by?: string | null
          id?: string
          model_version?: string
          risk_factors?: Json
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          taxpayer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_taxpayer_id_fkey"
            columns: ["taxpayer_id"]
            isOneToOne: false
            referencedRelation: "taxpayers"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_records: {
        Row: {
          arrears_amount: number
          created_at: string
          delay_days: number
          due_amount: number
          financial_year: string
          id: string
          paid_amount: number
          payment_date: string | null
          penalty_amount: number
          status: string
          taxpayer_id: string
          updated_at: string
        }
        Insert: {
          arrears_amount?: number
          created_at?: string
          delay_days?: number
          due_amount?: number
          financial_year: string
          id?: string
          paid_amount?: number
          payment_date?: string | null
          penalty_amount?: number
          status?: string
          taxpayer_id: string
          updated_at?: string
        }
        Update: {
          arrears_amount?: number
          created_at?: string
          delay_days?: number
          due_amount?: number
          financial_year?: string
          id?: string
          paid_amount?: number
          payment_date?: string | null
          penalty_amount?: number
          status?: string
          taxpayer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_records_taxpayer_id_fkey"
            columns: ["taxpayer_id"]
            isOneToOne: false
            referencedRelation: "taxpayers"
            referencedColumns: ["id"]
          },
        ]
      }
      taxpayers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          property_address: string
          tax_type: Database["public"]["Enums"]["tax_type"]
          updated_at: string
          ward: string
          zone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          property_address: string
          tax_type?: Database["public"]["Enums"]["tax_type"]
          updated_at?: string
          ward: string
          zone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          property_address?: string
          tax_type?: Database["public"]["Enums"]["tax_type"]
          updated_at?: string
          ward?: string
          zone?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["officer_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["officer_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["officer_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["officer_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_officer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      behavior_segment:
        | "Regular Payer"
        | "Occasional Defaulter"
        | "Chronic Defaulter"
        | "First-time Defaulter"
      nudge_status: "pending" | "sent" | "delivered" | "failed"
      nudge_type: "sms" | "whatsapp" | "email"
      officer_role: "admin" | "supervisor" | "officer"
      risk_level: "low" | "medium" | "high"
      tax_type: "Property Tax" | "Water Tax" | "Drainage Tax" | "Commercial Tax"
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
      behavior_segment: [
        "Regular Payer",
        "Occasional Defaulter",
        "Chronic Defaulter",
        "First-time Defaulter",
      ],
      nudge_status: ["pending", "sent", "delivered", "failed"],
      nudge_type: ["sms", "whatsapp", "email"],
      officer_role: ["admin", "supervisor", "officer"],
      risk_level: ["low", "medium", "high"],
      tax_type: ["Property Tax", "Water Tax", "Drainage Tax", "Commercial Tax"],
    },
  },
} as const
