// Generated from the WanderMetric Supabase schema. Do not edit by hand.
// Regenerate after every migration.

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
      activities: {
        Row: {
          author_id: string | null
          body: string | null
          category_id: string | null
          city_id: string
          created_at: string
          deleted_at: string | null
          duration_minutes: number | null
          hero_media_id: string | null
          id: string
          is_featured: boolean
          kind: Database["public"]["Enums"]["activity_kind"]
          name: string
          published_at: string | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          city_id: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["activity_kind"]
          name: string
          published_at?: string | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          city_id?: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["activity_kind"]
          name?: string
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_link_id: string
          campaign: string | null
          content_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          country_code: string | null
          created_at: string
          device: Database["public"]["Enums"]["device_type"]
          id: string
          is_bot: boolean
          page_path: string | null
          program_id: string | null
          provider_id: string | null
          referrer_host: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_link_id: string
          campaign?: string | null
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          country_code?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"]
          id?: string
          is_bot?: boolean
          page_path?: string | null
          program_id?: string | null
          provider_id?: string | null
          referrer_host?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_link_id?: string
          campaign?: string | null
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          country_code?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"]
          id?: string
          is_bot?: boolean
          page_path?: string | null
          program_id?: string | null
          provider_id?: string | null
          referrer_host?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "affiliate_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          click_id: string | null
          commission_amount: number | null
          commission_currency: string | null
          created_at: string
          external_id: string
          id: string
          occurred_at: string
          order_amount: number | null
          order_currency: string | null
          program_id: string | null
          provider_id: string
          raw: Json
          status: Database["public"]["Enums"]["conversion_status"]
          updated_at: string
        }
        Insert: {
          click_id?: string | null
          commission_amount?: number | null
          commission_currency?: string | null
          created_at?: string
          external_id: string
          id?: string
          occurred_at: string
          order_amount?: number | null
          order_currency?: string | null
          program_id?: string | null
          provider_id: string
          raw?: Json
          status?: Database["public"]["Enums"]["conversion_status"]
          updated_at?: string
        }
        Update: {
          click_id?: string | null
          commission_amount?: number | null
          commission_currency?: string | null
          created_at?: string
          external_id?: string
          id?: string
          occurred_at?: string
          order_amount?: number | null
          order_currency?: string | null
          program_id?: string | null
          provider_id?: string
          raw?: Json
          status?: Database["public"]["Enums"]["conversion_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "affiliate_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_link_placements: {
        Row: {
          affiliate_link_id: string
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          position: number
        }
        Insert: {
          affiliate_link_id: string
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          position?: number
        }
        Update: {
          affiliate_link_id?: string
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_link_placements_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          deep_link_template: string | null
          default_params: Json
          deleted_at: string | null
          destination_url: string
          id: string
          label: string
          program_id: string
          slug: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          deep_link_template?: string | null
          default_params?: Json
          deleted_at?: string | null
          destination_url: string
          id?: string
          label: string
          program_id: string
          slug: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          deep_link_template?: string | null
          default_params?: Json
          deleted_at?: string | null
          destination_url?: string
          id?: string
          label?: string
          program_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_offers: {
        Row: {
          activity_id: string | null
          city_id: string | null
          description: string | null
          destination_url: string
          expires_at: string | null
          external_id: string
          fetched_at: string
          hotel_id: string | null
          id: string
          image_url: string | null
          price_amount: number | null
          price_currency: string | null
          program_id: string
          rating: number | null
          raw: Json
          title: string
        }
        Insert: {
          activity_id?: string | null
          city_id?: string | null
          description?: string | null
          destination_url: string
          expires_at?: string | null
          external_id: string
          fetched_at?: string
          hotel_id?: string | null
          id?: string
          image_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          program_id: string
          rating?: number | null
          raw?: Json
          title: string
        }
        Update: {
          activity_id?: string | null
          city_id?: string | null
          description?: string | null
          destination_url?: string
          expires_at?: string | null
          external_id?: string
          fetched_at?: string
          hotel_id?: string | null
          id?: string
          image_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          program_id?: string
          rating?: number | null
          raw?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_offers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_offers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_offers_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_offers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          commission_model: Database["public"]["Enums"]["commission_model"]
          commission_rate: number | null
          config: Json
          cookie_days: number | null
          created_at: string
          currency: string | null
          id: string
          name: string
          provider_id: string
          slug: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Insert: {
          commission_model?: Database["public"]["Enums"]["commission_model"]
          commission_rate?: number | null
          config?: Json
          cookie_days?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          name: string
          provider_id: string
          slug: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Update: {
          commission_model?: Database["public"]["Enums"]["commission_model"]
          commission_rate?: number | null
          config?: Json
          cookie_days?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
          provider_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "affiliate_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_providers: {
        Row: {
          capabilities: Json
          config: Json
          created_at: string
          homepage_url: string | null
          id: string
          name: string
          notes: string | null
          slug: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          config?: Json
          created_at?: string
          homepage_url?: string | null
          id?: string
          name: string
          notes?: string | null
          slug: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          config?: Json
          created_at?: string
          homepage_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          applies_to: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          deleted_at: string | null
          hero_media_id: string | null
          iata_code: string | null
          id: string
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
          region_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          deleted_at?: string | null
          hero_media_id?: string | null
          iata_code?: string | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
          region_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          hero_media_id?: string | null
          iata_code?: string | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
          region_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          tag_id: string
        }
        Insert: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          body: string | null
          capital: string | null
          continent: Database["public"]["Enums"]["continent"]
          created_at: string
          currency_code: string | null
          deleted_at: string | null
          hero_media_id: string | null
          id: string
          iso2: string
          iso3: string | null
          name: string
          phone_code: string | null
          published_at: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          capital?: string | null
          continent: Database["public"]["Enums"]["continent"]
          created_at?: string
          currency_code?: string | null
          deleted_at?: string | null
          hero_media_id?: string | null
          id?: string
          iso2: string
          iso3?: string | null
          name: string
          phone_code?: string | null
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          capital?: string | null
          continent?: Database["public"]["Enums"]["continent"]
          created_at?: string
          currency_code?: string | null
          deleted_at?: string | null
          hero_media_id?: string | null
          id?: string
          iso2?: string
          iso3?: string | null
          name?: string
          phone_code?: string | null
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          clicks: number
          content_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          conversions: number
          currency: string | null
          id: number
          provider_id: string | null
          revenue: number
          stat_date: string
          updated_at: string
          views: number
        }
        Insert: {
          clicks?: number
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          conversions?: number
          currency?: string | null
          id?: never
          provider_id?: string | null
          revenue?: number
          stat_date: string
          updated_at?: string
          views?: number
        }
        Update: {
          clicks?: number
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          conversions?: number
          currency?: string | null
          id?: never
          provider_id?: string | null
          revenue?: number
          stat_date?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "affiliate_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          activity_id: string | null
          body: string | null
          city_id: string | null
          country_id: string | null
          created_at: string
          deleted_at: string | null
          discount_label: string | null
          ends_at: string | null
          hero_media_id: string | null
          hotel_id: string | null
          id: string
          is_featured: boolean
          kind: Database["public"]["Enums"]["deal_kind"]
          published_at: string | null
          search_vector: unknown
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_id?: string | null
          body?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_label?: string | null
          ends_at?: string | null
          hero_media_id?: string | null
          hotel_id?: string | null
          id?: string
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["deal_kind"]
          published_at?: string | null
          search_vector?: unknown
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_id?: string | null
          body?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_label?: string | null
          ends_at?: string | null
          hero_media_id?: string | null
          hotel_id?: string | null
          id?: string
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["deal_kind"]
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          author_id: string | null
          best_time: string | null
          body: string | null
          city_id: string | null
          country_id: string
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          hero_media_id: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          best_time?: string | null
          body?: string | null
          city_id?: string | null
          country_id: string
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          best_time?: string | null
          body?: string | null
          city_id?: string | null
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destinations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destinations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destinations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destinations_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          confirmation_token: string
          confirmed_at: string | null
          country_code: string | null
          created_at: string
          email: string
          id: string
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmation_token?: string
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmation_token?: string
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flight_routes: {
        Row: {
          body: string | null
          created_at: string
          deleted_at: string | null
          destination_city_id: string
          id: string
          origin_city_id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          destination_city_id: string
          id?: string
          origin_city_id: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          destination_city_id?: string
          id?: string
          origin_city_id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_routes_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_routes_origin_city_id_fkey"
            columns: ["origin_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          author_id: string | null
          body: string | null
          category_id: string | null
          city_id: string | null
          country_id: string | null
          created_at: string
          deleted_at: string | null
          destination_id: string | null
          excerpt: string | null
          hero_media_id: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          reading_minutes: number | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          destination_id?: string | null
          excerpt?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          destination_id?: string | null
          excerpt?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          author_id: string | null
          body: string | null
          city_id: string
          created_at: string
          deleted_at: string | null
          hero_media_id: string | null
          id: string
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          name: string
          published_at: string | null
          search_vector: unknown
          slug: string
          star_rating: number | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          author_id?: string | null
          body?: string | null
          city_id: string
          created_at?: string
          deleted_at?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          published_at?: string | null
          search_vector?: unknown
          slug: string
          star_rating?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          author_id?: string | null
          body?: string | null
          city_id?: string
          created_at?: string
          deleted_at?: string | null
          hero_media_id?: string | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          star_rating?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotels_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotels_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string
          blurhash: string | null
          bucket: string
          caption: string | null
          created_at: string
          credit: string | null
          filename: string
          height: number | null
          id: string
          mime_type: string
          size_bytes: number | null
          source_url: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          blurhash?: string | null
          bucket?: string
          caption?: string | null
          created_at?: string
          credit?: string | null
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          size_bytes?: number | null
          source_url?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          blurhash?: string | null
          bucket?: string
          caption?: string | null
          created_at?: string
          credit?: string | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number | null
          source_url?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          content_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          country_code: string | null
          created_at: string
          device: Database["public"]["Enums"]["device_type"]
          id: number
          is_bot: boolean
          path: string
          referrer_host: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          country_code?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"]
          id?: number
          is_bot?: boolean
          path: string
          referrer_host?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          country_code?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"]
          id?: number
          is_bot?: boolean
          path?: string
          referrer_host?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      redirects: {
        Row: {
          created_at: string
          from_path: string
          hit_count: number
          id: string
          is_active: boolean
          last_hit_at: string | null
          note: string | null
          status_code: number
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_path: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          note?: string | null
          status_code?: number
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_path?: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          note?: string | null
          status_code?: number
          to_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          country_id: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          id: string
          og_description: string | null
          og_image_media_id: string | null
          og_title: string | null
          robots_follow: boolean
          robots_index: boolean
          schema_type: string | null
          title: string | null
          twitter_card: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          og_description?: string | null
          og_image_media_id?: string | null
          og_title?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          schema_type?: string | null
          title?: string | null
          twitter_card?: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          og_description?: string | null
          og_image_media_id?: string | null
          og_title?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          schema_type?: string | null
          title?: string | null
          twitter_card?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_metadata_og_image_media_id_fkey"
            columns: ["og_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tracking_sessions: {
        Row: {
          country_code: string | null
          device: Database["public"]["Enums"]["device_type"]
          first_seen_at: string
          id: string
          last_seen_at: string
          referrer_host: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          country_code?: string | null
          device?: Database["public"]["Enums"]["device_type"]
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          referrer_host?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          country_code?: string | null
          device?: Database["public"]["Enums"]["device_type"]
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          referrer_host?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role_level: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      record_affiliate_click: {
        Args: {
          p_campaign?: string
          p_content_id?: string
          p_content_type?: Database["public"]["Enums"]["content_type"]
          p_country_code?: string
          p_device?: Database["public"]["Enums"]["device_type"]
          p_is_bot?: boolean
          p_link_id: string
          p_page_path?: string
          p_referrer_host?: string
          p_session_id?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: string
      }
      resolve_affiliate_link: {
        Args: { p_slug: string }
        Returns: {
          deep_link_template: string
          default_params: Json
          destination_url: string
          link_id: string
          program_id: string
          provider_config: Json
          provider_id: string
          provider_slug: string
        }[]
      }
      rollup_daily_stats: { Args: { p_date?: string }; Returns: number }
      search_content: {
        Args: {
          filter_type?: Database["public"]["Enums"]["content_type"]
          result_limit?: number
          result_offset?: number
          search_query: string
        }
        Returns: {
          content_type: Database["public"]["Enums"]["content_type"]
          id: string
          image_id: string
          path: string
          rank: number
          slug: string
          summary: string
          title: string
        }[]
      }
      slugify: { Args: { value: string }; Returns: string }
      suggest_places: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          id: string
          kind: string
          label: string
          path: string
          score: number
        }[]
      }
      touch_redirect: { Args: { p_from_path: string }; Returns: undefined }
    }
    Enums: {
      activity_kind: "activity" | "tour"
      commission_model:
        | "percentage"
        | "fixed"
        | "cpa"
        | "cpc"
        | "hybrid"
        | "unknown"
      content_status: "draft" | "review" | "published" | "archived"
      content_type:
        | "country"
        | "region"
        | "city"
        | "destination"
        | "guide"
        | "hotel"
        | "activity"
        | "deal"
        | "flight_route"
        | "page"
      continent:
        | "africa"
        | "antarctica"
        | "asia"
        | "europe"
        | "north_america"
        | "oceania"
        | "south_america"
      conversion_status: "pending" | "approved" | "rejected" | "cancelled"
      deal_kind: "hotel" | "flight" | "activity" | "tour" | "package" | "other"
      device_type: "desktop" | "mobile" | "tablet" | "bot" | "unknown"
      integration_status: "active" | "paused" | "disabled"
      subscriber_status:
        | "pending"
        | "subscribed"
        | "unsubscribed"
        | "bounced"
        | "complained"
      user_role: "admin" | "editor" | "viewer"
      vertical:
        | "flights"
        | "hotels"
        | "activities"
        | "tours"
        | "cars"
        | "insurance"
        | "transfers"
        | "other"
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
      activity_kind: ["activity", "tour"],
      commission_model: [
        "percentage",
        "fixed",
        "cpa",
        "cpc",
        "hybrid",
        "unknown",
      ],
      content_status: ["draft", "review", "published", "archived"],
      content_type: [
        "country",
        "region",
        "city",
        "destination",
        "guide",
        "hotel",
        "activity",
        "deal",
        "flight_route",
        "page",
      ],
      continent: [
        "africa",
        "antarctica",
        "asia",
        "europe",
        "north_america",
        "oceania",
        "south_america",
      ],
      conversion_status: ["pending", "approved", "rejected", "cancelled"],
      deal_kind: ["hotel", "flight", "activity", "tour", "package", "other"],
      device_type: ["desktop", "mobile", "tablet", "bot", "unknown"],
      integration_status: ["active", "paused", "disabled"],
      subscriber_status: [
        "pending",
        "subscribed",
        "unsubscribed",
        "bounced",
        "complained",
      ],
      user_role: ["admin", "editor", "viewer"],
      vertical: [
        "flights",
        "hotels",
        "activities",
        "tours",
        "cars",
        "insurance",
        "transfers",
        "other",
      ],
    },
  },
} as const
