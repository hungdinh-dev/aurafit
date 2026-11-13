import {
  PORTION_MULTIPLIERS,
  kcalFromMacros,
  mealTotals,
  remainingNutrients,
  roundNutrients,
  scaleNutrients,
  subtractNutrients,
  sumNutrients,
  toNutrients,
  zeroNutrients,
} from './nutrients';

const pho = { kcal: 450, protein_g: 25.4, carb_g: 60.2, fat_g: 12.1, sugar_g: 4, fiber_g: 2.5, sodium_mg: 1800 };

describe('nutrient helpers', () => {
  it('portion multipliers match NUT-05', () => {
    expect([...PORTION_MULTIPLIERS]).toEqual([0.5, 1, 1.5, 2]);
  });

  it('toNutrients fills missing / null / NaN with 0', () => {
    expect(toNutrients({ kcal: 100, protein_g: null, fat_g: Number.NaN })).toEqual({ ...zeroNutrients(), kcal: 100 });
  });

  it('roundNutrients uses storage precision', () => {
    expect(roundNutrients({ kcal: 100.6, protein_g: 10.04, sodium_mg: 99.5, fiber_g: 1.05 })).toEqual({
      kcal: 101,
      protein_g: 10,
      carb_g: 0,
      fat_g: 0,
      sugar_g: 0,
      fiber_g: 1.1,
      sodium_mg: 100,
    });
  });

  it('scaleNutrients multiplies every nutrient and rounds', () => {
    expect(scaleNutrients(pho, 1.5)).toEqual({
      kcal: 675,
      protein_g: 38.1,
      carb_g: 90.3,
      fat_g: 18.2,
      sugar_g: 6,
      fiber_g: 3.8,
      sodium_mg: 2700,
    });
    expect(scaleNutrients(pho, 0)).toEqual(zeroNutrients());
  });

  it('scaleNutrients rejects negative / NaN factors', () => {
    expect(() => scaleNutrients(pho, -1)).toThrow(RangeError);
    expect(() => scaleNutrients(pho, Number.NaN)).toThrow(RangeError);
  });

  it('sumNutrients / mealTotals add items, tolerating partial rows', () => {
    const coffee = { kcal: 150, protein_g: 2, carb_g: 20, fat_g: 6, sugar_g: 18 };
    expect(sumNutrients([pho, coffee])).toEqual({
      kcal: 600,
      protein_g: 27.4,
      carb_g: 80.2,
      fat_g: 18.1,
      sugar_g: 22,
      fiber_g: 2.5,
      sodium_mg: 1800,
    });
    expect(mealTotals([])).toEqual(zeroNutrients());
  });

  it('subtract / remaining (negative = over, optional clamp)', () => {
    const target = { kcal: 2000, protein_g: 150, carb_g: 200, fat_g: 60, sugar_g: 50, fiber_g: 28, sodium_mg: 2000 };
    const eaten = { kcal: 2100, protein_g: 100, carb_g: 210, fat_g: 70, sugar_g: 20, fiber_g: 10, sodium_mg: 2500 };
    expect(subtractNutrients(target, eaten).kcal).toBe(-100);
    expect(remainingNutrients(target, eaten)).toMatchObject({ kcal: -100, protein_g: 50, sodium_mg: -500 });
    expect(remainingNutrients(target, eaten, { clampAtZero: true })).toMatchObject({ kcal: 0, protein_g: 50, sodium_mg: 0 });
  });

  it('kcalFromMacros uses 4/4/9', () => {
    expect(kcalFromMacros({ protein_g: 10, carb_g: 20, fat_g: 10 })).toBe(210);
  });
});
