import type { TablesUpdate } from '@aurafit/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertSupabase, supabase } from '@/lib/supabase';

/** Columns of `profiles` the settings screen may change. */
export type ProfilePatch = Pick<TablesUpdate<'profiles'>, 'character' | 'character_name' | 'locale'>;

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      assertSupabase();
      if (!user) throw new Error('not_signed_in');
      const { error } = await supabase.from('profiles').update(patch).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
