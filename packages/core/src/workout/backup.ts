/**
 * WRK-17 – one-tap backup exercise ("machine busy") and equipment-profile substitution (WRK-02).
 * Candidates must use available equipment; ranking prefers the same primary muscle and
 * movement pattern, then the same mechanic / group / secondary muscles and a similar level.
 * Swapping keeps sets × reps and target RIR (the load is reset because the implement differs).
 */
import { EXERCISES, requireExercise } from './catalog/exercises';
import type { EquipmentCode, Exercise, ExperienceLevel } from './types';

export interface BackupOptions {
  /** Equipment available right now. Bodyweight is always available. */
  availableEquipment?: readonly EquipmentCode[];
  excludeSlugs?: readonly string[];
  catalog?: readonly Exercise[];
  limit?: number;
}

export interface BackupCandidate {
  slug: string;
  score: number;
}

const LEVEL_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Similarity score between an exercise and a candidate replacement (higher = closer). */
export function similarity(a: Exercise, b: Exercise): number {
  let score = 0;
  if (a.primaryMuscle === b.primaryMuscle) score += 4;
  if (a.movementPattern !== null && a.movementPattern === b.movementPattern) score += 3;
  if (a.mechanic === b.mechanic) score += 1.5;
  if (a.groupCode === b.groupCode) score += 1;
  if (a.measure === b.measure) score += 0.5;
  const overlap = a.secondaryMuscles.filter((m) => b.secondaryMuscles.includes(m)).length;
  score += overlap * 0.5;
  score -= Math.abs(LEVEL_RANK[a.level] - LEVEL_RANK[b.level]) * 0.5;
  return score;
}

/** Equivalent exercise = same primary muscle, or same (non-null) movement pattern. */
export function isEquivalent(a: Exercise, b: Exercise): boolean {
  return (
    a.slug !== b.slug &&
    a.measure === b.measure &&
    (a.primaryMuscle === b.primaryMuscle || (a.movementPattern !== null && a.movementPattern === b.movementPattern))
  );
}

export function isAvailable(exercise: Exercise, available?: readonly EquipmentCode[]): boolean {
  if (!available) return true;
  return exercise.equipment === 'bodyweight' || available.includes(exercise.equipment);
}

/** Ranked backup exercises for `slug`. */
export function findBackupExercises(slug: string, opts: BackupOptions = {}): BackupCandidate[] {
  const source = requireExercise(slug);
  const exclude = new Set(opts.excludeSlugs ?? []);
  return (opts.catalog ?? EXERCISES)
    .filter((c) => !exclude.has(c.slug) && isEquivalent(source, c) && isAvailable(c, opts.availableEquipment))
    .map((c) => ({ slug: c.slug, score: similarity(source, c) }))
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, opts.limit ?? 5);
}

/** Best single backup, or `null`. */
export function pickBackup(slug: string, opts: BackupOptions = {}): string | null {
  return findBackupExercises(slug, { ...opts, limit: 1 })[0]?.slug ?? null;
}

/** Minimal planned-exercise shape used by swaps and the generator. */
export interface PlannedExercise {
  exerciseSlug: string;
  sortOrder: number;
  sets: number;
  repMin: number;
  repMax: number;
  targetRir: number | null;
  restSec: number;
  targetLoadKg: number | null;
  backupExerciseSlug: string | null;
  isExtra: boolean;
}

/** Swap a planned exercise for its backup, keeping sets / reps / RIR / rest (WRK-17). */
export function swapExercise(planned: PlannedExercise, newSlug: string): PlannedExercise {
  requireExercise(newSlug);
  return {
    ...planned,
    exerciseSlug: newSlug,
    targetLoadKg: null,
    backupExerciseSlug: planned.exerciseSlug,
  };
}

/**
 * Replace exercises that need missing equipment with the best available equivalent
 * (WRK-02: picking an equipment profile at session start). Exercises without any
 * equivalent are dropped and reported.
 */
export function adaptToEquipment(
  planned: readonly PlannedExercise[],
  availableEquipment: readonly EquipmentCode[],
): { exercises: PlannedExercise[]; replaced: { from: string; to: string }[]; dropped: string[] } {
  const replaced: { from: string; to: string }[] = [];
  const dropped: string[] = [];
  const used = new Set(planned.map((p) => p.exerciseSlug));
  const exercises: PlannedExercise[] = [];
  for (const p of planned) {
    const ex = requireExercise(p.exerciseSlug);
    if (isAvailable(ex, availableEquipment)) {
      const backupOk =
        p.backupExerciseSlug !== null && isAvailable(requireExercise(p.backupExerciseSlug), availableEquipment);
      exercises.push(
        backupOk ? p : { ...p, backupExerciseSlug: pickBackup(p.exerciseSlug, { availableEquipment, excludeSlugs: [...used] }) },
      );
      continue;
    }
    const to =
      p.backupExerciseSlug !== null &&
      !used.has(p.backupExerciseSlug) &&
      isAvailable(requireExercise(p.backupExerciseSlug), availableEquipment)
        ? p.backupExerciseSlug
        : pickBackup(p.exerciseSlug, { availableEquipment, excludeSlugs: [...used] });
    if (!to) {
      dropped.push(p.exerciseSlug);
      continue;
    }
    used.add(to);
    replaced.push({ from: p.exerciseSlug, to });
    const swapped = swapExercise(p, to);
    exercises.push({
      ...swapped,
      backupExerciseSlug: pickBackup(to, { availableEquipment, excludeSlugs: [...used] }),
    });
  }
  return { exercises: exercises.map((e, i) => ({ ...e, sortOrder: i + 1 })), replaced, dropped };
}
