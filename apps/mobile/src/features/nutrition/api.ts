import { nutrition, time } from '@aurafit/core';
import { StorageBuckets, type Tables, type TablesInsert } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { localToday } from '@/features/coach/lib/clock';
import { isRecord, toJson } from '@/features/coach/lib/json';
import { useAuth } from '@/lib/auth';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

import { AnalyzeResponseSchema, type AnalyzeResponse, type ComputedItem, type MealSlot } from './analysis';

export type MealEntry = Tables<'meal_entries'>;
export type MealItem = Tables<'meal_items'>;
export type MealWithItems = MealEntry & { meal_items: MealItem[] };
export type SavedFood = Tables<'saved_foods'> & { saved_food_items: Tables<'saved_food_items'>[] };
export type NutritionTargetRow = Tables<'nutrition_targets'>;
export type GoalRow = Tables<'goals'>;
export type BarcodeProduct = Tables<'barcode_products'>;
export type FreeDayRow = Tables<'free_days'>;

export const nutritionKeys = {
  all: ['nutrition'] as const,
  targets: (uid: string) => ['nutrition', 'targets', uid] as const,
  goal: (uid: string) => ['nutrition', 'goal', uid] as const,
  meals: (uid: string, day: string) => ['nutrition', 'meals', uid, day] as const,
  intake: (uid: string, start: string, end: string) => ['nutrition', 'intake', uid, start, end] as const,
  saved: (uid: string) => ['nutrition', 'saved', uid] as const,
  recent: (uid: string) => ['nutrition', 'recent', uid] as const,
  barcode: (code: string) => ['nutrition', 'barcode', code] as const,
  freeDays: (uid: string, start: string, end: string) => ['nutrition', 'free-days', uid, start, end] as const,
};

const MEAL_SELECT = '*, meal_items(*)';

// ---------------------------------------------------------------------------------------------
// Targets & goal

/** Latest target row in effect today (`null` before onboarding / without account). */
export function useCurrentTargets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.targets(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<{ current: NutritionTargetRow | null; history: NutritionTargetRow[] }> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', user!.id)
        .lte('effective_from', localToday())
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      const rows = data ?? [];
      return { current: rows[0] ?? null, history: rows };
    },
  });
}

/** Numbers from `nutrition_targets.explanation` the UI needs (safety floor, daily delta). */
const ExplanationSchema = z
  .object({
    bmrKcal: z.number(),
    activityFactor: z.number(),
    tdeeKcal: z.number(),
    floorKcal: z.number(),
    floorApplied: z.boolean(),
    effectiveDailyDeltaKcal: z.number(),
    effectiveKgPerWeek: z.number(),
    resolvedPace: z.string().nullable(),
    goal: z.string(),
    previousTdeeKcal: z.number(),
    newTdeeKcal: z.number(),
    avgIntakeKcal: z.number().nullable(),
    trendChangeKg: z.number().nullable(),
  })
  .partial();
export type TargetExplanation = z.output<typeof ExplanationSchema>;

export function parseExplanation(value: unknown): TargetExplanation {
  if (!isRecord(value)) return {};
  const r = ExplanationSchema.safeParse(value);
  return r.success ? r.data : {};
}

/** Current goal (latest row with effective_from ≤ today). */
export function useCurrentGoal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.goal(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<GoalRow | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .lte('effective_from', localToday())
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Meals

export function useMealsForDay(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.meals(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<MealWithItems[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('meal_entries')
        .select(MEAL_SELECT)
        .eq('user_id', user!.id)
        .eq('local_date', day)
        .order('eaten_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MealWithItems[];
    },
  });
}

/** kcal eaten per local date in [start, end] (weekly budget, free-day quote). */
export function useIntakeByDay(start: string, end: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.intake(user?.id ?? 'anonymous', start, end),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<Record<string, number>> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('meal_entries')
        .select('local_date, meal_items(kcal)')
        .eq('user_id', user!.id)
        .gte('local_date', start)
        .lte('local_date', end);
      if (error) throw error;
      const out: Record<string, number> = {};
      for (const row of data ?? []) {
        const kcal = (row.meal_items ?? []).reduce((s, i) => s + (i.kcal ?? 0), 0);
        out[row.local_date] = (out[row.local_date] ?? 0) + kcal;
      }
      return out;
    },
  });
}

/** "Món của tôi" ordered by use. */
export function useSavedFoods() {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.saved(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<SavedFood[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('saved_foods')
        .select('*, saved_food_items(*)')
        .eq('user_id', user!.id)
        .order('use_count', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as SavedFood[];
    },
  });
}

/** Last meals (recent / repeat, NUT-06). */
export function useRecentMeals(limit = 12) {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.recent(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<MealWithItems[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('meal_entries')
        .select(MEAL_SELECT)
        .eq('user_id', user!.id)
        .order('eaten_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as MealWithItems[];
    },
  });
}

type ItemInsert = Omit<TablesInsert<'meal_items'>, 'meal_entry_id' | 'user_id'>;

async function insertMeal(input: {
  userId: string;
  slot: MealSlot;
  source: MealEntry['source'];
  items: ItemInsert[];
  photoPath?: string | null;
  aiRequestId?: string | null;
}): Promise<string> {
  assertSupabase();
  const { data: entry, error } = await supabase
    .from('meal_entries')
    .insert({
      user_id: input.userId,
      meal_slot: input.slot,
      source: input.source,
      local_date: localToday(),
      eaten_at: new Date().toISOString(),
      photo_path: input.photoPath ?? null,
      ai_request_id: input.aiRequestId ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (input.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(input.items.map((i) => ({ ...i, meal_entry_id: entry.id, user_id: input.userId })));
    if (itemsError) {
      await supabase.from('meal_entries').delete().eq('id', entry.id);
      throw itemsError;
    }
  }
  return entry.id;
}

const nutrientsOf = (n: nutrition.NutrientLike): nutrition.Nutrients => nutrition.roundNutrients(n);

/** Saves a confirmed draft (photo / text / barcode) and optionally adds it to "Món của tôi". */
export function useSaveMeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      slot: MealSlot;
      source: 'photo' | 'text' | 'barcode';
      items: ComputedItem[];
      quantity?: number;
      photoPath?: string | null;
      aiRequestId?: string | null;
      saveAs?: string | null;
    }) => {
      if (!user) throw new Error('not_signed_in');
      const quantity = input.quantity ?? 1;
      await insertMeal({
        userId: user.id,
        slot: input.slot,
        source: input.source,
        photoPath: input.photoPath,
        aiRequestId: input.aiRequestId,
        items: input.items.map((i) => ({
          name: i.name,
          portion_text: i.portionText,
          quantity,
          ...nutrientsOf(i.final),
          confidence: i.confidence,
          clarifications: i.clarifications.length > 0 ? toJson(i.clarifications) : null,
          barcode: i.barcode ?? null,
          saved_food_id: i.savedFoodId ?? null,
        })),
      });
      const name = input.saveAs?.trim();
      if (name) {
        const totals = nutrition.sumNutrients(input.items.map((i) => i.final));
        const { data: food, error } = await supabase
          .from('saved_foods')
          .insert({
            user_id: user.id,
            name: name.slice(0, 120),
            kind: input.items.length > 1 ? 'combo' : 'item',
            usual_slot: input.slot,
            use_count: 1,
            last_used_at: new Date().toISOString(),
            ...totals,
          })
          .select('id')
          .single();
        if (error) throw error;
        if (input.items.length > 1) {
          const { error: e2 } = await supabase.from('saved_food_items').insert(
            input.items.map((i) => ({ saved_food_id: food.id, name: i.name, quantity: 1, ...nutrientsOf(i.final) })),
          );
          if (e2) throw e2;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

/** Logs a saved food (or combo) with a portion multiplier (NUT-05). */
export function useLogSavedFood() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ food, portion, slot }: { food: SavedFood; portion: number; slot: MealSlot }) => {
      if (!user) throw new Error('not_signed_in');
      const parts =
        food.kind === 'combo' && food.saved_food_items.length > 0
          ? food.saved_food_items.map((p) => ({ name: p.name, n: nutrition.scaleNutrients(p, portion) }))
          : [{ name: food.name, n: nutrition.scaleNutrients(food, portion) }];
      await insertMeal({
        userId: user.id,
        slot,
        source: 'library',
        items: parts.map((p) => ({ name: p.name, quantity: portion, ...p.n, saved_food_id: food.id })),
      });
      await supabase
        .from('saved_foods')
        .update({ use_count: food.use_count + 1, last_used_at: new Date().toISOString() })
        .eq('id', food.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

/** Copies an earlier meal into today (NUT-06 "Lặp lại bữa"). */
export function useRepeatMeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ meal, slot }: { meal: MealWithItems; slot: MealSlot }) => {
      if (!user) throw new Error('not_signed_in');
      await insertMeal({
        userId: user.id,
        slot,
        source: 'recent',
        items: meal.meal_items.map((i) => ({
          name: i.name,
          portion_text: i.portion_text,
          quantity: i.quantity,
          ...nutrientsOf(i),
          saved_food_id: i.saved_food_id,
          barcode: i.barcode,
        })),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

/** Logs a single ad-hoc suggestion part list (from "Ăn gì bây giờ?"). */
export function useLogSuggestion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      parts,
      slot,
    }: {
      parts: { food: SavedFood; portion: number; nutrients: nutrition.Nutrients }[];
      slot: MealSlot;
    }) => {
      if (!user) throw new Error('not_signed_in');
      await insertMeal({
        userId: user.id,
        slot,
        source: 'library',
        items: parts.map((p) => ({ name: p.food.name, quantity: p.portion, ...p.nutrients, saved_food_id: p.food.id })),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mealId: string) => {
      assertSupabase();
      const { error } = await supabase.from('meal_entries').delete().eq('id', mealId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

// ---------------------------------------------------------------------------------------------
// Barcode (shared cache – server writes)

export function useBarcodeProduct(code: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.barcode(code ?? ''),
    enabled: !!code && !!user && isSupabaseConfigured,
    staleTime: Infinity,
    queryFn: async (): Promise<BarcodeProduct | null> => {
      assertSupabase();
      const { data, error } = await supabase.from('barcode_products').select('*').eq('barcode', code!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------------------------
// AI analysis (Edge Functions)

/** Thrown when the daily AI quota is used up (HTTP 429 `quota_exceeded`). */
export class QuotaExceededError extends Error {
  constructor() {
    super('quota_exceeded');
    this.name = 'QuotaExceededError';
  }
}

async function invokeAnalysis(fn: 'analyze-meal' | 'analyze-text', body: Record<string, unknown>): Promise<AnalyzeResponse> {
  assertSupabase();
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 429) throw new QuotaExceededError();
    throw error;
  }
  const parsed = AnalyzeResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error('invalid_ai_response');
  return parsed.data;
}

export function useAnalyzeText() {
  return useMutation({
    mutationFn: ({ text, slot }: { text: string; slot: MealSlot }) =>
      invokeAnalysis('analyze-text', { text: text.trim().slice(0, 1000), meal_slot: slot }),
  });
}

export function useAnalyzePhoto() {
  return useMutation({
    mutationFn: ({ photoPath, slot, reanalyze }: { photoPath: string; slot: MealSlot; reanalyze?: boolean }) =>
      invokeAnalysis('analyze-meal', { photo_path: photoPath, meal_slot: slot, reanalyze: !!reanalyze }),
  });
}

/** Uploads a compressed JPEG to the private bucket under `<uid>/…` and returns the path. */
export async function uploadMealPhoto(userId: string, localUri: string): Promise<string> {
  assertSupabase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const body = await (await fetch(localUri)).arrayBuffer();
  const { error } = await supabase.storage
    .from(StorageBuckets.mealPhotos)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

// ---------------------------------------------------------------------------------------------
// Free days (NUT-09)

export function useFreeDays(start: string, end: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: nutritionKeys.freeDays(user?.id ?? 'anonymous', start, end),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<FreeDayRow[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('free_days')
        .select('*')
        .eq('user_id', user!.id)
        .gte('local_date', start)
        .lte('local_date', end);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Requests (or cancels) a quota free day for a date that is not closed yet. */
export function useToggleFreeDay() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { date: string; enable: boolean; quotedExtraKcal: number | null }) => {
      assertSupabase();
      if (!user) throw new Error('not_signed_in');
      if (input.enable) {
        const { error } = await supabase.from('free_days').insert({
          user_id: user.id,
          local_date: input.date,
          kind: 'quota',
          quoted_extra_kcal: input.quotedExtraKcal,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('free_days').delete().eq('user_id', user.id).eq('local_date', input.date);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

/** Monday–Sunday of the week containing `day`. */
export function weekOf(day: string): { start: string; end: string; dates: string[] } {
  const { start, end } = time.weekRange(day);
  return { start, end, dates: time.weekDates(day) };
}
