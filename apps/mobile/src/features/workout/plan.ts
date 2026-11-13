/**
 * Train-tab planning helpers (WRK-02 / WRK-06 / WRK-15): pick today's session from the active
 * program, build the week strip, fall back to a template session and compute readiness inputs.
 * Pure functions over core logic – unit tested in `__tests__/plan.test.ts`.
 */
import { time, workout } from '@aurafit/core';

import type { ActiveProgram, PlanSession, SessionRow } from './api';

/** 1-based program week for `today` (clamped to the program length). */
export function programWeek(startedOn: string, today: string, totalWeeks: number): number {
  const week = Math.floor(Math.max(0, time.diffDays(startedOn, today)) / 7) + 1;
  return Math.min(Math.max(1, totalWeeks), week);
}

export interface TodayPick {
  session: PlanSession | null;
  isScheduledDay: boolean;
  weekNo: number;
  /** Next session to train when today is a rest day ("train anyway"). */
  next: PlanSession | null;
}

export function pickTodaySession(program: ActiveProgram, today: string, done: readonly SessionRow[]): TodayPick {
  const weekNo = programWeek(program.startedOn, today, program.totalWeeks);
  const week = program.sessions.filter((s) => s.weekNo === weekNo);
  const completed = done.filter((d) => d.status === 'completed');
  if (program.scheduleMode === 'rotation') {
    const doneDates = completed.map((d) => d.localDate).sort();
    const plan = workout.planToday({
      mode: 'rotation',
      today,
      nextRotationIndex: program.nextRotationIndex,
      daysPerWeek: program.daysPerWeek,
      lastCompletedDate: doneDates[doneDates.length - 1] ?? null,
      completedThisWeek: workout.completedInWeek(doneDates, today),
    });
    const byRotation = (idx: number) =>
      week.find((s) => s.rotationIndex === idx) ?? program.sessions.find((s) => s.rotationIndex === idx) ?? null;
    const next = byRotation(program.nextRotationIndex);
    return {
      session: plan.sessionIndex === null ? null : byRotation(plan.sessionIndex),
      isScheduledDay: plan.isScheduledDay,
      weekNo,
      next,
    };
  }
  const indexed = week.filter((s) => s.dayOfWeek !== null);
  const plan = workout.planToday({
    mode: 'weekday',
    today,
    sessions: indexed.map((s, index) => ({ index, dayOfWeek: s.dayOfWeek as number })),
  });
  const doneIds = new Set(completed.map((d) => d.plannedSessionId));
  const dow = time.isoWeekday(today);
  const next =
    indexed.find((s) => (s.dayOfWeek as number) > dow && !doneIds.has(s.id)) ??
    indexed.find((s) => !doneIds.has(s.id)) ??
    indexed[0] ??
    null;
  return {
    session: plan.sessionIndex === null ? null : (indexed[plan.sessionIndex] ?? null),
    isScheduledDay: plan.isScheduledDay,
    weekNo,
    next,
  };
}

export type DayStatus = 'done' | 'today' | 'planned' | 'rest';

export interface WeekDay {
  date: string;
  dayOfWeek: number;
  name: string | null;
  status: DayStatus;
}

/** Monday → Sunday strip of the current week. */
export function weekStrip(program: ActiveProgram | null, today: string, done: readonly SessionRow[]): WeekDay[] {
  const completedDates = new Set(done.filter((d) => d.status === 'completed').map((d) => d.localDate));
  const weekNo = program ? programWeek(program.startedOn, today, program.totalWeeks) : 1;
  const sessions = program?.scheduleMode === 'weekday' ? program.sessions.filter((s) => s.weekNo === weekNo) : [];
  return time.weekDates(today).map((date) => {
    const dow = time.isoWeekday(date);
    const planned = sessions.find((s) => s.dayOfWeek === dow) ?? null;
    const doneSession = done.find((d) => d.localDate === date && d.status === 'completed');
    const doneName = doneSession ? (program?.sessions.find((s) => s.id === doneSession.plannedSessionId)?.name ?? null) : null;
    const status: DayStatus = completedDates.has(date)
      ? 'done'
      : date === today
        ? 'today'
        : planned
          ? 'planned'
          : 'rest';
    return { date, dayOfWeek: dow, name: doneName ?? planned?.name ?? null, status };
  });
}

/** Template session for quick start / preview: the template matching the equipment, session A. */
export function sampleSession(equipment: readonly workout.EquipmentCode[], rotationIndex = 0) {
  const slug = workout.chooseTemplate({ daysPerWeek: 3, availableEquipment: equipment });
  const template = workout.getTemplate(slug);
  const session = template.sessions[rotationIndex % template.sessions.length] ?? template.sessions[0]!;
  const planned: workout.PlannedExercise[] = session.exercises.map((e, i) => ({
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
  const adapted = workout.adaptToEquipment(planned, equipment);
  return { templateSlug: slug, rotationIndex: session.rotationIndex, exercises: adapted.exercises, replaced: adapted.replaced };
}

/** Planned exercises adapted to the equipment picked today (WRK-02). */
export function adaptSession(exercises: readonly workout.PlannedExercise[], equipment: readonly workout.EquipmentCode[]) {
  return workout.adaptToEquipment(exercises, equipment);
}

const HOUR = 3_600_000;

/** Hard (non-warm-up) sets in the last 3 days and the usual 3-day amount over the 11 days before. */
export function trainingLoad(sets: readonly workout.SetLog[], nowMs: number): { last3: number; baseline: number | null } {
  let last3 = 0;
  let before = 0;
  for (const s of sets) {
    if (s.isWarmup) continue;
    const age = nowMs - Date.parse(s.completedAt);
    if (age < 0) continue;
    if (age <= 72 * HOUR) last3 += 1;
    else if (age <= 14 * 24 * HOUR) before += 1;
  }
  return { last3, baseline: before > 0 ? (before / 11) * 3 : null };
}

/** Average recovery % of the primary muscles of a session (readiness factor). */
export function plannedRecoveryPct(
  exercises: readonly workout.PlannedExercise[],
  muscles: Record<workout.MuscleCode, workout.MuscleRecovery>
): number | null {
  const codes = [...new Set(exercises.flatMap((e) => workout.getExercise(e.exerciseSlug)?.primaryMuscle ?? []))];
  if (codes.length === 0) return null;
  return codes.reduce((sum, m) => sum + muscles[m].recoveryPct, 0) / codes.length;
}
