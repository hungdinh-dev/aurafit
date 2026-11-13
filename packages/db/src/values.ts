// GENERATED from supabase/migrations by supabase/scripts/pglite-check . Do not edit by hand.

/** Allowed values of `text` columns constrained by CHECK (col IN (...)) – the DB uses text + check instead of enums. */
export const DbValues = {
  ai_requests: {
    kind: ['meal_image', 'meal_text', 'reanalyze'],
    status: ['ok', 'error', 'quota_exceeded'],
  },
  badges: {
    rarity: ['common', 'rare', 'epic', 'legendary'],
  },
  barcode_products: {
    source: ['openfoodfacts', 'user'],
  },
  coach_settings: {
    free_day_mode: ['compensate', 'no_compensate'],
    strictness: ['gentle', 'standard', 'hardcore'],
    voice: ['bestie', 'coach', 'drama'],
  },
  coach_state: {
    aura_tier: ['gray', 'green', 'blue', 'purple', 'gold', 'red'],
    mood: ['radiant', 'sleepy', 'thirsty', 'hungry', 'fired_up', 'sad', 'neutral'],
  },
  daily_scores: {
    result: ['excellent', 'pass', 'fail'],
    strictness: ['gentle', 'standard', 'hardcore'],
  },
  duo_streaks: {
    status: ['active', 'ended'],
  },
  equipment_profiles: {
    kind: ['gym', 'home', 'bodyweight'],
  },
  exercise_media: {
    kind: ['gif', 'mp4', 'webp', 'image'],
    source: ['own', 'licensed', 'open_license'],
    variant: ['default', 'kai', 'mira'],
  },
  exercise_muscle_heads: {
    role: ['primary', 'secondary'],
  },
  exercises: {
    category: ['strength', 'warmup', 'mobility'],
    level: ['beginner', 'intermediate', 'advanced'],
    measure: ['reps', 'time', 'distance'],
    mechanic: ['compound', 'isolation'],
    movement_pattern: ['push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'lunge', 'core', 'carry'],
  },
  free_days: {
    kind: ['quota', 'shield'],
  },
  friendships: {
    status: ['pending', 'accepted', 'blocked'],
  },
  goals: {
    goal_type: ['lose_fat', 'maintain', 'gain_muscle'],
    pace: ['slow', 'medium', 'fast', 'auto'],
  },
  health_samples: {
    source: ['manual', 'apple_health', 'garmin', 'google_fit'],
    type: ['weight', 'water', 'sleep_session', 'steps', 'active_energy', 'resting_hr'],
    unit: ['kg', 'ml', 'min', 'count', 'kcal', 'bpm'],
  },
  meal_entries: {
    meal_slot: ['breakfast', 'lunch', 'dinner', 'snack'],
    source: ['photo', 'text', 'library', 'recent', 'barcode'],
  },
  meal_reactions: {
    reaction: ['fire', 'clap', 'heart', 'drool', 'strong'],
  },
  muscle_volume_targets: {
    source: ['default', 'auto', 'manual'],
  },
  muscles: {
    size: ['large', 'medium', 'small'],
    view: ['front', 'back', 'both'],
  },
  nutrition_targets: {
    reason: ['initial', 'weekly_adjust', 'goal_change', 'manual'],
  },
  personal_records: {
    kind: ['max_load', 'est_1rm', 'max_reps', 'max_time', 'progression_level'],
  },
  profiles: {
    activity_level: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    character: ['kai', 'mira'],
    experience_level: ['beginner', 'intermediate', 'advanced'],
    locale: ['vi', 'en'],
    sex: ['male', 'female'],
  },
  program_templates: {
    equipment_kind: ['gym', 'home', 'bodyweight'],
    level: ['beginner', 'intermediate', 'advanced'],
    split: ['full_body', 'upper_lower', 'ppl'],
  },
  programs: {
    goal_type: ['lose_fat', 'maintain', 'gain_muscle'],
    schedule_mode: ['weekday', 'rotation'],
    split: ['full_body', 'upper_lower', 'ppl'],
    status: ['active', 'completed', 'archived'],
  },
  quests: {
    stat: ['diet_discipline', 'protein', 'sleep', 'water', 'training', 'strength', 'body_progress', 'self_growth'],
  },
  saved_foods: {
    kind: ['item', 'combo'],
    usual_slot: ['breakfast', 'lunch', 'dinner', 'snack'],
  },
  set_logs: {
    side: ['both', 'left', 'right'],
  },
  shield_ledger: {
    reason: ['excellent_day', 'monthly_gift', 'starter', 'protect_streak', 'free_day', 'boss_reward'],
  },
  stat_snapshots: {
    stat: ['diet_discipline', 'protein', 'sleep', 'water', 'training', 'strength', 'body_progress', 'self_growth'],
  },
  task_definitions: {
    auto_source: ['steps', 'wake_before'],
    kind: ['check', 'count', 'timer', 'auto'],
  },
  task_logs: {
    source: ['manual', 'auto', 'timer'],
  },
  task_templates: {
    auto_source: ['steps', 'wake_before'],
    kind: ['check', 'count', 'timer', 'auto'],
  },
  workout_sessions: {
    status: ['in_progress', 'completed', 'cancelled'],
  },
} as const;

export type DbValue<
  T extends keyof typeof DbValues,
  C extends keyof (typeof DbValues)[T],
> = (typeof DbValues)[T][C] extends readonly (infer V)[] ? V : never;
