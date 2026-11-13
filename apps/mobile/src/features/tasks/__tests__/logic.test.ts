import { focusRemainingMs, formatCountdown, isTaskComplete, taskProgress, tasksForWeekday } from '../logic';

const task = (id: string, kind: string, target: number | null, days = [1, 2, 3, 4, 5, 6, 7]) => ({
  id,
  kind,
  target_value: target,
  days_of_week: days,
});

describe('tasks logic', () => {
  it('filters tasks by weekday', () => {
    const tasks = [task('a', 'check', null, [1, 3, 5]), task('b', 'check', null)];
    expect(tasksForWeekday(tasks, 2).map((t) => t.id)).toEqual(['b']);
    expect(tasksForWeekday(tasks, 5).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('decides completion per kind', () => {
    expect(isTaskComplete('check', 1, null)).toBe(true);
    expect(isTaskComplete('count', 12, 20)).toBe(false);
    expect(isTaskComplete('count', 20, 20)).toBe(true);
    expect(isTaskComplete('timer', 1, null)).toBe(true);
  });

  it('computes progress and tasks pillar points', () => {
    const tasks = [task('a', 'check', null), task('b', 'count', 20), task('c', 'timer', 2), task('d', 'auto', 8000)];
    const logs = [
      { task_id: 'a', value: 1, is_completed: true },
      { task_id: 'b', value: 12, is_completed: false },
    ];
    expect(taskProgress(tasks, logs)).toEqual({ done: 1, total: 4, pts: 3 });
    expect(taskProgress([], [])).toEqual({ done: 0, total: 0, pts: 0 });
  });
});

describe('focus timer', () => {
  const start = 1_000_000;
  it('counts down from the planned time and accounts for pauses', () => {
    expect(focusRemainingMs({ plannedMin: 50, startedAt: null, pausedMs: 0, pausedAt: null, now: start })).toBe(3_000_000);
    expect(focusRemainingMs({ plannedMin: 50, startedAt: start, pausedMs: 0, pausedAt: null, now: start + 60_000 })).toBe(2_940_000);
    expect(
      focusRemainingMs({ plannedMin: 50, startedAt: start, pausedMs: 30_000, pausedAt: start + 120_000, now: start + 600_000 }),
    ).toBe(3_000_000 - 90_000);
    expect(focusRemainingMs({ plannedMin: 1, startedAt: start, pausedMs: 0, pausedAt: null, now: start + 120_000 })).toBe(0);
  });

  it('formats mm:ss', () => {
    expect(formatCountdown(1_935_000)).toBe('32:15');
    expect(formatCountdown(0)).toBe('00:00');
  });
});
