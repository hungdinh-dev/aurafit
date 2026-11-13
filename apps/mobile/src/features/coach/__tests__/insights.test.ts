import { asAuraTier, asMood, asStrictness, asVoice, pickCoachLine, provisionalScore } from '../insights';

describe('pickCoachLine', () => {
  it('prefers a non-neutral mood', () => {
    expect(pickCoachLine({ mood: 'thirsty', proteinLeftG: 80, localTimeMin: 16 * 60 })).toEqual({ situation: 'thirsty' });
  });
  it('nudges protein in the afternoon when much is missing', () => {
    expect(pickCoachLine({ mood: 'neutral', proteinLeftG: 79.6, localTimeMin: 15 * 60 })).toEqual({
      situation: 'protein_low',
      grams: 80,
    });
  });
  it('stays neutral in the morning or when protein is nearly met', () => {
    expect(pickCoachLine({ mood: 'neutral', proteinLeftG: 80, localTimeMin: 9 * 60 }).situation).toBe('neutral');
    expect(pickCoachLine({ mood: 'neutral', proteinLeftG: 10, localTimeMin: 18 * 60 }).situation).toBe('neutral');
  });
});

describe('coercions', () => {
  it('falls back to safe defaults', () => {
    expect(asVoice('drama')).toBe('drama');
    expect(asVoice(null)).toBe('bestie');
    expect(asStrictness('x')).toBe('standard');
    expect(asMood('sleepy')).toBe('sleepy');
    expect(asMood('weird')).toBe('neutral');
    expect(asAuraTier('gold')).toBe('gold');
    expect(asAuraTier(undefined)).toBe('gray');
  });
});

describe('provisionalScore', () => {
  const base = {
    strictness: 'standard' as const,
    isFreeDay: false,
    nutrition: {
      mealsLogged: 3,
      kcalIn: 2100,
      kcalTarget: 2150,
      kcalFloor: 1500,
      proteinG: 140,
      proteinTargetG: 140,
      sugarG: 20,
      sugarLimitG: 50,
    },
    sleepMin: 480,
    sleepTargetMin: 420,
    waterMl: 2600,
    waterTargetMl: 2600,
    tasks: { scheduled: 0, completed: 0 },
  };

  it('scores a perfect day at 100 with nothing left to excellent', () => {
    const r = provisionalScore(base);
    expect(r.total).toBe(100);
    expect(r.result).toBe('excellent');
    expect(r.toExcellent).toBe(0);
  });

  it('reports the gap to an excellent day', () => {
    const r = provisionalScore({ ...base, waterMl: 0, sleepMin: null });
    expect(r.total).toBeLessThan(95);
    expect(r.toExcellent).toBe(95 - r.total);
  });

  it('handles missing targets without crashing', () => {
    const r = provisionalScore({ ...base, nutrition: null, waterTargetMl: null });
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});
