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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      categories: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          moderator_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          moderator_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          moderator_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          address: string | null
          body: string | null
          capacity: number | null
          category: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          creator_name: string | null
          description: string | null
          duration_seconds: number | null
          ends_at: string | null
          event_ends_at: string | null
          event_location: string | null
          event_starts_at: string | null
          external_url: string | null
          featured: boolean
          id: string
          location: string | null
          media_url: string | null
          r2_media_key: string | null
          r2_thumbnail_key: string | null
          member_only: boolean
          organizer: string | null
          published_at: string | null
          reading_time_minutes: number | null
          recipe_cook_time: string | null
          recipe_ingredients: string | null
          recipe_instructions: string | null
          recipe_prep_time: string | null
          recipe_servings: string | null
          registration_url: string | null
          release_at: string | null
          resource_category: string | null
          short_description: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          ticket_info: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          body?: string | null
          capacity?: number | null
          category?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_name?: string | null
          description?: string | null
          duration_seconds?: number | null
          ends_at?: string | null
          event_ends_at?: string | null
          event_location?: string | null
          event_starts_at?: string | null
          external_url?: string | null
          featured?: boolean
          id?: string
          location?: string | null
          media_url?: string | null
          r2_media_key?: string | null
          r2_thumbnail_key?: string | null
          member_only?: boolean
          organizer?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          recipe_cook_time?: string | null
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          recipe_prep_time?: string | null
          recipe_servings?: string | null
          registration_url?: string | null
          release_at?: string | null
          resource_category?: string | null
          short_description?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          ticket_info?: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          body?: string | null
          capacity?: number | null
          category?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_name?: string | null
          description?: string | null
          duration_seconds?: number | null
          ends_at?: string | null
          event_ends_at?: string | null
          event_location?: string | null
          event_starts_at?: string | null
          external_url?: string | null
          featured?: boolean
          id?: string
          location?: string | null
          media_url?: string | null
          r2_media_key?: string | null
          r2_thumbnail_key?: string | null
          member_only?: boolean
          organizer?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          recipe_cook_time?: string | null
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          recipe_prep_time?: string | null
          recipe_servings?: string | null
          registration_url?: string | null
          release_at?: string | null
          resource_category?: string | null
          short_description?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          ticket_info?: string | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_views: {
        Row: {
          content_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          content_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          content_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          content_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      family_profiles: {
        Row: {
          created_at: string
          display_name: string
          first_name: string
          id: string
          interests: string[]
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          first_name: string
          id?: string
          interests?: string[]
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          first_name?: string
          id?: string
          interests?: string[]
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          content_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          status: string | null
          subscribed: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          id?: string
          status?: string | null
          subscribed?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          status?: string | null
          subscribed?: boolean
        }
        Relationships: []
      }
      media_progress: {
        Row: {
          content_id: string
          duration_seconds: number | null
          position_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          duration_seconds?: number | null
          position_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          duration_seconds?: number | null
          position_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_inquiries: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_inquiry_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          inquiry_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          inquiry_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "member_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_inquiry_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string | null
          profile_limit: number | null
          school_code: string | null
          school_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
          tier: Database["public"]["Enums"]["membership_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          profile_limit?: number | null
          school_code?: string | null
          school_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          profile_limit?: number | null
          school_code?: string | null
          school_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_membership_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      privacy_deletion_log: {
        Row: {
          actor_id: string | null
          cancellation_effective_at: string | null
          completed_at: string | null
          id: string
          requested_at: string
          retained_for: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_ids: string[]
        }
        Insert: {
          actor_id?: string | null
          cancellation_effective_at?: string | null
          completed_at?: string | null
          id?: string
          requested_at?: string
          retained_for?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_ids?: string[]
        }
        Update: {
          actor_id?: string | null
          cancellation_effective_at?: string | null
          completed_at?: string | null
          id?: string
          requested_at?: string
          retained_for?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_ids?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          avatar_path: string | null
          cancel_at_period_end: boolean
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          interests: string[] | null
          membership_expires_at: string | null
          membership_period_end: string | null
          membership_status: string | null
          membership_tier: string
          membership_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_code: string | null
          school_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_path?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          interests?: string[] | null
          membership_expires_at?: string | null
          membership_period_end?: string | null
          membership_status?: string | null
          membership_tier?: string
          membership_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_code?: string | null
          school_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_path?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          membership_expires_at?: string | null
          membership_period_end?: string | null
          membership_status?: string | null
          membership_tier?: string
          membership_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_code?: string | null
          school_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_codes: {
        Row: {
          active: boolean
          code_hash: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number
          school_name: string
          uses: number
        }
        Insert: {
          active?: boolean
          code_hash: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          school_name: string
          uses?: number
        }
        Update: {
          active?: boolean
          code_hash?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          school_name?: string
          uses?: number
        }
        Relationships: []
      }
      school_membership_codes: {
        Row: {
          access_type: string
          active: boolean
          code: string
          created_at: string
          discount_percent: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          school_name: string
          uses_count: number
        }
        Insert: {
          access_type?: string
          active?: boolean
          code: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          school_name: string
          uses_count?: number
        }
        Update: {
          access_type?: string
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          school_name?: string
          uses_count?: number
        }
        Relationships: []
      }
      section_content: {
        Row: {
          content_id: string
          created_at: string
          display_order: number
          section_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          display_order?: number
          section_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          display_order?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_content_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_content_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          artwork_url: string | null
          background_image_url: string | null
          card_style: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          max_items: number
          name: string
          section_type: string
          see_all_label: string
          show_in_navigation: boolean
          show_on_homepage: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          artwork_url?: string | null
          background_image_url?: string | null
          card_style?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_items?: number
          name: string
          section_type?: string
          see_all_label?: string
          show_in_navigation?: boolean
          show_on_homepage?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          artwork_url?: string | null
          background_image_url?: string | null
          card_style?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_items?: number
          name?: string
          section_type?: string
          see_all_label?: string
          show_in_navigation?: boolean
          show_on_homepage?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_key: string | null
          image_url: string | null
          label: string
          slot_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          label: string
          slot_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          label?: string
          slot_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          last_error: string | null
          livemode: boolean
          processed_at: string | null
          processing_started_at: string | null
          received_at: string
          status: string
        }
        Insert: {
          event_id: string
          event_type: string
          last_error?: string | null
          livemode?: boolean
          processed_at?: string | null
          processing_started_at?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          last_error?: string | null
          livemode?: boolean
          processed_at?: string | null
          processing_started_at?: string | null
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_assets: {
        Row: {
          content_id: string
          media_url: string
          updated_at: string
        }
        Insert: {
          content_id: string
          media_url: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          media_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_assets_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_family_profile: {
        Args: {
          p_display_name: string
          p_first_name: string
          p_interests?: string[]
        }
        Returns: {
          created_at: string
          display_name: string
          first_name: string
          id: string
          interests: string[]
          owner_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "family_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_stripe_event: {
        Args: { p_event_id: string; p_event_type: string; p_livemode: boolean }
        Returns: boolean
      }
      finish_stripe_event: {
        Args: { p_error?: string; p_event_id: string; p_success: boolean }
        Returns: undefined
      }
      is_staff: { Args: { uid: string }; Returns: boolean }
      issue_school_code: {
        Args: {
          p_code_hash: string
          p_expires_at?: string
          p_max_uses: number
          p_school_name: string
        }
        Returns: undefined
      }
      redeem_school_code: { Args: { p_code_hash: string }; Returns: undefined }
      register_for_event: { Args: { p_event_id: string }; Returns: string }
      remove_family_profile: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      replace_content_sections: {
        Args: { p_content_id: string; p_section_ids: string[] }
        Returns: undefined
      }
      replace_section_content: {
        Args: { p_content_ids: string[]; p_section_id: string }
        Returns: undefined
      }
      studio_user_count: { Args: never; Returns: number }
      t2i_can_manage_type: {
        Args: { t: Database["public"]["Enums"]["content_type"] }
        Returns: boolean
      }
      t2i_role: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      user_can_watch_videos: { Args: never; Returns: boolean }
      user_has_role: { Args: { required_roles: string[] }; Returns: boolean }
      validate_school_code: { Args: { p_code_hash: string }; Returns: boolean }
    }
    Enums: {
      content_status: "draft" | "published" | "archived"
      content_type:
        | "podcast"
        | "video"
        | "article"
        | "resource"
        | "printable"
        | "pick"
        | "event"
        | "recipe"
        | "original"
      membership_status: "active" | "inactive" | "cancelled" | "expired"
      membership_tier: "free" | "member"
      user_role: "user" | "content_editor" | "event_manager" | "administrator"
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
      content_status: ["draft", "published", "archived"],
      content_type: [
        "podcast",
        "video",
        "article",
        "resource",
        "printable",
        "pick",
        "event",
        "recipe",
        "original",
      ],
      membership_status: ["active", "inactive", "cancelled", "expired"],
      membership_tier: ["free", "member"],
      user_role: ["user", "content_editor", "event_manager", "administrator"],
    },
  },
} as const
