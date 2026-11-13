/**
 * COA-04 – daily coach quests (gamification.md §6): 1–3 each morning, aimed at the weakest
 * hard stats, chosen by rules (no AI). Reward +10 … +30 XP; failing costs nothing.
 * Selection is deterministic: a hash of the date picks among a stat's candidate quests.
 */
import { BEDTIME_LIMIT_MIN, normalizeBedtime } from './dailyScore';
import { weakestStats } from './stats';
import type { HardStats, StatCode } from './types';

export type QuestCode =
  | 'sleep_before_2330'
  | 'wake_on_time'
  | 'protein_breakfast_30g'
  | 'hit_protein_target'
  | 'water_before_10'
  | 'hit_water_target'
  | 'log_all_meals'
  | 'kcal_in_range'
  | 'complete_workout'
  | 'walk_8000_steps'
  | 'beat_last_session'
  | 'weigh_in'
  | 'complete_all_tasks'
  | 'complete_one_task';

type Requirement = 'workout_today' | 'no_workout_today' | 'tasks_today' | 'weigh_in_today';

export interface QuestDefinition {
  code: QuestCode;
  stat: StatCode;
  xpReward: number;
  params?: Readonly<Record<string, number>>;
  requires?: Requirement;
}

export const QUEST_DEFINITIONS: readonly QuestDefinition[] = [
  { code: 'sleep_before_2330', stat: 'sleep', xpReward: 20, params: { bedtimeMin: BEDTIME_LIMIT_MIN } },
  { code: 'wake_on_time', stat: 'sleep', xpReward: 15 },
  { code: 'protein_breakfast_30g', stat: 'protein', xpReward: 20, params: { proteinG: 30 } },
  { code: 'hit_protein_target', stat: 'protein', xpReward: 15 },
  { code: 'water_before_10', stat: 'water', xpReward: 15, params: { ml: 500, hour: 10 } },
  { code: 'hit_water_target', stat: 'water', xpReward: 10 },
  { code: 'log_all_meals', stat: 'diet_discipline', xpReward: 15 },
  { code: 'kcal_in_range', stat: 'diet_discipline', xpReward: 20 },
  { code: 'complete_workout', stat: 'training', xpReward: 25, requires: 'workout_today' },
  { code: 'walk_8000_steps', stat: 'training', xpReward: 20, params: { steps: 8000 }, requires: 'no_workout_today' },
  { code: 'beat_last_session', stat: 'strength', xpReward: 30, requires: 'workout_today' },
  { code: 'weigh_in', stat: 'body_progress', xpReward: 10, requires: 'weigh_in_today' },
  { code: 'kcal_in_range', stat: 'body_progress', xpReward: 20 },
  { code: 'complete_all_tasks', stat: 'self_growth', xpReward: 20, requires: 'tasks_today' },
  { code: 'complete_one_task', stat: 'self_growth', xpReward: 10, requires: 'tasks_today' },
];

export interface Quest {
  code: QuestCode;
  stat: StatCode;
  xpReward: number;
  params: Record<string, number>;
}

export interface QuestContext {
  localDate: string;
  stats: HardStats;
  workoutScheduledToday: boolean;
  tasksScheduledToday: boolean;
  weighInDueToday: boolean;
}

/** Stats below this value are considered "weak" (number of quests = weak stats, 1–3). */
export const WEAK_STAT_THRESHOLD = 70;
export const MAX_QUESTS = 3;

/** djb2 string hash – stable across platforms. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function meets(req: Requirement | undefined, ctx: QuestContext): boolean {
  switch (req) {
    case undefined:
      return true;
    case 'workout_today':
      return ctx.workoutScheduledToday;
    case 'no_workout_today':
      return !ctx.workoutScheduledToday;
    case 'tasks_today':
      return ctx.tasksScheduledToday;
    case 'weigh_in_today':
      return ctx.weighInDueToday;
  }
}

const toQuest = (d: QuestDefinition): Quest => ({ code: d.code, stat: d.stat, xpReward: d.xpReward, params: { ...(d.params ?? {}) } });

export function generateDailyQuests(ctx: QuestContext): Quest[] {
  const ranked = weakestStats(ctx.stats);
  const weakCount = ranked.filter((s) => s.value < WEAK_STAT_THRESHOLD).length;
  const count = Math.min(MAX_QUESTS, Math.max(1, weakCount));
  const out: Quest[] = [];
  for (const { code: stat } of ranked) {
    if (out.length >= count) break;
    const candidates = QUEST_DEFINITIONS.filter(
      (d) => d.stat === stat && meets(d.requires, ctx) && !out.some((q) => q.code === d.code),
    );
    if (candidates.length === 0) continue;
    const pick = candidates[hashString(`${ctx.localDate}:${stat}`) % candidates.length] as QuestDefinition;
    out.push(toQuest(pick));
  }
  if (out.length === 0) out.push(toQuest(QUEST_DEFINITIONS.find((d) => d.code === 'log_all_meals') as QuestDefinition));
  return out;
}

/** Facts of the day used to check quests (all optional; missing → not completed). */
export interface QuestFacts {
  bedtimeMin?: number | null;
  wakeOnTime?: boolean | null;
  breakfastProteinG?: number | null;
  proteinMet?: boolean;
  waterMlBefore10?: number | null;
  waterMet?: boolean;
  loggedFullDay?: boolean;
  kcalInRange?: boolean;
  workoutCompleted?: boolean;
  steps?: number | null;
  beatLastSession?: boolean;
  weighed?: boolean;
  tasksCompleted?: number;
  tasksScheduled?: number;
}

export function isQuestCompleted(quest: Quest, f: QuestFacts): boolean {
  const p = quest.params;
  switch (quest.code) {
    case 'sleep_before_2330':
      return f.bedtimeMin != null && normalizeBedtime(f.bedtimeMin) <= (p.bedtimeMin ?? BEDTIME_LIMIT_MIN);
    case 'wake_on_time':
      return f.wakeOnTime === true;
    case 'protein_breakfast_30g':
      return (f.breakfastProteinG ?? 0) >= (p.proteinG ?? 30);
    case 'hit_protein_target':
      return f.proteinMet === true;
    case 'water_before_10':
      return (f.waterMlBefore10 ?? 0) >= (p.ml ?? 500);
    case 'hit_water_target':
      return f.waterMet === true;
    case 'log_all_meals':
      return f.loggedFullDay === true;
    case 'kcal_in_range':
      return f.kcalInRange === true;
    case 'complete_workout':
      return f.workoutCompleted === true;
    case 'walk_8000_steps':
      return (f.steps ?? 0) >= (p.steps ?? 8000);
    case 'beat_last_session':
      return f.beatLastSession === true;
    case 'weigh_in':
      return f.weighed === true;
    case 'complete_all_tasks':
      return (f.tasksScheduled ?? 0) > 0 && (f.tasksCompleted ?? 0) >= (f.tasksScheduled ?? 0);
    case 'complete_one_task':
      return (f.tasksCompleted ?? 0) >= 1;
  }
}

export function evaluateQuests(quests: readonly Quest[], facts: QuestFacts): { quest: Quest; completed: boolean; xp: number }[] {
  return quests.map((quest) => {
    const completed = isQuestCompleted(quest, facts);
    return { quest, completed, xp: completed ? quest.xpReward : 0 };
  });
}
