import { coach } from '@aurafit/core';

/** At most 7 active tasks (DB trigger `task_definitions_limit_active`). */
export const MAX_ACTIVE_TASKS = 7;

/** Default focus session length (`focus_sessions.planned_min` default). */
export const DEFAULT_FOCUS_MIN = 50;

export interface TaskLike {
  id: string;
  kind: string;
  target_value: number | null;
  days_of_week: number[];
}
export interface LogLike {
  task_id: string;
  value: number;
  is_completed: boolean;
}

/** Tasks scheduled on an ISO weekday (1 = Monday … 7 = Sunday). */
export function tasksForWeekday<T extends TaskLike>(tasks: readonly T[], isoWeekday: number): T[] {
  return tasks.filter((t) => t.days_of_week.length === 0 || t.days_of_week.includes(isoWeekday));
}

/** Whether a value reaches the task's target (check tasks: value ≥ 1). */
export function isTaskComplete(kind: string, value: number, target: number | null): boolean {
  if (kind === 'check') return value >= 1;
  return value >= (target != null && target > 0 ? target : 1);
}

/**
 * Today's progress for the tasks screen header: done / scheduled and the tasks pillar points
 * so far (display only – the server scores the day).
 */
export function taskProgress(tasks: readonly TaskLike[], logs: readonly LogLike[]): { done: number; total: number; pts: number } {
  const byTask = new Map(logs.map((l) => [l.task_id, l]));
  const done = tasks.filter((t) => byTask.get(t.id)?.is_completed).length;
  const total = tasks.length;
  const pts = total === 0 ? 0 : Math.round((done / total) * coach.PILLAR_MAX.tasks);
  return { done, total, pts };
}

/** Remaining milliseconds of a focus timer that may have been paused. */
export function focusRemainingMs(input: {
  plannedMin: number;
  startedAt: number | null;
  /** Total ms spent paused so far (excluding an ongoing pause). */
  pausedMs: number;
  /** Start of the ongoing pause, if paused. */
  pausedAt: number | null;
  now: number;
}): number {
  const total = input.plannedMin * 60_000;
  if (input.startedAt == null) return total;
  const end = input.pausedAt ?? input.now;
  const elapsed = end - input.startedAt - input.pausedMs;
  return Math.max(0, total - Math.max(0, elapsed));
}

/** "32:15" */
export function formatCountdown(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
