/**
 * WRK-20 – the 7 AuraFit template plans (feature-backlog.md §6, EXT-26), written by AuraFit
 * (not copied from any AGPL source). Shared principles:
 * - every muscle ≥ 2×/week [12]; ~10–20 effective sets / muscle / week, beginners low [1][2];
 * - compound 6–12 reps, isolation 10–20 [20]; RIR 1–3 (beginners 2–3) [6][7];
 * - compound rest ≥ 2 min [15][16]; double progression [9], deload every 4–6 weeks [10].
 * Names / descriptions are i18n keys in the app (`program_templates.name_vi/en`), keyed by slug.
 */
import { requireExercise } from './catalog/exercises';
import { defaultRest } from './restDefaults';
import type { EquipmentProfileKind, ExperienceLevel, ProgramSplit } from './types';
import type { ProgressionRule } from './progression';

export type SessionFocus = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

export interface TemplateExercise {
  exerciseSlug: string;
  sets: number;
  repMin: number;
  repMax: number;
  targetRir: number;
  restSec: number;
  backupExerciseSlug: string | null;
}

export interface TemplateSession {
  /** A = 0, B = 1 … (`program_template_sessions.rotation_index`). */
  rotationIndex: number;
  code: string;
  focus: SessionFocus;
  exercises: TemplateExercise[];
}

export type TemplateSlug =
  | 'full_body_ab'
  | 'upper_lower'
  | 'push_pull_legs'
  | 'strength_5x5'
  | 'home_dumbbell_band'
  | 'calisthenics_levels'
  | 'women_lower_focus';

export interface ProgramTemplate {
  slug: TemplateSlug;
  level: ExperienceLevel;
  /** Default sessions / week. */
  daysPerWeek: number;
  /** All supported sessions / week. */
  supportedDays: readonly number[];
  split: ProgramSplit;
  equipmentKind: EquipmentProfileKind;
  progressionRule: ProgressionRule;
  /** Weeks between deloads (4–6). */
  deloadEveryWeeks: number;
  sessions: TemplateSession[];
}

function te(
  slug: string,
  sets: number,
  repMin: number,
  repMax: number,
  targetRir: number,
  backup: string | null,
  restSec?: number,
): TemplateExercise {
  const ex = requireExercise(slug);
  if (backup) requireExercise(backup);
  return {
    exerciseSlug: slug,
    sets,
    repMin,
    repMax,
    targetRir,
    restSec: restSec ?? defaultRest(ex.mechanic, { repMax }).restSec,
    backupExerciseSlug: backup,
  };
}

const session = (rotationIndex: number, code: string, focus: SessionFocus, exercises: TemplateExercise[]): TemplateSession => ({
  rotationIndex,
  code,
  focus,
  exercises,
});

export const PROGRAM_TEMPLATES: readonly ProgramTemplate[] = [
  {
    slug: 'full_body_ab',
    level: 'beginner',
    daysPerWeek: 3,
    supportedDays: [2, 3],
    split: 'full_body',
    equipmentKind: 'gym',
    progressionRule: 'double',
    deloadEveryWeeks: 6,
    sessions: [
      session(0, 'A', 'full_body', [
        te('leg_press', 3, 8, 12, 3, 'smith_machine_squat'),
        te('barbell_bench_press', 3, 6, 10, 2, 'dumbbell_bench_press'),
        te('lat_pulldown', 3, 8, 12, 2, 'one_arm_dumbbell_row'),
        te('romanian_deadlift', 2, 8, 12, 3, 'lying_leg_curl'),
        te('dumbbell_lateral_raise', 2, 12, 20, 2, 'cable_lateral_raise'),
        te('crunch', 2, 12, 20, 2, 'bicycle_crunch'),
      ]),
      session(1, 'B', 'full_body', [
        te('smith_machine_squat', 3, 8, 12, 3, 'leg_press'),
        te('dumbbell_shoulder_press', 3, 8, 12, 2, 'machine_shoulder_press'),
        te('seated_cable_row', 3, 8, 12, 2, 'one_arm_dumbbell_row'),
        te('incline_dumbbell_press', 2, 8, 12, 2, 'machine_chest_press'),
        te('lying_leg_curl', 2, 10, 15, 2, 'romanian_deadlift'),
        te('dumbbell_curl', 2, 10, 15, 2, 'cable_curl'),
        te('cable_pushdown', 2, 10, 15, 2, 'rope_pushdown'),
      ]),
    ],
  },
  {
    slug: 'upper_lower',
    level: 'intermediate',
    daysPerWeek: 4,
    supportedDays: [4],
    split: 'upper_lower',
    equipmentKind: 'gym',
    progressionRule: 'double',
    deloadEveryWeeks: 5,
    sessions: [
      session(0, 'upper_a', 'upper', [
        te('barbell_bench_press', 4, 6, 10, 2, 'dumbbell_bench_press'),
        te('barbell_row', 3, 6, 10, 2, 'seated_cable_row'),
        te('dumbbell_shoulder_press', 3, 8, 12, 2, 'machine_shoulder_press'),
        te('lat_pulldown', 3, 8, 12, 2, 'pull_up'),
        te('dumbbell_lateral_raise', 3, 12, 20, 1, 'cable_lateral_raise'),
        te('ez_bar_curl', 2, 10, 15, 1, 'dumbbell_curl'),
        te('cable_pushdown', 2, 10, 15, 1, 'rope_pushdown'),
      ]),
      session(1, 'lower_a', 'lower', [
        te('barbell_back_squat', 4, 6, 10, 2, 'smith_machine_squat'),
        te('romanian_deadlift', 3, 8, 12, 2, 'lying_leg_curl'),
        te('leg_extension', 2, 10, 15, 1, 'leg_press'),
        te('lying_leg_curl', 2, 10, 15, 1, 'romanian_deadlift'),
        te('calf_raise', 3, 10, 20, 1, null),
        te('cable_crunch', 2, 10, 15, 1, 'crunch'),
      ]),
      session(2, 'upper_b', 'upper', [
        te('incline_dumbbell_press', 3, 8, 12, 2, 'incline_barbell_bench_press'),
        te('pull_up', 3, 6, 10, 2, 'lat_pulldown'),
        te('seated_cable_row', 3, 8, 12, 2, 't_bar_row'),
        te('cable_crossover', 3, 10, 15, 1, 'pec_deck_fly'),
        te('face_pull', 3, 12, 20, 1, 'reverse_pec_deck'),
        te('hammer_curl', 2, 10, 15, 1, 'cable_curl'),
        te('overhead_cable_extension', 2, 10, 15, 1, 'overhead_dumbbell_extension'),
      ]),
      session(3, 'lower_b', 'lower', [
        te('leg_press', 3, 8, 12, 2, 'goblet_squat'),
        te('barbell_hip_thrust', 3, 8, 12, 2, 'glute_bridge'),
        te('bulgarian_split_squat', 2, 8, 12, 2, 'walking_lunge'),
        te('lying_leg_curl', 3, 10, 15, 1, 'romanian_deadlift'),
        te('calf_raise', 3, 10, 20, 1, null),
        te('hanging_leg_raise', 2, 10, 15, 1, 'lying_leg_raise'),
      ]),
    ],
  },
  {
    slug: 'push_pull_legs',
    level: 'intermediate',
    daysPerWeek: 6,
    supportedDays: [3, 5, 6],
    split: 'ppl',
    equipmentKind: 'gym',
    progressionRule: 'double',
    deloadEveryWeeks: 5,
    sessions: [
      session(0, 'push', 'push', [
        te('barbell_bench_press', 3, 6, 10, 2, 'dumbbell_bench_press'),
        te('overhead_press', 3, 6, 10, 2, 'dumbbell_shoulder_press'),
        te('incline_dumbbell_press', 3, 8, 12, 2, 'machine_chest_press'),
        te('dumbbell_lateral_raise', 3, 12, 20, 1, 'cable_lateral_raise'),
        te('rope_pushdown', 3, 10, 15, 1, 'cable_pushdown'),
        te('overhead_dumbbell_extension', 2, 10, 15, 1, 'overhead_cable_extension'),
      ]),
      // Pull day follows the project owner's example (workout.md); the row rest is raised from
      // 90 s to 120 s to respect "compound ≥ 2 min" (WRK-16, D-048).
      session(1, 'pull', 'pull', [
        te('lat_pulldown', 3, 8, 10, 2, 'pull_up', 120),
        te('seated_cable_row', 3, 10, 12, 2, 'one_arm_dumbbell_row', 120),
        te('reverse_pec_deck', 3, 12, 15, 1, 'face_pull', 60),
        te('dumbbell_curl', 3, 10, 12, 1, 'cable_curl', 60),
        te('barbell_row', 2, 6, 10, 2, 't_bar_row'),
      ]),
      session(2, 'legs', 'legs', [
        te('barbell_back_squat', 3, 6, 10, 2, 'leg_press'),
        te('romanian_deadlift', 3, 8, 12, 2, 'lying_leg_curl'),
        te('leg_press', 2, 10, 15, 2, 'smith_machine_squat'),
        te('lying_leg_curl', 2, 10, 15, 1, 'romanian_deadlift'),
        te('leg_extension', 2, 12, 20, 1, 'leg_press'),
        te('calf_raise', 3, 10, 20, 1, null),
      ]),
    ],
  },
  {
    slug: 'strength_5x5',
    level: 'beginner',
    daysPerWeek: 3,
    supportedDays: [3],
    split: 'full_body',
    equipmentKind: 'gym',
    progressionRule: 'linear',
    deloadEveryWeeks: 6,
    sessions: [
      session(0, 'A', 'full_body', [
        te('barbell_back_squat', 5, 5, 5, 2, 'smith_machine_squat'),
        te('barbell_bench_press', 5, 5, 5, 2, 'dumbbell_bench_press'),
        te('barbell_row', 5, 5, 5, 2, 't_bar_row'),
      ]),
      session(1, 'B', 'full_body', [
        te('barbell_back_squat', 5, 5, 5, 2, 'smith_machine_squat'),
        te('overhead_press', 5, 5, 5, 2, 'dumbbell_shoulder_press'),
        te('deadlift', 1, 5, 5, 2, 'romanian_deadlift'),
      ]),
    ],
  },
  {
    slug: 'home_dumbbell_band',
    level: 'beginner',
    daysPerWeek: 3,
    supportedDays: [3, 4],
    split: 'full_body',
    equipmentKind: 'home',
    progressionRule: 'double',
    deloadEveryWeeks: 6,
    sessions: [
      session(0, 'A', 'full_body', [
        te('sumo_goblet_squat', 3, 8, 12, 2, 'bulgarian_split_squat'),
        te('dumbbell_bench_press', 3, 8, 12, 2, 'push_up'),
        te('one_arm_dumbbell_row', 3, 8, 12, 2, 'inverted_row'),
        te('dumbbell_shoulder_press', 2, 8, 12, 2, 'pike_push_up'),
        te('band_pull_apart', 2, 12, 20, 2, 'inverted_row'),
        te('dead_bug', 2, 8, 12, 2, 'crunch'),
      ]),
      session(1, 'B', 'full_body', [
        te('bulgarian_split_squat', 3, 8, 12, 2, 'walking_lunge'),
        te('push_up', 3, 6, 15, 2, 'dumbbell_bench_press'),
        te('inverted_row', 3, 6, 12, 2, 'one_arm_dumbbell_row'),
        te('single_leg_glute_bridge', 3, 8, 15, 2, 'glute_bridge'),
        te('dumbbell_lateral_raise', 2, 12, 20, 2, null),
        te('band_curl', 2, 10, 20, 2, 'dumbbell_curl'),
        te('band_pushdown', 2, 10, 20, 2, 'overhead_dumbbell_extension'),
      ]),
    ],
  },
  {
    slug: 'calisthenics_levels',
    level: 'beginner',
    daysPerWeek: 3,
    supportedDays: [3],
    split: 'full_body',
    equipmentKind: 'bodyweight',
    progressionRule: 'calisthenics_level',
    deloadEveryWeeks: 6,
    sessions: [
      session(0, 'A', 'full_body', [
        te('push_up', 3, 6, 12, 2, 'diamond_push_up'),
        te('inverted_row', 3, 6, 12, 2, null),
        te('single_leg_glute_bridge', 3, 6, 12, 2, 'glute_bridge'),
        te('calf_raise', 3, 10, 20, 2, null),
        te('lying_leg_raise', 3, 6, 12, 2, 'dead_bug'),
      ]),
      session(1, 'B', 'full_body', [
        te('pike_push_up', 3, 6, 12, 2, 'chest_dip'),
        te('chin_up', 3, 3, 8, 2, 'pull_up'),
        te('bench_dip', 3, 6, 12, 2, 'diamond_push_up'),
        te('glute_bridge', 3, 6, 12, 2, 'single_leg_glute_bridge'),
        te('plank', 2, 20, 60, 2, 'side_plank'),
      ]),
    ],
  },
  {
    slug: 'women_lower_focus',
    level: 'beginner',
    daysPerWeek: 4,
    supportedDays: [4],
    split: 'upper_lower',
    equipmentKind: 'gym',
    progressionRule: 'double',
    deloadEveryWeeks: 5,
    sessions: [
      session(0, 'lower_a', 'lower', [
        te('barbell_hip_thrust', 4, 8, 12, 2, 'glute_bridge'),
        te('goblet_squat', 3, 8, 12, 2, 'leg_press'),
        te('romanian_deadlift', 3, 8, 12, 2, 'lying_leg_curl'),
        te('hip_abduction_machine', 3, 12, 20, 1, 'banded_lateral_walk'),
        te('calf_raise', 2, 10, 20, 1, null),
      ]),
      session(1, 'upper_a', 'upper', [
        te('lat_pulldown', 3, 8, 12, 2, 'one_arm_dumbbell_row'),
        te('dumbbell_shoulder_press', 3, 8, 12, 2, 'machine_shoulder_press'),
        te('incline_dumbbell_press', 2, 8, 12, 2, 'machine_chest_press'),
        te('seated_cable_row', 2, 8, 12, 2, 'one_arm_dumbbell_row'),
        te('dumbbell_lateral_raise', 2, 12, 20, 1, 'cable_lateral_raise'),
        te('cable_pushdown', 2, 10, 15, 1, 'band_pushdown'),
      ]),
      session(2, 'lower_b', 'lower', [
        te('bulgarian_split_squat', 3, 8, 12, 2, 'walking_lunge'),
        te('lying_leg_curl', 3, 10, 15, 1, 'romanian_deadlift'),
        te('leg_press', 3, 10, 15, 2, 'smith_machine_squat'),
        te('cable_glute_kickback', 3, 12, 20, 1, 'single_leg_glute_bridge'),
        te('dead_bug', 2, 8, 12, 2, 'crunch'),
      ]),
      session(3, 'upper_b', 'upper', [
        te('machine_chest_press', 3, 8, 12, 2, 'dumbbell_bench_press'),
        te('one_arm_dumbbell_row', 3, 8, 12, 2, 'seated_cable_row'),
        te('machine_shoulder_press', 2, 8, 12, 2, 'dumbbell_shoulder_press'),
        te('face_pull', 2, 12, 20, 1, 'reverse_pec_deck'),
        te('dumbbell_curl', 2, 10, 15, 1, 'band_curl'),
      ]),
    ],
  },
];

export function getTemplate(slug: TemplateSlug): ProgramTemplate {
  const t = PROGRAM_TEMPLATES.find((x) => x.slug === slug);
  if (!t) throw new Error(`unknown_template:${slug}`);
  return t;
}
