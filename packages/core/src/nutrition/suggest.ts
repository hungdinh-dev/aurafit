/**
 * "Ăn gì bây giờ?" (NUT-10, signature-features §4): pick 1–2 foods / combos from the user's
 * own library ("Món của tôi" + recent) that best fit the remaining kcal and protein, with
 * portion multipliers ×0.5 / ×1 / ×1.5 / ×2. Rule-based, on device, 0 AI.
 *
 * Example from the docs: 520 kcal / 42 g left → chicken breast + ½ bowl rice (510 kcal, 45 g).
 *
 * Scoring (lower is better; weights are our choice, docs silent):
 *   kcal error |R − K| / R (over-shoot counts double; > R·(1 + tolerance) is excluded)
 *   + protein shortfall max(0, P − p) / P
 *   + 0.03 for a 2-part suggestion, + 0.01 per non-×1 portion (prefer simple answers)
 *   − 0.05 when every part's usual slot matches the current slot (−0.025 if some do)
 *   − up to 0.02 for frequently used foods.
 */
import { scaleNutrients, sumNutrients, PORTION_MULTIPLIERS, type NutrientLike } from './nutrients';
import type { MealSlot, Nutrients } from './types';

/** Below this many kcal left there is nothing useful to suggest (docs silent). */
export const MIN_SUGGEST_BUDGET_KCAL = 100;
/** Library size considered for pair search (most relevant first). */
const MAX_CANDIDATES = 60;

export interface SuggestibleFood extends NutrientLike {
  id: string;
  kind?: 'item' | 'combo';
  usual_slot?: MealSlot | null;
  use_count?: number | null;
}

export interface SuggestInput {
  remaining: { kcal: number; protein_g: number };
  foods: readonly SuggestibleFood[];
  slot?: MealSlot | null;
  /** 1 or 2 parts per suggestion (default 2). */
  maxParts?: 1 | 2;
  portions?: readonly number[];
  /** Number of suggestions to return (default 3). */
  limit?: number;
  /** Allowed kcal overshoot as a share of the remaining kcal (default 0.1). */
  kcalTolerance?: number;
}

export interface SuggestionPart {
  foodId: string;
  portion: number;
  nutrients: Nutrients;
}

export interface Suggestion {
  parts: SuggestionPart[];
  totals: Nutrients;
  score: number;
}

export type SuggestStatus = 'ok' | 'no_budget' | 'no_foods' | 'no_match';

export interface SuggestResult {
  status: SuggestStatus;
  suggestions: Suggestion[];
}

function relevance(f: SuggestibleFood, slot: MealSlot | null | undefined): number {
  return (slot && f.usual_slot === slot ? 1_000_000 : 0) + (f.use_count ?? 0);
}

export function suggestFoods(input: SuggestInput): SuggestResult {
  const R = input.remaining.kcal;
  const P = input.remaining.protein_g;
  if (!Number.isFinite(R) || R < MIN_SUGGEST_BUDGET_KCAL) return { status: 'no_budget', suggestions: [] };

  const foods = input.foods
    .filter((f) => typeof f.kcal === 'number' && f.kcal > 0)
    .slice()
    .sort((a, b) => relevance(b, input.slot) - relevance(a, input.slot))
    .slice(0, MAX_CANDIDATES);
  if (foods.length === 0) return { status: 'no_foods', suggestions: [] };

  const portions = input.portions ?? PORTION_MULTIPLIERS;
  const maxKcal = R * (1 + (input.kcalTolerance ?? 0.1));
  const limit = input.limit ?? 3;

  // Pre-scale every (food, portion) once.
  const options = foods.flatMap((food) =>
    portions.map((portion) => ({ food, portion, n: scaleNutrients(food, portion) })),
  );

  const scoreOf = (parts: typeof options): number | null => {
    const totals = sumNutrients(parts.map((p) => p.n));
    if (totals.kcal > maxKcal) return null;
    const kcalErr = totals.kcal > R ? (2 * (totals.kcal - R)) / R : (R - totals.kcal) / R;
    const protErr = P > 0 ? Math.max(0, P - totals.protein_g) / P : 0;
    const matching = input.slot ? parts.filter((p) => p.food.usual_slot === input.slot).length : 0;
    const slotBonus = matching === 0 ? 0 : matching === parts.length ? 0.05 : 0.025;
    const popularity =
      parts.reduce((s, p) => s + Math.min(1, Math.log10(1 + Math.max(0, p.food.use_count ?? 0)) / 2), 0) /
      parts.length;
    const complexity = (parts.length - 1) * 0.03 + parts.filter((p) => p.portion !== 1).length * 0.01;
    return kcalErr + protErr + complexity - slotBonus - 0.02 * popularity;
  };

  // Best suggestion per distinct set of foods, so results are varied.
  const best = new Map<string, Suggestion>();
  const consider = (parts: typeof options): void => {
    const score = scoreOf(parts);
    if (score === null) return;
    const key = parts
      .map((p) => p.food.id)
      .sort()
      .join('+');
    const prev = best.get(key);
    if (prev && prev.score <= score) return;
    best.set(key, {
      // Main dish (most kcal) first.
      parts: parts
        .map((p) => ({ foodId: p.food.id, portion: p.portion, nutrients: p.n }))
        .sort((a, b) => b.nutrients.kcal - a.nutrients.kcal),
      totals: sumNutrients(parts.map((p) => p.n)),
      score: Math.round(score * 10_000) / 10_000,
    });
  };

  for (const o of options) consider([o]);
  if ((input.maxParts ?? 2) === 2) {
    for (let i = 0; i < options.length; i++) {
      const a = options[i]!;
      if (a.n.kcal > maxKcal) continue;
      for (let j = i + 1; j < options.length; j++) {
        const b = options[j]!;
        if (b.food.id === a.food.id) continue;
        consider([a, b]);
      }
    }
  }

  const suggestions = [...best.values()].sort((a, b) => a.score - b.score).slice(0, limit);
  return suggestions.length > 0 ? { status: 'ok', suggestions } : { status: 'no_match', suggestions: [] };
}
