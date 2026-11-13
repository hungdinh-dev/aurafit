/**
 * Pure helpers for the in-app workout session (draft sets, autoregulation, PR summary).
 * All training maths comes from `@aurafit/core` (`workout.*`); this file only shapes data for the UI.
 */
import { workout } from '@aurafit/core';

export interface DraftSet {
  loadKg: number | null;
  reps: number;
  rir: number | null;
  done: boolean;
  completedAt: string | null;
  /** `set_logs.id` once synced. */
  logId: string | null;
  addedLoadKg: number | null;
  side: workout.SetSide;
  bands: workout.BandUse[] | null;
}

export type SuggestionKind = 'increase' | 'decrease' | 'nextSessionUp' | 'nextSessionDown';

export interface SuggestionNote {
  kind: SuggestionKind;
  setNo: number;
  kg: number;
}

export interface DraftExercise {
  key: string;
  slug: string;
  /** Exercise of the plan – differs from `slug` after a "machine busy" swap (WRK-17). */
  mainSlug: string;
  sets: DraftSet[];
  repMin: number;
  repMax: number;
  targetRir: number | null;
  restSec: number;
  backupSlug: string | null;
  note: SuggestionNote | null;
}

let keySeq = 0;
const nextKey = (slug: string) => `${slug}-${Date.now().toString(36)}-${(keySeq++).toString(36)}`;

export function loadSpecOf(slug: string, inventory?: workout.GymInventory): workout.LoadSpec {
  return workout.loadSpecFor(workout.requireExercise(slug), inventory);
}

/** First load to show for an exercise: last used load rounded to the gym, else the lightest real load. */
export function initialLoad(slug: string, inventory?: workout.GymInventory, lastLoadKg?: number | null): number | null {
  const spec = loadSpecOf(slug, inventory);
  if (spec.kind === 'bodyweight') return null;
  if (lastLoadKg != null && lastLoadKg > 0) return workout.roundLoad(lastLoadKg, spec) ?? lastLoadKg;
  switch (spec.kind) {
    case 'plates':
      return spec.barKg;
    case 'stack':
      return spec.minKg ?? spec.stepKg;
    case 'fixed':
      return [...spec.availableKg].sort((a, b) => a - b)[0] ?? null;
  }
}

function blankSet(loadKg: number | null, reps: number): DraftSet {
  return {
    loadKg,
    reps,
    rir: null,
    done: false,
    completedAt: null,
    logId: null,
    addedLoadKg: null,
    side: 'both',
    bands: null,
  };
}

export interface DraftOptions {
  inventory?: workout.GymInventory;
  /** Readiness "lighter session": sets per exercise change (−1). */
  setDelta?: number;
  lastLoadBySlug?: Readonly<Record<string, number>>;
}

/** Planned exercises (program / template) → editable session draft. Extras are skipped. */
export function draftFromPlanned(planned: readonly workout.PlannedExercise[], opts: DraftOptions = {}): DraftExercise[] {
  return planned
    .filter((p) => !p.isExtra && workout.getExercise(p.exerciseSlug))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const load = p.targetLoadKg ?? initialLoad(p.exerciseSlug, opts.inventory, opts.lastLoadBySlug?.[p.exerciseSlug]);
      const count = Math.max(1, p.sets + (opts.setDelta ?? 0));
      return {
        key: nextKey(p.exerciseSlug),
        slug: p.exerciseSlug,
        mainSlug: p.exerciseSlug,
        sets: Array.from({ length: count }, () => blankSet(load, p.repMax)),
        repMin: p.repMin,
        repMax: p.repMax,
        targetRir: p.targetRir,
        restSec: p.restSec,
        backupSlug: p.backupExerciseSlug,
        note: null,
      };
    });
}

/** A template session as planned exercises (no loads yet). */
export function plannedFromTemplate(session: workout.TemplateSession): workout.PlannedExercise[] {
  return session.exercises.map((e, i) => ({
    exerciseSlug: e.exerciseSlug,
    sortOrder: i + 1,
    sets: e.sets,
    repMin: e.repMin,
    repMax: e.repMax,
    targetRir: e.targetRir,
    restSec: e.restSec,
    targetLoadKg: null,
    backupExerciseSlug: e.backupExerciseSlug,
    isExtra: false,
  }));
}

/** A single library exercise added to the session with its default prescription. */
export function draftForExercise(slug: string, inventory?: workout.GymInventory, lastLoadKg?: number | null): DraftExercise {
  const ex = workout.requireExercise(slug);
  const rest = workout.defaultRest(ex.mechanic, { repMax: ex.defaultRepMax }).restSec;
  const load = initialLoad(slug, inventory, lastLoadKg);
  return {
    key: nextKey(slug),
    slug,
    mainSlug: slug,
    sets: Array.from({ length: 3 }, () => blankSet(load, ex.defaultRepMax)),
    repMin: ex.defaultRepMin,
    repMax: ex.defaultRepMax,
    targetRir: workout.DEFAULT_TARGET_RIR,
    restSec: rest,
    backupSlug: workout.pickBackup(slug),
    note: null,
  };
}

export function addSet(ex: DraftExercise): DraftExercise {
  const last = ex.sets[ex.sets.length - 1];
  return { ...ex, sets: [...ex.sets, blankSet(last?.loadKg ?? null, last?.reps ?? ex.repMax)] };
}

export function removeLastSet(ex: DraftExercise): DraftExercise {
  if (ex.sets.length <= 1) return ex;
  const last = ex.sets[ex.sets.length - 1];
  if (last?.done) return ex;
  return { ...ex, sets: ex.sets.slice(0, -1) };
}

export function patchSet(ex: DraftExercise, index: number, patch: Partial<DraftSet>): DraftExercise {
  return { ...ex, sets: ex.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)) };
}

/**
 * WRK-17: swap to another exercise (backup / equivalent), keeping sets × reps, RIR and rest.
 * Loads are reset because the implement differs. Swapping back to the main exercise is allowed.
 */
export function swapExercise(ex: DraftExercise, slug: string, inventory?: workout.GymInventory): DraftExercise {
  const load = initialLoad(slug, inventory);
  return {
    ...ex,
    slug,
    backupSlug: slug === ex.mainSlug ? ex.backupSlug : ex.backupSlug ?? ex.mainSlug,
    sets: ex.sets.map((s) => (s.done ? s : { ...s, loadKg: load })),
    note: null,
  };
}

export interface CompleteSetResult {
  exercise: DraftExercise;
  suggestion: workout.AutoregSuggestion;
}

/**
 * Mark a set done and run WRK-05/WRK-14 autoregulation: when the set was clearly too light or
 * too heavy, the remaining sets get the suggested real load (rounded to the gym's steps).
 */
export function completeSet(
  ex: DraftExercise,
  index: number,
  data: Partial<DraftSet>,
  inventory?: workout.GymInventory,
  nowIso: string = new Date().toISOString()
): CompleteSetResult {
  const current = { ...ex.sets[index]!, ...data, done: true, completedAt: nowIso };
  const isLastSet = ex.sets.every((s, i) => i === index || s.done);
  const suggestion = workout.autoregulate({
    set: { loadKg: current.loadKg, reps: current.reps, rir: current.rir },
    repMin: ex.repMin,
    repMax: ex.repMax,
    targetRir: ex.targetRir,
    loadSpec: loadSpecOf(ex.slug, inventory),
    isLastSet,
  });
  let sets = ex.sets.map((s, i) => (i === index ? current : s));
  let note: SuggestionNote | null = ex.note;
  const kg = suggestion.suggestedLoadKg;
  if (suggestion.action !== 'hold' && kg != null) {
    if (suggestion.scope === 'next_set') {
      sets = sets.map((s, i) => (i > index && !s.done ? { ...s, loadKg: kg } : s));
      note = { kind: suggestion.action === 'increase' ? 'increase' : 'decrease', setNo: index + 1, kg };
    } else {
      note = { kind: suggestion.action === 'increase' ? 'nextSessionUp' : 'nextSessionDown', setNo: index + 1, kg };
    }
  }
  return { exercise: { ...ex, sets, note }, suggestion };
}

export function uncompleteSet(ex: DraftExercise, index: number): DraftExercise {
  return patchSet(ex, index, { done: false, completedAt: null, logId: null });
}

/** Done sets of one exercise as core `SetLog`s. */
export function toSetLogs(ex: DraftExercise, sessionId?: string): workout.SetLog[] {
  return ex.sets.flatMap((s, i) =>
    s.done && s.completedAt
      ? [
          {
            exerciseSlug: ex.slug,
            sessionId,
            setNo: i + 1,
            loadKg: s.loadKg,
            reps: s.reps,
            rir: s.rir,
            completedAt: s.completedAt,
            addedLoadKg: s.addedLoadKg,
            side: s.side,
          },
        ]
      : []
  );
}

export function sessionProgress(exercises: readonly DraftExercise[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const ex of exercises) {
    total += ex.sets.length;
    done += ex.sets.filter((s) => s.done).length;
  }
  return { done, total };
}

export interface ExerciseBest {
  loadKg: number | null;
  reps: number;
  oneRmKg: number | null;
  newRecords: workout.PersonalRecordHit[];
}

/** WRK-07: best set of the session (by est. 1RM) and PRs versus previous bests. */
export function exerciseBest(
  ex: DraftExercise,
  previous: workout.PersonalBests = {},
  bodyweightKg?: number
): ExerciseBest | null {
  const logs = toSetLogs(ex);
  if (logs.length === 0) return null;
  const best = workout.bestEstimatedOneRm(logs, { bodyweightKg });
  const top =
    best?.set ??
    logs.reduce((a, b) => ((b.loadKg ?? 0) * (b.reps ?? 0) > (a.loadKg ?? 0) * (a.reps ?? 0) ? b : a));
  const hasPrevious = Object.keys(previous).length > 0;
  return {
    loadKg: top.loadKg,
    reps: top.reps ?? 0,
    oneRmKg: best?.oneRmKg ?? null,
    newRecords: hasPrevious ? workout.detectPersonalRecords(logs, previous, { bodyweightKg }) : [],
  };
}

/** Index of the first exercise with an unfinished set (or the last exercise). */
export function firstOpenExercise(exercises: readonly DraftExercise[]): number {
  const i = exercises.findIndex((e) => e.sets.some((s) => !s.done));
  return i === -1 ? Math.max(0, exercises.length - 1) : i;
}

/** Index of the next unfinished set of an exercise, or −1. */
export function nextOpenSet(ex: DraftExercise): number {
  return ex.sets.findIndex((s) => !s.done);
}
