// One JSON file per module namespace and language. To add a namespace: create vi/<ns>.json and
// en/<ns>.json, import both below and add them to `vi`/`en`. The shape test keeps vi/en in sync.
import enAuth from './en/auth.json';
import enCoach from './en/coach.json';
import enCommon from './en/common.json';
import enFriends from './en/friends.json';
import enHealth from './en/health.json';
import enNutrition from './en/nutrition.json';
import enOnboarding from './en/onboarding.json';
import enProgress from './en/progress.json';
import enSettings from './en/settings.json';
import enTasks from './en/tasks.json';
import enToday from './en/today.json';
import enWorkout from './en/workout.json';
import viAuth from './vi/auth.json';
import viCoach from './vi/coach.json';
import viCommon from './vi/common.json';
import viFriends from './vi/friends.json';
import viHealth from './vi/health.json';
import viNutrition from './vi/nutrition.json';
import viOnboarding from './vi/onboarding.json';
import viProgress from './vi/progress.json';
import viSettings from './vi/settings.json';
import viTasks from './vi/tasks.json';
import viToday from './vi/today.json';
import viWorkout from './vi/workout.json';

export const LANGUAGES = ['vi', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'vi';

export const vi = {
  common: viCommon,
  auth: viAuth,
  onboarding: viOnboarding,
  today: viToday,
  nutrition: viNutrition,
  health: viHealth,
  tasks: viTasks,
  coach: viCoach,
  workout: viWorkout,
  progress: viProgress,
  friends: viFriends,
  settings: viSettings,
} as const;

export const en = {
  common: enCommon,
  auth: enAuth,
  onboarding: enOnboarding,
  today: enToday,
  nutrition: enNutrition,
  health: enHealth,
  tasks: enTasks,
  coach: enCoach,
  workout: enWorkout,
  progress: enProgress,
  friends: enFriends,
  settings: enSettings,
} satisfies Record<keyof typeof vi, object>;

export const resources = { vi, en } as const;

export type Namespace = keyof typeof vi;
export const NAMESPACES = Object.keys(vi) as Namespace[];
export const DEFAULT_NAMESPACE = 'common' satisfies Namespace;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
