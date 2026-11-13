/**
 * Coach (gamification) types. Codes mirror `docs/04-database/05-coach.md` and
 * `01-profile.md` (`coach_settings`). The app maps codes to vi/en strings.
 */

export type Strictness = 'gentle' | 'standard' | 'hardcore';
export type DayResult = 'excellent' | 'pass' | 'fail';
/** `none` = normal day; `quota` / `shield` = valid free day (`free_days.kind`); `excess` = over allowance. */
export type FreeDayKind = 'none' | 'quota' | 'shield' | 'excess';
export type AuraTier = 'gray' | 'green' | 'blue' | 'purple' | 'gold' | 'red';
export type Mood = 'radiant' | 'sleepy' | 'thirsty' | 'hungry' | 'fired_up' | 'sad' | 'neutral';
export type StatCode =
  | 'diet_discipline'
  | 'protein'
  | 'sleep'
  | 'water'
  | 'training'
  | 'strength'
  | 'body_progress'
  | 'self_growth';
export type ShieldReason = 'excellent_day' | 'monthly_gift' | 'starter' | 'protect_streak' | 'free_day' | 'boss_reward';

export type HardStats = Record<StatCode, number | null>;

/** Per-criterion outcome of a day (stored in `daily_scores.breakdown`, feeds stats / boss). */
export interface ScoreCriteria {
  loggedFullDay: boolean;
  kcalInRange: boolean;
  proteinMet: boolean;
  sugarMet: boolean;
  belowFloor: boolean;
  sleepMet: boolean;
  /** `null` when no wake target is set. */
  wakeOnTime: boolean | null;
  /** Bed before 23:30; `null` when unknown. */
  bedtimeOk: boolean | null;
  waterMet: boolean;
  workoutsScheduled: number;
  workoutsCompleted: number;
  tasksScheduled: number;
  tasksCompleted: number;
  /** `null` when no weigh-in was due. */
  weighed: boolean | null;
}

/** One closed day kept in the rolling history (rebuilt server-side from `daily_scores`). */
export interface DayRecord {
  localDate: string;
  total: number;
  result: DayResult;
  freeDay: FreeDayKind;
  shieldUsed: boolean;
  criteria: ScoreCriteria;
  /** % change of est. 1RM / calisthenics level vs 30 days ago (from workout), if known. */
  strengthTrendPct: number | null;
  /** 0–100 body progress score of that day (see `bodyProgressScore`), if known. */
  bodyProgressScore: number | null;
}

export interface ShieldLedgerEntry {
  deltaShields: number;
  deltaFragments: number;
  reason: ShieldReason;
  localDate: string;
}
