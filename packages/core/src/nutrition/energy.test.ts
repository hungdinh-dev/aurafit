import {
  ACTIVITY_FACTORS,
  KCAL_PER_KG,
  activityBonusKcal,
  bmr,
  safetyFloorKcal,
  tdee,
  tdeeFromProfile,
  validateBodyProfile,
} from './energy';

describe('bmr (Mifflin–St Jeor)', () => {
  it('male / female / unknown sex constants', () => {
    const p = { ageYears: 30, heightCm: 175, weightKg: 80 };
    expect(bmr({ ...p, sex: 'male' })).toBeCloseTo(1748.75, 6);
    expect(bmr({ ...p, sex: 'female' })).toBeCloseTo(1582.75, 6);
    // unknown sex = midpoint of the two
    expect(bmr({ ...p, sex: null })).toBeCloseTo((1748.75 + 1582.75) / 2, 6);
  });

  it('extreme but valid bodies stay positive', () => {
    expect(bmr({ sex: 'female', ageYears: 90, heightCm: 140, weightKg: 30 })).toBeCloseTo(300 + 875 - 450 - 161, 6);
    expect(bmr({ sex: 'male', ageYears: 25, heightCm: 200, weightKg: 300 })).toBeCloseTo(3000 + 1250 - 125 + 5, 6);
  });

  it('throws on non-positive / non-finite input', () => {
    expect(() => bmr({ sex: 'male', ageYears: 30, heightCm: 175, weightKg: 0 })).toThrow(RangeError);
    expect(() => bmr({ sex: 'male', ageYears: Number.NaN, heightCm: 175, weightKg: 70 })).toThrow(RangeError);
    expect(() => bmr({ sex: 'male', ageYears: 30, heightCm: -1, weightKg: 70 })).toThrow(RangeError);
  });
});

describe('tdee', () => {
  it('uses the standard activity factors', () => {
    expect(ACTIVITY_FACTORS).toEqual({ sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 });
    expect(tdee(1000, 'sedentary')).toBe(1200);
    expect(tdee(1000, 'very_active')).toBe(1900);
    expect(tdee(1748.75, 'moderate')).toBe(2711);
  });

  it('tdeeFromProfile combines both', () => {
    expect(tdeeFromProfile({ sex: 'female', ageYears: 25, heightCm: 160, weightKg: 55 }, 'light')).toBe(1738);
  });

  it('rejects a non-positive BMR', () => {
    expect(() => tdee(0, 'light')).toThrow(RangeError);
  });

  it('7,700 kcal per kg', () => {
    expect(KCAL_PER_KG).toBe(7700);
  });
});

describe('safetyFloorKcal', () => {
  it('max(BMR, 1,200 F / 1,500 M), rounded up to 10', () => {
    expect(safetyFloorKcal(1100, 'female')).toBe(1200);
    expect(safetyFloorKcal(1100, 'male')).toBe(1500);
    expect(safetyFloorKcal(1600.2, 'female')).toBe(1610);
    expect(safetyFloorKcal(2155, 'male')).toBe(2160);
  });

  it('unknown sex uses the higher (safer) minimum', () => {
    expect(safetyFloorKcal(1100, null)).toBe(1500);
  });
});

describe('validateBodyProfile', () => {
  it('accepts a normal profile', () => {
    expect(validateBodyProfile({ sex: 'male', ageYears: 30, heightCm: 175, weightKg: 80 })).toEqual([]);
  });

  it('reports every out-of-range field as a code', () => {
    expect(validateBodyProfile({ sex: null, ageYears: 10, heightCm: 260, weightKg: 400 })).toEqual([
      'age_out_of_range',
      'height_out_of_range',
      'weight_out_of_range',
    ]);
    expect(validateBodyProfile({ sex: 'female', ageYears: Number.NaN, heightCm: 99, weightKg: 24 })).toHaveLength(3);
  });
});

describe('activityBonusKcal (training-day extra, §1.7)', () => {
  // BMR 1600, moderate: baseline = (1.55 − 1.1) × 1600 = 720 kcal
  it('credits 50 % of active energy above the factor baseline', () => {
    expect(activityBonusKcal({ bmrKcal: 1600, activityLevel: 'moderate', measuredActiveKcal: 1000 })).toBe(140);
  });

  it('returns 0 at or below the baseline and for missing data', () => {
    expect(activityBonusKcal({ bmrKcal: 1600, activityLevel: 'moderate', measuredActiveKcal: 700 })).toBe(0);
    expect(activityBonusKcal({ bmrKcal: 1600, activityLevel: 'moderate', measuredActiveKcal: 0 })).toBe(0);
    expect(activityBonusKcal({ bmrKcal: 1600, activityLevel: 'moderate', measuredActiveKcal: Number.NaN })).toBe(0);
  });

  it('respects the cap and custom share', () => {
    expect(activityBonusKcal({ bmrKcal: 1600, activityLevel: 'sedentary', measuredActiveKcal: 3000 })).toBe(500);
    expect(
      activityBonusKcal({ bmrKcal: 1600, activityLevel: 'sedentary', measuredActiveKcal: 660, share: 1, maxBonusKcal: 1000 }),
    ).toBe(500); // baseline 0.1 × 1600 = 160
  });
});
