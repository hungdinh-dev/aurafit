/**
 * COA-03 – XP & level (gamification.md §4): lifetime, never decreases.
 * Daily XP = daily score × (1 + streak bonus) + quest XP; streak bonus +1 % per 7 streak days,
 * max +20 %. Level curve (assumption): level L → L+1 needs round(400 × 1.08^(L−1)) XP,
 * i.e. "each level needs a bit more" (~5 days for level 2 at ~85 pts/day).
 */

export const STREAK_BONUS_MAX_PCT = 20;
export const LEVEL_BASE_XP = 400;
export const LEVEL_GROWTH = 1.08;

export function streakBonusPct(streak: number): number {
  return Math.min(STREAK_BONUS_MAX_PCT, Math.floor(Math.max(0, streak) / 7));
}

export function dailyXp(scoreTotal: number, streak: number, questXp = 0): number {
  return Math.round(Math.max(0, scoreTotal) * (1 + streakBonusPct(streak) / 100)) + Math.max(0, questXp);
}

/** XP needed to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return Math.round(LEVEL_BASE_XP * LEVEL_GROWTH ** (Math.max(1, level) - 1));
}

/** Cumulative XP required to reach `level` (level 1 = 0). */
export function totalXpForLevel(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpToNextLevel(l);
  return sum;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export function levelProgress(xp: number): LevelProgress {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= xpToNextLevel(level)) {
    rest -= xpToNextLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: rest, xpForNextLevel: xpToNextLevel(level) };
}

export function levelForXp(xp: number): number {
  return levelProgress(xp).level;
}
