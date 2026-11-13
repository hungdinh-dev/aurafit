/**
 * BMR, TDEE and the safety calorie floor (nutrition.md §1, NUT-01).
 */
import type { ActivityLevel, BodyProfile, Sex } from './types';

/** ≈ 7,700 kcal per kg of body fat (nutrition.md §1.3). */
export const KCAL_PER_KG = 7700;

/**
 * Activity multipliers chosen at onboarding. Docs only say "BMR × hệ số vận động"; these
 * are the standard multipliers used with Mifflin–St Jeor (McArdle, Katch & Katch,
 * "Exercise Physiology"; same values as the classic Harris–Benedict activity factors).
 */
export const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Absolute kcal minimum by sex (nutrition.md §1.4): 1,200 women / 1,500 men. */
export const MIN_KCAL_BY_SEX: Readonly<Record<Sex, number>> = { female: 1200, male: 1500 };

/**
 * Sex constant in Mifflin–St Jeor (Mifflin et al., Am J Clin Nutr 1990;51:241-7):
 * +5 for men, −161 for women. When sex is unknown we use the midpoint (−78).
 */
const MIFFLIN_SEX_CONSTANT: Readonly<Record<Sex | 'unknown', number>> = {
  male: 5,
  female: -161,
  unknown: -78,
};

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name}_must_be_positive`);
}

/** Validation codes for onboarding input (no user-facing strings – the app translates). */
export type BodyProfileIssue =
  | 'age_out_of_range'
  | 'height_out_of_range'
  | 'weight_out_of_range';

/**
 * Plausibility check for onboarding. Height range follows `profiles.height_cm` (100–250);
 * age 13–100 and weight 25–350 kg are app limits (Mifflin–St Jeor was validated on adults,
 * values outside these ranges are not meaningful for the equation).
 */
export function validateBodyProfile(p: BodyProfile): BodyProfileIssue[] {
  const issues: BodyProfileIssue[] = [];
  if (!Number.isFinite(p.ageYears) || p.ageYears < 13 || p.ageYears > 100) issues.push('age_out_of_range');
  if (!Number.isFinite(p.heightCm) || p.heightCm < 100 || p.heightCm > 250) issues.push('height_out_of_range');
  if (!Number.isFinite(p.weightKg) || p.weightKg < 25 || p.weightKg > 350) issues.push('weight_out_of_range');
  return issues;
}

/**
 * Basal metabolic rate, Mifflin–St Jeor:
 * `10·kg + 6.25·cm − 5·age + s` (s = +5 male, −161 female, −78 unknown). Not rounded.
 */
export function bmr(p: BodyProfile): number {
  assertPositive('weight', p.weightKg);
  assertPositive('height', p.heightCm);
  assertPositive('age', p.ageYears);
  const s = MIFFLIN_SEX_CONSTANT[p.sex ?? 'unknown'];
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears + s;
}

/** Initial TDEE = BMR × activity factor, rounded to whole kcal. */
export function tdee(bmrKcal: number, activityLevel: ActivityLevel): number {
  assertPositive('bmr', bmrKcal);
  return Math.round(bmrKcal * ACTIVITY_FACTORS[activityLevel]);
}

/** Convenience: TDEE straight from the body profile. */
export function tdeeFromProfile(p: BodyProfile, activityLevel: ActivityLevel): number {
  return tdee(bmr(p), activityLevel);
}

/**
 * Safety floor: never suggest below max(BMR, 1,200 kcal women / 1,500 kcal men)
 * (nutrition.md §1.4). Unknown sex uses the higher 1,500 (the safer choice).
 * Rounded *up* to the next 10 kcal so a rounded target can never sit below it.
 */
export function safetyFloorKcal(bmrKcal: number, sex: Sex | null): number {
  const minimum = sex ? MIN_KCAL_BY_SEX[sex] : MIN_KCAL_BY_SEX.male;
  return Math.ceil(Math.max(bmrKcal, minimum) / 10) * 10;
}

/**
 * Extra kcal for a training / very active day (nutrition.md §1.7: "cộng thêm một phần năng
 * lượng vận động"). Only active energy *above* what the activity factor already assumes is
 * credited, and only a share of it:
 * - baseline active energy implied by the factor = (factor − 1.1) × BMR, because the factor
 *   also covers the ~10 % thermic effect of food (Westerterp, Nutr Metab 2004);
 * - default share 50 %, because wrist wearables overestimate energy expenditure
 *   substantially (Shcherbina et al., J Pers Med 2017).
 * Result is rounded to 10 kcal and capped (default 500 kcal).
 */
export function activityBonusKcal(input: {
  bmrKcal: number;
  activityLevel: ActivityLevel;
  measuredActiveKcal: number;
  share?: number;
  maxBonusKcal?: number;
}): number {
  const share = input.share ?? 0.5;
  const cap = input.maxBonusKcal ?? 500;
  if (!Number.isFinite(input.measuredActiveKcal) || input.measuredActiveKcal <= 0) return 0;
  const baseline = (ACTIVITY_FACTORS[input.activityLevel] - 1.1) * input.bmrKcal;
  const extra = Math.max(0, input.measuredActiveKcal - baseline) * share;
  return Math.min(cap, Math.round(extra / 10) * 10);
}
