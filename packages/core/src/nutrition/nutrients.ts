/**
 * Nutrient arithmetic: meal totals, portion scaling, remaining-vs-target.
 * Rounding follows the column precision in `meal_items`: kcal int, grams 0.1, sodium int.
 */
import { NUTRIENT_KEYS, type NutrientKey, type Nutrients } from './types';

/** Portion multipliers offered for "Món của tôi" (NUT-05: ×0.5 / ×1 / ×1.5 / ×2). */
export const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2] as const;

/** Any row-like object carrying (possibly null / missing) nutrient columns. */
export type NutrientLike = Partial<Record<NutrientKey, number | null | undefined>>;

const num = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round1 = (x: number): number => Math.round(x * 10) / 10;

export function zeroNutrients(): Nutrients {
  return { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 0 };
}

/** Normalises a partial / nullable row into a full `Nutrients` (missing → 0). */
export function toNutrients(n: NutrientLike): Nutrients {
  const out = zeroNutrients();
  for (const k of NUTRIENT_KEYS) out[k] = num(n[k]);
  return out;
}

/** Rounds to storage precision: kcal & sodium → integer, grams → 0.1 g. */
export function roundNutrients(n: NutrientLike): Nutrients {
  const v = toNutrients(n);
  return {
    kcal: Math.round(v.kcal),
    protein_g: round1(v.protein_g),
    carb_g: round1(v.carb_g),
    fat_g: round1(v.fat_g),
    sugar_g: round1(v.sugar_g),
    fiber_g: round1(v.fiber_g),
    sodium_mg: Math.round(v.sodium_mg),
  };
}

/**
 * Multiplies every nutrient by a portion factor (`meal_items.quantity`) and rounds to
 * storage precision. Factor must be ≥ 0.
 */
export function scaleNutrients(n: NutrientLike, factor: number): Nutrients {
  if (!Number.isFinite(factor) || factor < 0) throw new RangeError('portion_factor_must_be_non_negative');
  const v = toNutrients(n);
  const out = zeroNutrients();
  for (const k of NUTRIENT_KEYS) out[k] = v[k] * factor;
  return roundNutrients(out);
}

/** Element-wise sum, unrounded beyond storage precision. */
export function sumNutrients(list: readonly NutrientLike[]): Nutrients {
  const out = zeroNutrients();
  for (const item of list) for (const k of NUTRIENT_KEYS) out[k] += num(item[k]);
  return roundNutrients(out);
}

/** Total of a meal (= `sumNutrients` of its items; items already include their quantity). */
export const mealTotals = sumNutrients;

/** `a − b` per nutrient (may be negative). */
export function subtractNutrients(a: NutrientLike, b: NutrientLike): Nutrients {
  const x = toNutrients(a);
  const y = toNutrients(b);
  const out = zeroNutrients();
  for (const k of NUTRIENT_KEYS) out[k] = x[k] - y[k];
  return roundNutrients(out);
}

/**
 * What is left for today: `target − consumed`. Negative values mean "over"; pass
 * `clampAtZero` for display rings that should stop at 0.
 */
export function remainingNutrients(
  target: NutrientLike,
  consumed: NutrientLike,
  options: { clampAtZero?: boolean } = {},
): Nutrients {
  const diff = subtractNutrients(target, consumed);
  if (!options.clampAtZero) return diff;
  for (const k of NUTRIENT_KEYS) diff[k] = Math.max(0, diff[k]);
  return diff;
}

/** kcal implied by macros (Atwater 4/4/9) – used to sanity-check AI output. */
export function kcalFromMacros(n: NutrientLike): number {
  return Math.round(num(n.protein_g) * 4 + num(n.carb_g) * 4 + num(n.fat_g) * 9);
}
