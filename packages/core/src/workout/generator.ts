/**
 * WRK-03 – program generator: long-term block (8–12 weeks, deload every 4–6 weeks) built from a
 * WRK-20 template, adapted to level, equipment, session length and priority groups; plus the
 * short-term step `applyProgression` that turns last week's performance into next week's loads.
 * Split by days / week (workout.md): 2–3 → full body, 4 → upper / lower, 5–6 → push / pull / legs.
 */
import { requireExercise } from './catalog/exercises';
import { adaptToEquipment, type PlannedExercise } from './backup';
import type { LoadSpec } from './plates';
import { nextSessionTarget, type PerformedSet, type ProgressionDecision, type ProgressionRule } from './progression';
import { defaultWeekdays } from './schedule';
import { getTemplate, type ProgramTemplate, type TemplateSlug } from './templates';
import type {
  EquipmentCode,
  EquipmentProfileKind,
  ExperienceLevel,
  GoalType,
  MuscleGroupCode,
  ProgramSplit,
  ScheduleMode,
} from './types';

export const GENERATOR_VERSION = 'core-1';
export const WARMUP_MIN = 5;
/** Average working time of one set (s). */
export const SET_WORK_SEC = 40;

export interface GeneratorInput {
  goal: GoalType;
  level: ExperienceLevel;
  daysPerWeek: number;
  /** Default 60. */
  sessionMinutes?: number;
  availableEquipment: readonly EquipmentCode[];
  templateSlug?: TemplateSlug;
  priorityGroups?: readonly MuscleGroupCode[];
  /** 8–12, default 8. */
  totalWeeks?: number;
  scheduleMode?: ScheduleMode;
}

export interface GeneratedSession {
  weekNo: number;
  /** Order within the week (1-based). */
  sessionNo: number;
  rotationIndex: number;
  code: string;
  /** Only in `weekday` mode. */
  dayOfWeek: number | null;
  isDeload: boolean;
  exercises: PlannedExercise[];
}

export interface GeneratedWeek {
  weekNo: number;
  isDeload: boolean;
  sessions: GeneratedSession[];
}

export interface GeneratedProgram {
  templateSlug: TemplateSlug;
  goalType: GoalType;
  split: ProgramSplit;
  daysPerWeek: number;
  sessionMinutes: number;
  scheduleMode: ScheduleMode;
  totalWeeks: number;
  progressionRule: ProgressionRule;
  generatorVersion: string;
  weeks: GeneratedWeek[];
  /** Exercises replaced / dropped for missing equipment. */
  replaced: { from: string; to: string }[];
  dropped: string[];
}

const LOADED: readonly EquipmentCode[] = ['barbell', 'machine', 'cable', 'smith_machine'];
const FREE_WEIGHTS: readonly EquipmentCode[] = ['dumbbell', 'kettlebell', 'band'];

export function equipmentKindOf(available: readonly EquipmentCode[]): EquipmentProfileKind {
  if (available.some((e) => LOADED.includes(e))) return 'gym';
  if (available.some((e) => FREE_WEIGHTS.includes(e))) return 'home';
  return 'bodyweight';
}

/** Template choice when the user did not pick one. */
export function chooseTemplate(input: Pick<GeneratorInput, 'daysPerWeek' | 'availableEquipment' | 'priorityGroups'>): TemplateSlug {
  const kind = equipmentKindOf(input.availableEquipment);
  if (kind === 'bodyweight') return 'calisthenics_levels';
  if (kind === 'home') return 'home_dumbbell_band';
  if (input.daysPerWeek <= 3) return 'full_body_ab';
  if (input.daysPerWeek === 4) {
    const lower = input.priorityGroups?.some((g) => g === 'glutes' || g === 'legs') ?? false;
    return lower ? 'women_lower_focus' : 'upper_lower';
  }
  return 'push_pull_legs';
}

/** Estimated minutes for a list of planned exercises. */
export function estimateSessionMinutes(exercises: readonly PlannedExercise[]): number {
  const sec = exercises
    .filter((e) => !e.isExtra)
    .reduce((s, e) => s + e.sets * SET_WORK_SEC + Math.max(0, e.sets - 1) * e.restSec, 0);
  return Math.round(WARMUP_MIN + sec / 60);
}

/** Mark trailing exercises (isolation first) as `isExtra` until the session fits. */
export function fitToDuration(exercises: readonly PlannedExercise[], minutes: number): PlannedExercise[] {
  const out = exercises.map((e) => ({ ...e }));
  const order = [...out]
    .map((e, i) => ({ i, iso: requireExercise(e.exerciseSlug).mechanic === 'isolation' }))
    .sort((a, b) => Number(b.iso) - Number(a.iso) || b.i - a.i);
  for (const { i } of order) {
    if (estimateSessionMinutes(out) <= minutes) break;
    if (out.filter((e) => !e.isExtra).length <= 2) break;
    (out[i] as PlannedExercise).isExtra = true;
  }
  return out;
}

function adjustSets(sets: number, slug: string, template: ProgramTemplate, input: GeneratorInput): number {
  const ex = requireExercise(slug);
  let s = sets;
  if (input.level === 'beginner' && template.level !== 'beginner') s -= 1;
  if (input.level === 'advanced' && ex.mechanic === 'compound') s += 1;
  if (input.priorityGroups?.includes(ex.groupCode)) s += 1;
  return Math.min(5, Math.max(template.progressionRule === 'linear' ? sets : 2, s));
}

/** Deload: about half the sets, RIR + 2 (Bell et al. 2023 [10]). */
export function deloadExercise(e: PlannedExercise): PlannedExercise {
  return {
    ...e,
    sets: Math.max(1, Math.ceil(e.sets / 2)),
    targetRir: e.targetRir === null ? null : Math.min(4, e.targetRir + 2),
  };
}

export function generateProgram(input: GeneratorInput): GeneratedProgram {
  const templateSlug = input.templateSlug ?? chooseTemplate(input);
  const template = getTemplate(templateSlug);
  const daysPerWeek = Math.min(6, Math.max(2, Math.round(input.daysPerWeek)));
  const sessionMinutes = input.sessionMinutes ?? 60;
  const totalWeeks = Math.min(12, Math.max(8, Math.round(input.totalWeeks ?? 8)));
  const scheduleMode = input.scheduleMode ?? 'weekday';
  const replaced: { from: string; to: string }[] = [];
  const dropped: string[] = [];

  // Base sessions adapted once (level, priorities, equipment, duration).
  const baseSessions = template.sessions.map((s) => {
    const planned: PlannedExercise[] = s.exercises.map((e, i) => ({
      exerciseSlug: e.exerciseSlug,
      sortOrder: i + 1,
      sets: adjustSets(e.sets, e.exerciseSlug, template, input),
      repMin: e.repMin,
      repMax: e.repMax,
      targetRir: e.targetRir,
      restSec: e.restSec,
      targetLoadKg: null,
      backupExerciseSlug: e.backupExerciseSlug,
      isExtra: false,
    }));
    const adapted = adaptToEquipment(planned, input.availableEquipment);
    replaced.push(...adapted.replaced);
    dropped.push(...adapted.dropped);
    return { ...s, exercises: fitToDuration(adapted.exercises, sessionMinutes) };
  });

  const weekdays = defaultWeekdays(daysPerWeek);
  const weeks: GeneratedWeek[] = [];
  let k = 0;
  for (let weekNo = 1; weekNo <= totalWeeks; weekNo++) {
    const isDeload = weekNo % template.deloadEveryWeeks === 0;
    const sessions: GeneratedSession[] = [];
    for (let i = 0; i < daysPerWeek; i++, k++) {
      const base = baseSessions[k % baseSessions.length] as (typeof baseSessions)[number];
      sessions.push({
        weekNo,
        sessionNo: i + 1,
        rotationIndex: base.rotationIndex,
        code: base.code,
        dayOfWeek: scheduleMode === 'weekday' ? (weekdays[i] ?? null) : null,
        isDeload,
        exercises: isDeload ? base.exercises.map(deloadExercise) : base.exercises.map((e) => ({ ...e })),
      });
    }
    weeks.push({ weekNo, isDeload, sessions });
  }

  return {
    templateSlug,
    goalType: input.goal,
    split: template.split,
    daysPerWeek,
    sessionMinutes,
    scheduleMode,
    totalWeeks,
    progressionRule: template.progressionRule,
    generatorVersion: GENERATOR_VERSION,
    weeks,
    replaced,
    dropped,
  };
}

export interface ApplyProgressionOptions {
  rule: ProgressionRule;
  loadSpecFor: (slug: string) => LoadSpec;
  previousFailures?: Readonly<Record<string, number>>;
}

/**
 * Short-term step: given the planned exercises of a session and what was performed last time
 * (per exercise slug), produce next session's targets.
 */
export function applyProgression(
  planned: readonly PlannedExercise[],
  performance: Readonly<Record<string, readonly PerformedSet[]>>,
  opts: ApplyProgressionOptions,
): { exercises: PlannedExercise[]; decisions: Record<string, ProgressionDecision> } {
  const decisions: Record<string, ProgressionDecision> = {};
  const exercises = planned.map((p) => {
    const sets = performance[p.exerciseSlug];
    if (!sets || sets.length === 0) return { ...p };
    const decision = nextSessionTarget({
      rule: opts.rule,
      exerciseSlug: p.exerciseSlug,
      prescription: { sets: p.sets, repMin: p.repMin, repMax: p.repMax, targetRir: p.targetRir, targetLoadKg: p.targetLoadKg },
      sets,
      loadSpec: opts.loadSpecFor(p.exerciseSlug),
      previousFailures: opts.previousFailures?.[p.exerciseSlug],
    });
    decisions[p.exerciseSlug] = decision;
    if (decision.action === 'level_up' && decision.nextExerciseSlug) {
      return { ...p, exerciseSlug: decision.nextExerciseSlug, targetLoadKg: null, backupExerciseSlug: p.exerciseSlug };
    }
    return { ...p, targetLoadKg: decision.nextLoadKg };
  });
  return { exercises, decisions };
}
