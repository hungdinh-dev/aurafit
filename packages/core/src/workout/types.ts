/**
 * Shared workout types. Codes mirror `docs/04-database/06-workout.md` (v1.3) and
 * `docs/04-database/seed/exercises_v1.csv` so values can be stored / read without mapping.
 */

/** 9 library muscle groups (`muscle_groups.code`, D-042). */
export type MuscleGroupCode =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'glutes'
  | 'legs';

/** 18 recovery-map muscles (`muscles.code`). */
export type MuscleCode =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'traps'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves';

/** 37 muscle heads (`muscle_heads.code`, D-044). Single-head muscles reuse the muscle code. */
export type MuscleHeadCode =
  | 'chest_upper'
  | 'chest_middle'
  | 'chest_lower'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps_long'
  | 'biceps_short'
  | 'brachialis'
  | 'triceps_long'
  | 'triceps_lateral'
  | 'triceps_medial'
  | 'forearm_flexors'
  | 'forearm_extensors'
  | 'brachioradialis'
  | 'abs_upper'
  | 'abs_lower'
  | 'obliques_external'
  | 'serratus'
  | 'traps_upper'
  | 'traps_middle'
  | 'traps_lower'
  | 'lats'
  | 'rhomboids'
  | 'teres_infraspinatus'
  | 'erector_spinae'
  | 'glute_max'
  | 'glute_med'
  | 'rectus_femoris'
  | 'vastus_lateralis'
  | 'vastus_medialis'
  | 'biceps_femoris'
  | 'semitendinosus'
  | 'adductors'
  | 'gastrocnemius'
  | 'soleus'
  | 'tibialis_anterior';

/** 9 equipment types (`equipment.code`, D-042). */
export type EquipmentCode =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'smith_machine'
  | 'bodyweight'
  | 'pullup_bar'
  | 'band'
  | 'kettlebell';

export type Mechanic = 'compound' | 'isolation';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type MovementPattern =
  | 'push_h'
  | 'push_v'
  | 'pull_h'
  | 'pull_v'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'core'
  | 'carry';
export type Measure = 'reps' | 'time' | 'distance';
export type MuscleSize = 'large' | 'medium' | 'small';
export type BodyView = 'front' | 'back' | 'both';
export type GoalType = 'lose_fat' | 'maintain' | 'gain_muscle';
export type ProgramSplit = 'full_body' | 'upper_lower' | 'ppl';
export type EquipmentProfileKind = 'gym' | 'home' | 'bodyweight';
export type ScheduleMode = 'weekday' | 'rotation';
export type SetSide = 'both' | 'left' | 'right';

/** Exercise row (subset of `exercises` used by the core logic). */
export interface Exercise {
  slug: string;
  groupCode: MuscleGroupCode;
  primaryMuscle: MuscleCode;
  secondaryMuscles: readonly MuscleCode[];
  equipment: EquipmentCode;
  mechanic: Mechanic;
  level: ExperienceLevel;
  measure: Measure;
  homeFriendly: boolean;
  /** `null` for isolation movements that have no pattern in the DB enum. */
  movementPattern: MovementPattern | null;
  defaultRepMin: number;
  defaultRepMax: number;
  /** Smallest load step (`exercises.load_step_kg`); `null` for bodyweight / band. */
  loadStepKg: number | null;
  /** `exercises.default_rest_sec` (WRK-16). */
  defaultRestSec: number;
}

/** One logged set (`set_logs`, v1.3). */
export interface SetLog {
  exerciseSlug: string;
  sessionId?: string;
  setNo?: number;
  /** External load (bar + plates, dumbbell, stack). For bodyweight moves use `addedLoadKg`. */
  loadKg: number | null;
  reps: number | null;
  durationSec?: number | null;
  rpe?: number | null;
  rir?: number | null;
  isWarmup?: boolean;
  /** ISO timestamp. */
  completedAt: string;
  addedLoadKg?: number | null;
  side?: SetSide;
}

/** `equipment_profiles.inventory` jsonb (v1.3, WRK-18). Keys keep the stored snake_case. */
export interface GymInventory {
  bars?: { type: string; kg: number }[];
  plates_kg?: number[];
  /** Optional plate pair counts keyed by plate weight, e.g. `{ "20": 4 }` = 4 plates. */
  plate_counts?: Record<string, number>;
  dumbbells_kg?: number[];
  machines?: Record<string, { step_kg: number; min_kg?: number; max_kg?: number }>;
  bands?: { color: string; kg_equiv: number }[];
  kettlebells_kg?: number[];
}
