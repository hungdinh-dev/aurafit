import type { BodyView, MuscleCode, MuscleGroupCode, MuscleHeadCode, MuscleSize } from '../types';

export interface MuscleInfo {
  code: MuscleCode;
  groupCode: MuscleGroupCode;
  view: BodyView;
  size: MuscleSize;
  /** Hours until fatigue falls below 20 % of its initial value (muscle-recovery.md §2). */
  baseRecoveryHours: number;
  /** WRK-13 defaults (06-workout.md §4b). */
  defaultSetsMin: number;
  defaultSetsMax: number;
  overreachSets: number;
}

const m = (
  code: MuscleCode,
  groupCode: MuscleGroupCode,
  view: BodyView,
  size: MuscleSize,
  baseRecoveryHours: number,
): MuscleInfo => ({
  code,
  groupCode,
  view,
  size,
  baseRecoveryHours,
  defaultSetsMin: 10,
  defaultSetsMax: 20,
  overreachSets: 25,
});

/** The 18 muscles of the recovery map (`muscles` table, 06-workout.md §1). */
export const MUSCLES: Readonly<Record<MuscleCode, MuscleInfo>> = {
  chest: m('chest', 'chest', 'front', 'large', 72),
  front_delts: m('front_delts', 'shoulders', 'front', 'medium', 48),
  side_delts: m('side_delts', 'shoulders', 'both', 'medium', 48),
  rear_delts: m('rear_delts', 'shoulders', 'back', 'medium', 48),
  biceps: m('biceps', 'biceps', 'front', 'small', 48),
  triceps: m('triceps', 'triceps', 'back', 'small', 48),
  forearms: m('forearms', 'forearms', 'both', 'small', 36),
  abs: m('abs', 'abs', 'front', 'small', 36),
  obliques: m('obliques', 'abs', 'front', 'small', 36),
  traps: m('traps', 'back', 'back', 'medium', 48),
  lats: m('lats', 'back', 'back', 'large', 72),
  upper_back: m('upper_back', 'back', 'back', 'large', 60),
  lower_back: m('lower_back', 'back', 'back', 'large', 72),
  glutes: m('glutes', 'glutes', 'back', 'large', 72),
  quads: m('quads', 'legs', 'front', 'large', 72),
  hamstrings: m('hamstrings', 'legs', 'back', 'large', 72),
  adductors: m('adductors', 'legs', 'front', 'medium', 48),
  calves: m('calves', 'legs', 'back', 'small', 48),
};

export const MUSCLE_CODES = Object.keys(MUSCLES) as MuscleCode[];

/** 37 muscle heads grouped by muscle (muscle-recovery.md §1b), in display order. */
export const MUSCLE_HEADS_BY_MUSCLE: Readonly<Record<MuscleCode, readonly MuscleHeadCode[]>> = {
  chest: ['chest_upper', 'chest_middle', 'chest_lower'],
  front_delts: ['front_delts'],
  side_delts: ['side_delts'],
  rear_delts: ['rear_delts'],
  biceps: ['biceps_long', 'biceps_short', 'brachialis'],
  triceps: ['triceps_long', 'triceps_lateral', 'triceps_medial'],
  forearms: ['forearm_flexors', 'forearm_extensors', 'brachioradialis'],
  abs: ['abs_upper', 'abs_lower'],
  obliques: ['obliques_external', 'serratus'],
  traps: ['traps_upper', 'traps_middle', 'traps_lower'],
  lats: ['lats'],
  upper_back: ['rhomboids', 'teres_infraspinatus'],
  lower_back: ['erector_spinae'],
  glutes: ['glute_max', 'glute_med'],
  quads: ['rectus_femoris', 'vastus_lateralis', 'vastus_medialis'],
  hamstrings: ['biceps_femoris', 'semitendinosus'],
  adductors: ['adductors'],
  calves: ['gastrocnemius', 'soleus', 'tibialis_anterior'],
};

export const MUSCLE_HEAD_CODES: readonly MuscleHeadCode[] = MUSCLE_CODES.flatMap(
  (code) => MUSCLE_HEADS_BY_MUSCLE[code],
);

const headToMuscle = new Map<MuscleHeadCode, MuscleCode>();
for (const code of MUSCLE_CODES) {
  for (const head of MUSCLE_HEADS_BY_MUSCLE[code]) headToMuscle.set(head, code);
}

/** Muscle (region) that contains a head. */
export function muscleOfHead(head: MuscleHeadCode): MuscleCode {
  const muscle = headToMuscle.get(head);
  if (!muscle) throw new Error(`unknown_head:${head}`);
  return muscle;
}
