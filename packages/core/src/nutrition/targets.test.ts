import {
  PACE_KG_PER_WEEK,
  bmiOf,
  computeTargets,
  dailyDeltaKcal,
  fiberTargetG,
  plannedKgPerWeek,
  referenceWeightKg,
  resolvePace,
  splitMacros,
  sugarLimitG,
  type PaceInput,
} from './targets';

const base: PaceInput = { goal: 'lose_fat', pace: 'auto', sex: 'male', weightKg: 75, heightCm: 175 };

describe('pace table (D-013)', () => {
  it('matches nutrition.md §1', () => {
    expect(PACE_KG_PER_WEEK.lose_fat).toEqual({ slow: 0.25, medium: 0.5, fast: 0.75 });
    expect(PACE_KG_PER_WEEK.gain_muscle).toEqual({ slow: 0.1, medium: 0.25, fast: 0.4 });
  });

  it('plannedKgPerWeek is signed', () => {
    expect(plannedKgPerWeek('lose_fat', 'medium')).toBe(-0.5);
    expect(plannedKgPerWeek('gain_muscle', 'fast')).toBe(0.4);
    expect(plannedKgPerWeek('maintain', null)).toBe(0);
    expect(plannedKgPerWeek('maintain', 'fast')).toBe(0);
  });

  it('−0.5 kg/week ≈ −550 kcal/day', () => {
    expect(dailyDeltaKcal(-0.5)).toBe(-550);
    expect(dailyDeltaKcal(-0.25)).toBe(-275);
    expect(dailyDeltaKcal(-0.75)).toBe(-825);
    expect(dailyDeltaKcal(0.1)).toBe(110);
    expect(dailyDeltaKcal(0.4)).toBe(440);
    expect(dailyDeltaKcal(0)).toBe(0);
  });
});

describe('resolvePace ("Để app quyết định")', () => {
  it('keeps explicit choices and ignores pace for maintain', () => {
    expect(resolvePace({ ...base, pace: 'fast' })).toEqual({ pace: 'fast', reasons: ['user_choice'] });
    expect(resolvePace({ ...base, goal: 'maintain' })).toEqual({ pace: null, reasons: ['maintain'] });
  });

  it('fat loss by body-fat %', () => {
    expect(resolvePace({ ...base, bodyFatPct: 28 }).pace).toBe('fast');
    expect(resolvePace({ ...base, bodyFatPct: 20 }).pace).toBe('medium');
    expect(resolvePace({ ...base, bodyFatPct: 12 })).toEqual({ pace: 'slow', reasons: ['body_fat_low'] });
    expect(resolvePace({ ...base, sex: 'female', bodyFatPct: 28 }).pace).toBe('medium');
    expect(resolvePace({ ...base, sex: 'female', bodyFatPct: 32 }).pace).toBe('fast');
    expect(resolvePace({ ...base, sex: null, bodyFatPct: 29 }).pace).toBe('fast');
    expect(resolvePace({ ...base, sex: null, bodyFatPct: 18 }).pace).toBe('slow');
  });

  it('fat loss falls back to Asian BMI cut-offs', () => {
    expect(resolvePace({ ...base, weightKg: 85 })).toEqual({ pace: 'fast', reasons: ['bmi_high'] }); // BMI 27.8
    expect(resolvePace({ ...base, weightKg: 75 })).toEqual({ pace: 'medium', reasons: ['bmi_mid'] }); // 24.5
    expect(resolvePace({ ...base, weightKg: 65 })).toEqual({ pace: 'slow', reasons: ['bmi_low'] }); // 21.2
    expect(resolvePace({ ...base, weightKg: 85, bodyFatPct: 0 }).reasons).toEqual(['bmi_high']); // 0 = unknown
  });

  it('low adherence slows the auto pace one step', () => {
    expect(resolvePace({ ...base, weightKg: 85, adherenceRate: 0.4 })).toEqual({
      pace: 'medium',
      reasons: ['bmi_high', 'low_adherence'],
    });
    expect(resolvePace({ ...base, weightKg: 75, adherenceRate: 0.5 }).pace).toBe('slow');
    expect(resolvePace({ ...base, weightKg: 65, adherenceRate: 0.1 })).toEqual({ pace: 'slow', reasons: ['bmi_low'] });
    expect(resolvePace({ ...base, weightKg: 85, adherenceRate: 0.9 }).pace).toBe('fast');
  });

  it('muscle gain by experience', () => {
    const g = { ...base, goal: 'gain_muscle' as const };
    expect(resolvePace({ ...g, experience: 'beginner' }).pace).toBe('medium');
    expect(resolvePace({ ...g, experience: 'intermediate' }).pace).toBe('slow');
    expect(resolvePace({ ...g, experience: 'advanced' }).pace).toBe('slow');
    expect(resolvePace({ ...g, experience: null })).toEqual({ pace: 'medium', reasons: ['experience_unknown'] });
  });
});

describe('referenceWeightKg / bmi', () => {
  it('caps at BMI 25 weight', () => {
    expect(referenceWeightKg(60, 170)).toBe(60);
    expect(referenceWeightKg(120, 180)).toBeCloseTo(81, 6);
    expect(bmiOf(81, 180)).toBeCloseTo(25, 6);
  });
});

describe('splitMacros', () => {
  it('fat at 25 % kcal when above the 0.6 g/kg minimum', () => {
    expect(splitMacros({ kcal: 2160, referenceWeightKg: 76.5625, proteinGPerKg: 2.2 })).toEqual({
      protein_g: 168,
      fat_g: 60,
      carb_g: 237,
      fatMinG: 46,
      trimmed: false,
    });
  });

  it('fat never below 0.6 g/kg', () => {
    const m = splitMacros({ kcal: 1500, referenceWeightKg: 80, proteinGPerKg: 2.2 });
    expect(m.fat_g).toBe(48);
    expect(m.protein_g).toBe(176);
    expect(m.carb_g).toBe(91); // (1500 − 704 − 432) / 4
  });

  it('trims protein toward 1.6 g/kg and never returns negative carbs when kcal is too low', () => {
    const m = splitMacros({ kcal: 1000, referenceWeightKg: 90, proteinGPerKg: 2.2 });
    expect(m.trimmed).toBe(true);
    expect(m.fat_g).toBe(54);
    expect(m.protein_g).toBe(144);
    expect(m.carb_g).toBe(0);
  });
});

describe('sugar / fiber helpers', () => {
  it('sugar ≤ 10 % kcal, fiber 14 g/1000 kcal', () => {
    expect(sugarLimitG(2000)).toBe(50);
    expect(sugarLimitG(1750)).toBe(43);
    expect(fiberTargetG(2000)).toBe(28);
  });
});

describe('computeTargets', () => {
  const profile = {
    sex: 'male' as const,
    ageYears: 30,
    heightCm: 175,
    weightKg: 80,
    activityLevel: 'moderate' as const,
    goal: 'lose_fat' as const,
    pace: 'medium' as const,
  };

  it('uses a provided (adaptive) TDEE', () => {
    const r = computeTargets({ ...profile, tdeeKcal: 2500 });
    expect(r.targets.tdee_kcal).toBe(2500);
    expect(r.targets.kcal).toBe(1950);
    expect(r.explanation.tdeeSource).toBe('provided');
    expect(computeTargets(profile).explanation.tdeeSource).toBe('formula');
  });

  it('never goes below the floor even with a tiny adaptive TDEE', () => {
    const r = computeTargets({ ...profile, tdeeKcal: 1600 });
    expect(r.targets.kcal).toBe(1750); // ceil10(BMR 1748.75)
    expect(r.explanation.floorApplied).toBe(true);
    expect(r.explanation.effectiveDailyDeltaKcal).toBe(150);
  });

  it('rejects a non-positive TDEE override', () => {
    expect(() => computeTargets({ ...profile, tdeeKcal: 0 })).toThrow(RangeError);
  });

  it('reports effective kg/week after the floor', () => {
    const r = computeTargets(profile);
    expect(r.explanation.effectiveDailyDeltaKcal).toBe(2160 - 2711);
    expect(r.explanation.effectiveKgPerWeek).toBeCloseTo((-551 * 7) / 7700, 3);
    expect(r.explanation.plannedKgPerWeek).toBe(-0.5);
  });

  it('extreme weights still produce sane, floor-safe targets', () => {
    const heavy = computeTargets({ ...profile, weightKg: 250, heightCm: 170, pace: 'fast' });
    expect(heavy.targets.kcal).toBeGreaterThanOrEqual(heavy.explanation.floorKcal);
    expect(heavy.targets.protein_g).toBeLessThanOrEqual(Math.round(2.2 * 25 * 1.7 * 1.7));
    const light = computeTargets({ ...profile, sex: 'female', weightKg: 35, heightCm: 150, activityLevel: 'sedentary', pace: 'fast' });
    expect(light.targets.kcal).toBe(1200);
    expect(light.targets.carb_g).toBeGreaterThanOrEqual(0);
  });
});
