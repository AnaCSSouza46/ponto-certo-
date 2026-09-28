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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      on_call_periods: {
        Row: {
          created_at: string
          end_time: string
          id: string
          on_call_date: string
          participant_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          on_call_date: string
          participant_id?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          on_call_date?: string
          participant_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_call_periods_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          jornada_minutos: number
          sector_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          jornada_minutos?: number
          sector_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          jornada_minutos?: number
          sector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_adjustments: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["punch_kind"]
          reason: string
          requested_at: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["punch_kind"]
          reason?: string
          requested_at: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["punch_kind"]
          reason?: string
          requested_at?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_adjustments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          kind: string
          participant_id: string | null
          schedule_date: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          kind?: string
          participant_id?: string | null
          schedule_date: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          kind?: string
          participant_id?: string | null
          schedule_date?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          participant_id: string | null
          started_at: string | null
          ticket_date: string
          ticket_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          participant_id?: string | null
          started_at?: string | null
          ticket_date: string
          ticket_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          participant_id?: string | null
          started_at?: string | null
          ticket_date?: string
          ticket_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      time_punches: {
        Row: {
          adjusted_by: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["punch_kind"]
          note: string | null
          punched_at: string
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["punch_kind"]
          note?: string | null
          punched_at?: string
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["punch_kind"]
          note?: string | null
          punched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_manage: {
        Args: { _manager: string; _target: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      review_adjustment: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "gestor" | "funcionario" | "admin"
      punch_kind: "entrada" | "saida_almoco" | "volta_almoco" | "saida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["gestor", "funcionario", "admin"],
      punch_kind: ["entrada", "saida_almoco", "volta_almoco", "saida"],
    },
  },
} as const
