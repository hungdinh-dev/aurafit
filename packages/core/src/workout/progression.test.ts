import { DEFAULT_PLATES_KG } from './plates';
import { isStalled, nextSessionTarget, rirOf, type PerformedSet } from './progression';

const plates = { kind: 'plates' as const, barKg: 20, platesKg: DEFAULT_PLATES_KG };
const rx = { sets: 3, repMin: 8, repMax: 12, targetRir: 2, targetLoadKg: 60 };
const sets = (load: number, ...reps: number[]): PerformedSet[] => reps.map((r) => ({ loadKg: load, reps: r }));

describe('double progression', () => {
  it('adds the smallest real step when every set hits the top of the range', () => {
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: sets(60, 12, 12, 12), loadSpec: plates });
    expect(d).toMatchObject({ action: 'increase_load', nextLoadKg: 62.5, repTarget: 8, reason: 'all_sets_at_top' });
  });

  it('uses machine steps', () => {
    const d = nextSessionTarget({
      rule: 'double',
      exerciseSlug: 'lat_pulldown',
      prescription: rx,
      sets: sets(50, 12, 12, 12),
      loadSpec: { kind: 'stack', stepKg: 5 },
    });
    expect(d.nextLoadKg).toBe(55);
  });

  it('jumps two steps when all sets were very easy (RIR ≥ target + 2)', () => {
    const easy = sets(60, 12, 12, 12).map((s) => ({ ...s, rir: 4 }));
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: easy, loadSpec: plates });
    expect(d).toMatchObject({ nextLoadKg: 65, reason: 'all_sets_at_top_easy' });
  });

  it('adds reps while inside the range', () => {
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: sets(60, 12, 10, 9), loadSpec: plates });
    expect(d).toMatchObject({ action: 'add_reps', nextLoadKg: 60, repTarget: 10 });
  });

  it('does not progress when fewer sets than prescribed were done', () => {
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: sets(60, 12, 12), loadSpec: plates });
    expect(d.action).toBe('add_reps');
  });

  it('reduces ~10 % when most sets fall below the range', () => {
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: sets(60, 6, 6, 8), loadSpec: plates });
    expect(d).toMatchObject({ action: 'decrease_load', nextLoadKg: 55, reason: 'below_range' });
  });

  it('ignores warm-ups and returns hold without data', () => {
    const d = nextSessionTarget({ rule: 'double', exerciseSlug: 'barbell_bench_press', prescription: rx, sets: [{ loadKg: 40, reps: 12, isWarmup: true }], loadSpec: plates });
    expect(d).toMatchObject({ action: 'hold', reason: 'no_data', nextLoadKg: 60 });
  });

  it('levels up bodyweight moves at the top of the range', () => {
    const d = nextSessionTarget({
      rule: 'double',
      exerciseSlug: 'inverted_row',
      prescription: { ...rx, targetLoadKg: null },
      sets: sets(0, 12, 12, 12).map((s) => ({ ...s, loadKg: null })),
      loadSpec: { kind: 'bodyweight' },
    });
    expect(d).toMatchObject({ action: 'level_up', nextExerciseSlug: 'chin_up' });
  });
});

describe('linear progression (5×5)', () => {
  const rx5 = { sets: 5, repMin: 5, repMax: 5, targetRir: 2, targetLoadKg: 60 };
  it('adds 2.5 kg upper body and 5 kg lower body after a full success', () => {
    expect(nextSessionTarget({ rule: 'linear', exerciseSlug: 'barbell_bench_press', prescription: rx5, sets: sets(60, 5, 5, 5, 5, 5), loadSpec: plates }).nextLoadKg).toBe(62.5);
    expect(nextSessionTarget({ rule: 'linear', exerciseSlug: 'barbell_back_squat', prescription: rx5, sets: sets(60, 5, 5, 5, 5, 5), loadSpec: plates }).nextLoadKg).toBe(65);
  });

  it('holds after a failure and resets −10 % after the third', () => {
    const fail = sets(60, 5, 5, 4, 4, 3);
    expect(nextSessionTarget({ rule: 'linear', exerciseSlug: 'barbell_bench_press', prescription: rx5, sets: fail, loadSpec: plates })).toMatchObject({ action: 'hold', nextLoadKg: 60 });
    expect(
      nextSessionTarget({ rule: 'linear', exerciseSlug: 'barbell_bench_press', prescription: rx5, sets: fail, loadSpec: plates, previousFailures: 2 }),
    ).toMatchObject({ action: 'deload', nextLoadKg: 55, reason: 'stalled' });
  });
});

describe('calisthenics levels', () => {
  const rxc = { sets: 3, repMin: 6, repMax: 12, targetRir: 2, targetLoadKg: null };
  it('levels up at 3 × 12', () => {
    const d = nextSessionTarget({ rule: 'calisthenics_level', exerciseSlug: 'push_up', prescription: rxc, sets: sets(0, 12, 12, 12), loadSpec: { kind: 'bodyweight' } });
    expect(d).toMatchObject({ action: 'level_up', nextExerciseSlug: 'diamond_push_up' });
  });

  it('keeps adding reps below the criterion', () => {
    const d = nextSessionTarget({ rule: 'calisthenics_level', exerciseSlug: 'push_up', prescription: rxc, sets: sets(0, 12, 11, 9), loadSpec: { kind: 'bodyweight' } });
    expect(d).toMatchObject({ action: 'add_reps', repTarget: 10 });
  });

  it('adds a belt load at the top of a chain', () => {
    const d = nextSessionTarget({ rule: 'calisthenics_level', exerciseSlug: 'pull_up', prescription: rxc, sets: sets(0, 12, 12, 12), loadSpec: { kind: 'bodyweight' } });
    expect(d).toMatchObject({ action: 'increase_load', nextLoadKg: 2.5, reason: 'top_of_chain' });
  });
});

describe('helpers', () => {
  it('converts RPE to RIR', () => {
    expect(rirOf({ rpe: 8 })).toBe(2);
    expect(rirOf({ rir: 1, rpe: 8 })).toBe(1);
    expect(rirOf({})).toBeNull();
  });

  it('detects stalls', () => {
    expect(isStalled([100, 105, 104, 105, 103])).toBe(true);
    expect(isStalled([100, 105, 104, 106, 103])).toBe(false);
    expect(isStalled([100, 100])).toBe(false);
  });
});
