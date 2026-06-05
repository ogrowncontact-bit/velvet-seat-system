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
      activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          message: string
          meta: Json
          restaurant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          message: string
          meta?: Json
          restaurant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          meta?: Json
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          allergies: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_vip: boolean
          last_visit_at: string | null
          lifetime_value: number
          notes: string | null
          phone: string | null
          restaurant_id: string
          tags: string[]
          visits_count: number
        }
        Insert: {
          allergies?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_vip?: boolean
          last_visit_at?: string | null
          lifetime_value?: number
          notes?: string | null
          phone?: string | null
          restaurant_id: string
          tags?: string[]
          visits_count?: number
        }
        Update: {
          allergies?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_vip?: boolean
          last_visit_at?: string | null
          lifetime_value?: number
          notes?: string | null
          phone?: string | null
          restaurant_id?: string
          tags?: string[]
          visits_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_restaurant_id: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_restaurant_id?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_restaurant_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          deposit_amount: number
          duration_minutes: number
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          party_size: number
          reserved_at: string
          restaurant_id: string
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number
          duration_minutes?: number
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size: number
          reserved_at: string
          restaurant_id: string
          source?: Database["public"]["Enums"]["reservation_source"]
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number
          duration_minutes?: number
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          reserved_at?: string
          restaurant_id?: string
          source?: Database["public"]["Enums"]["reservation_source"]
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          cuisine: string | null
          currency: string
          default_deposit: number
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          is_published: boolean
          name: string
          phone: string | null
          photos: Json
          price_range: string | null
          slug: string | null
          timezone: string
          updated_at: string
          website: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          currency?: string
          default_deposit?: number
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_published?: boolean
          name: string
          phone?: string | null
          photos?: Json
          price_range?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          currency?: string
          default_deposit?: number
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_published?: boolean
          name?: string
          phone?: string | null
          photos?: Json
          price_range?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          dwell_minutes: number
          id: string
          label: string
          pos_x: number
          pos_y: number
          restaurant_id: string
          room_id: string
          seats: number
          shape: Database["public"]["Enums"]["table_shape"]
          status: Database["public"]["Enums"]["table_status"]
        }
        Insert: {
          created_at?: string
          dwell_minutes?: number
          id?: string
          label: string
          pos_x?: number
          pos_y?: number
          restaurant_id: string
          room_id: string
          seats?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          status?: Database["public"]["Enums"]["table_status"]
        }
        Update: {
          created_at?: string
          dwell_minutes?: number
          id?: string
          label?: string
          pos_x?: number
          pos_y?: number
          restaurant_id?: string
          room_id?: string
          seats?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          status?: Database["public"]["Enums"]["table_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          estimated_minutes: number
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          party_size: number
          restaurant_id: string
          status: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size: number
          restaurant_id: string
          status?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          restaurant_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurants_public: {
        Row: {
          address: string | null
          city: string | null
          cover_image_url: string | null
          cuisine: string | null
          description: string | null
          email: string | null
          hours: Json | null
          id: string | null
          name: string | null
          phone: string | null
          photos: Json | null
          price_range: string | null
          slug: string | null
          website: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          cuisine?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string | null
          name?: string | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          slug?: string | null
          website?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          cuisine?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string | null
          name?: string | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          slug?: string | null
          website?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _restaurant_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_or_owner: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      is_member: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manager" | "host" | "staff"
      reservation_source:
        | "widget"
        | "phone"
        | "walk_in"
        | "google"
        | "instagram"
        | "staff"
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "no_show"
        | "cancelled"
      table_shape: "round" | "square" | "rect"
      table_status:
        | "available"
        | "reserved"
        | "occupied"
        | "cleaning"
        | "vip"
        | "delayed"
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
      app_role: ["owner", "manager", "host", "staff"],
      reservation_source: [
        "widget",
        "phone",
        "walk_in",
        "google",
        "instagram",
        "staff",
      ],
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "no_show",
        "cancelled",
      ],
      table_shape: ["round", "square", "rect"],
      table_status: [
        "available",
        "reserved",
        "occupied",
        "cleaning",
        "vip",
        "delayed",
      ],
    },
  },
} as const
