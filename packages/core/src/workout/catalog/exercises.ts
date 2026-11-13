import type {
  EquipmentCode,
  Exercise,
  ExperienceLevel,
  Measure,
  Mechanic,
  MovementPattern,
  MuscleCode,
  MuscleGroupCode,
  MuscleHeadCode,
} from '../types';

/** WRK-16 defaults stored in `exercises.default_rest_sec` (06-workout.md §4b). */
export const DEFAULT_REST_SEC: Readonly<Record<Mechanic, number>> = { compound: 150, isolation: 75 };

function ex(
  slug: string,
  groupCode: MuscleGroupCode,
  primaryMuscle: MuscleCode,
  secondaryMuscles: MuscleCode[],
  equipment: EquipmentCode,
  mechanic: Mechanic,
  level: ExperienceLevel,
  measure: Measure,
  homeFriendly: boolean,
  movementPattern: MovementPattern | null,
  defaultRepMin: number,
  defaultRepMax: number,
  loadStepKg: number | null,
): Exercise {
  return {
    slug,
    groupCode,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    mechanic,
    level,
    measure,
    homeFriendly,
    movementPattern,
    defaultRepMin,
    defaultRepMax,
    loadStepKg,
    defaultRestSec: DEFAULT_REST_SEC[mechanic],
  };
}

/**
 * The 90 seed exercises (`seed/exercises_v1.csv`). Movement patterns, default rep ranges
 * (compound 6–12, isolation 10–20 – feature-backlog.md §6 [20]; seconds / metres for
 * time / distance measures) and load steps are added here because the CSV does not carry them.
 */
export const EXERCISES: readonly Exercise[] = [
  ex('barbell_bench_press', 'chest', 'chest', ['front_delts', 'triceps'], 'barbell', 'compound', 'beginner', 'reps', false, 'push_h', 6, 12, 2.5),
  ex('incline_barbell_bench_press', 'chest', 'chest', ['front_delts', 'triceps'], 'barbell', 'compound', 'intermediate', 'reps', false, 'push_h', 6, 12, 2.5),
  ex('dumbbell_bench_press', 'chest', 'chest', ['front_delts', 'triceps'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'push_h', 6, 12, 2),
  ex('incline_dumbbell_press', 'chest', 'chest', ['front_delts', 'triceps'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'push_h', 6, 12, 2),
  ex('dumbbell_fly', 'chest', 'chest', ['front_delts'], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('cable_crossover', 'chest', 'chest', ['front_delts'], 'cable', 'isolation', 'intermediate', 'reps', false, null, 10, 20, 5),
  ex('machine_chest_press', 'chest', 'chest', ['front_delts', 'triceps'], 'machine', 'compound', 'beginner', 'reps', false, 'push_h', 6, 12, 5),
  ex('pec_deck_fly', 'chest', 'chest', ['front_delts'], 'machine', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('push_up', 'chest', 'chest', ['front_delts', 'triceps', 'abs'], 'bodyweight', 'compound', 'beginner', 'reps', true, 'push_h', 6, 12, null),
  ex('chest_dip', 'chest', 'chest', ['triceps', 'front_delts'], 'bodyweight', 'compound', 'intermediate', 'reps', false, 'push_v', 6, 12, null),
  ex('deadlift', 'back', 'lower_back', ['glutes', 'hamstrings', 'traps', 'lats'], 'barbell', 'compound', 'intermediate', 'reps', false, 'hinge', 6, 12, 2.5),
  ex('barbell_row', 'back', 'upper_back', ['lats', 'biceps', 'rear_delts'], 'barbell', 'compound', 'intermediate', 'reps', false, 'pull_h', 6, 12, 2.5),
  ex('pull_up', 'back', 'lats', ['biceps', 'upper_back'], 'pullup_bar', 'compound', 'intermediate', 'reps', true, 'pull_v', 6, 12, null),
  ex('chin_up', 'back', 'lats', ['biceps', 'upper_back'], 'pullup_bar', 'compound', 'intermediate', 'reps', true, 'pull_v', 6, 12, null),
  ex('lat_pulldown', 'back', 'lats', ['biceps', 'upper_back'], 'cable', 'compound', 'beginner', 'reps', false, 'pull_v', 6, 12, 5),
  ex('seated_cable_row', 'back', 'upper_back', ['lats', 'biceps', 'rear_delts'], 'cable', 'compound', 'beginner', 'reps', false, 'pull_h', 6, 12, 5),
  ex('one_arm_dumbbell_row', 'back', 'lats', ['upper_back', 'biceps', 'rear_delts'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'pull_h', 6, 12, 2),
  ex('t_bar_row', 'back', 'upper_back', ['lats', 'biceps', 'rear_delts'], 'barbell', 'compound', 'intermediate', 'reps', false, 'pull_h', 6, 12, 2.5),
  ex('inverted_row', 'back', 'upper_back', ['lats', 'biceps', 'rear_delts'], 'bodyweight', 'compound', 'beginner', 'reps', true, 'pull_h', 6, 12, null),
  ex('band_pull_apart', 'back', 'upper_back', ['rear_delts', 'traps'], 'band', 'isolation', 'beginner', 'reps', true, null, 10, 20, null),
  ex('overhead_press', 'shoulders', 'front_delts', ['side_delts', 'triceps', 'traps'], 'barbell', 'compound', 'intermediate', 'reps', false, 'push_v', 6, 12, 2.5),
  ex('dumbbell_shoulder_press', 'shoulders', 'front_delts', ['side_delts', 'triceps'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'push_v', 6, 12, 2),
  ex('arnold_press', 'shoulders', 'front_delts', ['side_delts', 'triceps'], 'dumbbell', 'compound', 'intermediate', 'reps', true, 'push_v', 6, 12, 2),
  ex('dumbbell_lateral_raise', 'shoulders', 'side_delts', ['traps'], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('cable_lateral_raise', 'shoulders', 'side_delts', [], 'cable', 'isolation', 'intermediate', 'reps', false, null, 10, 20, 5),
  ex('dumbbell_front_raise', 'shoulders', 'front_delts', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('reverse_pec_deck', 'shoulders', 'rear_delts', ['upper_back'], 'machine', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('face_pull', 'shoulders', 'rear_delts', ['upper_back', 'traps'], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('machine_shoulder_press', 'shoulders', 'front_delts', ['side_delts', 'triceps'], 'machine', 'compound', 'beginner', 'reps', false, 'push_v', 6, 12, 5),
  ex('pike_push_up', 'shoulders', 'front_delts', ['side_delts', 'triceps'], 'bodyweight', 'compound', 'intermediate', 'reps', true, 'push_v', 6, 12, null),
  ex('barbell_curl', 'biceps', 'biceps', ['forearms'], 'barbell', 'isolation', 'beginner', 'reps', false, null, 10, 20, 2.5),
  ex('ez_bar_curl', 'biceps', 'biceps', ['forearms'], 'barbell', 'isolation', 'beginner', 'reps', false, null, 10, 20, 2.5),
  ex('dumbbell_curl', 'biceps', 'biceps', ['forearms'], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('hammer_curl', 'biceps', 'biceps', ['forearms'], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('incline_dumbbell_curl', 'biceps', 'biceps', [], 'dumbbell', 'isolation', 'intermediate', 'reps', true, null, 10, 20, 2),
  ex('preacher_curl', 'biceps', 'biceps', [], 'barbell', 'isolation', 'beginner', 'reps', false, null, 10, 20, 2.5),
  ex('concentration_curl', 'biceps', 'biceps', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('cable_curl', 'biceps', 'biceps', ['forearms'], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('band_curl', 'biceps', 'biceps', ['forearms'], 'band', 'isolation', 'beginner', 'reps', true, null, 10, 20, null),
  ex('spider_curl', 'biceps', 'biceps', [], 'dumbbell', 'isolation', 'intermediate', 'reps', true, null, 10, 20, 2),
  ex('close_grip_bench_press', 'triceps', 'triceps', ['chest', 'front_delts'], 'barbell', 'compound', 'intermediate', 'reps', false, 'push_h', 6, 12, 2.5),
  ex('cable_pushdown', 'triceps', 'triceps', [], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('rope_pushdown', 'triceps', 'triceps', [], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('overhead_dumbbell_extension', 'triceps', 'triceps', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('skull_crusher', 'triceps', 'triceps', [], 'barbell', 'isolation', 'intermediate', 'reps', false, null, 10, 20, 2.5),
  ex('dumbbell_kickback', 'triceps', 'triceps', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('bench_dip', 'triceps', 'triceps', ['front_delts', 'chest'], 'bodyweight', 'compound', 'beginner', 'reps', true, 'push_v', 6, 12, null),
  ex('diamond_push_up', 'triceps', 'triceps', ['chest', 'front_delts'], 'bodyweight', 'compound', 'intermediate', 'reps', true, 'push_h', 6, 12, null),
  ex('overhead_cable_extension', 'triceps', 'triceps', [], 'cable', 'isolation', 'intermediate', 'reps', false, null, 10, 20, 5),
  ex('band_pushdown', 'triceps', 'triceps', [], 'band', 'isolation', 'beginner', 'reps', true, null, 10, 20, null),
  ex('barbell_wrist_curl', 'forearms', 'forearms', [], 'barbell', 'isolation', 'beginner', 'reps', false, null, 10, 20, 2.5),
  ex('dumbbell_wrist_curl', 'forearms', 'forearms', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('reverse_wrist_curl', 'forearms', 'forearms', [], 'dumbbell', 'isolation', 'beginner', 'reps', true, null, 10, 20, 2),
  ex('behind_back_wrist_curl', 'forearms', 'forearms', [], 'barbell', 'isolation', 'intermediate', 'reps', false, null, 10, 20, 2.5),
  ex('reverse_barbell_curl', 'forearms', 'forearms', ['biceps'], 'barbell', 'isolation', 'beginner', 'reps', false, null, 10, 20, 2.5),
  ex('zottman_curl', 'forearms', 'forearms', ['biceps'], 'dumbbell', 'isolation', 'intermediate', 'reps', true, null, 10, 20, 2),
  ex('cable_wrist_curl', 'forearms', 'forearms', [], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('farmers_walk', 'forearms', 'forearms', ['traps', 'abs'], 'dumbbell', 'compound', 'beginner', 'distance', true, 'carry', 20, 40, 2),
  ex('dead_hang', 'forearms', 'forearms', ['lats'], 'pullup_bar', 'isolation', 'beginner', 'time', true, null, 20, 60, null),
  ex('towel_hang', 'forearms', 'forearms', ['lats'], 'pullup_bar', 'isolation', 'intermediate', 'time', true, null, 10, 30, null),
  ex('crunch', 'abs', 'abs', [], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'core', 10, 20, null),
  ex('plank', 'abs', 'abs', ['obliques', 'lower_back'], 'bodyweight', 'isolation', 'beginner', 'time', true, 'core', 20, 60, null),
  ex('side_plank', 'abs', 'obliques', ['abs'], 'bodyweight', 'isolation', 'beginner', 'time', true, 'core', 15, 45, null),
  ex('lying_leg_raise', 'abs', 'abs', [], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'core', 10, 20, null),
  ex('hanging_leg_raise', 'abs', 'abs', ['obliques'], 'pullup_bar', 'isolation', 'intermediate', 'reps', true, 'core', 10, 20, null),
  ex('cable_crunch', 'abs', 'abs', [], 'cable', 'isolation', 'intermediate', 'reps', false, 'core', 10, 20, 5),
  ex('russian_twist', 'abs', 'obliques', ['abs'], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'core', 10, 20, null),
  ex('bicycle_crunch', 'abs', 'abs', ['obliques'], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'core', 10, 20, null),
  ex('mountain_climber', 'abs', 'abs', ['front_delts', 'quads'], 'bodyweight', 'compound', 'beginner', 'time', true, 'core', 20, 45, null),
  ex('dead_bug', 'abs', 'abs', [], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'core', 10, 20, null),
  ex('barbell_hip_thrust', 'glutes', 'glutes', ['hamstrings'], 'barbell', 'compound', 'intermediate', 'reps', false, 'hinge', 6, 12, 2.5),
  ex('glute_bridge', 'glutes', 'glutes', ['hamstrings'], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'hinge', 10, 20, null),
  ex('single_leg_glute_bridge', 'glutes', 'glutes', ['hamstrings'], 'bodyweight', 'isolation', 'beginner', 'reps', true, 'hinge', 10, 20, null),
  ex('cable_glute_kickback', 'glutes', 'glutes', ['hamstrings'], 'cable', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('bulgarian_split_squat', 'glutes', 'glutes', ['quads', 'hamstrings'], 'dumbbell', 'compound', 'intermediate', 'reps', true, 'lunge', 6, 12, 2),
  ex('sumo_goblet_squat', 'glutes', 'glutes', ['adductors', 'quads'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'squat', 6, 12, 2),
  ex('hip_abduction_machine', 'glutes', 'glutes', [], 'machine', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('banded_lateral_walk', 'glutes', 'glutes', [], 'band', 'isolation', 'beginner', 'reps', true, null, 10, 20, null),
  ex('kettlebell_swing', 'glutes', 'glutes', ['hamstrings', 'lower_back'], 'kettlebell', 'compound', 'intermediate', 'reps', true, 'hinge', 6, 12, 4),
  ex('dumbbell_step_up', 'glutes', 'glutes', ['quads'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'lunge', 6, 12, 2),
  ex('barbell_back_squat', 'legs', 'quads', ['glutes', 'adductors', 'lower_back'], 'barbell', 'compound', 'intermediate', 'reps', false, 'squat', 6, 12, 2.5),
  ex('front_squat', 'legs', 'quads', ['glutes', 'abs'], 'barbell', 'compound', 'advanced', 'reps', false, 'squat', 6, 12, 2.5),
  ex('goblet_squat', 'legs', 'quads', ['glutes', 'adductors'], 'kettlebell', 'compound', 'beginner', 'reps', true, 'squat', 6, 12, 4),
  ex('smith_machine_squat', 'legs', 'quads', ['glutes'], 'smith_machine', 'compound', 'beginner', 'reps', false, 'squat', 6, 12, 2.5),
  ex('leg_press', 'legs', 'quads', ['glutes', 'adductors'], 'machine', 'compound', 'beginner', 'reps', false, 'squat', 6, 12, 5),
  ex('leg_extension', 'legs', 'quads', [], 'machine', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('lying_leg_curl', 'legs', 'hamstrings', ['calves'], 'machine', 'isolation', 'beginner', 'reps', false, null, 10, 20, 5),
  ex('romanian_deadlift', 'legs', 'hamstrings', ['glutes', 'lower_back'], 'barbell', 'compound', 'intermediate', 'reps', false, 'hinge', 6, 12, 2.5),
  ex('walking_lunge', 'legs', 'quads', ['glutes', 'hamstrings'], 'dumbbell', 'compound', 'beginner', 'reps', true, 'lunge', 6, 12, 2),
  ex('calf_raise', 'legs', 'calves', [], 'bodyweight', 'isolation', 'beginner', 'reps', true, null, 10, 20, null),
];

const bySlug = new Map(EXERCISES.map((e) => [e.slug, e] as const));

export function getExercise(slug: string): Exercise | undefined {
  return bySlug.get(slug);
}

export function requireExercise(slug: string): Exercise {
  const exercise = bySlug.get(slug);
  if (!exercise) throw new Error(`unknown_exercise:${slug}`);
  return exercise;
}

/**
 * Per-head stimulus coefficients (`exercise_muscle_heads`) known so far – the chest examples of
 * muscle-recovery.md §1b. Exercises / muscles not listed fall back to the uniform split.
 */
export const EXERCISE_HEAD_STIMULUS: Readonly<Record<string, Partial<Record<MuscleHeadCode, number>>>> = {
  incline_barbell_bench_press: { chest_upper: 1.0, chest_middle: 0.6, chest_lower: 0.2 },
  incline_dumbbell_press: { chest_upper: 1.0, chest_middle: 0.6, chest_lower: 0.2 },
  barbell_bench_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  dumbbell_bench_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  machine_chest_press: { chest_upper: 0.5, chest_middle: 1.0, chest_lower: 0.5 },
  chest_dip: { chest_upper: 0.2, chest_middle: 0.6, chest_lower: 1.0 },
  cable_crossover: { chest_upper: 0.2, chest_middle: 0.8, chest_lower: 0.8 },
  push_up: { chest_upper: 0.4, chest_middle: 1.0, chest_lower: 0.5 },
};

/**
 * Calisthenics progression chains built from the seed library (signature-features.md §8).
 * Level up when the criterion (3 × 12 reps) is met. Full skill tree is WRK-08 (v1.1).
 */
export const CALISTHENICS_CHAINS: Readonly<Record<string, readonly string[]>> = {
  push: ['push_up', 'diamond_push_up'],
  vertical_push: ['pike_push_up'],
  pull: ['inverted_row', 'chin_up', 'pull_up'],
  dip: ['bench_dip', 'chest_dip'],
  core: ['lying_leg_raise', 'hanging_leg_raise'],
  hip: ['glute_bridge', 'single_leg_glute_bridge'],
};

/** Next harder exercise in its calisthenics chain, or `null` at the top / not in a chain. */
export function nextProgressionExercise(slug: string): string | null {
  for (const chain of Object.values(CALISTHENICS_CHAINS)) {
    const i = chain.indexOf(slug);
    if (i >= 0) return chain[i + 1] ?? null;
  }
  return null;
}
