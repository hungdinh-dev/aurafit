import {
  advanceRotation,
  completedInWeek,
  defaultWeekdays,
  isRotationSessionDue,
  nextRotationIndex,
  planToday,
  rotationSequence,
} from './schedule';

// 2026-11-09 is a Monday.
describe('rotation (WRK-15)', () => {
  it('wraps A → B → C → A', () => {
    expect(nextRotationIndex(0, 3)).toBe(1);
    expect(nextRotationIndex(2, 3)).toBe(0);
    expect(advanceRotation(1, 2)).toBe(0);
    expect(rotationSequence(2, 4, 3)).toEqual([2, 0, 1, 2]);
    expect(() => nextRotationIndex(0, 0)).toThrow('no_sessions');
  });

  it('a missed day does not skip a session', () => {
    // A done Monday, Wednesday missed, opened Thursday → still B.
    const thu = planToday({ mode: 'rotation', today: '2026-11-12', nextRotationIndex: 1, daysPerWeek: 3, lastCompletedDate: '2026-11-09', completedThisWeek: 1 });
    expect(thu).toEqual({ sessionIndex: 1, isScheduledDay: true });
  });

  it('spaces sessions and stops when the weekly target is met', () => {
    const base = { daysPerWeek: 3, lastCompletedDate: '2026-11-09', completedThisWeek: 1 };
    expect(isRotationSessionDue({ ...base, today: '2026-11-10' })).toBe(false);
    expect(isRotationSessionDue({ ...base, today: '2026-11-11' })).toBe(true);
    expect(isRotationSessionDue({ ...base, today: '2026-11-09' })).toBe(false);
    expect(isRotationSessionDue({ ...base, completedThisWeek: 3, today: '2026-11-13' })).toBe(false);
    // Saturday with 2 sessions left and only 2 days left → due even right after a session.
    expect(isRotationSessionDue({ daysPerWeek: 3, lastCompletedDate: '2026-11-13', completedThisWeek: 1, today: '2026-11-14' })).toBe(true);
    expect(isRotationSessionDue({ daysPerWeek: 3, lastCompletedDate: null, completedThisWeek: 0, today: '2026-11-10' })).toBe(true);
  });

  it('counts sessions in the Monday-based week', () => {
    expect(completedInWeek(['2026-11-08', '2026-11-09', '2026-11-12', '2026-11-16'], '2026-11-13')).toBe(2);
  });
});

describe('weekday mode', () => {
  it('maps today to its session', () => {
    const sessions = defaultWeekdays(3).map((dayOfWeek, index) => ({ index, dayOfWeek }));
    expect(sessions).toEqual([
      { index: 0, dayOfWeek: 1 },
      { index: 1, dayOfWeek: 3 },
      { index: 2, dayOfWeek: 5 },
    ]);
    expect(planToday({ mode: 'weekday', today: '2026-11-13', sessions })).toEqual({ sessionIndex: 2, isScheduledDay: true });
    expect(planToday({ mode: 'weekday', today: '2026-11-14', sessions })).toEqual({ sessionIndex: null, isScheduledDay: false });
  });

  it('spreads default training days', () => {
    expect(defaultWeekdays(2)).toEqual([1, 4]);
    expect(defaultWeekdays(4)).toEqual([1, 2, 4, 5]);
    expect(defaultWeekdays(6)).toHaveLength(6);
    expect(defaultWeekdays(9)).toHaveLength(7);
  });
});
