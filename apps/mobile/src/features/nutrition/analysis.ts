import { nutrition } from '@aurafit/core';
import { z } from 'zod';

export type MealSlot = nutrition.MealSlot;
export type Nutrients = nutrition.Nutrients;

export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function asMealSlot(value: string | null | undefined): MealSlot {
  return (MEAL_SLOTS as readonly string[]).includes(value ?? '') ? (value as MealSlot) : 'snack';
}

/**
 * Default slot for "now" (minutes after local midnight): 04:00–10:29 breakfast,
 * 10:30–14:29 lunch, 17:00–21:59 dinner, otherwise snack.
 */
export function slotForTime(minutes: number): MealSlot {
  if (minutes >= 4 * 60 && minutes < 10 * 60 + 30) return 'breakfast';
  if (minutes >= 10 * 60 + 30 && minutes < 14 * 60 + 30) return 'lunch';
  if (minutes >= 17 * 60 && minutes < 22 * 60) return 'dinner';
  return 'snack';
}

// ---------------------------------------------------------------------------------------------
// analyze-meal / analyze-text response (supabase/functions/_shared/ai/types.ts)

const nonNeg = z.preprocess(
  (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0),
  z.number(),
);
const delta = z.number().refine(Number.isFinite);

const AdjustmentSchema = z
  .object({ kcal: delta, protein_g: delta, carb_g: delta, fat_g: delta, sugar_g: delta })
  .partial();

const OptionSchema = z.object({
  label: z.string().min(1),
  is_default: z.boolean().optional().default(false),
  adjustment: AdjustmentSchema.optional().default({}),
});

const QuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  item_index: z.number().int().nullable().optional(),
  options: z.array(OptionSchema).min(2),
});

const ItemSchema = z.object({
  name: z.string().min(1),
  portion_text: z.string().nullable().optional(),
  kcal: nonNeg,
  protein_g: nonNeg,
  carb_g: nonNeg,
  fat_g: nonNeg,
  sugar_g: nonNeg,
  fiber_g: nonNeg.optional(),
  sodium_mg: nonNeg.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export const AnalyzeResponseSchema = z.object({
  ai_request_id: z.string().nullable().optional(),
  analysis: z.object({
    is_food: z.boolean(),
    items: z.array(ItemSchema),
    overall_confidence: z.number().min(0).max(1).optional(),
    clarifying_questions: z.array(QuestionSchema).optional().default([]),
    notes: z.string().nullable().optional(),
  }),
  low_confidence: z.boolean().optional().default(false),
  quota: z.object({ used: z.number(), limit: z.number() }).nullable().optional(),
});
export type AnalyzeResponse = z.output<typeof AnalyzeResponseSchema>;

// ---------------------------------------------------------------------------------------------
// Draft = what the confirm screen edits before saving

export interface DraftItem {
  name: string;
  portionText: string | null;
  /** Base nutrients (quantity 1), before clarifying answers. */
  nutrients: Nutrients;
  confidence: number | null;
  barcode?: string | null;
  savedFoodId?: string | null;
}

export interface DraftOption {
  id: string;
  label: string;
  kcalDelta: number;
}

export interface DraftQuestion extends nutrition.ClarificationQuestion {
  question: string;
  labels: DraftOption[];
}

export interface MealDraft {
  source: 'photo' | 'text' | 'barcode';
  slot: MealSlot;
  items: DraftItem[];
  questions: DraftQuestion[];
  aiRequestId: string | null;
  photoPath: string | null;
  confidence: number | null;
  lowConfidence: boolean;
  isFood: boolean;
  notes: string | null;
}

/** Converts a validated AI response into an editable draft (≤ 3 questions, option ids = index). */
export function draftFromAnalysis(
  res: AnalyzeResponse,
  ctx: { source: 'photo' | 'text'; slot: MealSlot; photoPath?: string | null },
): MealDraft {
  const questions: DraftQuestion[] = res.analysis.clarifying_questions
    .slice(0, nutrition.MAX_CLARIFYING_QUESTIONS)
    .map((q) => {
      const def = q.options.findIndex((o) => o.is_default);
      return {
        id: q.id,
        question: q.question,
        itemIndex: q.item_index ?? null,
        options: q.options.map((o, i) => ({ id: String(i), delta: { ...o.adjustment } })),
        defaultOptionId: def >= 0 ? String(def) : null,
        labels: q.options.map((o, i) => ({
          id: String(i),
          label: o.label,
          kcalDelta: Math.round(o.adjustment.kcal ?? 0),
        })),
      };
    });
  return {
    source: ctx.source,
    slot: ctx.slot,
    items: res.analysis.items.map((it) => ({
      name: it.name.slice(0, 120),
      portionText: it.portion_text ?? null,
      nutrients: nutrition.roundNutrients(it),
      confidence: it.confidence ?? null,
    })),
    questions,
    aiRequestId: res.ai_request_id ?? null,
    photoPath: ctx.photoPath ?? null,
    confidence: res.analysis.overall_confidence ?? null,
    lowConfidence: res.low_confidence,
    isFood: res.analysis.is_food,
    notes: res.analysis.notes ?? null,
  };
}

/** Initial answers: each question's default option. */
export function defaultAnswers(questions: readonly DraftQuestion[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of questions) if (q.defaultOptionId) out[q.id] = q.defaultOptionId;
  return out;
}

export interface ComputedItem extends DraftItem {
  /** Final nutrients after answers × portion (what is stored in meal_items). */
  final: Nutrients;
  clarifications: nutrition.AppliedClarification[];
}

/**
 * Applies the clarifying answers on device (no second AI call, D-014) and then the portion
 * multiplier – the order prescribed by `nutrition.applyClarifications`.
 */
export function computeDraft(
  draft: Pick<MealDraft, 'items' | 'questions'>,
  answers: Readonly<Record<string, string>>,
  portion = 1,
): { items: ComputedItem[]; totals: Nutrients } {
  const applied = nutrition.applyClarifications(
    draft.items.map((i) => i.nutrients),
    draft.questions,
    answers,
  );
  const items = draft.items.map((item, idx) => ({
    ...item,
    final: nutrition.scaleNutrients(applied.items[idx] ?? item.nutrients, portion),
    clarifications: nutrition.clarificationsForItem(applied.applied, idx),
  }));
  return { items, totals: nutrition.sumNutrients(items.map((i) => i.final)) };
}

export interface BarcodeRowLike {
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carb_g_100g: number | null;
  fat_g_100g: number | null;
  sugar_g_100g: number | null;
  fiber_g_100g: number | null;
  sodium_mg_100g: number | null;
}

/** Per-100 g barcode row → nutrients for `grams` grams. */
export function barcodeNutrients(p: BarcodeRowLike, grams: number): Nutrients {
  return nutrition.scaleNutrients(
    {
      kcal: p.kcal_100g,
      protein_g: p.protein_g_100g,
      carb_g: p.carb_g_100g,
      fat_g: p.fat_g_100g,
      sugar_g: p.sugar_g_100g,
      fiber_g: p.fiber_g_100g,
      sodium_mg: p.sodium_mg_100g,
    },
    Math.max(0, grams) / 100,
  );
}
