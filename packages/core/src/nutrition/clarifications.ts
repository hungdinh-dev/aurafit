/**
 * Clarifying questions (NUT-03, D-014). The AI returns, in the *same* call, at most 3
 * questions; every answer option carries its own kcal / macro adjustment, e.g.
 *   "Cỡ bát?"       [Nhỏ −120 kcal] [Vừa 0] [Lớn +150 kcal]
 *   "Có thêm quẩy?" [Không 0] [Có +230 kcal]
 * Answering is computed on device – no second AI call.
 *
 * Order of operations: AI base portion → apply answers (this module) → user portion
 * multiplier (`scaleNutrients`, stored in `meal_items.quantity`) → save. Deltas therefore
 * refer to the AI's base portion and scale with the portion.
 */
import { NUTRIENT_KEYS, type NutrientKey, type Nutrients } from './types';
import { roundNutrients, toNutrients, type NutrientLike } from './nutrients';

export const MAX_CLARIFYING_QUESTIONS = 3;

/** Signed adjustment per nutrient; omitted keys mean 0. */
export type NutrientDelta = Partial<Record<NutrientKey, number>>;

export interface ClarificationOption {
  id: string;
  delta: NutrientDelta;
}

export interface ClarificationQuestion {
  id: string;
  /**
   * Index (in the AI's item list) of the item this question modifies. When absent the
   * main item – the one with the most kcal – is used.
   */
  itemIndex?: number | null;
  options: readonly ClarificationOption[];
  /** Option applied when the user does not answer (normally the "0" option). */
  defaultOptionId?: string | null;
}

/** questionId → chosen optionId. */
export type ClarificationAnswers = Readonly<Record<string, string>>;

export interface AppliedClarification {
  questionId: string;
  optionId: string;
  itemIndex: number;
  delta: NutrientDelta;
  /** `true` when the default option was applied because the user did not answer. */
  isDefault: boolean;
}

export type ClarificationIssueCode =
  | 'unknown_question'
  | 'unknown_option'
  | 'question_over_limit'
  | 'invalid_item_index'
  | 'no_items';

export interface ClarificationIssue {
  code: ClarificationIssueCode;
  questionId: string;
}

export interface ClarificationResult {
  /** Adjusted base items (quantity 1), rounded to storage precision, never negative. */
  items: Nutrients[];
  applied: AppliedClarification[];
  issues: ClarificationIssue[];
}

/** Index of the item with the most kcal (first one on ties); −1 when empty. */
export function mainItemIndex(items: readonly NutrientLike[]): number {
  let best = -1;
  let bestKcal = -Infinity;
  items.forEach((item, i) => {
    const k = typeof item.kcal === 'number' ? item.kcal : 0;
    if (k > bestKcal) {
      best = i;
      bestKcal = k;
    }
  });
  return best;
}

/**
 * Applies the chosen answers to the AI's item list. Only the first 3 questions are used;
 * unanswered questions use their `defaultOptionId` (if any); unknown ids are reported in
 * `issues` and ignored. Nutrients are clamped at 0.
 */
export function applyClarifications(
  items: readonly NutrientLike[],
  questions: readonly ClarificationQuestion[],
  answers: ClarificationAnswers,
): ClarificationResult {
  const out = items.map((it) => toNutrients(it));
  const applied: AppliedClarification[] = [];
  const issues: ClarificationIssue[] = [];
  const usable = questions.slice(0, MAX_CLARIFYING_QUESTIONS);
  const known = new Set(usable.map((q) => q.id));

  for (const q of questions.slice(MAX_CLARIFYING_QUESTIONS)) {
    if (answers[q.id] !== undefined) issues.push({ code: 'question_over_limit', questionId: q.id });
    known.add(q.id);
  }
  for (const qid of Object.keys(answers)) {
    if (!known.has(qid)) issues.push({ code: 'unknown_question', questionId: qid });
  }

  const main = mainItemIndex(items);
  for (const q of usable) {
    const answered = answers[q.id];
    const optionId = answered ?? q.defaultOptionId ?? undefined;
    if (optionId === undefined) continue;
    const option = q.options.find((o) => o.id === optionId);
    if (!option) {
      issues.push({ code: 'unknown_option', questionId: q.id });
      continue;
    }
    if (out.length === 0) {
      issues.push({ code: 'no_items', questionId: q.id });
      continue;
    }
    let idx = main;
    if (q.itemIndex != null) {
      if (Number.isInteger(q.itemIndex) && q.itemIndex >= 0 && q.itemIndex < out.length) idx = q.itemIndex;
      else issues.push({ code: 'invalid_item_index', questionId: q.id });
    }
    const target = out[idx]!;
    for (const k of NUTRIENT_KEYS) {
      const d = option.delta[k];
      if (typeof d === 'number' && Number.isFinite(d)) target[k] = Math.max(0, target[k] + d);
    }
    applied.push({
      questionId: q.id,
      optionId: option.id,
      itemIndex: idx,
      delta: { ...option.delta },
      isDefault: answered === undefined,
    });
  }

  return { items: out.map((n) => roundNutrients(n)), applied, issues };
}

/** The applied answers that touched one item – what goes into `meal_items.clarifications`. */
export function clarificationsForItem(
  applied: readonly AppliedClarification[],
  itemIndex: number,
): AppliedClarification[] {
  return applied.filter((a) => a.itemIndex === itemIndex);
}
