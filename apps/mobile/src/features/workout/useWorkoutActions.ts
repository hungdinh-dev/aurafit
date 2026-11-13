/**
 * Session actions shared by the Train tab, the session and set screens: start, log / unlog a set
 * (WRK-04/05/14), finish → server, rest timer (WRK-16). Preview mode keeps everything local.
 */
import type { workout } from '@aurafit/core';
import { router } from 'expo-router';
import { useState } from 'react';

import { haptics } from '@/ui';

import {
  useCanSync,
  useDeleteSetLog,
  useFinishWorkoutSession,
  useLogSet,
  useStartWorkoutSession,
  type GymProfile,
} from './api';
import { skipRest, startRest } from './restTimer';
import {
  completeSet,
  draftFromPlanned,
  nextOpenSet,
  toSetLogs,
  uncompleteSet,
  type DraftSet,
} from './sessionLogic';
import { useWorkoutStore } from './store';

export interface StartInput {
  title: string;
  exercises: readonly workout.PlannedExercise[];
  profile: GymProfile;
  plannedSessionId: string | null;
  programId: string | null;
  rotationIndex: number | null;
  rotationCount: number | null;
  readiness: number | null;
  lastLoadBySlug?: Readonly<Record<string, number>>;
}

export function useStartWorkout() {
  const canSync = useCanSync();
  const start = useStartWorkoutSession();
  const [error, setError] = useState(false);
  const lighter = useWorkoutStore((s) => s.lighter);

  const run = async (input: StartInput) => {
    setError(false);
    haptics.light();
    const exercises = draftFromPlanned(input.exercises, {
      inventory: input.profile.inventory,
      setDelta: lighter ? -1 : 0,
      lastLoadBySlug: input.lastLoadBySlug,
    });
    let id = `local-${Date.now().toString(36)}`;
    let local = true;
    if (canSync) {
      try {
        id = await start.mutateAsync({
          plannedSessionId: input.plannedSessionId,
          equipmentProfileId: input.profile.id,
          readiness: input.readiness,
          readinessApplied: lighter,
        });
        local = false;
      } catch {
        haptics.error();
        setError(true);
        return;
      }
    }
    useWorkoutStore.getState().begin({
      id,
      local,
      title: input.title,
      startedAt: new Date().toISOString(),
      programId: input.programId,
      plannedSessionId: input.plannedSessionId,
      rotationIndex: input.rotationIndex,
      rotationCount: input.rotationCount,
      profileKind: input.profile.kind,
      inventory: input.profile.inventory,
      exercises,
      currentIndex: 0,
    });
    router.push({ pathname: '/workout/[sessionId]', params: { sessionId: id } });
  };

  return { start: run, isPending: start.isPending, error };
}

export function useSetActions() {
  const logSet = useLogSet();
  const deleteSet = useDeleteSetLog();
  const [syncError, setSyncError] = useState(false);

  /** Complete a set: autoregulate the next sets, sync, start the rest timer. */
  const complete = (exerciseIndex: number, setIndex: number, data: Partial<DraftSet>, restSec?: number) => {
    const state = useWorkoutStore.getState();
    const active = state.active;
    const ex = active?.exercises[exerciseIndex];
    if (!active || !ex) return null;
    const result = completeSet(ex, setIndex, data, active.inventory);
    state.updateExercise(exerciseIndex, () => result.exercise);
    haptics.success();
    const done = result.exercise.sets[setIndex]!;
    if (active.local) {
      state.pushLocalHistory(toSetLogs({ ...result.exercise, sets: [done] }, active.id).map((s) => ({ ...s, setNo: setIndex + 1 })));
    } else {
      logSet.mutate(
        {
          sessionId: active.id,
          slug: result.exercise.slug,
          setNo: setIndex + 1,
          loadKg: done.loadKg,
          reps: done.reps,
          rir: done.rir,
          completedAt: done.completedAt ?? new Date().toISOString(),
          addedLoadKg: done.addedLoadKg,
          side: done.side,
          bands: done.bands,
        },
        {
          onSuccess: (logId) => {
            setSyncError(false);
            useWorkoutStore.getState().updateExercise(exerciseIndex, (e) =>
              e.key === result.exercise.key
                ? { ...e, sets: e.sets.map((s, i) => (i === setIndex ? { ...s, logId } : s)) }
                : e
            );
          },
          onError: () => setSyncError(true),
        }
      );
    }
    // Rest leads to the next open set of this exercise, else the next exercise.
    const nextSet = nextOpenSet(result.exercise);
    const exercises = useWorkoutStore.getState().active?.exercises ?? [];
    const nextExercise = nextSet >= 0 ? exerciseIndex : exercises.findIndex((e, i) => i > exerciseIndex && nextOpenSet(e) >= 0);
    if (nextExercise >= 0) {
      void startRest(restSec ?? result.exercise.restSec, {
        exerciseIndex: nextExercise,
        setIndex: nextSet >= 0 ? nextSet : Math.max(0, nextOpenSet(exercises[nextExercise]!)),
      });
      if (nextSet < 0) useWorkoutStore.getState().setCurrent(nextExercise);
    } else {
      void skipRest();
    }
    return result.suggestion;
  };

  const undo = (exerciseIndex: number, setIndex: number) => {
    const state = useWorkoutStore.getState();
    const active = state.active;
    const ex = active?.exercises[exerciseIndex];
    const set = ex?.sets[setIndex];
    if (!active || !ex || !set) return;
    state.updateExercise(exerciseIndex, (e) => uncompleteSet(e, setIndex));
    haptics.light();
    if (active.local) {
      state.removeLocalHistory((s) => s.sessionId === active.id && s.exerciseSlug === ex.slug && s.completedAt === set.completedAt);
    } else if (set.logId) {
      deleteSet.mutate(set.logId);
    }
  };

  return { complete, undo, syncError };
}

export function useFinishWorkout() {
  const finish = useFinishWorkoutSession();
  const [error, setError] = useState(false);
  const run = async (status: 'completed' | 'cancelled') => {
    const active = useWorkoutStore.getState().active;
    if (!active) return;
    setError(false);
    if (!active.local) {
      try {
        await finish.mutateAsync({
          sessionId: active.id,
          status,
          programId: active.programId,
          rotationIndex: active.rotationIndex,
          rotationCount: active.rotationCount,
        });
      } catch {
        haptics.error();
        setError(true);
        return;
      }
    }
    await skipRest();
    if (status === 'completed') haptics.heavy();
    useWorkoutStore.getState().end();
    if (router.canGoBack()) router.back();
    else router.replace('/train');
  };
  return { finish: run, isPending: finish.isPending, error };
}
