// Provider-neutral AI contract (tech-stack.md "Chiến lược AI", D-014, D-022).
// The output of analyzeMealImage / analyzeMealText is validated with zod before
// it reaches the app, whatever the provider.
import { z } from 'zod';

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export type Locale = 'vi' | 'en';
export type ModelTier = 'fast' | 'strong';

const grams = z.number().finite().min(0).max(1000);

/** Nutrient deltas of one clarifying-question option, relative to the estimate. */
export const AdjustmentSchema = z.object({
  kcal: z.number().finite().min(-3000).max(3000),
  protein_g: z.number().finite().min(-300).max(300),
  carb_g: z.number().finite().min(-500).max(500),
  fat_g: z.number().finite().min(-300).max(300),
  sugar_g: z.number().finite().min(-300).max(300),
});

export const ClarifyingOptionSchema = z.object({
  label: z.string().trim().min(1).max(60),
  is_default: z.boolean(),
  adjustment: AdjustmentSchema,
});

export const ClarifyingQuestionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  question: z.string().trim().min(1).max(160),
  /** Index into `items` the question refers to, or null for the whole meal. */
  item_index: z.number().int().min(0).nullable(),
  options: z.array(ClarifyingOptionSchema).min(2).max(4),
});

export const MealItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  name_en: z.string().trim().max(120).nullable().default(null),
  portion_text: z.string().trim().min(1).max(80),
  grams: z.number().finite().min(0).max(5000).nullable().default(null),
  kcal: z.number().finite().min(0).max(5000),
  protein_g: grams,
  carb_g: grams,
  fat_g: grams,
  sugar_g: grams,
  fiber_g: grams,
  sodium_mg: z.number().finite().min(0).max(20000),
  confidence: z.number().min(0).max(1),
});

export const MealAnalysisSchema = z.object({
  is_food: z.boolean(),
  items: z.array(MealItemSchema).max(15),
  overall_confidence: z.number().min(0).max(1),
  // At most 3 questions are kept even if the model returns more (D-014).
  clarifying_questions: z.array(ClarifyingQuestionSchema).transform((qs) => qs.slice(0, 3)),
  notes: z.string().trim().max(300).nullable().default(null),
});

export type MealItem = z.output<typeof MealItemSchema>;
export type ClarifyingQuestion = z.output<typeof ClarifyingQuestionSchema>;
export type MealAnalysis = z.output<typeof MealAnalysisSchema>;

export interface AiUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
}

export interface AiResult<T> {
  data: T;
  usage: AiUsage;
}

export interface MealImageInput {
  imageBase64: string;
  mimeType: string;
  locale: Locale;
  mealSlot?: MealSlot;
  /** Optional free-text note from the user, e.g. "ít cơm". Treated as data, never as instructions. */
  hint?: string;
  tier?: ModelTier;
}

export interface MealTextInput {
  text: string;
  locale: Locale;
  mealSlot?: MealSlot;
  tier?: ModelTier;
}

/** One interface for every AI vendor: switching Gemini ↔ Claude ↔ … is configuration only. */
export interface AiProvider {
  readonly name: string;
  modelFor(tier: ModelTier): string;
  analyzeMealImage(input: MealImageInput): Promise<AiResult<MealAnalysis>>;
  analyzeMealText(input: MealTextInput): Promise<AiResult<MealAnalysis>>;
}

export type AiErrorCode = 'config' | 'upstream' | 'timeout' | 'blocked' | 'invalid_output';

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code: AiErrorCode,
    readonly usage?: Partial<AiUsage>,
  ) {
    super(message);
  }
}

export interface MealTotals {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  sugar_g: number;
  fiber_g: number;
  sodium_mg: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Server-computed totals (never trust the model's arithmetic). */
export function mealTotals(items: MealItem[]): MealTotals {
  const t = items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein_g: acc.protein_g + i.protein_g,
      carb_g: acc.carb_g + i.carb_g,
      fat_g: acc.fat_g + i.fat_g,
      sugar_g: acc.sugar_g + i.sugar_g,
      fiber_g: acc.fiber_g + i.fiber_g,
      sodium_mg: acc.sodium_mg + i.sodium_mg,
    }),
    { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 0 },
  );
  return {
    kcal: Math.round(t.kcal),
    protein_g: round1(t.protein_g),
    carb_g: round1(t.carb_g),
    fat_g: round1(t.fat_g),
    sugar_g: round1(t.sugar_g),
    fiber_g: round1(t.fiber_g),
    sodium_mg: Math.round(t.sodium_mg),
  };
}
