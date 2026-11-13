import { EXERCISES, getExercise, nextProgressionExercise } from './catalog/exercises';
import { MUSCLE_CODES, MUSCLE_HEAD_CODES, muscleOfHead } from './catalog/muscles';
import { defaultRest } from './restDefaults';
import { analyzeSides, analyzeUnilateralSets, effectiveLoad } from './specialLoad';
import { headStimulus, muscleStimulus } from './stimulus';

describe('catalog', () => {
  it('has the 90 seed exercises, 18 muscles and 37 heads', () => {
    expect(EXERCISES).toHaveLength(90);
    expect(new Set(EXERCISES.map((e) => e.slug)).size).toBe(90);
    expect(MUSCLE_CODES).toHaveLength(18);
    expect(MUSCLE_HEAD_CODES).toHaveLength(37);
    expect(new Set(MUSCLE_HEAD_CODES).size).toBe(37);
    expect(muscleOfHead('triceps_long')).toBe('triceps');
    expect(() => muscleOfHead('nope' as never)).toThrow('unknown_head');
  });

  it('sets rest and rep defaults by mechanic', () => {
    expect(getExercise('barbell_back_squat')).toMatchObject({ defaultRestSec: 150, defaultRepMin: 6, defaultRepMax: 12, movementPattern: 'squat' });
    expect(getExercise('dumbbell_curl')).toMatchObject({ defaultRestSec: 75, defaultRepMin: 10, defaultRepMax: 20, movementPattern: null });
    expect(getExercise('plank')).toMatchObject({ measure: 'time', defaultRepMin: 20 });
  });

  it('walks calisthenics chains', () => {
    expect(nextProgressionExercise('inverted_row')).toBe('chin_up');
    expect(nextProgressionExercise('pull_up')).toBeNull();
    expect(nextProgressionExercise('barbell_curl')).toBeNull();
  });
});

describe('stimulus', () => {
  it('gives primary 1.0 and secondary 0.5', () => {
    expect([...muscleStimulus('barbell_bench_press')]).toEqual(
      expect.arrayContaining([['chest', 1], ['front_delts', 0.5], ['triceps', 0.5]]),
    );
  });

  it('uses explicit head coefficients and a uniform split otherwise', () => {
    const h = headStimulus('incline_barbell_bench_press');
    expect(h.get('chest_upper')).toBe(1);
    expect(h.get('chest_middle')).toBe(0.6);
    expect(h.get('chest_lower')).toBe(0.2);
    expect(h.get('triceps_long')).toBe(0.5);
    expect(headStimulus('dumbbell_curl').get('brachialis')).toBe(1);
  });
});

describe('defaultRest (WRK-16)', () => {
  it('uses 150 s compound / 75 s isolation and 180 s for heavy compounds', () => {
    expect(defaultRest('compound')).toEqual({ restSec: 150, minSec: 120, maxSec: 180 });
    expect(defaultRest('isolation').restSec).toBe(75);
    expect(defaultRest('compound', { repMax: 5 }).restSec).toBe(180);
    expect(defaultRest('isolation', { userOverrideSec: 50 }).restSec).toBe(50);
  });
});

describe('special loads (WRK-19)', () => {
  it('adds a belt load to bodyweight', () => {
    expect(effectiveLoad({ exerciseSlug: 'pull_up', bodyweightKg: 70, addedLoadKg: 10 })).toMatchObject({ totalLoadKg: 80 });
  });

  it('subtracts assistance bands and adds resistance bands', () => {
    const bands = [
      { color: 'red', kgEquiv: 11 },
      { color: 'black', kgEquiv: 23 },
    ];
    expect(effectiveLoad({ exerciseSlug: 'pull_up', bodyweightKg: 70, bands, bandMode: 'assist' }).totalLoadKg).toBe(36);
    expect(effectiveLoad({ exerciseSlug: 'push_up', bodyweightKg: 70, bands: [bands[0]!], bandMode: 'resist' }).totalLoadKg).toBe(55.8);
    expect(effectiveLoad({ bodyweightKg: 50, bands: [{ color: 'x', kgEquiv: 80 }] }).totalLoadKg).toBe(0);
  });

  it('detects left / right imbalance above 10 %', () => {
    expect(analyzeSides(10, 8)).toEqual({ creditedReps: 8, weakerSide: 'right', imbalancePct: 20, imbalanced: true });
    expect(analyzeSides(10, 10)).toMatchObject({ weakerSide: null, imbalanced: false });
    expect(analyzeSides(10, 9).imbalanced).toBe(false);
    const pairs = analyzeUnilateralSets([
      { setNo: 1, side: 'left', reps: 12 },
      { setNo: 1, side: 'right', reps: 10 },
      { setNo: 2, side: 'left', reps: 10 },
    ]);
    expect(pairs).toEqual([expect.objectContaining({ setNo: 1, creditedReps: 10, imbalanced: true })]);
  });
});
