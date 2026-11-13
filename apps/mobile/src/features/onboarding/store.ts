import { coach, nutrition, time } from '@aurafit/core';
import { create } from 'zustand';

import type { CoachVoice } from '@/features/coach/insights';

/** Activity levels offered in onboarding (very_active is reachable later from settings). */
export const ONBOARDING_ACTIVITIES = ['sedentary', 'light', 'moderate', 'active'] as const;
export type OnboardingActivity = (typeof ONBOARDING_ACTIVITIES)[number];
export const GOALS: readonly nutrition.GoalType[] = ['lose_fat', 'maintain', 'gain_muscle'];
export const PACES: readonly nutrition.Pace[] = ['slow', 'medium', 'fast', 'auto'];

export type OnboardingDraft = {
  sex: nutrition.Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activity: OnboardingActivity;
  goal: nutrition.GoalType;
  pace: nutrition.Pace;
  strictness: coach.Strictness;
  freeDaysPerWeek: number;
  character: 'kai' | 'mira';
  characterName: string;
  voice: CoachVoice;
};

type Store = OnboardingDraft & { update: (patch: Partial<OnboardingDraft>) => void };

export const useOnboardingDraft = create<Store>((set) => ({
  sex: 'male',
  birthYear: 1999,
  heightCm: 170,
  weightKg: 65,
  activity: 'moderate',
  goal: 'lose_fat',
  pace: 'medium',
  strictness: 'standard',
  freeDaysPerWeek: coach.rulesFor('standard').defaultFreeDaysPerWeek,
  character: 'kai',
  characterName: 'Kai',
  voice: 'bestie',
  update: (patch) => set(patch),
}));

/** Birth year → `profiles.birth_date` (mid-year, the app only asks the year). */
export function birthDateFromYear(year: number): string {
  return time.makeLocalDate(year, 7, 1);
}

export function ageFromYear(year: number, today: string): number {
  return time.ageOn(birthDateFromYear(year), today);
}

/** Validation + targets for the result screen (NUT-01). `null` targets when input is invalid. */
export function computeOnboardingTargets(d: OnboardingDraft, today: string) {
  const body = { sex: d.sex, ageYears: ageFromYear(d.birthYear, today), heightCm: d.heightCm, weightKg: d.weightKg };
  const issues = nutrition.validateBodyProfile(body);
  if (issues.length > 0) return { issues, result: null };
  const result = nutrition.computeTargets({ ...body, activityLevel: d.activity, goal: d.goal, pace: d.pace });
  return { issues, result };
}
