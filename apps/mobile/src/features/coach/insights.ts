import { coach } from '@aurafit/core';

export type Strictness = coach.Strictness;
export type CoachVoice = 'bestie' | 'coach' | 'drama';

export const VOICES: readonly CoachVoice[] = ['bestie', 'coach', 'drama'];
export const STRICTNESS_LEVELS: readonly Strictness[] = ['gentle', 'standard', 'hardcore'];

export function asVoice(value: string | null | undefined): CoachVoice {
  return value === 'coach' || value === 'drama' ? value : 'bestie';
}

export function asStrictness(value: string | null | undefined): Strictness {
  return value === 'gentle' || value === 'hardcore' ? value : 'standard';
}

const MOODS: readonly coach.Mood[] = ['radiant', 'sleepy', 'thirsty', 'hungry', 'fired_up', 'sad', 'neutral'];
export function asMood(value: string | null | undefined): coach.Mood {
  return (MOODS as readonly string[]).includes(value ?? '') ? (value as coach.Mood) : 'neutral';
}

const TIERS: readonly coach.AuraTier[] = ['gray', 'green', 'blue', 'purple', 'gold', 'red'];
export function asAuraTier(value: string | null | undefined): coach.AuraTier {
  return (TIERS as readonly string[]).includes(value ?? '') ? (value as coach.AuraTier) : 'gray';
}

/** Situations the coach comments on (i18n `coach:lines.<voice>.<situation>`). */
export type CoachSituation = coach.Mood | 'protein_low';

/** Grams of protein still missing above which the coach nudges in the afternoon. */
export const PROTEIN_NUDGE_G = 30;

/**
 * Picks the coach line for the Today card: a non-neutral mood wins; otherwise a protein nudge
 * after 15:00 when ≥ 30 g are still missing; else a neutral line.
 */
export function pickCoachLine(input: {
  mood: coach.Mood;
  proteinLeftG: number | null;
  localTimeMin: number;
}): { situation: CoachSituation; grams?: number } {
  if (input.mood !== 'neutral') return { situation: input.mood };
  if (input.proteinLeftG != null && input.proteinLeftG >= PROTEIN_NUDGE_G && input.localTimeMin >= 15 * 60) {
    return { situation: 'protein_low', grams: Math.round(input.proteinLeftG) };
  }
  return { situation: 'neutral' };
}

export interface ProvisionalScoreInput {
  strictness: Strictness;
  isFreeDay: boolean;
  /** null when targets are unknown. */
  nutrition: {
    mealsLogged: number;
    kcalIn: number;
    kcalTarget: number;
    kcalFloor: number | null;
    proteinG: number;
    proteinTargetG: number;
    sugarG: number;
    sugarLimitG: number;
  } | null;
  sleepMin: number | null;
  sleepTargetMin: number;
  waterMl: number;
  waterTargetMl: number | null;
  tasks: { scheduled: number; completed: number };
  workout?: { scheduled: number; completed: number };
}

/** Meals that count as "logged the full day" for the provisional (display-only) estimate. */
export const FULL_DAY_MEALS = 3;

/**
 * Display-only estimate of today's score so far (COA-01). The real score is computed and
 * stored by the server (close-day at 03:00) – this is never written anywhere.
 */
export function provisionalScore(input: ProvisionalScoreInput): {
  total: number;
  result: coach.DayResult;
  toExcellent: number;
} {
  const n = input.nutrition;
  const result = coach.computeDailyScore({
    strictness: input.strictness,
    freeDay: input.isFreeDay ? 'quota' : 'none',
    nutrition: n
      ? {
          loggedFullDay: n.mealsLogged >= FULL_DAY_MEALS,
          kcalIn: n.kcalIn,
          kcalTarget: n.kcalTarget,
          kcalFloor: n.kcalFloor,
          proteinG: n.proteinG,
          proteinTargetG: n.proteinTargetG,
          sugarG: n.sugarG,
          sugarLimitG: n.sugarLimitG,
        }
      : null,
    sleep: { sleepMin: input.sleepMin, targetMin: input.sleepTargetMin },
    workout: { scheduledSessions: input.workout?.scheduled ?? 0, completedSessions: input.workout?.completed ?? 0 },
    water: input.waterTargetMl ? { ml: input.waterMl, targetMl: input.waterTargetMl } : null,
    tasks: input.tasks,
    weight: { weighInDue: false, weighed: false },
  });
  const excellent = coach.rulesFor(input.strictness).excellentThreshold;
  return { total: result.total, result: result.result, toExcellent: Math.max(0, excellent - result.total) };
}
