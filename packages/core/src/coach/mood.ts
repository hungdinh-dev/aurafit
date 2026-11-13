/**
 * COA-06 – character mood from today's data (gamification.md §2):
 * radiant score ≥ 90 · sleepy slept < 6 h · thirsty at 15:00 water < 40 % · hungry at 11:00 no
 * meal logged · fired_up streak ≥ 7 · sad the day after losing the streak.
 * Priority when several apply (assumption): sad > radiant > hungry > thirsty > sleepy > fired_up.
 */
import { diffDays } from './localDate';
import type { Mood } from './types';

export interface MoodInput {
  today: string;
  /** Minutes after local midnight. */
  localTimeMin: number;
  scoreSoFar?: number | null;
  lastNightSleepMin?: number | null;
  waterMl?: number | null;
  waterTargetMl?: number | null;
  mealsLoggedToday?: number | null;
  streak: number;
  /** Local date of the day that broke the streak. */
  streakLostOn?: string | null;
}

export const MOOD_PRIORITY: readonly Mood[] = ['sad', 'radiant', 'hungry', 'thirsty', 'sleepy', 'fired_up'];

export function activeMoods(i: MoodInput): Mood[] {
  const active = new Set<Mood>();
  if (i.streakLostOn && diffDays(i.streakLostOn, i.today) === 1) active.add('sad');
  if (i.scoreSoFar != null && i.scoreSoFar >= 90) active.add('radiant');
  if (i.localTimeMin >= 11 * 60 && (i.mealsLoggedToday ?? 0) === 0) active.add('hungry');
  if (i.localTimeMin >= 15 * 60 && i.waterTargetMl != null && i.waterTargetMl > 0 && (i.waterMl ?? 0) < 0.4 * i.waterTargetMl) {
    active.add('thirsty');
  }
  if (i.lastNightSleepMin != null && i.lastNightSleepMin < 6 * 60) active.add('sleepy');
  if (i.streak >= 7) active.add('fired_up');
  return MOOD_PRIORITY.filter((m) => active.has(m));
}

export function deriveMood(input: MoodInput): Mood {
  return activeMoods(input)[0] ?? 'neutral';
}
