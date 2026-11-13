import type { Tables } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { useAuth } from '@/lib/auth';
import { deviceTimeZone } from '@/lib/locale';
import { queryKeys } from '@/lib/queryClient';
import { kv } from '@/lib/storage';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

export type Profile = Tables<'profiles'>;

/** Reference pattern for feature data: typed select → TanStack Query, keyed per user. */
export function useMyProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: queryKeys.profile(userId ?? 'anonymous'),
    enabled: !!userId && isSupabaseConfigured,
    queryFn: async (): Promise<Profile | null> => {
      assertSupabase();
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

const onboardedKey = (userId: string) => `aurafit.onboarded.${userId}`;
const DEV_PREVIEW_USER = 'dev-preview';

/** Reactive mirror of the persisted local "onboarded" flags. */
const useLocalOnboarding = create<{ done: Record<string, true>; mark: (userId: string) => void }>((set) => ({
  done: {},
  mark: (userId) => {
    kv.setBoolean(onboardedKey(userId), true);
    set((s) => ({ done: { ...s.done, [userId]: true } }));
  },
}));

function useLocalOnboarded(userId: string | null): boolean {
  const marked = useLocalOnboarding((s) => (userId ? !!s.done[userId] : false));
  return marked || (userId ? kv.getBoolean(onboardedKey(userId)) : false);
}

/**
 * Onboarding gate: done when `profiles.onboarding_completed_at` is set. A local flag mirrors it so
 * an offline cold start does not send a returning user back to onboarding.
 * `ready` is false while the first profile fetch is in flight (keep the splash screen up).
 */
export function useOnboardingStatus(): { ready: boolean; completed: boolean } {
  const { user, devPreview } = useAuth();
  const profile = useMyProfile();
  const localUser = user?.id ?? (devPreview ? DEV_PREVIEW_USER : null);
  const localFlag = useLocalOnboarded(localUser);
  if (!user) return { ready: true, completed: localFlag };
  const remote = !!profile.data?.onboarding_completed_at;
  return { ready: !profile.isPending || localFlag || !isSupabaseConfigured, completed: remote || localFlag };
}

/** Marks onboarding as done (M1 replaces the placeholder screens but keeps this mutation). */
export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const { user, devPreview } = useAuth();
  const mark = useLocalOnboarding((s) => s.mark);
  return useMutation({
    mutationFn: async () => {
      if (!user) {
        if (devPreview) mark(DEV_PREVIEW_USER);
        return;
      }
      assertSupabase();
      const { error } = await supabase.from('profiles').upsert(
        { user_id: user.id, onboarding_completed_at: new Date().toISOString(), timezone: deviceTimeZone() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      mark(user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
