import type { workout } from '@aurafit/core';
import { create } from 'zustand';

import type { DraftExercise } from './sessionLogic';

/** The workout being trained right now (one at a time). Server data stays in TanStack Query. */
export interface ActiveSession {
  /** `workout_sessions.id`, or `local-…` in preview mode / offline. */
  id: string;
  local: boolean;
  title: string;
  startedAt: string;
  programId: string | null;
  plannedSessionId: string | null;
  rotationIndex: number | null;
  rotationCount: number | null;
  profileKind: workout.EquipmentProfileKind;
  inventory: workout.GymInventory | undefined;
  exercises: DraftExercise[];
  currentIndex: number;
}

export interface RestState {
  /** Epoch ms when the rest ends. */
  endsAt: number;
  durationSec: number;
  notificationId: string | null;
  /** Exercise / set the rest leads to. */
  exerciseIndex: number;
  setIndex: number;
}

interface WorkoutState {
  active: ActiveSession | null;
  rest: RestState | null;
  /** Equipment profile picked on the Train tab (WRK-02). */
  profileKind: workout.EquipmentProfileKind;
  /** Readiness "lighter session" accepted for today's session. */
  lighter: boolean;
  /** Sets logged without an account (preview) – feeds recovery / volume locally. */
  localHistory: workout.SetLog[];
  /** Gym inventory edited without an account. */
  localInventory: Partial<Record<workout.EquipmentProfileKind, workout.GymInventory>>;
  begin: (session: ActiveSession) => void;
  updateExercise: (index: number, fn: (ex: DraftExercise) => DraftExercise) => void;
  setExercises: (fn: (list: DraftExercise[]) => DraftExercise[]) => void;
  setCurrent: (index: number) => void;
  end: () => void;
  setRest: (rest: RestState | null) => void;
  setProfileKind: (kind: workout.EquipmentProfileKind) => void;
  setLighter: (lighter: boolean) => void;
  pushLocalHistory: (sets: readonly workout.SetLog[]) => void;
  removeLocalHistory: (predicate: (set: workout.SetLog) => boolean) => void;
  setLocalInventory: (kind: workout.EquipmentProfileKind, inventory: workout.GymInventory) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  active: null,
  rest: null,
  profileKind: 'gym',
  lighter: false,
  localHistory: [],
  localInventory: {},
  begin: (session) => set({ active: session, rest: null }),
  updateExercise: (index, fn) =>
    set((s) =>
      s.active
        ? { active: { ...s.active, exercises: s.active.exercises.map((e, i) => (i === index ? fn(e) : e)) } }
        : s
    ),
  setExercises: (fn) => set((s) => (s.active ? { active: { ...s.active, exercises: fn(s.active.exercises) } } : s)),
  setCurrent: (index) => set((s) => (s.active ? { active: { ...s.active, currentIndex: index } } : s)),
  end: () => set({ active: null, rest: null, lighter: false }),
  setRest: (rest) => set({ rest }),
  setProfileKind: (profileKind) => set({ profileKind }),
  setLighter: (lighter) => set({ lighter }),
  pushLocalHistory: (sets) => set((s) => ({ localHistory: [...s.localHistory, ...sets] })),
  removeLocalHistory: (predicate) => set((s) => ({ localHistory: s.localHistory.filter((x) => !predicate(x)) })),
  setLocalInventory: (kind, inventory) => set((s) => ({ localInventory: { ...s.localInventory, [kind]: inventory } })),
}));
