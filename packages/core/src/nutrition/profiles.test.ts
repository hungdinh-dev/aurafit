/**
 * M1 "Done" criterion: 10 sample profiles produce the hand-calculated targets.
 *
 * Hand-calculation recipe (see targets.ts):
 *   BMR   = 10·kg + 6.25·cm − 5·age + s   (s: male +5, female −161, unknown −78)
 *   TDEE  = round(BMR × factor)            (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
 *   delta = round(kg/week × 7700 / 7)      (lose −275/−550/−825, gain +110/+275/+440)
 *   kcal  = max(round10(TDEE + delta), ceil10(max(BMR, 1200 F | 1500 M/unknown)))
 *   refW  = min(kg, 25 × m²)
 *   P     = round(refW × 2.2 lose | 1.6 maintain | 1.8 gain)
 *   F     = max(round(refW × 0.6), round(kcal × 0.25 / 9))
 *   C     = round((kcal − 4P − 9F) / 4)
 *   sugar = floor(kcal / 40) · fiber = round(kcal × 14 / 1000) · sodium = 2000
 */
import { computeTargets, type TargetsInput } from './targets';
import type { NutritionTargets } from './types';

interface Case {
  name: string;
  input: TargetsInput;
  expected: NutritionTargets;
  floorApplied: boolean;
}

const cases: Case[] = [
  {
    // BMR = 800 + 1093.75 − 150 + 5 = 1748.75; TDEE = 1748.75×1.55 = 2710.56 → 2711
    // kcal = round10(2711 − 550 = 2161) = 2160 (floor 1750); refW = min(80, 76.5625)
    // P = round(168.44) = 168; F = max(46, 60) = 60; C = (2160 − 672 − 540)/4 = 237
    // sugar 54; fiber round(30.24) = 30
    name: '1 · male 30y 175cm 80kg moderate, lose medium',
    input: { sex: 'male', ageYears: 30, heightCm: 175, weightKg: 80, activityLevel: 'moderate', goal: 'lose_fat', pace: 'medium' },
    expected: { tdee_kcal: 2711, kcal: 2160, protein_g: 168, carb_g: 237, fat_g: 60, sugar_g: 54, fiber_g: 30, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // BMR = 550 + 1000 − 125 − 161 = 1264; TDEE = 1264×1.375 = 1738
    // kcal = round10(1738) = 1740; refW = 55; P = 88; F = max(33, round(48.33)=48) = 48
    // C = (1740 − 352 − 432)/4 = 239; sugar floor(43.5) = 43; fiber round(24.36) = 24
    name: '2 · female 25y 160cm 55kg light, maintain',
    input: { sex: 'female', ageYears: 25, heightCm: 160, weightKg: 55, activityLevel: 'light', goal: 'maintain', pace: 'medium' },
    expected: { tdee_kcal: 1738, kcal: 1740, protein_g: 88, carb_g: 239, fat_g: 48, sugar_g: 43, fiber_g: 24, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // BMR = 600 + 1062.5 − 110 + 5 = 1557.5; TDEE = ×1.725 = 2686.69 → 2687
    // kcal = round10(2687 + 275 = 2962) = 2960; refW 60; P = 108; F = max(36, 82.2→82) = 82
    // C = (2960 − 432 − 738)/4 = 447.5 → 448; sugar 74; fiber round(41.44) = 41
    name: '3 · male 22y 170cm 60kg active, gain medium',
    input: { sex: 'male', ageYears: 22, heightCm: 170, weightKg: 60, activityLevel: 'active', goal: 'gain_muscle', pace: 'medium' },
    expected: { tdee_kcal: 2687, kcal: 2960, protein_g: 108, carb_g: 448, fat_g: 82, sugar_g: 74, fiber_g: 41, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // BMR = 500 + 968.75 − 225 − 161 = 1082.75; TDEE = ×1.2 = 1299.3 → 1299
    // raw = 1299 − 825 = 474 → 470 < floor ceil10(max(1082.75, 1200)) = 1200 → kcal 1200
    // refW 50; P = 110; F = max(30, 33.3→33) = 33; C = (1200 − 440 − 297)/4 = 115.75 → 116
    // sugar 30; fiber round(16.8) = 17
    name: '4 · female 45y 155cm 50kg sedentary, lose fast → 1,200 floor',
    input: { sex: 'female', ageYears: 45, heightCm: 155, weightKg: 50, activityLevel: 'sedentary', goal: 'lose_fat', pace: 'fast' },
    expected: { tdee_kcal: 1299, kcal: 1200, protein_g: 110, carb_g: 116, fat_g: 33, sugar_g: 30, fiber_g: 17, sodium_mg: 2000 },
    floorApplied: true,
  },
  {
    // BMR = 1200 + 1125 − 175 + 5 = 2155; TDEE = ×1.2 = 2586
    // raw = 2586 − 825 = 1761 → 1760 < floor ceil10(max(2155, 1500)) = 2160 (BMR floor)
    // refW = min(120, 25×3.24 = 81) = 81; P = round(178.2) = 178; F = max(round(48.6)=49, 60) = 60
    // C = (2160 − 712 − 540)/4 = 227; sugar 54; fiber 30
    name: '5 · male 35y 180cm 120kg sedentary, lose fast → BMR floor + BMI-25 protein reference',
    input: { sex: 'male', ageYears: 35, heightCm: 180, weightKg: 120, activityLevel: 'sedentary', goal: 'lose_fat', pace: 'fast' },
    expected: { tdee_kcal: 2586, kcal: 2160, protein_g: 178, carb_g: 227, fat_g: 60, sugar_g: 54, fiber_g: 30, sodium_mg: 2000 },
    floorApplied: true,
  },
  {
    // unknown sex: s = −78. BMR = 700 + 1031.25 − 200 − 78 = 1453.25; TDEE = ×1.55 = 2252.54 → 2253
    // kcal = 2250 (floor uses 1500); refW = min(70, 68.0625); P = round(108.9) = 109
    // F = max(round(40.84)=41, 62.5→63) = 63; C = (2250 − 436 − 567)/4 = 311.75 → 312
    // sugar floor(56.25) = 56; fiber 31.5 → 32
    name: '6 · unknown sex 40y 165cm 70kg moderate, maintain',
    input: { sex: null, ageYears: 40, heightCm: 165, weightKg: 70, activityLevel: 'moderate', goal: 'maintain', pace: 'auto' },
    expected: { tdee_kcal: 2253, kcal: 2250, protein_g: 109, carb_g: 312, fat_g: 63, sugar_g: 56, fiber_g: 32, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // auto pace: female body fat 34 % ≥ 32 → fast (−825)
    // BMR = 680 + 1031.25 − 140 − 161 = 1410.25; TDEE = ×1.55 = 2185.89 → 2186
    // raw = 1361 → 1360 < floor ceil10(1410.25) = 1420 → kcal 1420
    // refW = min(68, 68.06) = 68; P = round(149.6) = 150; F = max(round(40.8)=41, 39.4→39) = 41
    // C = (1420 − 600 − 369)/4 = 112.75 → 113; sugar floor(35.5) = 35; fiber round(19.88) = 20
    name: '7 · female 28y 165cm 68kg moderate, lose auto (34 % fat → fast) → BMR floor',
    input: {
      sex: 'female', ageYears: 28, heightCm: 165, weightKg: 68, activityLevel: 'moderate', goal: 'lose_fat', pace: 'auto', bodyFatPct: 34,
    },
    expected: { tdee_kcal: 2186, kcal: 1420, protein_g: 150, carb_g: 113, fat_g: 41, sugar_g: 35, fiber_g: 20, sodium_mg: 2000 },
    floorApplied: true,
  },
  {
    // auto pace: beginner gain → medium (+275)
    // BMR = 650 + 1156.25 − 95 + 5 = 1716.25; TDEE = ×1.9 = 3260.88 → 3261
    // kcal = round10(3536) = 3540; refW 65; P = 117; F = max(39, 98.3→98) = 98
    // C = (3540 − 468 − 882)/4 = 547.5 → 548; sugar floor(88.5) = 88; fiber round(49.56) = 50
    name: '8 · male 19y 185cm 65kg very active, gain auto (beginner → medium)',
    input: {
      sex: 'male', ageYears: 19, heightCm: 185, weightKg: 65, activityLevel: 'very_active', goal: 'gain_muscle', pace: 'auto', experience: 'beginner',
    },
    expected: { tdee_kcal: 3261, kcal: 3540, protein_g: 117, carb_g: 548, fat_g: 98, sugar_g: 88, fiber_g: 50, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // BMR = 720 + 1050 − 300 + 5 = 1475; TDEE = ×1.375 = 2028.13 → 2028
    // kcal = round10(2028 − 275 = 1753) = 1750 (floor 1500); refW = min(72, 70.56) = 70.56
    // P = round(155.23) = 155; F = max(round(42.34)=42, 48.6→49) = 49; C = (1750 − 620 − 441)/4 = 172.25 → 172
    // sugar floor(43.75) = 43; fiber 24.5 → 25
    name: '9 · male 60y 168cm 72kg light, lose slow',
    input: { sex: 'male', ageYears: 60, heightCm: 168, weightKg: 72, activityLevel: 'light', goal: 'lose_fat', pace: 'slow' },
    expected: { tdee_kcal: 2028, kcal: 1750, protein_g: 155, carb_g: 172, fat_g: 49, sugar_g: 43, fiber_g: 25, sodium_mg: 2000 },
    floorApplied: false,
  },
  {
    // BMR = 520 + 987.5 − 165 − 161 = 1181.5; TDEE = ×1.725 = 2038.09 → 2038
    // kcal = round10(2038 + 440 = 2478) = 2480; refW 52; P = round(93.6) = 94; F = max(31, 68.9→69) = 69
    // C = (2480 − 376 − 621)/4 = 370.75 → 371; sugar 62; fiber round(34.72) = 35
    name: '10 · female 33y 158cm 52kg active, gain fast',
    input: { sex: 'female', ageYears: 33, heightCm: 158, weightKg: 52, activityLevel: 'active', goal: 'gain_muscle', pace: 'fast' },
    expected: { tdee_kcal: 2038, kcal: 2480, protein_g: 94, carb_g: 371, fat_g: 69, sugar_g: 62, fiber_g: 35, sodium_mg: 2000 },
    floorApplied: false,
  },
];

describe('M1: 10 sample profiles produce the hand-calculated targets', () => {
  it.each(cases)('$name', ({ input, expected, floorApplied }) => {
    const { targets, explanation } = computeTargets(input);
    expect(targets).toEqual(expected);
    expect(explanation.floorApplied).toBe(floorApplied);
    // Safety floor is never violated
    expect(targets.kcal).toBeGreaterThanOrEqual(explanation.floorKcal);
    // Macros never exceed the kcal target by more than rounding (≤ 2 g of carb)
    const macroKcal = targets.protein_g * 4 + targets.carb_g * 4 + targets.fat_g * 9;
    expect(Math.abs(macroKcal - targets.kcal)).toBeLessThanOrEqual(8);
  });

  it('explains the auto choices', () => {
    expect(computeTargets(cases[6]!.input).explanation).toMatchObject({
      resolvedPace: 'fast',
      paceReasons: ['body_fat_high'],
      effectiveDailyDeltaKcal: 1420 - 2186,
    });
    expect(computeTargets(cases[7]!.input).explanation).toMatchObject({
      resolvedPace: 'medium',
      paceReasons: ['experience_beginner'],
      plannedDailyDeltaKcal: 275,
    });
    expect(computeTargets(cases[4]!.input).explanation).toMatchObject({ floorKcal: 2160, referenceWeightKg: 81 });
  });
});
