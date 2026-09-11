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
      check_items: {
        Row: {
          added_by_operator: string | null
          added_by_user: string | null
          check_id: string
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          notes: string | null
          qty: number
          restaurant_id: string
          unit_price: number
          voided: boolean
        }
        Insert: {
          added_by_operator?: string | null
          added_by_user?: string | null
          check_id: string
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          notes?: string | null
          qty?: number
          restaurant_id: string
          unit_price: number
          voided?: boolean
        }
        Update: {
          added_by_operator?: string | null
          added_by_user?: string | null
          check_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          notes?: string | null
          qty?: number
          restaurant_id?: string
          unit_price?: number
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "check_items_added_by_operator_fkey"
            columns: ["added_by_operator"]
            isOneToOne: false
            referencedRelation: "staff_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_items_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      check_payments: {
        Row: {
          amount: number
          check_id: string
          created_at: string
          id: string
          method: string
          paid_at: string
          received_by_operator: string | null
          received_by_user: string | null
          restaurant_id: string
        }
        Insert: {
          amount: number
          check_id: string
          created_at?: string
          id?: string
          method: string
          paid_at?: string
          received_by_operator?: string | null
          received_by_user?: string | null
          restaurant_id: string
        }
        Update: {
          amount?: number
          check_id?: string
          created_at?: string
          id?: string
          method?: string
          paid_at?: string
          received_by_operator?: string | null
          received_by_user?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_payments_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_payments_received_by_operator_fkey"
            columns: ["received_by_operator"]
            isOneToOne: false
            referencedRelation: "staff_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          closed_at: string | null
          created_at: string
          discount: number
          guest_name: string | null
          id: string
          notes: string | null
          opened_at: string
          opened_by_operator: string | null
          opened_by_user: string | null
          party_size: number | null
          payment_method: string | null
          reservation_id: string | null
          restaurant_id: string
          service_charge: number
          status: string
          subtotal: number
          table_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          discount?: number
          guest_name?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by_operator?: string | null
          opened_by_user?: string | null
          party_size?: number | null
          payment_method?: string | null
          reservation_id?: string | null
          restaurant_id: string
          service_charge?: number
          status?: string
          subtotal?: number
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          discount?: number
          guest_name?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by_operator?: string | null
          opened_by_user?: string | null
          party_size?: number | null
          payment_method?: string | null
          reservation_id?: string | null
          restaurant_id?: string
          service_charge?: number
          status?: string
          subtotal?: number
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_opened_by_operator_fkey"
            columns: ["opened_by_operator"]
            isOneToOne: false
            referencedRelation: "staff_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
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
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          body: string | null
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          error: string | null
          from_phone: string | null
          id: string
          kind: Database["public"]["Enums"]["message_kind"] | null
          provider_sid: string | null
          reservation_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["message_status"]
          to_phone: string | null
          waitlist_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          error?: string | null
          from_phone?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"] | null
          provider_sid?: string | null
          reservation_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["message_status"]
          to_phone?: string | null
          waitlist_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          error?: string | null
          from_phone?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"] | null
          provider_sid?: string | null
          reservation_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          to_phone?: string | null
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_log_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_log_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          last_error: string | null
          payload: Json
          processed_at: string | null
          reservation_id: string | null
          restaurant_id: string
          scheduled_for: string
          to_phone: string
          waitlist_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["message_kind"]
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          reservation_id?: string | null
          restaurant_id: string
          scheduled_for?: string
          to_phone: string
          waitlist_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          reservation_id?: string | null
          restaurant_id?: string
          scheduled_for?: string
          to_phone?: string
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["message_kind"]
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_restaurant_id_fkey"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      restaurant_closures: {
        Row: {
          closed_on: string
          created_at: string
          id: string
          reason: string | null
          restaurant_id: string
        }
        Insert: {
          closed_on: string
          created_at?: string
          id?: string
          reason?: string | null
          restaurant_id: string
        }
        Update: {
          closed_on?: string
          created_at?: string
          id?: string
          reason?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_closures_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_closures_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_hours: {
        Row: {
          active: boolean
          closes_at: string
          created_at: string
          id: string
          last_seating_offset_minutes: number
          opens_at: string
          restaurant_id: string
          shift_name: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          closes_at: string
          created_at?: string
          id?: string
          last_seating_offset_minutes?: number
          opens_at: string
          restaurant_id: string
          shift_name?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          closes_at?: string
          created_at?: string
          id?: string
          last_seating_offset_minutes?: number
          opens_at?: string
          restaurant_id?: string
          shift_name?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
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
          default_duration_minutes: number
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          is_published: boolean
          name: string
          no_show_deposit: number
          no_show_fine: number
          no_show_policy: Database["public"]["Enums"]["no_show_policy"]
          offer_timeout_minutes: number
          phone: string | null
          photos: Json
          price_range: string | null
          slot_interval_minutes: number
          slug: string | null
          status: Database["public"]["Enums"]["restaurant_status"]
          timezone: string
          updated_at: string
          website: string | null
          whatsapp_enabled: boolean
          whatsapp_from: string | null
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
          default_duration_minutes?: number
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_published?: boolean
          name: string
          no_show_deposit?: number
          no_show_fine?: number
          no_show_policy?: Database["public"]["Enums"]["no_show_policy"]
          offer_timeout_minutes?: number
          phone?: string | null
          photos?: Json
          price_range?: string | null
          slot_interval_minutes?: number
          slug?: string | null
          status?: Database["public"]["Enums"]["restaurant_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp_enabled?: boolean
          whatsapp_from?: string | null
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
          default_duration_minutes?: number
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_published?: boolean
          name?: string
          no_show_deposit?: number
          no_show_fine?: number
          no_show_policy?: Database["public"]["Enums"]["no_show_policy"]
          offer_timeout_minutes?: number
          phone?: string | null
          photos?: Json
          price_range?: string | null
          slot_interval_minutes?: number
          slug?: string | null
          status?: Database["public"]["Enums"]["restaurant_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp_enabled?: boolean
          whatsapp_from?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reservation_id: string | null
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reservation_id?: string | null
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reservation_id?: string | null
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
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
      staff_operators: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          pin_hash: string
          pin_salt: string
          restaurant_id: string
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          pin_hash: string
          pin_salt: string
          restaurant_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          pin_hash?: string
          pin_salt?: string
          restaurant_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_operators_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_operators_restaurant_id_fkey"
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
          min_seats: number
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
          min_seats?: number
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
          min_seats?: number
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
          customer_id: string | null
          estimated_minutes: number
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          notified_at: string | null
          party_size: number
          response_deadline: string | null
          restaurant_id: string
          seated_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          estimated_minutes?: number
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          party_size: number
          response_deadline?: string | null
          restaurant_id: string
          seated_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          estimated_minutes?: number
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          party_size?: number
          response_deadline?: string | null
          restaurant_id?: string
          seated_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
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
          avg_rating: number | null
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
          review_count: number | null
          slug: string | null
          website: string | null
          whatsapp_phone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      available_slots: {
        Args: { _date: string; _party_size: number; _restaurant_id: string }
        Returns: {
          local_time: string
          slot: string
          tables_free: number
        }[]
      }
      available_tables: {
        Args: { _at: string; _party_size: number; _restaurant_id: string }
        Returns: {
          id: string
          label: string
          room_id: string
          seats: number
        }[]
      }
      customer_reliability_score: {
        Args: { _customer_id: string }
        Returns: number
      }
      expire_stale_waitlist_offers: {
        Args: { _restaurant_id: string }
        Returns: number
      }
      get_user_role: { Args: { _uid: string }; Returns: string }
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
      is_within_service_hours: {
        Args: { _at: string; _restaurant_id: string }
        Returns: boolean
      }
      promote_next_waitlist: {
        Args: { _restaurant_id: string }
        Returns: {
          created_at: string
          customer_id: string | null
          estimated_minutes: number
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          notified_at: string | null
          party_size: number
          response_deadline: string | null
          restaurant_id: string
          seated_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "waitlist"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seed_message_templates: {
        Args: { _restaurant_id: string }
        Returns: undefined
      }
      verify_operator_pin: {
        Args: { _pin: string; _restaurant_id: string }
        Returns: {
          id: string
          name: string
          role: string
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "host" | "staff"
      message_direction: "out" | "in"
      message_kind:
        | "confirmation"
        | "reminder_24h"
        | "reminder_2h"
        | "waitlist_offer"
        | "reply_confirmed"
        | "reply_cancelled"
        | "test"
      message_status: "queued" | "sent" | "delivered" | "failed" | "received"
      no_show_policy: "none" | "card" | "deposit" | "fine"
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
      restaurant_status: "pending" | "approved" | "rejected"
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
      app_role: ["owner", "manager", "host", "staff"],
      message_direction: ["out", "in"],
      message_kind: [
        "confirmation",
        "reminder_24h",
        "reminder_2h",
        "waitlist_offer",
        "reply_confirmed",
        "reply_cancelled",
        "test",
      ],
      message_status: ["queued", "sent", "delivered", "failed", "received"],
      no_show_policy: ["none", "card", "deposit", "fine"],
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
      restaurant_status: ["pending", "approved", "rejected"],
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
