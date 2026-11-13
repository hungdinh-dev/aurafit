/**
 * Daily kcal / macro targets (nutrition.md §1, D-013, D-015, NUT-01).
 *
 *   kcal   = TDEE + pace delta (7,700 kcal/kg ⇒ −0.5 kg/week ≈ −550 kcal/day),
 *            rounded to 10 kcal, never below the safety floor max(BMR, 1,200 F / 1,500 M)
 *   protein 1.6–2.2 g/kg (fat loss takes the high end) · fat ≥ 0.6 g/kg · carb = remainder
 *   added sugar ≤ 10 % kcal · fiber / sodium optional (NUT-12)
 */
import {
  ACTIVITY_FACTORS,
  KCAL_PER_KG,
  bmr as computeBmr,
  safetyFloorKcal,
  tdee as computeTdee,
} from './energy';
import type {
  ActivityLevel,
  BodyProfile,
  ExperienceLevel,
  GoalType,
  NutritionTargets,
  Pace,
  ResolvedPace,
  Sex,
} from './types';

/** Weekly weight change per pace (nutrition.md §1 table), kg/week, unsigned. */
export const PACE_KG_PER_WEEK: Readonly<
  Record<Exclude<GoalType, 'maintain'>, Readonly<Record<ResolvedPace, number>>>
> = {
  lose_fat: { slow: 0.25, medium: 0.5, fast: 0.75 },
  gain_muscle: { slow: 0.1, medium: 0.25, fast: 0.4 },
};

/**
 * Protein g/kg per goal. Docs: 1.6–2.2 g/kg, fat loss takes the high end. Maintain uses
 * the low end and muscle gain 1.8 – protein needs are lower in a surplus than in a
 * deficit (Morton et al., Br J Sports Med 2018: benefit plateaus ≈1.6 g/kg; Helms et al.,
 * IJSNEM 2014: 2.3–3.1 g/kg FFM in a deficit).
 */
export const PROTEIN_G_PER_KG: Readonly<Record<GoalType, number>> = {
  lose_fat: 2.2,
  maintain: 1.6,
  gain_muscle: 1.8,
};
export const PROTEIN_MIN_G_PER_KG = 1.6;

/** Fat minimum (docs: ≥ 0.6 g/kg). */
export const FAT_MIN_G_PER_KG = 0.6;
/**
 * Default fat share of kcal when above the minimum. Docs are silent; 25 % sits inside the
 * IOM AMDR of 20–35 % (Dietary Reference Intakes for Energy and Macronutrients, 2005).
 */
export const FAT_DEFAULT_SHARE = 0.25;
/** Added sugar ≤ 10 % of kcal (docs; WHO Guideline: Sugars intake, 2015). */
export const SUGAR_MAX_SHARE = 0.1;
/** Fiber 14 g per 1,000 kcal (IOM DRI 2005 / Dietary Guidelines for Americans). */
export const FIBER_G_PER_1000_KCAL = 14;
/** Sodium < 2,000 mg/day (WHO Guideline: Sodium intake, 2012). */
export const SODIUM_MAX_MG = 2000;

/**
 * Body weight used for g/kg protein & fat. Docs are silent for overweight users; scaling
 * protein to total weight overshoots badly at high body fat (2.2 g/kg × 150 kg = 330 g).
 * We cap the reference at the weight corresponding to BMI 25 for the user's height,
 * a common clinical practice (ISSN position stand, Jäger et al. 2017, recommends scaling
 * to lean / goal weight in overweight individuals).
 */
export function referenceWeightKg(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.min(weightKg, 25 * m * m);
}

export function bmiOf(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Why "Để app quyết định" picked a pace – codes for the app's explanation copy. */
export type AutoPaceReason =
  | 'body_fat_high'
  | 'body_fat_mid'
  | 'body_fat_low'
  | 'bmi_high'
  | 'bmi_mid'
  | 'bmi_low'
  | 'experience_beginner'
  | 'experience_intermediate'
  | 'experience_advanced'
  | 'experience_unknown'
  | 'low_adherence'
  | 'user_choice'
  | 'maintain';

export interface PaceInput {
  goal: GoalType;
  pace: Pace;
  sex: Sex | null;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number | null;
  experience?: ExperienceLevel | null;
  /** Share (0–1) of recent logged days with kcal on target; < 0.6 slows the auto pace. */
  adherenceRate?: number | null;
}

export interface PaceResolution {
  /** `null` for `maintain`. */
  pace: ResolvedPace | null;
  reasons: AutoPaceReason[];
}

const SLOWER: Readonly<Record<ResolvedPace, ResolvedPace>> = { fast: 'medium', medium: 'slow', slow: 'slow' };

/** Body-fat cut-offs (ACE classification: "obese" ≥ 25 % men / ≥ 32 % women; "fitness" upper bound ~17 % / ~24 %). */
const BF_HIGH: Readonly<Record<Sex | 'unknown', number>> = { male: 25, female: 32, unknown: 28.5 };
const BF_LOW: Readonly<Record<Sex | 'unknown', number>> = { male: 15, female: 23, unknown: 19 };
/** WHO expert consultation for Asian populations (Lancet 2004): 23 = increased risk, 27.5 = high risk. */
const BMI_HIGH = 27.5;
const BMI_LOW = 23;
const LOW_ADHERENCE = 0.6;

/**
 * Resolves `auto` pace ("Để app quyết định", nutrition.md §1):
 * - fat loss: by body-fat % (falls back to Asian BMI cut-offs when unknown) → faster when
 *   there is more fat to lose (Helms et al. 2014 recommend 0.5–1 % BW/week, slower when
 *   lean); one step slower when recent adherence < 60 %.
 * - muscle gain: by training experience – beginner `medium`, intermediate / advanced `slow`
 *   (Aragon's guideline: ~1–1.5 % BW/month for beginners, 0.5–1 % intermediates,
 *   0.25–0.5 % advanced); unknown experience treated as beginner (onboarding asks it later).
 * Explicit user choices are returned unchanged.
 */
export function resolvePace(input: PaceInput): PaceResolution {
  if (input.goal === 'maintain') return { pace: null, reasons: ['maintain'] };
  if (input.pace !== 'auto') return { pace: input.pace, reasons: ['user_choice'] };

  if (input.goal === 'gain_muscle') {
    switch (input.experience) {
      case 'intermediate':
        return { pace: 'slow', reasons: ['experience_intermediate'] };
      case 'advanced':
        return { pace: 'slow', reasons: ['experience_advanced'] };
      case 'beginner':
        return { pace: 'medium', reasons: ['experience_beginner'] };
      default:
        return { pace: 'medium', reasons: ['experience_unknown'] };
    }
  }

  const reasons: AutoPaceReason[] = [];
  let pace: ResolvedPace;
  const bf = input.bodyFatPct;
  if (bf != null && Number.isFinite(bf) && bf > 0) {
    const key = input.sex ?? 'unknown';
    if (bf >= BF_HIGH[key]) {
      pace = 'fast';
      reasons.push('body_fat_high');
    } else if (bf < BF_LOW[key]) {
      pace = 'slow';
      reasons.push('body_fat_low');
    } else {
      pace = 'medium';
      reasons.push('body_fat_mid');
    }
  } else {
    const bmi = bmiOf(input.weightKg, input.heightCm);
    if (bmi >= BMI_HIGH) {
      pace = 'fast';
      reasons.push('bmi_high');
    } else if (bmi < BMI_LOW) {
      pace = 'slow';
      reasons.push('bmi_low');
    } else {
      pace = 'medium';
      reasons.push('bmi_mid');
    }
  }
  if (input.adherenceRate != null && input.adherenceRate < LOW_ADHERENCE && pace !== 'slow') {
    pace = SLOWER[pace];
    reasons.push('low_adherence');
  }
  return { pace, reasons };
}

/** Signed planned weight change (kg/week): negative for fat loss, 0 for maintain. */
export function plannedKgPerWeek(goal: GoalType, pace: ResolvedPace | null): number {
  if (goal === 'maintain' || pace === null) return 0;
  const kg = PACE_KG_PER_WEEK[goal][pace];
  return goal === 'lose_fat' ? -kg : kg;
}

/** kcal/day for a signed kg/week change: `kg × 7,700 / 7` (−0.5 → −550). */
export function dailyDeltaKcal(kgPerWeek: number): number {
  return Math.round((kgPerWeek * KCAL_PER_KG) / 7);
}

export interface TargetsInput extends BodyProfile {
  activityLevel: ActivityLevel;
  goal: GoalType;
  pace: Pace;
  bodyFatPct?: number | null;
  experience?: ExperienceLevel | null;
  adherenceRate?: number | null;
  /**
   * TDEE to use instead of BMR × factor – e.g. the value from the weekly adaptive
   * adjustment (HLT-03). When absent the initial TDEE is computed.
   */
  tdeeKcal?: number | null;
}

/** Numbers behind the targets – stored in `nutrition_targets.explanation` (jsonb). */
export interface TargetsExplanation {
  bmrKcal: number;
  activityFactor: number;
  tdeeKcal: number;
  tdeeSource: 'formula' | 'provided';
  goal: GoalType;
  requestedPace: Pace;
  resolvedPace: ResolvedPace | null;
  paceReasons: AutoPaceReason[];
  plannedKgPerWeek: number;
  plannedDailyDeltaKcal: number;
  rawKcal: number;
  floorKcal: number;
  floorApplied: boolean;
  effectiveDailyDeltaKcal: number;
  effectiveKgPerWeek: number;
  referenceWeightKg: number;
  proteinGPerKg: number;
  fatMinG: number;
  /** Macros had to be trimmed (fat → minimum, then protein → 1.6 g/kg) to fit kcal. */
  macrosTrimmed: boolean;
}

export interface TargetsResult {
  targets: NutritionTargets;
  explanation: TargetsExplanation;
}

const round10 = (x: number): number => Math.round(x / 10) * 10;
const round1 = (x: number): number => Math.round(x * 10) / 10;

/**
 * Splits a kcal target into protein / fat / carb grams.
 * protein = refWeight × g/kg; fat = max(0.6 g/kg, 25 % kcal); carb = remaining kcal / 4.
 * If the remainder is negative (very low kcal, heavy user) fat is trimmed to its minimum,
 * then protein to 1.6 g/kg; carb never goes below 0.
 */
export function splitMacros(input: {
  kcal: number;
  referenceWeightKg: number;
  proteinGPerKg: number;
}): { protein_g: number; fat_g: number; carb_g: number; fatMinG: number; trimmed: boolean } {
  const { kcal, referenceWeightKg: w } = input;
  let protein = Math.round(w * input.proteinGPerKg);
  const fatMin = Math.round(w * FAT_MIN_G_PER_KG);
  let fat = Math.max(fatMin, Math.round((kcal * FAT_DEFAULT_SHARE) / 9));
  let rest = kcal - protein * 4 - fat * 9;
  let trimmed = false;
  if (rest < 0) {
    trimmed = true;
    fat = Math.max(fatMin, fat - Math.ceil(-rest / 9));
    rest = kcal - protein * 4 - fat * 9;
  }
  if (rest < 0) {
    const proteinMin = Math.round(w * PROTEIN_MIN_G_PER_KG);
    protein = Math.max(proteinMin, protein - Math.ceil(-rest / 4));
    rest = kcal - protein * 4 - fat * 9;
  }
  return { protein_g: protein, fat_g: fat, carb_g: Math.max(0, Math.round(rest / 4)), fatMinG: fatMin, trimmed };
}

/** Added-sugar limit in grams: 10 % of kcal / 4 kcal/g, rounded down. */
export function sugarLimitG(kcal: number): number {
  return Math.floor((kcal * SUGAR_MAX_SHARE) / 4);
}

/** Fiber target in grams: 14 g / 1,000 kcal. */
export function fiberTargetG(kcal: number): number {
  return Math.round((kcal / 1000) * FIBER_G_PER_1000_KCAL);
}

/**
 * Computes the full daily target set (NUT-01). Pure: the caller stores the result as a new
 * `nutrition_targets` row with `reason` `initial` / `weekly_adjust` / `goal_change`.
 */
export function computeTargets(input: TargetsInput): TargetsResult {
  const bmrKcal = computeBmr(input);
  const tdeeSource = input.tdeeKcal != null ? 'provided' : 'formula';
  const tdeeKcal =
    input.tdeeKcal != null ? Math.round(input.tdeeKcal) : computeTdee(bmrKcal, input.activityLevel);
  if (!Number.isFinite(tdeeKcal) || tdeeKcal <= 0) throw new RangeError('tdee_must_be_positive');

  const resolution = resolvePace(input);
  const kgPerWeek = plannedKgPerWeek(input.goal, resolution.pace);
  const delta = dailyDeltaKcal(kgPerWeek);
  const rawKcal = tdeeKcal + delta;
  const floorKcal = safetyFloorKcal(bmrKcal, input.sex);
  const rounded = round10(rawKcal);
  const kcal = Math.max(rounded, floorKcal);
  const effectiveDelta = kcal - tdeeKcal;

  const refW = referenceWeightKg(input.weightKg, input.heightCm);
  const proteinGPerKg = PROTEIN_G_PER_KG[input.goal];
  const macros = splitMacros({ kcal, referenceWeightKg: refW, proteinGPerKg });

  return {
    targets: {
      tdee_kcal: tdeeKcal,
      kcal,
      protein_g: macros.protein_g,
      carb_g: macros.carb_g,
      fat_g: macros.fat_g,
      sugar_g: sugarLimitG(kcal),
      fiber_g: fiberTargetG(kcal),
      sodium_mg: SODIUM_MAX_MG,
    },
    explanation: {
      bmrKcal: Math.round(bmrKcal),
      activityFactor: ACTIVITY_FACTORS[input.activityLevel],
      tdeeKcal,
      tdeeSource,
      goal: input.goal,
      requestedPace: input.pace,
      resolvedPace: resolution.pace,
      paceReasons: resolution.reasons,
      plannedKgPerWeek: kgPerWeek,
      plannedDailyDeltaKcal: delta,
      rawKcal,
      floorKcal,
      floorApplied: rounded < floorKcal,
      effectiveDailyDeltaKcal: effectiveDelta,
      effectiveKgPerWeek: Math.round(((effectiveDelta * 7) / KCAL_PER_KG) * 1000) / 1000,
      referenceWeightKg: round1(refW),
      proteinGPerKg,
      fatMinG: macros.fatMinG,
      macrosTrimmed: macros.trimmed,
    },
  };
}
