/**
 * WRK-10 / WRK-11 – muscle recovery model (muscle-recovery.md §2), computed per head (37) and
 * rolled up per muscle (18) as the most fatigued head.
 * - Each completed set adds `12 × stimulus × intensity` fatigue (intensity: top of rep range or
 *   RPE ≥ 8 → 1.0, easier → 0.7, warm-up → 0); fatigue is capped to 0–100.
 * - Fatigue decays exponentially; τ is chosen so that after `base_recovery_hours` fatigue is
 *   below 20 % of its initial value: τ = H / ln 5.
 * - Lifestyle: short sleep last night +15 % hours, protein met yesterday −10 %, beginner in
 *   first 4 weeks +10 % (multiplicative).
 * - Recovery % = 100 − fatigue; "ready" when fatigue ≤ 20 (recovery ≥ 80 %).
 * This is an orientation estimate, not a physiological measurement.
 */
import { MUSCLES, MUSCLE_CODES, MUSCLE_HEADS_BY_MUSCLE, MUSCLE_HEAD_CODES, muscleOfHead } from './catalog/muscles';
import { getExercise } from './catalog/exercises';
import { headStimulus } from './stimulus';
import { rirOf } from './progression';
import type { MuscleCode, MuscleGroupCode, MuscleHeadCode, SetLog } from './types';

export const FATIGUE_PER_SET = 12;
export const MAX_FATIGUE = 100;
export const READY_FATIGUE = 20;
export const WHY_WINDOW_DAYS = 7;
const HOUR_MS = 3_600_000;

export type RecoveryBand = 'heavy' | 'moderate' | 'light' | 'ready';
/** Colours from muscle-recovery.md §1 (data, not UI strings). */
export const RECOVERY_COLORS: Readonly<Record<RecoveryBand, string>> = {
  heavy: '#FF453A',
  moderate: '#C9504A',
  light: '#8E4B48',
  ready: '#48484A',
};

export function recoveryBand(recoveryPct: number): RecoveryBand {
  if (recoveryPct < 40) return 'heavy';
  if (recoveryPct < 65) return 'moderate';
  if (recoveryPct < 80) return 'light';
  return 'ready';
}

export interface RecoveryModifiers {
  sleptBelowTarget?: boolean;
  proteinMetYesterday?: boolean;
  beginnerFirst4Weeks?: boolean;
}

export function recoveryHoursMultiplier(mods: RecoveryModifiers = {}): number {
  return (mods.sleptBelowTarget ? 1.15 : 1) * (mods.proteinMetYesterday ? 0.9 : 1) * (mods.beginnerFirst4Weeks ? 1.1 : 1);
}

export interface RecoveryOptions {
  modifiers?: RecoveryModifiers;
  /** Planned rep max per exercise slug (falls back to the exercise default). */
  repMaxBySlug?: Readonly<Record<string, number>>;
  /** `muscle_heads.base_recovery_hours` overrides. */
  baseHoursByHead?: Readonly<Partial<Record<MuscleHeadCode, number>>>;
}

/** Intensity factor of a set (0, 0.7 or 1.0). */
export function setIntensity(set: SetLog, repMax?: number): number {
  if (set.isWarmup) return 0;
  const rir = rirOf(set);
  if (rir !== null && rir <= 2) return 1;
  const top = repMax ?? getExercise(set.exerciseSlug)?.defaultRepMax;
  if (set.reps != null && top !== undefined && set.reps >= top) return 1;
  return 0.7;
}

/** Fatigue a set adds to each head. */
export function setFatigue(set: SetLog, opts: RecoveryOptions = {}): Map<MuscleHeadCode, number> {
  const out = new Map<MuscleHeadCode, number>();
  if (!getExercise(set.exerciseSlug)) return out;
  const intensity = setIntensity(set, opts.repMaxBySlug?.[set.exerciseSlug]);
  if (intensity === 0 || set.side === 'right') return out;
  for (const [head, stim] of headStimulus(set.exerciseSlug)) out.set(head, FATIGUE_PER_SET * stim * intensity);
  return out;
}

function tauHours(head: MuscleHeadCode, opts: RecoveryOptions): number {
  const base = opts.baseHoursByHead?.[head] ?? MUSCLES[muscleOfHead(head)].baseRecoveryHours;
  return (base * recoveryHoursMultiplier(opts.modifiers)) / Math.log(5);
}

export interface HeadRecovery {
  head: MuscleHeadCode;
  muscle: MuscleCode;
  fatigue: number;
  recoveryPct: number;
  band: RecoveryBand;
  hoursUntilReady: number;
  /** ISO time when recovery reaches 80 % (`muscle_recovery.recovered_at`); null if ready. */
  readyAt: string | null;
  lastTrainedAt: string | null;
}

function windowed(sets: readonly SetLog[], nowMs: number): SetLog[] {
  const from = nowMs - WHY_WINDOW_DAYS * 24 * HOUR_MS;
  return sets
    .filter((s) => {
      const t = Date.parse(s.completedAt);
      return t >= from && t <= nowMs;
    })
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
}

const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Recovery state of every head at `nowIso`, from the last 7 days of sets. */
export function computeHeadRecovery(
  sets: readonly SetLog[],
  nowIso: string,
  opts: RecoveryOptions = {},
): Record<MuscleHeadCode, HeadRecovery> {
  const nowMs = Date.parse(nowIso);
  const state = new Map<MuscleHeadCode, { f: number; t: number; last: number }>();
  for (const set of windowed(sets, nowMs)) {
    const t = Date.parse(set.completedAt);
    for (const [head, add] of setFatigue(set, opts)) {
      const tau = tauHours(head, opts);
      const prev = state.get(head);
      const decayed = prev ? prev.f * Math.exp(-(t - prev.t) / HOUR_MS / tau) : 0;
      state.set(head, { f: Math.min(MAX_FATIGUE, decayed + add), t, last: t });
    }
  }
  const out = {} as Record<MuscleHeadCode, HeadRecovery>;
  for (const head of MUSCLE_HEAD_CODES) {
    const s = state.get(head);
    const tau = tauHours(head, opts);
    const f = s ? s.f * Math.exp(-(nowMs - s.t) / HOUR_MS / tau) : 0;
    const hours = f > READY_FATIGUE ? tau * Math.log(f / READY_FATIGUE) : 0;
    const fatigue = r1(f);
    const recoveryPct = r1(100 - f);
    out[head] = {
      head,
      muscle: muscleOfHead(head),
      fatigue,
      recoveryPct,
      band: recoveryBand(recoveryPct),
      hoursUntilReady: r1(hours),
      readyAt: hours > 0 ? new Date(nowMs + hours * HOUR_MS).toISOString() : null,
      lastTrainedAt: s ? new Date(s.last).toISOString() : null,
    };
  }
  return out;
}

export interface MuscleRecovery extends Omit<HeadRecovery, 'head'> {
  /** The most fatigued head (drives the region colour). */
  worstHead: MuscleHeadCode;
}

/** Region (18 muscles) = most fatigued head (D-044). */
export function computeMuscleRecovery(heads: Record<MuscleHeadCode, HeadRecovery>): Record<MuscleCode, MuscleRecovery> {
  const out = {} as Record<MuscleCode, MuscleRecovery>;
  for (const muscle of MUSCLE_CODES) {
    const list = MUSCLE_HEADS_BY_MUSCLE[muscle].map((h) => heads[h]);
    const worst = list.reduce((a, b) => (b.fatigue > a.fatigue ? b : a));
    const lastTrained = list
      .map((h) => h.lastTrainedAt)
      .filter((x): x is string => x !== null)
      .sort()
      .pop();
    const { head, ...rest } = worst;
    out[muscle] = { ...rest, muscle, worstHead: head, lastTrainedAt: lastTrained ?? null };
  }
  return out;
}

/** Muscles sorted most fatigued first (list under the map). */
export function mostFatigued(muscles: Record<MuscleCode, MuscleRecovery>): MuscleRecovery[] {
  return MUSCLE_CODES.map((m) => muscles[m]).sort((a, b) => b.fatigue - a.fatigue || a.muscle.localeCompare(b.muscle));
}

/** Groups whose muscles are all ready (≥ 80 %) – "Hôm nay hợp tập: Chân, Mông". */
export function readyGroups(muscles: Record<MuscleCode, MuscleRecovery>): MuscleGroupCode[] {
  const groups = new Map<MuscleGroupCode, boolean>();
  for (const m of MUSCLE_CODES) {
    const g = MUSCLES[m].groupCode;
    groups.set(g, (groups.get(g) ?? true) && muscles[m].band === 'ready');
  }
  return [...groups.entries()].filter(([, ok]) => ok).map(([g]) => g);
}

export interface FatigueContribution {
  sessionId: string | null;
  exerciseSlug: string;
  firstSetAt: string;
  sets: number;
  minLoadKg: number | null;
  maxLoadKg: number | null;
  minReps: number | null;
  maxReps: number | null;
  /** Fatigue added at the time ("+44"). */
  addedFatigue: number;
  /** What is left of it now, after decay. */
  remainingFatigue: number;
}

/** "Why?" list for one head: contributions of the last 7 days, largest remaining first. */
export function explainHead(
  head: MuscleHeadCode,
  sets: readonly SetLog[],
  nowIso: string,
  opts: RecoveryOptions = {},
): FatigueContribution[] {
  const nowMs = Date.parse(nowIso);
  const tau = tauHours(head, opts);
  const groups = new Map<string, FatigueContribution>();
  for (const set of windowed(sets, nowMs)) {
    const add = setFatigue(set, opts).get(head);
    if (!add) continue;
    const t = Date.parse(set.completedAt);
    const key = `${set.sessionId ?? set.completedAt.slice(0, 10)}|${set.exerciseSlug}`;
    const g = groups.get(key) ?? {
      sessionId: set.sessionId ?? null,
      exerciseSlug: set.exerciseSlug,
      firstSetAt: set.completedAt,
      sets: 0,
      minLoadKg: null,
      maxLoadKg: null,
      minReps: null,
      maxReps: null,
      addedFatigue: 0,
      remainingFatigue: 0,
    };
    g.sets += 1;
    if (set.loadKg != null) {
      g.minLoadKg = g.minLoadKg === null ? set.loadKg : Math.min(g.minLoadKg, set.loadKg);
      g.maxLoadKg = g.maxLoadKg === null ? set.loadKg : Math.max(g.maxLoadKg, set.loadKg);
    }
    if (set.reps != null) {
      g.minReps = g.minReps === null ? set.reps : Math.min(g.minReps, set.reps);
      g.maxReps = g.maxReps === null ? set.reps : Math.max(g.maxReps, set.reps);
    }
    g.addedFatigue += add;
    g.remainingFatigue += add * Math.exp(-(nowMs - t) / HOUR_MS / tau);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, addedFatigue: Math.round(g.addedFatigue), remainingFatigue: r1(g.remainingFatigue) }))
    .sort((a, b) => b.remainingFatigue - a.remainingFatigue);
}
