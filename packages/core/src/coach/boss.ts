/**
 * COA-05 – weekly boss (gamification.md §6): every Monday a boss targets last week's weakest
 * habit. It has an HP bar (`hits_required`); each qualifying day is one hit. Win → badge +
 * 1 shield fragment + accessory for the character.
 */
import { addDays, weekStart } from './localDate';
import type { DayRecord } from './types';

export type BossCode = 'sugar_demon' | 'sloth' | 'night_owl' | 'drought' | 'protein_thief' | 'scatterbrain';

export interface BossReward {
  shieldFragments: number;
  accessoryCode: string;
  badgeCode: string;
}

/** `boss_battles` row. */
export interface BossBattle {
  weekStart: string;
  bossCode: BossCode;
  hitsRequired: number;
  hits: number;
  /** Local date the boss was defeated. */
  wonAt: string | null;
  reward: BossReward;
}

export interface BossWeekPlan {
  /** Scheduled workouts this week (for `sloth`). */
  scheduledWorkouts: number;
  hasActiveTasks: boolean;
}

interface BossDefinition {
  code: BossCode;
  applicable: (plan: BossWeekPlan) => boolean;
  hitsRequired: (plan: BossWeekPlan) => number;
  /** Hits dealt by a closed day. */
  hits: (r: DayRecord) => number;
  /** Last-week success rate 0–1 (lower = weaker habit), `null` if not measurable. */
  rate: (days: readonly DayRecord[]) => number | null;
}

const share = (days: readonly DayRecord[], ok: (r: DayRecord) => boolean): number | null =>
  days.length === 0 ? null : days.filter(ok).length / days.length;

/** "Keep X at least 5 of 7 days" bosses (doc examples: Sugar Demon 5/7, Night Owl 5 nights). */
export const DAILY_BOSS_HITS = 5;

export const BOSS_DEFINITIONS: readonly BossDefinition[] = [
  {
    code: 'sugar_demon',
    applicable: () => true,
    hitsRequired: () => DAILY_BOSS_HITS,
    hits: (r) => (r.criteria.sugarMet ? 1 : 0),
    rate: (d) => share(d, (r) => r.criteria.sugarMet),
  },
  {
    code: 'sloth',
    applicable: (p) => p.scheduledWorkouts > 0,
    hitsRequired: (p) => Math.max(1, p.scheduledWorkouts),
    hits: (r) => Math.min(r.criteria.workoutsCompleted, r.criteria.workoutsScheduled),
    rate: (d) => {
      const planned = d.reduce((s, r) => s + r.criteria.workoutsScheduled, 0);
      if (planned === 0) return null;
      return d.reduce((s, r) => s + Math.min(r.criteria.workoutsCompleted, r.criteria.workoutsScheduled), 0) / planned;
    },
  },
  {
    code: 'night_owl',
    applicable: () => true,
    hitsRequired: () => DAILY_BOSS_HITS,
    hits: (r) => (r.criteria.bedtimeOk ? 1 : 0),
    rate: (d) => share(d, (r) => r.criteria.bedtimeOk === true),
  },
  {
    code: 'drought',
    applicable: () => true,
    hitsRequired: () => DAILY_BOSS_HITS,
    hits: (r) => (r.criteria.waterMet ? 1 : 0),
    rate: (d) => share(d, (r) => r.criteria.waterMet),
  },
  {
    code: 'protein_thief',
    applicable: () => true,
    hitsRequired: () => DAILY_BOSS_HITS,
    hits: (r) => (r.criteria.proteinMet ? 1 : 0),
    rate: (d) => share(d, (r) => r.criteria.proteinMet),
  },
  {
    code: 'scatterbrain',
    applicable: (p) => p.hasActiveTasks,
    hitsRequired: () => DAILY_BOSS_HITS,
    hits: (r) => (r.criteria.tasksScheduled > 0 && r.criteria.tasksCompleted >= r.criteria.tasksScheduled ? 1 : 0),
    rate: (d) => {
      const withTasks = d.filter((r) => r.criteria.tasksScheduled > 0);
      return share(withTasks, (r) => r.criteria.tasksCompleted >= r.criteria.tasksScheduled);
    },
  },
];

function definition(code: BossCode): BossDefinition {
  return BOSS_DEFINITIONS.find((b) => b.code === code) as BossDefinition;
}

export function bossReward(code: BossCode): BossReward {
  return { shieldFragments: 1, accessoryCode: `accessory_${code}`, badgeCode: `boss_${code}` };
}

/** Records of the week before `weekStartDate` (Mon–Sun). */
export function previousWeekRecords(history: readonly DayRecord[], weekStartDate: string): DayRecord[] {
  const from = addDays(weekStartDate, -7);
  return history.filter((r) => r.localDate >= from && r.localDate < weekStartDate);
}

/** Pick the boss for the week: lowest last-week success rate; ties / no data → catalogue order. */
export function pickBoss(lastWeek: readonly DayRecord[], plan: BossWeekPlan): BossCode {
  let best: { code: BossCode; rate: number } | null = null;
  for (const def of BOSS_DEFINITIONS) {
    if (!def.applicable(plan)) continue;
    const rate = def.rate(lastWeek);
    if (rate === null) continue;
    if (!best || rate < best.rate) best = { code: def.code, rate };
  }
  return best?.code ?? 'sugar_demon';
}

export function spawnWeeklyBoss(input: { localDate: string; history: readonly DayRecord[]; plan: BossWeekPlan }): BossBattle {
  const start = weekStart(input.localDate);
  const code = pickBoss(previousWeekRecords(input.history, start), input.plan);
  return {
    weekStart: start,
    bossCode: code,
    hitsRequired: definition(code).hitsRequired(input.plan),
    hits: 0,
    wonAt: null,
    reward: bossReward(code),
  };
}

export function bossHp(battle: BossBattle): number {
  return Math.max(0, battle.hitsRequired - battle.hits);
}

/** Apply one closed day. `defeated` is true only on the day the boss falls. */
export function applyBossDay(battle: BossBattle, record: DayRecord): { battle: BossBattle; damage: number; defeated: boolean } {
  if (battle.wonAt !== null || record.localDate < battle.weekStart || record.localDate > addDays(battle.weekStart, 6)) {
    return { battle, damage: 0, defeated: false };
  }
  const damage = Math.min(definition(battle.bossCode).hits(record), bossHp(battle));
  const hits = battle.hits + damage;
  const defeated = hits >= battle.hitsRequired;
  return { battle: { ...battle, hits, wonAt: defeated ? record.localDate : null }, damage, defeated };
}
