import { workout } from '@aurafit/core';

import {
  addSet,
  completeSet,
  draftForExercise,
  draftFromPlanned,
  exerciseBest,
  initialLoad,
  removeLastSet,
  sessionProgress,
  swapExercise,
  uncompleteSet,
} from '../sessionLogic';

const bench: workout.PlannedExercise = {
  exerciseSlug: 'barbell_bench_press',
  sortOrder: 1,
  sets: 4,
  repMin: 8,
  repMax: 10,
  targetRir: 2,
  restSec: 150,
  targetLoadKg: 60,
  backupExerciseSlug: 'dumbbell_bench_press',
  isExtra: false,
};

describe('draftFromPlanned', () => {
  it('creates one draft set per planned set with the target load and top reps', () => {
    const [ex] = draftFromPlanned([bench]);
    expect(ex!.sets).toHaveLength(4);
    expect(ex!.sets[0]).toMatchObject({ loadKg: 60, reps: 10, done: false });
  });

  it('applies the readiness set delta and skips extras', () => {
    const drafts = draftFromPlanned([bench, { ...bench, exerciseSlug: 'crunch', isExtra: true }], { setDelta: -1 });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.sets).toHaveLength(3);
  });
});

describe('initialLoad', () => {
  it('starts barbell lifts with the empty bar and bodyweight moves without load', () => {
    expect(initialLoad('barbell_bench_press')).toBe(20);
    expect(initialLoad('push_up')).toBeNull();
  });

  it('rounds a previous load to the gym', () => {
    expect(initialLoad('barbell_bench_press', undefined, 61)).toBe(60);
  });
});

describe('completeSet (WRK-05 / WRK-14)', () => {
  it('raises the remaining sets when the set was clearly too easy', () => {
    const [ex] = draftFromPlanned([bench]);
    const { exercise, suggestion } = completeSet(ex!, 1, { reps: 12, rir: 4 });
    expect(suggestion.action).toBe('increase');
    expect(exercise.sets[1]!.done).toBe(true);
    expect(exercise.sets[2]!.loadKg).toBeGreaterThan(60);
    expect(exercise.sets[0]!.loadKg).toBe(60);
    expect(exercise.note).toMatchObject({ kind: 'increase', setNo: 2 });
  });

  it('keeps the load when on target', () => {
    const [ex] = draftFromPlanned([bench]);
    const { exercise, suggestion } = completeSet(ex!, 0, { reps: 9, rir: 2 });
    expect(suggestion.action).toBe('hold');
    expect(exercise.sets[1]!.loadKg).toBe(60);
    expect(exercise.note).toBeNull();
  });

  it('turns the last set suggestion into a next-session note', () => {
    let [ex] = draftFromPlanned([{ ...bench, sets: 1 }]);
    ex = completeSet(ex!, 0, { reps: 5, rir: 0 }).exercise;
    expect(ex.note?.kind).toBe('nextSessionDown');
  });
});

describe('set editing', () => {
  it('adds, removes and un-completes sets', () => {
    let [ex] = draftFromPlanned([bench]);
    ex = addSet(ex!);
    expect(ex.sets).toHaveLength(5);
    ex = removeLastSet(ex);
    expect(ex.sets).toHaveLength(4);
    ex = completeSet(ex, 0, { reps: 10 }).exercise;
    expect(sessionProgress([ex])).toEqual({ done: 1, total: 4 });
    ex = uncompleteSet(ex, 0);
    expect(sessionProgress([ex])).toEqual({ done: 0, total: 4 });
  });

  it('swaps to the backup keeping sets and reps (WRK-17)', () => {
    const [ex] = draftFromPlanned([bench]);
    const swapped = swapExercise(ex!, 'dumbbell_bench_press');
    expect(swapped.slug).toBe('dumbbell_bench_press');
    expect(swapped.mainSlug).toBe('barbell_bench_press');
    expect(swapped.sets).toHaveLength(4);
    expect(swapped.repMax).toBe(10);
  });
});

describe('exerciseBest (WRK-07)', () => {
  it('reports the best set, estimated 1RM and new records vs previous bests', () => {
    let [ex] = draftFromPlanned([bench]);
    ex = completeSet(ex!, 0, { reps: 10, loadKg: 60 }).exercise;
    const best = exerciseBest(ex, { max_load: 55, est_1rm: 70 });
    expect(best?.loadKg).toBe(60);
    expect(best?.oneRmKg).toBe(80);
    expect(best?.newRecords.map((r) => r.kind)).toEqual(expect.arrayContaining(['max_load', 'est_1rm']));
  });

  it('returns null with no done sets', () => {
    expect(exerciseBest(draftForExercise('dumbbell_curl'))).toBeNull();
  });
});
