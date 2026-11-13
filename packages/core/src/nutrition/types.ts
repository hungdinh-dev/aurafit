/**
 * Shared nutrition types. Row-like shapes use the database column names
 * (docs/04-database/01-profile.md, 02-nutrition.md) so app code can pass Supabase rows
 * straight through. Units: kg, cm, kcal, grams, mg (sodium).
 */

/** `profiles.sex`. `null` = not provided (handled conservatively). */
export type Sex = 'male' | 'female';

/** `profiles.activity_level`. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** `goals.goal_type` (D-024). */
export type GoalType = 'lose_fat' | 'maintain' | 'gain_muscle';

/** `goals.pace` (D-013). `auto` = "Để app quyết định". */
export type Pace = 'slow' | 'medium' | 'fast' | 'auto';
/** Alias kept for readability in UI code ("speed" in the onboarding copy). */
export type Speed = Pace;
/** A pace after `auto` has been resolved. */
export type ResolvedPace = Exclude<Pace, 'auto'>;

/** `profiles.experience_level`. */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

/** `coach_settings.strictness`. */
export type Strictness = 'gentle' | 'standard' | 'hardcore';

/** `coach_settings.free_day_mode`. */
export type FreeDayMode = 'compensate' | 'no_compensate';

/** `meal_entries.meal_slot` / `saved_foods.usual_slot`. */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Nutrient amounts, column names as in `meal_items` / `saved_foods` (D-015: always store
 * all seven, display of fiber/sodium is optional).
 */
export interface Nutrients {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
}

export type NutrientKey = keyof Nutrients;

export const NUTRIENT_KEYS: readonly NutrientKey[] = [
  'kcal',
  'protein_g',
  'carb_g',
  'fat_g',
  'sugar_g',
  'fiber_g',
  'sodium_mg',
] as const;

/** Daily targets – the value columns of `nutrition_targets`. */
export interface NutritionTargets {
  tdee_kcal: number;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  /** Upper limit for (added) sugar. */
  sugar_g: number;
  /** Optional nutrient (NUT-12) – minimum. */
  fiber_g: number;
  /** Optional nutrient (NUT-12) – upper limit. */
  sodium_mg: number;
}

/** Body data needed for energy equations. */
export interface BodyProfile {
  sex: Sex | null;
  ageYears: number;
  heightCm: number;
  weightKg: number;
}
