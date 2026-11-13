/**
 * Exercise → muscle / head stimulus (the `exercise_muscle_heads` model, v1.2).
 * Primary muscle 1.0, secondary 0.5 (muscle-recovery.md §2). Heads use the explicit
 * coefficients when known; otherwise every head of the muscle receives the muscle's stimulus
 * (uniform split – "chia đều", so the region value = its most stimulated head).
 */
import { EXERCISE_HEAD_STIMULUS, requireExercise } from './catalog/exercises';
import { MUSCLE_HEADS_BY_MUSCLE, muscleOfHead } from './catalog/muscles';
import type { MuscleCode, MuscleHeadCode } from './types';

export const PRIMARY_STIMULUS = 1;
export const SECONDARY_STIMULUS = 0.5;

/** Stimulus per muscle (18-region level). */
export function muscleStimulus(slug: string): Map<MuscleCode, number> {
  const ex = requireExercise(slug);
  const out = new Map<MuscleCode, number>();
  for (const m of ex.secondaryMuscles) out.set(m, SECONDARY_STIMULUS);
  out.set(ex.primaryMuscle, PRIMARY_STIMULUS);
  return out;
}

/** Stimulus per head (37-head level). */
export function headStimulus(slug: string): Map<MuscleHeadCode, number> {
  const explicit = EXERCISE_HEAD_STIMULUS[slug] ?? {};
  const explicitMuscles = new Set(
    (Object.keys(explicit) as MuscleHeadCode[]).map((h) => muscleOfHead(h)),
  );
  const out = new Map<MuscleHeadCode, number>();
  for (const [muscle, value] of muscleStimulus(slug)) {
    if (explicitMuscles.has(muscle)) continue;
    for (const head of MUSCLE_HEADS_BY_MUSCLE[muscle]) out.set(head, value);
  }
  for (const [head, value] of Object.entries(explicit) as [MuscleHeadCode, number][]) out.set(head, value);
  return out;
}
