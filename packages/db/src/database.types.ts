// GENERATED from supabase/migrations by supabase/scripts/pglite-check (same shape as
// `supabase gen types typescript`). Regenerate with `supabase gen types typescript --linked`
// once a project exists. Do not edit by hand.

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
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          kind: string
          latency_ms: number | null
          model: string
          output_tokens: number | null
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          kind: string
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          provider: string
          status: string
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          kind?: string
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          description_key: string
          icon: string
          name_key: string
          rarity: string
        }
        Insert: {
          code: string
          description_key: string
          icon: string
          name_key: string
          rarity?: string
        }
        Update: {
          code?: string
          description_key?: string
          icon?: string
          name_key?: string
          rarity?: string
        }
        Relationships: []
      }
      barcode_products: {
        Row: {
          barcode: string
          brand: string | null
          carb_g_100g: number | null
          fat_g_100g: number | null
          fetched_at: string
          fiber_g_100g: number | null
          kcal_100g: number | null
          name: string
          protein_g_100g: number | null
          serving_g: number | null
          sodium_mg_100g: number | null
          source: string
          sugar_g_100g: number | null
        }
        Insert: {
          barcode: string
          brand?: string | null
          carb_g_100g?: number | null
          fat_g_100g?: number | null
          fetched_at?: string
          fiber_g_100g?: number | null
          kcal_100g?: number | null
          name: string
          protein_g_100g?: number | null
          serving_g?: number | null
          sodium_mg_100g?: number | null
          source: string
          sugar_g_100g?: number | null
        }
        Update: {
          barcode?: string
          brand?: string | null
          carb_g_100g?: number | null
          fat_g_100g?: number | null
          fetched_at?: string
          fiber_g_100g?: number | null
          kcal_100g?: number | null
          name?: string
          protein_g_100g?: number | null
          serving_g?: number | null
          sodium_mg_100g?: number | null
          source?: string
          sugar_g_100g?: number | null
        }
        Relationships: []
      }
      boss_battles: {
        Row: {
          boss_code: string
          hits: number
          hits_required: number
          id: string
          reward: Json
          user_id: string
          week_start: string
          won_at: string | null
        }
        Insert: {
          boss_code: string
          hits?: number
          hits_required: number
          id?: string
          reward?: Json
          user_id: string
          week_start: string
          won_at?: string | null
        }
        Update: {
          boss_code?: string
          hits?: number
          hits_required?: number
          id?: string
          reward?: Json
          user_id?: string
          week_start?: string
          won_at?: string | null
        }
        Relationships: []
      }
      coach_settings: {
        Row: {
          free_day_mode: string
          free_days_per_week: number
          photo_quota_per_day: number
          quiet_end: string
          quiet_start: string
          strictness: string
          strictness_changed_at: string | null
          updated_at: string
          user_id: string
          voice: string
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          free_day_mode?: string
          free_days_per_week?: number
          photo_quota_per_day?: number
          quiet_end?: string
          quiet_start?: string
          strictness?: string
          strictness_changed_at?: string | null
          updated_at?: string
          user_id: string
          voice?: string
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          free_day_mode?: string
          free_days_per_week?: number
          photo_quota_per_day?: number
          quiet_end?: string
          quiet_start?: string
          strictness?: string
          strictness_changed_at?: string | null
          updated_at?: string
          user_id?: string
          voice?: string
          work_end?: string | null
          work_start?: string | null
        }
        Relationships: []
      }
      coach_state: {
        Row: {
          aura_score: number
          aura_tier: string
          best_streak: number
          boss_wins: number
          last_closed_date: string | null
          last_monthly_gift: string | null
          last_streak_lost_date: string | null
          level: number
          mood: string
          shield_fragments: number
          shields: number
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          aura_score?: number
          aura_tier?: string
          best_streak?: number
          boss_wins?: number
          last_closed_date?: string | null
          last_monthly_gift?: string | null
          last_streak_lost_date?: string | null
          level?: number
          mood?: string
          shield_fragments?: number
          shields?: number
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          aura_score?: number
          aura_tier?: string
          best_streak?: number
          boss_wins?: number
          last_closed_date?: string | null
          last_monthly_gift?: string | null
          last_streak_lost_date?: string | null
          level?: number
          mood?: string
          shield_fragments?: number
          shields?: number
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          breakdown: Json
          closed_at: string
          is_free_day: boolean
          local_date: string
          nutrition_pts: number
          penalty_pts: number
          result: string
          shield_used: boolean
          sleep_pts: number
          strictness: string
          tasks_pts: number
          total: number
          training_pts: number
          user_id: string
          water_pts: number
          weight_pts: number
        }
        Insert: {
          breakdown?: Json
          closed_at?: string
          is_free_day?: boolean
          local_date: string
          nutrition_pts?: number
          penalty_pts?: number
          result: string
          shield_used?: boolean
          sleep_pts?: number
          strictness: string
          tasks_pts?: number
          total: number
          training_pts?: number
          user_id: string
          water_pts?: number
          weight_pts?: number
        }
        Update: {
          breakdown?: Json
          closed_at?: string
          is_free_day?: boolean
          local_date?: string
          nutrition_pts?: number
          penalty_pts?: number
          result?: string
          shield_used?: boolean
          sleep_pts?: number
          strictness?: string
          tasks_pts?: number
          total?: number
          training_pts?: number
          user_id?: string
          water_pts?: number
          weight_pts?: number
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          active_kcal: number | null
          carb_g: number
          fat_g: number
          is_free_day: boolean
          kcal_in: number
          kcal_target: number | null
          local_date: string
          protein_g: number
          resting_hr: number | null
          sleep_min: number | null
          sleep_quality: number | null
          steps: number | null
          sugar_g: number
          updated_at: string
          user_id: string
          wake_time: string | null
          water_ml: number
          weight_kg: number | null
          weight_trend_kg: number | null
        }
        Insert: {
          active_kcal?: number | null
          carb_g?: number
          fat_g?: number
          is_free_day?: boolean
          kcal_in?: number
          kcal_target?: number | null
          local_date: string
          protein_g?: number
          resting_hr?: number | null
          sleep_min?: number | null
          sleep_quality?: number | null
          steps?: number | null
          sugar_g?: number
          updated_at?: string
          user_id: string
          wake_time?: string | null
          water_ml?: number
          weight_kg?: number | null
          weight_trend_kg?: number | null
        }
        Update: {
          active_kcal?: number | null
          carb_g?: number
          fat_g?: number
          is_free_day?: boolean
          kcal_in?: number
          kcal_target?: number | null
          local_date?: string
          protein_g?: number
          resting_hr?: number | null
          sleep_min?: number | null
          sleep_quality?: number | null
          steps?: number | null
          sugar_g?: number
          updated_at?: string
          user_id?: string
          wake_time?: string | null
          water_ml?: number
          weight_kg?: number | null
          weight_trend_kg?: number | null
        }
        Relationships: []
      }
      duo_streaks: {
        Row: {
          best_streak: number
          id: string
          last_counted_date: string | null
          started_at: string
          status: string
          streak: number
          user_a: string
          user_b: string
        }
        Insert: {
          best_streak?: number
          id?: string
          last_counted_date?: string | null
          started_at?: string
          status?: string
          streak?: number
          user_a: string
          user_b: string
        }
        Update: {
          best_streak?: number
          id?: string
          last_counted_date?: string | null
          started_at?: string
          status?: string
          streak?: number
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          code: string
          home_friendly: boolean
          name_en: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          code: string
          home_friendly?: boolean
          name_en: string
          name_vi: string
          sort_order?: number
        }
        Update: {
          code?: string
          home_friendly?: boolean
          name_en?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: []
      }
      equipment_profiles: {
        Row: {
          created_at: string
          equipment_codes: string[]
          id: string
          inventory: Json
          is_default: boolean
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_codes?: string[]
          id?: string
          inventory?: Json
          is_default?: boolean
          kind: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_codes?: string[]
          id?: string
          inventory?: Json
          is_default?: boolean
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_equipment: {
        Row: {
          equipment_code: string
          exercise_id: string
        }
        Insert: {
          equipment_code: string
          exercise_id: string
        }
        Update: {
          equipment_code?: string
          exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_equipment_code_fkey"
            columns: ["equipment_code"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_media: {
        Row: {
          attribution: string | null
          duration_ms: number | null
          exercise_id: string
          height: number | null
          id: string
          is_primary: boolean
          kind: string
          license: string
          provider: string
          source: string
          storage_path: string
          variant: string
          width: number | null
        }
        Insert: {
          attribution?: string | null
          duration_ms?: number | null
          exercise_id: string
          height?: number | null
          id?: string
          is_primary?: boolean
          kind: string
          license: string
          provider: string
          source: string
          storage_path: string
          variant?: string
          width?: number | null
        }
        Update: {
          attribution?: string | null
          duration_ms?: number | null
          exercise_id?: string
          height?: number | null
          id?: string
          is_primary?: boolean
          kind?: string
          license?: string
          provider?: string
          source?: string
          storage_path?: string
          variant?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_media_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_muscle_heads: {
        Row: {
          exercise_id: string
          head_code: string
          role: string
          stimulus: number
        }
        Insert: {
          exercise_id: string
          head_code: string
          role: string
          stimulus: number
        }
        Update: {
          exercise_id?: string
          head_code?: string
          role?: string
          stimulus?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_heads_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscle_heads_head_code_fkey"
            columns: ["head_code"]
            isOneToOne: false
            referencedRelation: "muscle_heads"
            referencedColumns: ["code"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          default_rep_max: number | null
          default_rep_min: number | null
          default_rest_sec: number
          group_code: string
          home_friendly: boolean
          id: string
          is_published: boolean
          level: string
          load_step_kg: number | null
          measure: string
          mechanic: string
          movement_pattern: string | null
          name_en: string
          name_vi: string
          progression_group: string | null
          progression_level: number | null
          slug: string
          steps_en: string[]
          steps_vi: string[]
          tips_en: string[]
          tips_vi: string[]
          unlock_criteria: Json | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_rep_max?: number | null
          default_rep_min?: number | null
          default_rest_sec?: number
          group_code: string
          home_friendly?: boolean
          id?: string
          is_published?: boolean
          level: string
          load_step_kg?: number | null
          measure?: string
          mechanic: string
          movement_pattern?: string | null
          name_en: string
          name_vi: string
          progression_group?: string | null
          progression_level?: number | null
          slug: string
          steps_en?: string[]
          steps_vi?: string[]
          tips_en?: string[]
          tips_vi?: string[]
          unlock_criteria?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_rep_max?: number | null
          default_rep_min?: number | null
          default_rest_sec?: number
          group_code?: string
          home_friendly?: boolean
          id?: string
          is_published?: boolean
          level?: string
          load_step_kg?: number | null
          measure?: string
          mechanic?: string
          movement_pattern?: string | null
          name_en?: string
          name_vi?: string
          progression_group?: string | null
          progression_level?: number | null
          slug?: string
          steps_en?: string[]
          steps_vi?: string[]
          tips_en?: string[]
          tips_vi?: string[]
          unlock_criteria?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_group_code_fkey"
            columns: ["group_code"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["code"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed: boolean
          ended_at: string | null
          id: string
          planned_min: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          ended_at?: string | null
          id?: string
          planned_min?: number
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          ended_at?: string | null
          id?: string
          planned_min?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      free_days: {
        Row: {
          compensated: boolean
          created_at: string
          id: string
          kind: string
          local_date: string
          quoted_extra_kcal: number | null
          user_id: string
        }
        Insert: {
          compensated?: boolean
          created_at?: string
          id?: string
          kind: string
          local_date: string
          quoted_extra_kcal?: number | null
          user_id: string
        }
        Update: {
          compensated?: boolean
          created_at?: string
          id?: string
          kind?: string
          local_date?: string
          quoted_extra_kcal?: number | null
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          effective_from: string
          goal_type: string
          id: string
          pace: string
          target_weight_kg: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          goal_type: string
          id?: string
          pace?: string
          target_weight_kg?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          goal_type?: string
          id?: string
          pace?: string
          target_weight_kg?: number | null
          user_id?: string
        }
        Relationships: []
      }
      health_samples: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          local_date: string
          metadata: Json
          source: string
          source_id: string | null
          start_at: string
          type: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          local_date: string
          metadata?: Json
          source?: string
          source_id?: string | null
          start_at: string
          type: string
          unit: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          local_date?: string
          metadata?: Json
          source?: string
          source_id?: string | null
          start_at?: string
          type?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          inviter_id: string
          max_uses: number
          uses: number
        }
        Insert: {
          code?: string
          created_at?: string
          expires_at?: string
          inviter_id: string
          max_uses?: number
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          inviter_id?: string
          max_uses?: number
          uses?: number
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          ai_request_id: string | null
          created_at: string
          eaten_at: string
          id: string
          is_shared: boolean
          local_date: string
          meal_slot: string
          photo_path: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_request_id?: string | null
          created_at?: string
          eaten_at?: string
          id?: string
          is_shared?: boolean
          local_date: string
          meal_slot: string
          photo_path?: string | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_request_id?: string | null
          created_at?: string
          eaten_at?: string
          id?: string
          is_shared?: boolean
          local_date?: string
          meal_slot?: string
          photo_path?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_ai_request_id_fkey"
            columns: ["ai_request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          barcode: string | null
          carb_g: number
          clarifications: Json | null
          confidence: number | null
          fat_g: number
          fiber_g: number
          id: string
          kcal: number
          meal_entry_id: string
          name: string
          portion_text: string | null
          protein_g: number
          quantity: number
          saved_food_id: string | null
          sodium_mg: number
          sugar_g: number
          user_id: string
        }
        Insert: {
          barcode?: string | null
          carb_g?: number
          clarifications?: Json | null
          confidence?: number | null
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          meal_entry_id: string
          name: string
          portion_text?: string | null
          protein_g?: number
          quantity?: number
          saved_food_id?: string | null
          sodium_mg?: number
          sugar_g?: number
          user_id: string
        }
        Update: {
          barcode?: string | null
          carb_g?: number
          clarifications?: Json | null
          confidence?: number | null
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          meal_entry_id?: string
          name?: string
          portion_text?: string | null
          protein_g?: number
          quantity?: number
          saved_food_id?: string | null
          sodium_mg?: number
          sugar_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_entry_id_fkey"
            columns: ["meal_entry_id"]
            isOneToOne: false
            referencedRelation: "meal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_saved_food_id_fkey"
            columns: ["saved_food_id"]
            isOneToOne: false
            referencedRelation: "saved_foods"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_reactions: {
        Row: {
          created_at: string
          id: string
          meal_entry_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_entry_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_entry_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_reactions_meal_entry_id_fkey"
            columns: ["meal_entry_id"]
            isOneToOne: false
            referencedRelation: "meal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          code: string
          name_en: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          code: string
          name_en: string
          name_vi: string
          sort_order?: number
        }
        Update: {
          code?: string
          name_en?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: []
      }
      muscle_heads: {
        Row: {
          base_recovery_hours: number | null
          code: string
          muscle_code: string
          name_en: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          base_recovery_hours?: number | null
          code: string
          muscle_code: string
          name_en: string
          name_vi: string
          sort_order?: number
        }
        Update: {
          base_recovery_hours?: number | null
          code?: string
          muscle_code?: string
          name_en?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "muscle_heads_muscle_code_fkey"
            columns: ["muscle_code"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["code"]
          },
        ]
      }
      muscle_recovery: {
        Row: {
          fatigue: number
          head_code: string
          last_trained_at: string | null
          recovered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          fatigue?: number
          head_code: string
          last_trained_at?: string | null
          recovered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          fatigue?: number
          head_code?: string
          last_trained_at?: string | null
          recovered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muscle_recovery_head_code_fkey"
            columns: ["head_code"]
            isOneToOne: false
            referencedRelation: "muscle_heads"
            referencedColumns: ["code"]
          },
        ]
      }
      muscle_volume_targets: {
        Row: {
          muscle_code: string
          sets_max: number
          sets_min: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          muscle_code: string
          sets_max: number
          sets_min: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          muscle_code?: string
          sets_max?: number
          sets_min?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "muscle_volume_targets_muscle_code_fkey"
            columns: ["muscle_code"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["code"]
          },
        ]
      }
      muscles: {
        Row: {
          base_recovery_hours: number
          code: string
          default_sets_max: number
          default_sets_min: number
          group_code: string
          name_en: string
          name_vi: string
          overreach_sets: number
          size: string
          view: string
        }
        Insert: {
          base_recovery_hours: number
          code: string
          default_sets_max?: number
          default_sets_min?: number
          group_code: string
          name_en: string
          name_vi: string
          overreach_sets?: number
          size: string
          view: string
        }
        Update: {
          base_recovery_hours?: number
          code?: string
          default_sets_max?: number
          default_sets_min?: number
          group_code?: string
          name_en?: string
          name_vi?: string
          overreach_sets?: number
          size?: string
          view?: string
        }
        Relationships: [
          {
            foreignKeyName: "muscles_group_code_fkey"
            columns: ["group_code"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["code"]
          },
        ]
      }
      nutrition_targets: {
        Row: {
          carb_g: number
          created_at: string
          effective_from: string
          explanation: Json
          fat_g: number
          fiber_g: number | null
          id: string
          kcal: number
          protein_g: number
          reason: string
          sodium_mg: number | null
          sugar_g: number
          tdee_kcal: number | null
          user_id: string
        }
        Insert: {
          carb_g: number
          created_at?: string
          effective_from: string
          explanation?: Json
          fat_g: number
          fiber_g?: number | null
          id?: string
          kcal: number
          protein_g: number
          reason: string
          sodium_mg?: number | null
          sugar_g: number
          tdee_kcal?: number | null
          user_id: string
        }
        Update: {
          carb_g?: number
          created_at?: string
          effective_from?: string
          explanation?: Json
          fat_g?: number
          fiber_g?: number | null
          id?: string
          kcal?: number
          protein_g?: number
          reason?: string
          sodium_mg?: number | null
          sugar_g?: number
          tdee_kcal?: number | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          kind: string
          set_log_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          kind: string
          set_log_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          kind?: string
          set_log_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_set_log_id_fkey"
            columns: ["set_log_id"]
            isOneToOne: false
            referencedRelation: "set_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_exercises: {
        Row: {
          backup_exercise_id: string | null
          exercise_id: string
          id: string
          is_extra: boolean
          planned_session_id: string
          rep_max: number | null
          rep_min: number | null
          rest_sec: number | null
          sets: number
          sort_order: number
          target_load_kg: number | null
          target_rir: number | null
        }
        Insert: {
          backup_exercise_id?: string | null
          exercise_id: string
          id?: string
          is_extra?: boolean
          planned_session_id: string
          rep_max?: number | null
          rep_min?: number | null
          rest_sec?: number | null
          sets: number
          sort_order?: number
          target_load_kg?: number | null
          target_rir?: number | null
        }
        Update: {
          backup_exercise_id?: string | null
          exercise_id?: string
          id?: string
          is_extra?: boolean
          planned_session_id?: string
          rep_max?: number | null
          rep_min?: number | null
          rest_sec?: number | null
          sets?: number
          sort_order?: number
          target_load_kg?: number | null
          target_rir?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planned_exercises_backup_exercise_id_fkey"
            columns: ["backup_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_exercises_planned_session_id_fkey"
            columns: ["planned_session_id"]
            isOneToOne: false
            referencedRelation: "planned_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_sessions: {
        Row: {
          day_of_week: number | null
          equipment_profile_id: string | null
          id: string
          is_deload: boolean
          name: string
          program_id: string
          rotation_index: number | null
          user_id: string
          week_no: number
        }
        Insert: {
          day_of_week?: number | null
          equipment_profile_id?: string | null
          id?: string
          is_deload?: boolean
          name: string
          program_id: string
          rotation_index?: number | null
          user_id: string
          week_no?: number
        }
        Update: {
          day_of_week?: number | null
          equipment_profile_id?: string | null
          id?: string
          is_deload?: boolean
          name?: string
          program_id?: string
          rotation_index?: number | null
          user_id?: string
          week_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "planned_sessions_equipment_profile_id_fkey"
            columns: ["equipment_profile_id"]
            isOneToOne: false
            referencedRelation: "equipment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          birth_date: string | null
          body_fat_pct: number | null
          character: string | null
          character_name: string | null
          created_at: string
          display_name: string | null
          experience_level: string | null
          height_cm: number | null
          locale: string
          onboarding_completed_at: string | null
          sex: string | null
          timezone: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          activity_level?: string | null
          birth_date?: string | null
          body_fat_pct?: number | null
          character?: string | null
          character_name?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          height_cm?: number | null
          locale?: string
          onboarding_completed_at?: string | null
          sex?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          activity_level?: string | null
          birth_date?: string | null
          body_fat_pct?: number | null
          character?: string | null
          character_name?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          height_cm?: number | null
          locale?: string
          onboarding_completed_at?: string | null
          sex?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      program_template_exercises: {
        Row: {
          backup_exercise_id: string | null
          exercise_id: string
          id: string
          rep_max: number | null
          rep_min: number | null
          rest_sec: number | null
          session_id: string
          sets: number
          sort_order: number
          target_rir: number | null
        }
        Insert: {
          backup_exercise_id?: string | null
          exercise_id: string
          id?: string
          rep_max?: number | null
          rep_min?: number | null
          rest_sec?: number | null
          session_id: string
          sets: number
          sort_order: number
          target_rir?: number | null
        }
        Update: {
          backup_exercise_id?: string | null
          exercise_id?: string
          id?: string
          rep_max?: number | null
          rep_min?: number | null
          rest_sec?: number | null
          session_id?: string
          sets?: number
          sort_order?: number
          target_rir?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_template_exercises_backup_exercise_id_fkey"
            columns: ["backup_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_template_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "program_template_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template_sessions: {
        Row: {
          id: string
          name_en: string
          name_vi: string
          rotation_index: number
          template_id: string
        }
        Insert: {
          id?: string
          name_en: string
          name_vi: string
          rotation_index: number
          template_id: string
        }
        Update: {
          id?: string
          name_en?: string
          name_vi?: string
          rotation_index?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_template_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          days_per_week: number
          description_en: string | null
          description_vi: string | null
          equipment_kind: string
          id: string
          level: string
          name_en: string
          name_vi: string
          slug: string
          split: string
        }
        Insert: {
          days_per_week: number
          description_en?: string | null
          description_vi?: string | null
          equipment_kind: string
          id?: string
          level: string
          name_en: string
          name_vi: string
          slug: string
          split: string
        }
        Update: {
          days_per_week?: number
          description_en?: string | null
          description_vi?: string | null
          equipment_kind?: string
          id?: string
          level?: string
          name_en?: string
          name_vi?: string
          slug?: string
          split?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          days_per_week: number
          generator_version: string | null
          goal_type: string
          id: string
          next_rotation_index: number
          schedule_mode: string
          session_minutes: number | null
          split: string
          started_on: string
          status: string
          total_weeks: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week: number
          generator_version?: string | null
          goal_type: string
          id?: string
          next_rotation_index?: number
          schedule_mode?: string
          session_minutes?: number | null
          split: string
          started_on?: string
          status?: string
          total_weeks?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          generator_version?: string | null
          goal_type?: string
          id?: string
          next_rotation_index?: number
          schedule_mode?: string
          session_minutes?: number | null
          split?: string
          started_on?: string
          status?: string
          total_weeks?: number | null
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          code: string
          completed_at: string | null
          id: string
          local_date: string
          params: Json
          stat: string | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          code: string
          completed_at?: string | null
          id?: string
          local_date: string
          params?: Json
          stat?: string | null
          user_id: string
          xp_reward?: number
        }
        Update: {
          code?: string
          completed_at?: string | null
          id?: string
          local_date?: string
          params?: Json
          stat?: string | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      saved_food_items: {
        Row: {
          carb_g: number
          fat_g: number
          fiber_g: number
          id: string
          kcal: number
          name: string
          protein_g: number
          quantity: number
          saved_food_id: string
          sodium_mg: number
          sugar_g: number
        }
        Insert: {
          carb_g?: number
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          name: string
          protein_g?: number
          quantity?: number
          saved_food_id: string
          sodium_mg?: number
          sugar_g?: number
        }
        Update: {
          carb_g?: number
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          name?: string
          protein_g?: number
          quantity?: number
          saved_food_id?: string
          sodium_mg?: number
          sugar_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_food_items_saved_food_id_fkey"
            columns: ["saved_food_id"]
            isOneToOne: false
            referencedRelation: "saved_foods"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_foods: {
        Row: {
          carb_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          kcal: number
          kind: string
          last_used_at: string | null
          name: string
          protein_g: number
          sodium_mg: number
          sugar_g: number
          use_count: number
          user_id: string
          usual_slot: string | null
        }
        Insert: {
          carb_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          kind?: string
          last_used_at?: string | null
          name: string
          protein_g?: number
          sodium_mg?: number
          sugar_g?: number
          use_count?: number
          user_id: string
          usual_slot?: string | null
        }
        Update: {
          carb_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          kcal?: number
          kind?: string
          last_used_at?: string | null
          name?: string
          protein_g?: number
          sodium_mg?: number
          sugar_g?: number
          use_count?: number
          user_id?: string
          usual_slot?: string | null
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          added_load_kg: number | null
          bands: Json | null
          completed_at: string
          distance_m: number | null
          duration_sec: number | null
          exercise_id: string
          id: string
          is_warmup: boolean
          load_kg: number | null
          reps: number | null
          rir: number | null
          rpe: number | null
          session_id: string
          set_no: number
          side: string
          user_id: string
        }
        Insert: {
          added_load_kg?: number | null
          bands?: Json | null
          completed_at?: string
          distance_m?: number | null
          duration_sec?: number | null
          exercise_id: string
          id?: string
          is_warmup?: boolean
          load_kg?: number | null
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          session_id: string
          set_no: number
          side?: string
          user_id: string
        }
        Update: {
          added_load_kg?: number | null
          bands?: Json | null
          completed_at?: string
          distance_m?: number | null
          duration_sec?: number | null
          exercise_id?: string
          id?: string
          is_warmup?: boolean
          load_kg?: number | null
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          session_id?: string
          set_no?: number
          side?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shield_ledger: {
        Row: {
          created_at: string
          delta_fragments: number
          delta_shields: number
          id: string
          local_date: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_fragments?: number
          delta_shields?: number
          id?: string
          local_date?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta_fragments?: number
          delta_shields?: number
          id?: string
          local_date?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      stat_snapshots: {
        Row: {
          local_date: string
          stat: string
          user_id: string
          value: number
        }
        Insert: {
          local_date: string
          stat: string
          user_id: string
          value: number
        }
        Update: {
          local_date?: string
          stat?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      task_definitions: {
        Row: {
          auto_source: string | null
          created_at: string
          days_of_week: number[]
          id: string
          is_active: boolean
          kind: string
          reminder_time: string | null
          sort_order: number
          target_value: number | null
          template_code: string | null
          title: string
          unit: string | null
          user_id: string
        }
        Insert: {
          auto_source?: string | null
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          kind: string
          reminder_time?: string | null
          sort_order?: number
          target_value?: number | null
          template_code?: string | null
          title: string
          unit?: string | null
          user_id: string
        }
        Update: {
          auto_source?: string | null
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          kind?: string
          reminder_time?: string | null
          sort_order?: number
          target_value?: number | null
          template_code?: string | null
          title?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_definitions_template_code_fkey"
            columns: ["template_code"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["code"]
          },
        ]
      }
      task_logs: {
        Row: {
          id: string
          is_completed: boolean
          local_date: string
          note: string | null
          photo_path: string | null
          source: string
          task_id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          is_completed?: boolean
          local_date: string
          note?: string | null
          photo_path?: string | null
          source?: string
          task_id: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          id?: string
          is_completed?: boolean
          local_date?: string
          note?: string | null
          photo_path?: string | null
          source?: string
          task_id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          auto_source: string | null
          code: string
          default_target_value: number | null
          icon: string | null
          kind: string
          sort_order: number
          title_en: string
          title_vi: string
          unit: string | null
        }
        Insert: {
          auto_source?: string | null
          code: string
          default_target_value?: number | null
          icon?: string | null
          kind: string
          sort_order?: number
          title_en: string
          title_vi: string
          unit?: string | null
        }
        Update: {
          auto_source?: string | null
          code?: string
          default_target_value?: number | null
          icon?: string | null
          kind?: string
          sort_order?: number
          title_en?: string
          title_vi?: string
          unit?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_code: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_code: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_code?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_code_fkey"
            columns: ["badge_code"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["code"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          ended_at: string | null
          equipment_profile_id: string | null
          feeling: number | null
          id: string
          local_date: string
          planned_session_id: string | null
          readiness: number | null
          readiness_applied: boolean
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          equipment_profile_id?: string | null
          feeling?: number | null
          id?: string
          local_date: string
          planned_session_id?: string | null
          readiness?: number | null
          readiness_applied?: boolean
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          equipment_profile_id?: string | null
          feeling?: number | null
          id?: string
          local_date?: string
          planned_session_id?: string | null
          readiness?: number | null
          readiness_applied?: boolean
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_equipment_profile_id_fkey"
            columns: ["equipment_profile_id"]
            isOneToOne: false
            referencedRelation: "equipment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_planned_session_id_fkey"
            columns: ["planned_session_id"]
            isOneToOne: false
            referencedRelation: "planned_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      exercise_muscles: {
        Row: {
          exercise_id: string | null
          muscle_code: string | null
          role: string | null
          stimulus: number | null
        }
        Relationships: []
      }
      monthly_summaries: {
        Row: {
          avg_kcal_in: number | null
          avg_protein_g: number | null
          avg_sleep_min: number | null
          avg_steps: number | null
          avg_water_ml: number | null
          avg_weight_kg: number | null
          days: number | null
          free_days: number | null
          last_weight_trend_kg: number | null
          period_start: string | null
          user_id: string | null
        }
        Relationships: []
      }
      public_coach_state: {
        Row: {
          aura_tier: string | null
          mood: string | null
          streak: number | null
          user_id: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          character: string | null
          character_name: string | null
          display_name: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          avg_kcal_in: number | null
          avg_protein_g: number | null
          avg_sleep_min: number | null
          avg_steps: number | null
          avg_water_ml: number | null
          avg_weight_kg: number | null
          days: number | null
          free_days: number | null
          last_weight_trend_kg: number | null
          period_start: string | null
          user_id: string | null
        }
        Relationships: []
      }
      yearly_summaries: {
        Row: {
          avg_kcal_in: number | null
          avg_protein_g: number | null
          avg_sleep_min: number | null
          avg_steps: number | null
          avg_water_ml: number | null
          avg_weight_kg: number | null
          days: number | null
          free_days: number | null
          last_weight_trend_kg: number | null
          period_start: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_close_day: {
        Args: { p: Json }
        Returns: boolean
      }
      due_close_days: {
        Args: { p_limit?: number; p_max_backfill?: number; p_now?: string }
        Returns: {
          local_date: string
          timezone: string
          user_id: string
        }[]
      }
      find_user_by_username: {
        Args: { p_username: string }
        Returns: {
          character: string
          character_name: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      redeem_invite: {
        Args: { p_code: string }
        Returns: string
      }
      start_duo_streak: {
        Args: { p_friend_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
