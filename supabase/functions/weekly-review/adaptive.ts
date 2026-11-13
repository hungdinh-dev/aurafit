// Adaptive TDEE hook: maps closed-day rows to core `health.adaptTdee` (HLT-03,
// lifestyle.md §2, nutrition.md §1.6). Core owns the rules (≥ 4 weigh-ins, ≥ 10 logged
// days in 14, ±150 kcal max step, 50 kcal dead-band, BMR bounds).
import { health, nutrition, time } from '@aurafit/core';

export type AdaptiveTdeeResult = health.AdaptiveTdeeResult;

export interface ClosedDayRow {
  local_date: string;
  kcal_in: number;
  weight_kg: number | null;
}

export interface BodyFacts {
  sex: 'male' | 'female' | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
}

export function bmrFor(body: BodyFacts, asOf: string): number | null {
  if (!body.birthDate || !body.heightCm || !body.weightKg) return null;
  const p = { sex: body.sex, ageYears: time.ageOn(body.birthDate, asOf), heightCm: body.heightCm, weightKg: body.weightKg };
  return nutrition.validateBodyProfile(p).length > 0 ? null : nutrition.bmr(p);
}

/** `days` = closed days (daily_summaries) up to `asOf`, any order, ideally ≥ 30 for trend warm-up. */
export function adaptiveTdee(asOf: string, currentTdeeKcal: number, days: ClosedDayRow[], body: BodyFacts): AdaptiveTdeeResult {
  return health.adaptTdee({
    asOf,
    currentTdeeKcal,
    weighIns: days.filter((d) => d.weight_kg !== null).map((d) => ({ date: d.local_date, weightKg: Number(d.weight_kg) })),
    intake: days.map((d) => ({ date: d.local_date, kcal: Number(d.kcal_in) > 0 ? Number(d.kcal_in) : null })),
    bmrKcal: bmrFor(body, asOf),
  });
}

export function safetyFloor(body: BodyFacts, asOf: string): number {
  return nutrition.safetyFloorKcal(bmrFor(body, asOf) ?? 0, body.sex);
}
