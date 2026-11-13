/**
 * COA-08 – badge rules (gamification.md §9; `badges` / `user_badges`). Names and descriptions
 * are i18n keys `badge.<code>.name` / `badge.<code>.description` in the app.
 */
import type { BossCode } from './boss';
import type { AuraTier } from './types';
import { compareTiers } from './stats';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeDefinition {
  code: string;
  rarity: BadgeRarity;
}

const BOSS_CODES: readonly BossCode[] = ['sugar_demon', 'sloth', 'night_owl', 'drought', 'protein_thief', 'scatterbrain'];

export const BADGES: readonly BadgeDefinition[] = [
  { code: 'first_excellent_day', rarity: 'common' },
  { code: 'streak_7', rarity: 'common' },
  { code: 'streak_30', rarity: 'rare' },
  { code: 'streak_100', rarity: 'epic' },
  { code: 'streak_365', rarity: 'legendary' },
  { code: 'perfect_week', rarity: 'rare' },
  { code: 'boss_slayer', rarity: 'common' },
  { code: 'boss_slayer_10', rarity: 'epic' },
  ...BOSS_CODES.map((c) => ({ code: `boss_${c}`, rarity: 'rare' as const })),
  { code: 'level_5', rarity: 'common' },
  { code: 'level_10', rarity: 'rare' },
  { code: 'level_25', rarity: 'epic' },
  { code: 'level_50', rarity: 'legendary' },
  { code: 'aura_gold', rarity: 'epic' },
  { code: 'aura_red', rarity: 'legendary' },
  { code: 'first_pr', rarity: 'common' },
  { code: 'calisthenics_level_up', rarity: 'rare' },
  { code: 'weight_milestone', rarity: 'rare' },
  { code: 'full_shields', rarity: 'rare' },
];

export interface BadgeContext {
  streak: number;
  level: number;
  auraTier: AuraTier;
  excellentToday: boolean;
  perfectWeek: boolean;
  bossDefeated: BossCode | null;
  bossWins: number;
  newPrs: number;
  calisthenicsLevelUps: number;
  weightMilestone: boolean;
  shields: number;
}

/** Badge codes newly earned given the context and already-earned codes. */
export function evaluateBadges(ctx: BadgeContext, earned: readonly string[]): string[] {
  const has = new Set(earned);
  const out: string[] = [];
  const award = (code: string, cond: boolean): void => {
    if (cond && !has.has(code) && !out.includes(code)) out.push(code);
  };
  award('first_excellent_day', ctx.excellentToday);
  for (const m of [7, 30, 100, 365]) award(`streak_${m}`, ctx.streak >= m);
  award('perfect_week', ctx.perfectWeek);
  award('boss_slayer', ctx.bossWins >= 1);
  award('boss_slayer_10', ctx.bossWins >= 10);
  if (ctx.bossDefeated) award(`boss_${ctx.bossDefeated}`, true);
  for (const l of [5, 10, 25, 50]) award(`level_${l}`, ctx.level >= l);
  award('aura_gold', compareTiers(ctx.auraTier, 'gold') >= 0);
  award('aura_red', ctx.auraTier === 'red');
  award('first_pr', ctx.newPrs > 0);
  award('calisthenics_level_up', ctx.calisthenicsLevelUps > 0);
  award('weight_milestone', ctx.weightMilestone);
  award('full_shields', ctx.shields >= 3);
  return out;
}
