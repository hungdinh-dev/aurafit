import type { Tables } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

import { MAX_ACTIVE_TASKS } from './logic';

export type TaskTemplate = Tables<'task_templates'>;
export type TaskDefinition = Tables<'task_definitions'>;
export type TaskLog = Tables<'task_logs'>;

export const taskKeys = {
  all: ['tasks'] as const,
  templates: ['tasks', 'templates'] as const,
  definitions: (uid: string) => ['tasks', 'definitions', uid] as const,
  logs: (uid: string, day: string) => ['tasks', 'logs', uid, day] as const,
};

export function useTaskTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: taskKeys.templates,
    enabled: !!user && isSupabaseConfigured,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<TaskTemplate[]> => {
      assertSupabase();
      const { data, error } = await supabase.from('task_templates').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Active task definitions (max 7). */
export function useTaskDefinitions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: taskKeys.definitions(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<TaskDefinition[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('task_definitions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTaskLogs(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: taskKeys.logs(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<TaskLog[]> => {
      assertSupabase();
      const { data, error } = await supabase.from('task_logs').select('*').eq('user_id', user!.id).eq('local_date', day);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Upserts today's log of a task (unique task_id + local_date), optimistic. */
export function useSetTaskLog(day: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = taskKeys.logs(user?.id ?? 'anonymous', day);
  return useMutation({
    mutationFn: async (input: { taskId: string; value: number; completed: boolean; source?: 'manual' | 'timer' }) => {
      assertSupabase();
      if (!user) throw new Error('not_signed_in');
      const { error } = await supabase.from('task_logs').upsert(
        {
          task_id: input.taskId,
          user_id: user.id,
          local_date: day,
          value: Math.max(0, input.value),
          is_completed: input.completed,
          source: input.source ?? 'manual',
        },
        { onConflict: 'task_id,local_date' },
      );
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskLog[]>(key);
      const rest = (previous ?? []).filter((l) => l.task_id !== input.taskId);
      const base = (previous ?? []).find((l) => l.task_id === input.taskId);
      qc.setQueryData<TaskLog[]>(key, [
        ...rest,
        {
          id: base?.id ?? `optimistic-${input.taskId}`,
          task_id: input.taskId,
          user_id: user?.id ?? '',
          local_date: day,
          value: input.value,
          is_completed: input.completed,
          source: input.source ?? 'manual',
          note: base?.note ?? null,
          photo_path: base?.photo_path ?? null,
          updated_at: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export class TaskLimitError extends Error {
  constructor() {
    super('task_limit');
    this.name = 'TaskLimitError';
  }
}

/** Adds a task from a template (TSK-03) or a custom "check" task. */
export function useAddTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { template?: TaskTemplate; title: string; activeCount: number }) => {
      assertSupabase();
      if (!user) throw new Error('not_signed_in');
      if (input.activeCount >= MAX_ACTIVE_TASKS) throw new TaskLimitError();
      const t = input.template;
      const { error } = await supabase.from('task_definitions').insert({
        user_id: user.id,
        template_code: t?.code ?? null,
        title: input.title.trim().slice(0, 80),
        kind: t?.kind ?? 'check',
        target_value: t?.default_target_value ?? null,
        unit: t?.unit ?? null,
        auto_source: t?.auto_source ?? null,
        sort_order: input.activeCount,
      });
      if (error) {
        if (error.code === 'P0001') throw new TaskLimitError();
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

/** Deactivates a task (history is kept). */
export function useRemoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      assertSupabase();
      const { error } = await supabase.from('task_definitions').update({ is_active: false }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

/** Records a focus session (TSK-02). Returns the row id. */
export function useStartFocusSession() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { taskId: string | null; plannedMin: number }): Promise<string | null> => {
      if (!user || !isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, task_id: input.taskId, planned_min: input.plannedMin })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
  });
}

export function useFinishFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; completed: boolean }) => {
      assertSupabase();
      const { error } = await supabase
        .from('focus_sessions')
        .update({ ended_at: new Date().toISOString(), completed: input.completed })
        .eq('id', input.sessionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
