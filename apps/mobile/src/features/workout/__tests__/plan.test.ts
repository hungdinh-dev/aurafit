import { workout } from '@aurafit/core';

import type { ActiveProgram, PlanSession } from '../api';
import { filterExercises, normalizeSearch } from '../library';
import { pickTodaySession, programWeek, sampleSession, trainingLoad, weekStrip } from '../plan';

const session = (id: string, weekNo: number, dayOfWeek: number | null, rotationIndex: number): PlanSession => ({
  id,
  weekNo,
  dayOfWeek,
  name: `S${rotationIndex}`,
  isDeload: false,
  rotationIndex,
  exercises: [],
});

const weekdayProgram: ActiveProgram = {
  id: 'p',
  split: 'full_body',
  daysPerWeek: 3,
  totalWeeks: 8,
  startedOn: '2026-11-09', // Monday
  scheduleMode: 'weekday',
  nextRotationIndex: 0,
  sessions: [session('a', 1, 1, 0), session('b', 1, 3, 1), session('c', 1, 5, 0), session('d', 2, 1, 1)],
};

describe('programWeek', () => {
  it('counts weeks from the start and clamps to the program length', () => {
    expect(programWeek('2026-11-09', '2026-11-13', 8)).toBe(1);
    expect(programWeek('2026-11-09', '2026-11-16', 8)).toBe(2);
    expect(programWeek('2026-11-09', '2027-06-01', 8)).toBe(8);
  });
});

describe('pickTodaySession', () => {
  it('picks the session of today in weekday mode', () => {
    const pick = pickTodaySession(weekdayProgram, '2026-11-13', []); // Friday
    expect(pick.session?.id).toBe('c');
    expect(pick.isScheduledDay).toBe(true);
  });

  it('returns a rest day and a next session when nothing is scheduled', () => {
    const pick = pickTodaySession(weekdayProgram, '2026-11-12', []); // Thursday
    expect(pick.session).toBeNull();
    expect(pick.next?.id).toBe('c');
  });

  it('follows the rotation pointer in rotation mode', () => {
    const rotation: ActiveProgram = { ...weekdayProgram, scheduleMode: 'rotation', nextRotationIndex: 1 };
    const pick = pickTodaySession(rotation, '2026-11-13', []);
    expect(pick.session?.rotationIndex).toBe(1);
  });
});

describe('weekStrip', () => {
  it('marks done days and today', () => {
    const strip = weekStrip(weekdayProgram, '2026-11-13', [
      { id: 'w', localDate: '2026-11-09', status: 'completed', plannedSessionId: 'a' },
    ]);
    expect(strip).toHaveLength(7);
    expect(strip[0]).toMatchObject({ status: 'done', name: 'S0' });
    expect(strip[4]!.status).toBe('today');
    expect(strip[2]!.status).toBe('planned');
    expect(strip[1]!.status).toBe('rest');
  });
});

describe('sampleSession', () => {
  it('uses bodyweight-only exercises without equipment', () => {
    const s = sampleSession(['bodyweight']);
    expect(s.templateSlug).toBe('calisthenics_levels');
    expect(s.exercises.length).toBeGreaterThan(0);
    for (const e of s.exercises) expect(workout.requireExercise(e.exerciseSlug).equipment).toBe('bodyweight');
  });
});

describe('trainingLoad', () => {
  it('counts hard sets of the last 3 days and a 3-day baseline', () => {
    const now = Date.parse('2026-11-13T12:00:00Z');
    const at = (h: number) => new Date(now - h * 3_600_000).toISOString();
    const sets: workout.SetLog[] = [
      { exerciseSlug: 'push_up', loadKg: null, reps: 10, completedAt: at(10) },
      { exerciseSlug: 'push_up', loadKg: null, reps: 10, completedAt: at(20), isWarmup: true },
      { exerciseSlug: 'push_up', loadKg: null, reps: 10, completedAt: at(100) },
    ];
    const load = trainingLoad(sets, now);
    expect(load.last3).toBe(1);
    expect(load.baseline).toBeCloseTo(3 / 11);
  });
});

describe('library filter', () => {
  it('normalises Vietnamese accents', () => {
    expect(normalizeSearch('Đẩy Ngực')).toBe('day nguc');
  });

  it('filters by group, equipment and search', () => {
    const name = (slug: string) => (slug === 'barbell_bench_press' ? 'Đẩy ngực ngang tạ đòn' : slug);
    expect(filterExercises({ mode: 'group', group: 'chest', equipment: 'barbell', query: '' }, name)).toHaveLength(10);
    expect(
      filterExercises({ mode: 'equipment', group: 'chest', equipment: 'kettlebell', query: '' }, name).map((e) => e.slug)
    ).toEqual(['kettlebell_swing', 'goblet_squat']);
    expect(filterExercises({ mode: 'group', group: 'legs', equipment: 'barbell', query: 'day nguc ngang' }, name)[0]?.slug).toBe(
      'barbell_bench_press'
    );
  });
});
