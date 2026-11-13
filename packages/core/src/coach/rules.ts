/**
 * Strictness rules (gamification.md §1a). All numbers are starting values to tune after
 * 2 weeks of beta (§11).
 */
import type { Strictness } from './types';

export interface StrictnessRules {
  /** kcal counts as "in range" within ± this fraction of target. */
  kcalTolerance: number;
  /** Minimum score that keeps the streak. */
  passThreshold: number;
  /** ⭐ threshold (doc gives 95 for Standard; assumed identical for all levels). */
  excellentThreshold: number;
  /** Shield protects the streak automatically (hardcore: user must arm it). */
  autoShield: boolean;
  defaultFreeDaysPerWeek: number;
  /** Points removed for each free day beyond the allowance. */
  excessFreeDayPenalty: number;
  /** Shields gifted every month (gentle: 2). */
  monthlyShieldGift: number;
  /**
   * "Aura drops when slacking: slow / medium / fast" → recency half-life (days) of the
   * 30-day hard-stat weighting. Assumption: 20 / 12 / 7 days.
   */
  auraHalfLifeDays: number;
}

export const STRICTNESS_RULES: Readonly<Record<Strictness, StrictnessRules>> = {
  gentle: {
    kcalTolerance: 0.15,
    passThreshold: 60,
    excellentThreshold: 95,
    autoShield: true,
    defaultFreeDaysPerWeek: 2,
    excessFreeDayPenalty: 0,
    monthlyShieldGift: 2,
    auraHalfLifeDays: 20,
  },
  standard: {
    kcalTolerance: 0.1,
    passThreshold: 70,
    excellentThreshold: 95,
    autoShield: true,
    defaultFreeDaysPerWeek: 1,
    excessFreeDayPenalty: 5,
    monthlyShieldGift: 1,
    auraHalfLifeDays: 12,
  },
  hardcore: {
    kcalTolerance: 0.05,
    passThreshold: 80,
    excellentThreshold: 95,
    autoShield: false,
    defaultFreeDaysPerWeek: 0,
    excessFreeDayPenalty: 10,
    monthlyShieldGift: 1,
    auraHalfLifeDays: 7,
  },
};

export function rulesFor(strictness: Strictness): StrictnessRules {
  return STRICTNESS_RULES[strictness];
}
