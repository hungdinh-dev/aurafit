/**
 * COA-02 – streak = consecutive days with result ≥ pass (rest days count, because a scheduled
 * rest day earns the full training points). A failed day is protected by a shield when one is
 * available and either the strictness auto-uses shields or the user armed one (hardcore).
 * A protected day keeps the streak unchanged (it does not extend it).
 */
import type { DayResult } from './types';

export const STREAK_MILESTONES: readonly number[] = [7, 30, 100, 365];

export type StreakOutcome = 'extended' | 'protected' | 'lost' | 'none';

export interface StreakUpdate {
  streak: number;
  bestStreak: number;
  outcome: StreakOutcome;
  /** Milestones crossed by this update (7 / 30 / 100 / 365). */
  milestones: number[];
  shieldUsed: boolean;
}

export function applyDayToStreak(
  current: { streak: number; bestStreak: number },
  result: DayResult,
  shield: { available: number; autoShield: boolean; armedByUser?: boolean },
): StreakUpdate {
  if (result !== 'fail') {
    const streak = current.streak + 1;
    return {
      streak,
      bestStreak: Math.max(current.bestStreak, streak),
      outcome: 'extended',
      milestones: STREAK_MILESTONES.filter((m) => m === streak),
      shieldUsed: false,
    };
  }
  if (current.streak === 0) {
    return { streak: 0, bestStreak: current.bestStreak, outcome: 'none', milestones: [], shieldUsed: false };
  }
  const canProtect = shield.available > 0 && (shield.autoShield || shield.armedByUser === true);
  if (canProtect) {
    return { ...current, outcome: 'protected', milestones: [], shieldUsed: true };
  }
  return { streak: 0, bestStreak: current.bestStreak, outcome: 'lost', milestones: [], shieldUsed: false };
}
