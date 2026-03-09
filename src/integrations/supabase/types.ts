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
      comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          shared_content_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          shared_content_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          shared_content_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_shared_content_id_fkey"
            columns: ["shared_content_id"]
            isOneToOne: false
            referencedRelation: "shared_content"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          card_back: string
          card_front: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          topic: string
          user_id: string
        }
        Insert: {
          card_back: string
          card_front: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          topic: string
          user_id: string
        }
        Update: {
          card_back?: string
          card_front?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          created_at: string
          description: string | null
          edges: Json
          id: string
          nodes: Json
          subject: string | null
          title: string
          updated_at: string
          user_id: string
          viewport: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
          viewport?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          viewport?: Json | null
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes: number
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_subjects: string[] | null
          study_goal: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_subjects?: string[] | null
          study_goal?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_subjects?: string[] | null
          study_goal?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_at: string
          id: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          repeat: Database["public"]["Enums"]["reminder_repeat"]
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_outputs: {
        Row: {
          created_at: string
          custom_title: string | null
          id: string
          input_data: Json
          output_text: string
          subject: string | null
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_title?: string | null
          id?: string
          input_data?: Json
          output_text: string
          subject?: string | null
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_title?: string | null
          id?: string
          input_data?: Json
          output_text?: string
          subject?: string | null
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_content: {
        Row: {
          group_id: string
          id: string
          output_id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          group_id: string
          id?: string
          output_id: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          group_id?: string
          id?: string
          output_id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_content_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "saved_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          paystack_customer_code: string | null
          paystack_email: string | null
          paystack_subscription_code: string | null
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      reminder_repeat: "none" | "daily" | "weekly"
      reminder_type: "study_session" | "exam_countdown" | "task"
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
      reminder_repeat: ["none", "daily", "weekly"],
      reminder_type: ["study_session", "exam_countdown", "task"],
    },
  },
} as const
