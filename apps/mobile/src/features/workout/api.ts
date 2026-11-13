/**
 * Workout data (WRK-*): typed Supabase queries wrapped in TanStack Query.
 * `set_logs` / `planned_exercises` reference `exercises.id`; the app works with slugs (core), so a
 * cached slug ↔ id map translates both ways. Score / XP / PR / recovery tables are read-only here.
 */
import { time, workout } from '@aurafit/core';
import type { Json, Tables, TablesInsert } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { deviceTimeZone } from '@/lib/locale';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

import { useWorkoutStore } from './store';

// ---------------------------------------------------------------------------------------------
// Keys & helpers

export const workoutKeys = {
  all: ['workout'] as const,
  exerciseIds: ['workout', 'exerciseIds'] as const,
  profiles: (userId: string) => ['workout', 'profiles', userId] as const,
  program: (userId: string) => ['workout', 'program', userId] as const,
  sets: (userId: string, days: number) => ['workout', 'sets', userId, days] as const,
  sessions: (userId: string, from: string) => ['workout', 'sessions', userId, from] as const,
  records: (userId: string, slug: string) => ['workout', 'records', userId, slug] as const,
  history: (userId: string, slug: string) => ['workout', 'history', userId, slug] as const,
  readiness: (userId: string, day: string) => ['workout', 'readiness', userId, day] as const,
};

/** True when data can be read from / written to Supabase (signed in + configured). */
export function useCanSync(): boolean {
  const { user } = useAuth();
  return !!user && isSupabaseConfigured;
}

export function todayLocal(now: Date = new Date()): string {
  return time.localDate(now, deviceTimeZone());
}

const num = (v: number | string | null | undefined): number | null =>
  v === null || v === undefined ? null : typeof v === 'number' ? v : Number(v);

type ExerciseIdMap = { bySlug: Map<string, string>; byId: Map<string, string> };

async function fetchExerciseIds(): Promise<ExerciseIdMap> {
  assertSupabase();
  const { data, error } = await supabase.from('exercises').select('id, slug');
  if (error) throw error;
  const bySlug = new Map<string, string>();
  const byId = new Map<string, string>();
  for (const row of data) {
    bySlug.set(row.slug, row.id);
    byId.set(row.id, row.slug);
  }
  return { bySlug, byId };
}

function exerciseIds(qc: QueryClient): Promise<ExerciseIdMap> {
  return qc.ensureQueryData({ queryKey: workoutKeys.exerciseIds, queryFn: fetchExerciseIds, staleTime: Infinity });
}

function requireId(map: ExerciseIdMap, slug: string): string {
  const id = map.bySlug.get(slug);
  if (!id) throw new Error(`exercise_not_seeded:${slug}`);
  return id;
}

// ---------------------------------------------------------------------------------------------
// Equipment profiles (WRK-02 / WRK-18)

const inventorySchema = z
  .object({
    bars: z.array(z.object({ type: z.string(), kg: z.number().positive() })).optional(),
    plates_kg: z.array(z.number().positive()).optional(),
    plate_counts: z.record(z.string(), z.number().int().nonnegative()).optional(),
    dumbbells_kg: z.array(z.number().positive()).optional(),
    machines: z
      .record(z.string(), z.object({ step_kg: z.number().positive(), min_kg: z.number().optional(), max_kg: z.number().optional() }))
      .optional(),
    bands: z.array(z.object({ color: z.string(), kg_equiv: z.number().nonnegative() })).optional(),
    kettlebells_kg: z.array(z.number().positive()).optional(),
  })
  .catch({});

export function parseInventory(value: Json | null | undefined): workout.GymInventory {
  return inventorySchema.parse(value ?? {});
}

export const EQUIPMENT_CODES: readonly workout.EquipmentCode[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'smith_machine',
  'bodyweight',
  'pullup_bar',
  'band',
  'kettlebell',
];

/** Equipment assumed for each place type until the user edits it. */
export const DEFAULT_EQUIPMENT: Readonly<Record<workout.EquipmentProfileKind, readonly workout.EquipmentCode[]>> = {
  gym: EQUIPMENT_CODES,
  home: ['dumbbell', 'band', 'kettlebell', 'bodyweight', 'pullup_bar'],
  bodyweight: ['bodyweight'],
};

/** Band presets shown before the user declares their own (SpecialLoad mockup). */
export const DEFAULT_BANDS: readonly { color: string; kg_equiv: number }[] = [
  { color: 'yellow', kg_equiv: 5 },
  { color: 'red', kg_equiv: 11 },
  { color: 'blue', kg_equiv: 16 },
  { color: 'black', kg_equiv: 23 },
];

export interface GymProfile {
  id: string | null;
  name: string;
  kind: workout.EquipmentProfileKind;
  equipment: workout.EquipmentCode[];
  inventory: workout.GymInventory;
  isDefault: boolean;
}

const kindSchema = z.enum(['gym', 'home', 'bodyweight']);
const equipmentSchema = z.enum(EQUIPMENT_CODES as [workout.EquipmentCode, ...workout.EquipmentCode[]]);

function toProfile(row: Tables<'equipment_profiles'>): GymProfile {
  const kind = kindSchema.catch('gym').parse(row.kind);
  const equipment = row.equipment_codes.flatMap((c) => {
    const r = equipmentSchema.safeParse(c);
    return r.success ? [r.data] : [];
  });
  return {
    id: row.id,
    name: row.name,
    kind,
    equipment: equipment.length ? equipment : [...DEFAULT_EQUIPMENT[kind]],
    inventory: parseInventory(row.inventory),
    isDefault: row.is_default,
  };
}

export function useEquipmentProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.profiles(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<GymProfile[]> => {
      assertSupabase();
      const { data, error } = await supabase.from('equipment_profiles').select('*').order('created_at');
      if (error) throw error;
      return data.map(toProfile);
    },
  });
}

/** The profile for a place type: saved one (signed in), local edits (preview) or defaults. */
export function useGymProfile(kind: workout.EquipmentProfileKind): { profile: GymProfile; isLoading: boolean } {
  const profiles = useEquipmentProfiles();
  const local = useWorkoutStore((s) => s.localInventory[kind]);
  const saved = profiles.data?.find((p) => p.kind === kind);
  if (saved) return { profile: saved, isLoading: false };
  return {
    profile: {
      id: null,
      name: '',
      kind,
      equipment: [...DEFAULT_EQUIPMENT[kind]],
      inventory: local ?? {},
      isDefault: false,
    },
    isLoading: profiles.isLoading,
  };
}

export function useSaveGymProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const setLocal = useWorkoutStore((s) => s.setLocalInventory);
  return useMutation({
    mutationFn: async (profile: GymProfile): Promise<void> => {
      if (!user || !isSupabaseConfigured) {
        setLocal(profile.kind, profile.inventory);
        return;
      }
      const row = {
        name: profile.name,
        kind: profile.kind,
        equipment_codes: profile.equipment,
        inventory: profile.inventory as Json,
      };
      if (profile.id) {
        const { error } = await supabase.from('equipment_profiles').update(row).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('equipment_profiles').insert({ ...row, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', 'profiles'] }),
  });
}

// ---------------------------------------------------------------------------------------------
// Program (WRK-03 / WRK-15 / WRK-20)

export interface PlanSession {
  id: string;
  weekNo: number;
  dayOfWeek: number | null;
  name: string;
  isDeload: boolean;
  rotationIndex: number | null;
  exercises: workout.PlannedExercise[];
}

export interface ActiveProgram {
  id: string;
  split: workout.ProgramSplit;
  daysPerWeek: number;
  totalWeeks: number;
  startedOn: string;
  scheduleMode: workout.ScheduleMode;
  nextRotationIndex: number;
  sessions: PlanSession[];
}

export function useActiveProgram() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.program(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<ActiveProgram | null> => {
      assertSupabase();
      const { data: program, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!program) return null;
      const ids = await exerciseIds(qc);
      const { data: sessions, error: sErr } = await supabase
        .from('planned_sessions')
        .select('*, planned_exercises(*)')
        .eq('program_id', program.id)
        .order('week_no');
      if (sErr) throw sErr;
      return {
        id: program.id,
        split: z.enum(['full_body', 'upper_lower', 'ppl']).catch('full_body').parse(program.split),
        daysPerWeek: program.days_per_week,
        totalWeeks: program.total_weeks ?? 8,
        startedOn: program.started_on,
        scheduleMode: program.schedule_mode === 'rotation' ? 'rotation' : 'weekday',
        nextRotationIndex: program.next_rotation_index,
        sessions: sessions.map((s) => ({
          id: s.id,
          weekNo: s.week_no,
          dayOfWeek: s.day_of_week,
          name: s.name,
          isDeload: s.is_deload,
          rotationIndex: s.rotation_index,
          exercises: s.planned_exercises.flatMap((e) => {
            const slug = ids.byId.get(e.exercise_id);
            if (!slug) return [];
            return [
              {
                exerciseSlug: slug,
                sortOrder: e.sort_order,
                sets: e.sets,
                repMin: e.rep_min ?? workout.getExercise(slug)?.defaultRepMin ?? 8,
                repMax: e.rep_max ?? workout.getExercise(slug)?.defaultRepMax ?? 12,
                targetRir: e.target_rir,
                restSec: e.rest_sec ?? workout.getExercise(slug)?.defaultRestSec ?? 90,
                targetLoadKg: num(e.target_load_kg),
                backupExerciseSlug: e.backup_exercise_id ? (ids.byId.get(e.backup_exercise_id) ?? null) : null,
                isExtra: e.is_extra,
              },
            ];
          }),
        })),
      };
    },
  });
}

export interface CreateProgramInput {
  program: workout.GeneratedProgram;
  sessionName: (rotationIndex: number) => string;
  equipmentProfileId?: string | null;
}

export function useCreateProgram() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ program, sessionName, equipmentProfileId }: CreateProgramInput): Promise<string> => {
      if (!user) throw new Error('not_signed_in');
      assertSupabase();
      const ids = await exerciseIds(qc);
      const archived = await supabase.from('programs').update({ status: 'archived' }).eq('status', 'active');
      if (archived.error) throw archived.error;
      const { data: created, error } = await supabase
        .from('programs')
        .insert({
          user_id: user.id,
          goal_type: program.goalType,
          split: program.split,
          days_per_week: program.daysPerWeek,
          session_minutes: program.sessionMinutes,
          total_weeks: program.totalWeeks,
          generator_version: program.generatorVersion,
          schedule_mode: program.scheduleMode,
          next_rotation_index: 0,
          started_on: todayLocal(),
        })
        .select('id')
        .single();
      if (error) throw error;
      const sessions = program.weeks.flatMap((w) => w.sessions);
      const sessionRows: TablesInsert<'planned_sessions'>[] = sessions.map((s) => ({
        program_id: created.id,
        user_id: user.id,
        week_no: s.weekNo,
        day_of_week: s.dayOfWeek,
        name: sessionName(s.rotationIndex),
        is_deload: s.isDeload,
        rotation_index: s.rotationIndex,
        equipment_profile_id: equipmentProfileId ?? null,
      }));
      const { data: inserted, error: sErr } = await supabase.from('planned_sessions').insert(sessionRows).select('id');
      if (sErr) throw sErr;
      const exerciseRows: TablesInsert<'planned_exercises'>[] = sessions.flatMap((s, i) =>
        s.exercises.map((e) => ({
          planned_session_id: inserted[i]!.id,
          exercise_id: requireId(ids, e.exerciseSlug),
          sort_order: e.sortOrder,
          sets: e.sets,
          rep_min: e.repMin,
          rep_max: e.repMax,
          target_rir: e.targetRir,
          rest_sec: e.restSec,
          target_load_kg: e.targetLoadKg,
          is_extra: e.isExtra,
          backup_exercise_id: e.backupExerciseSlug ? (ids.bySlug.get(e.backupExerciseSlug) ?? null) : null,
        }))
      );
      for (let i = 0; i < exerciseRows.length; i += 400) {
        const { error: eErr } = await supabase.from('planned_exercises').insert(exerciseRows.slice(i, i + 400));
        if (eErr) throw eErr;
      }
      return created.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', 'program'] }),
  });
}

/** Training preferences used by the generator (latest goal + experience level). */
export function useTrainingPrefs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout', 'prefs', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<{ goal: workout.GoalType; level: workout.ExperienceLevel | null }> => {
      assertSupabase();
      const [goal, profile] = await Promise.all([
        supabase.from('goals').select('goal_type').order('effective_from', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('profiles').select('experience_level').eq('user_id', user!.id).maybeSingle(),
      ]);
      if (goal.error) throw goal.error;
      if (profile.error) throw profile.error;
      return {
        goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']).catch('maintain').parse(goal.data?.goal_type),
        level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().catch(null).parse(profile.data?.experience_level ?? null),
      };
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Sessions & sets (WRK-04 / WRK-05 / WRK-07)

export interface SessionRow {
  id: string;
  localDate: string;
  status: string;
  plannedSessionId: string | null;
}

export function useWorkoutSessions(fromDate: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.sessions(user?.id ?? 'anonymous', fromDate),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<SessionRow[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, local_date, status, planned_session_id')
        .gte('local_date', fromDate)
        .order('local_date');
      if (error) throw error;
      return data.map((r) => ({ id: r.id, localDate: r.local_date, status: r.status, plannedSessionId: r.planned_session_id }));
    },
  });
}

const SET_COLUMNS =
  'id, session_id, exercise_id, set_no, load_kg, reps, duration_sec, rir, rpe, is_warmup, completed_at, added_load_kg, side' as const;

type SetRow = Pick<
  Tables<'set_logs'>,
  | 'id'
  | 'session_id'
  | 'exercise_id'
  | 'set_no'
  | 'load_kg'
  | 'reps'
  | 'duration_sec'
  | 'rir'
  | 'rpe'
  | 'is_warmup'
  | 'completed_at'
  | 'added_load_kg'
  | 'side'
>;

function toSetLog(row: SetRow, ids: ExerciseIdMap): workout.SetLog | null {
  const slug = ids.byId.get(row.exercise_id);
  if (!slug) return null;
  return {
    exerciseSlug: slug,
    sessionId: row.session_id,
    setNo: row.set_no,
    loadKg: num(row.load_kg),
    reps: row.reps,
    durationSec: row.duration_sec,
    rir: row.rir,
    rpe: num(row.rpe),
    isWarmup: row.is_warmup,
    completedAt: row.completed_at,
    addedLoadKg: num(row.added_load_kg),
    side: row.side === 'left' || row.side === 'right' ? row.side : 'both',
  };
}

/** Sets of the last `days` days (recovery: 7-day window; volume: current week). */
export function useRecentSetLogs(days = 8) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.sets(user?.id ?? 'anonymous', days),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<workout.SetLog[]> => {
      assertSupabase();
      const ids = await exerciseIds(qc);
      const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();
      const { data, error } = await supabase
        .from('set_logs')
        .select(SET_COLUMNS)
        .gte('completed_at', since)
        .order('completed_at');
      if (error) throw error;
      return data.flatMap((r) => toSetLog(r, ids) ?? []);
    },
  });
}

/**
 * Training sets for recovery / volume / readiness: server sets when signed in, otherwise the
 * sets logged on this device in preview mode.
 */
export function useTrainingSets(days = 8): { sets: workout.SetLog[]; isLoading: boolean; isError: boolean; refetch: () => void } {
  const canSync = useCanSync();
  const remote = useRecentSetLogs(days);
  const local = useWorkoutStore((s) => s.localHistory);
  if (!canSync) return { sets: local, isLoading: false, isError: false, refetch: () => undefined };
  return {
    sets: remote.data ?? [],
    isLoading: remote.isLoading,
    isError: remote.isError,
    refetch: () => void remote.refetch(),
  };
}

export function useStartWorkoutSession() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      plannedSessionId: string | null;
      equipmentProfileId: string | null;
      readiness: number | null;
      readinessApplied: boolean;
    }): Promise<string> => {
      if (!user) throw new Error('not_signed_in');
      assertSupabase();
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          local_date: todayLocal(),
          planned_session_id: input.plannedSessionId,
          equipment_profile_id: input.equipmentProfileId,
          readiness: input.readiness,
          readiness_applied: input.readinessApplied,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
  });
}

export interface LogSetInput {
  sessionId: string;
  slug: string;
  setNo: number;
  loadKg: number | null;
  reps: number;
  rir: number | null;
  completedAt: string;
  addedLoadKg: number | null;
  side: workout.SetSide;
  bands: workout.BandUse[] | null;
}

export function useLogSet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: LogSetInput): Promise<string> => {
      if (!user) throw new Error('not_signed_in');
      assertSupabase();
      const ids = await exerciseIds(qc);
      const { data, error } = await supabase
        .from('set_logs')
        .insert({
          session_id: input.sessionId,
          user_id: user.id,
          exercise_id: requireId(ids, input.slug),
          set_no: input.setNo,
          load_kg: input.loadKg,
          reps: input.reps,
          rir: input.rir === null ? null : Math.min(5, input.rir),
          completed_at: input.completedAt,
          added_load_kg: input.addedLoadKg,
          side: input.side,
          bands: input.bands ? (input.bands.map((b) => ({ color: b.color, kg_equiv: b.kgEquiv })) as Json) : null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', 'sets'] }),
  });
}

export function useDeleteSetLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      assertSupabase();
      const { error } = await supabase.from('set_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', 'sets'] }),
  });
}

export function useFinishWorkoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      status: 'completed' | 'cancelled';
      programId: string | null;
      rotationIndex: number | null;
      rotationCount: number | null;
    }) => {
      assertSupabase();
      const { error } = await supabase
        .from('workout_sessions')
        .update({ status: input.status, ended_at: new Date().toISOString() })
        .eq('id', input.sessionId);
      if (error) throw error;
      if (input.status === 'completed' && input.programId && input.rotationIndex !== null && input.rotationCount) {
        const next = workout.advanceRotation(input.rotationIndex, input.rotationCount);
        const { error: pErr } = await supabase
          .from('programs')
          .update({ next_rotation_index: next })
          .eq('id', input.programId);
        if (pErr) throw pErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}

// ---------------------------------------------------------------------------------------------
// Records & history (WRK-07, exercise detail)

/** Previous bests from the server-written `personal_records` (read-only). */
export function usePersonalBests(slug: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.records(user?.id ?? 'anonymous', slug ?? ''),
    enabled: !!user && isSupabaseConfigured && !!slug,
    queryFn: async (): Promise<workout.PersonalBests> => {
      assertSupabase();
      const ids = await exerciseIds(qc);
      const id = ids.bySlug.get(slug!);
      if (!id) return {};
      const { data, error } = await supabase.from('personal_records').select('kind, value').eq('exercise_id', id);
      if (error) throw error;
      const out: workout.PersonalBests = {};
      for (const r of data) {
        const kind = r.kind as workout.PersonalRecordKind;
        if (kind === 'max_load' || kind === 'est_1rm' || kind === 'max_reps' || kind === 'max_time') {
          out[kind] = Math.max(out[kind] ?? 0, Number(r.value));
        }
      }
      return out;
    },
  });
}

export interface HistoryEntry {
  sessionId: string;
  date: string;
  sets: { loadKg: number | null; reps: number | null }[];
}

/** Last sessions of one exercise (newest first) + all their sets as core logs. */
export function useExerciseHistory(slug: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.history(user?.id ?? 'anonymous', slug ?? ''),
    enabled: !!user && isSupabaseConfigured && !!slug,
    queryFn: async (): Promise<{ entries: HistoryEntry[]; logs: workout.SetLog[] }> => {
      assertSupabase();
      const ids = await exerciseIds(qc);
      const id = ids.bySlug.get(slug!);
      if (!id) return { entries: [], logs: [] };
      const { data, error } = await supabase
        .from('set_logs')
        .select(SET_COLUMNS)
        .eq('exercise_id', id)
        .order('completed_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      const logs = data.flatMap((r) => toSetLog(r, ids) ?? []);
      const bySession = new Map<string, HistoryEntry>();
      for (const r of data) {
        const entry = bySession.get(r.session_id) ?? { sessionId: r.session_id, date: r.completed_at, sets: [] };
        entry.sets.unshift({ loadKg: num(r.load_kg), reps: r.reps });
        bySession.set(r.session_id, entry);
      }
      return { entries: [...bySession.values()].slice(0, 5), logs };
    },
  });
}

/** Last used load per exercise (from recent sets) – seeds the first set of a new session. */
export function lastLoadBySlug(sets: readonly workout.SetLog[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sets) if (!s.isWarmup && s.loadKg != null && s.loadKg > 0) out[s.exerciseSlug] = s.loadKg;
  return out;
}

export interface ExerciseContent {
  stepsVi: string[];
  stepsEn: string[];
  tipsVi: string[];
  tipsEn: string[];
  /** Public URL of the primary licensed media (exercise-media bucket), if any. */
  mediaUrl: string | null;
}

/** Guide steps / tips / media of one exercise from the catalog (read-only). */
export function useExerciseContent(slug: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout', 'content', slug ?? ''],
    enabled: !!user && isSupabaseConfigured && !!slug,
    staleTime: Infinity,
    queryFn: async (): Promise<ExerciseContent | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('exercises')
        .select('steps_vi, steps_en, tips_vi, tips_en, exercise_media(storage_path, is_primary)')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const media = data.exercise_media.find((m) => m.is_primary) ?? data.exercise_media[0];
      return {
        stepsVi: data.steps_vi,
        stepsEn: data.steps_en,
        tipsVi: data.tips_vi,
        tipsEn: data.tips_en,
        mediaUrl: media ? supabase.storage.from('exercise-media').getPublicUrl(media.storage_path).data.publicUrl : null,
      };
    },
  });
}

/** Latest logged body weight (kg) – special loads (WRK-19) use it for bodyweight moves. */
export function useLatestBodyweight() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout', 'bodyweight', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<number | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('health_samples')
        .select('value')
        .eq('type', 'weight')
        .order('start_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return num(data?.value);
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Readiness inputs (WRK-06)

export interface ReadinessData {
  sleepQuality: number | null;
  sleepMin: number | null;
  kcalYesterday: number | null;
  kcalTargetYesterday: number | null;
  restingHr: number | null;
}

export function useReadinessData(today: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutKeys.readiness(user?.id ?? 'anonymous', today),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<ReadinessData> => {
      assertSupabase();
      const yesterday = time.addDays(today, -1);
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('local_date, sleep_quality, sleep_min, kcal_in, kcal_target, resting_hr')
        .in('local_date', [yesterday, today]);
      if (error) throw error;
      const t = data.find((r) => r.local_date === today);
      const y = data.find((r) => r.local_date === yesterday);
      return {
        sleepQuality: t?.sleep_quality ?? null,
        sleepMin: t?.sleep_min ?? null,
        kcalYesterday: num(y?.kcal_in),
        kcalTargetYesterday: y?.kcal_target ?? null,
        restingHr: t?.resting_hr ?? null,
      };
    },
  });
}
