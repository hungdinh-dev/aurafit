import { useMutation, useQueryClient } from '@tanstack/react-query';

import { localToday } from '@/features/coach/lib/clock';
import { toJson } from '@/features/coach/lib/json';
import { useCompleteOnboarding } from '@/features/profile/api';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { deviceTimeZone } from '@/lib/locale';
import { assertSupabase, supabase } from '@/lib/supabase';

import { birthDateFromYear, computeOnboardingTargets, type OnboardingDraft } from './store';

/**
 * Saves everything collected in onboarding (ONB-03/04/05, NUT-01) and then marks onboarding
 * complete (which re-routes to the tabs). Targets are stored as a `manual` row: RLS only lets
 * clients insert `manual` nutrition_targets (server writes `initial`/`weekly_adjust`).
 */
export function useFinishOnboarding() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [language] = useLanguage();
  const complete = useCompleteOnboarding();
  return useMutation({
    mutationFn: async (draft: OnboardingDraft) => {
      if (user) {
        assertSupabase();
        const today = localToday();
        const { result } = computeOnboardingTargets(draft, today);
        if (!result) throw new Error('invalid_body_profile');

        const { error: pErr } = await supabase
          .from('profiles')
          .update({
            sex: draft.sex,
            birth_date: birthDateFromYear(draft.birthYear),
            height_cm: draft.heightCm,
            activity_level: draft.activity,
            character: draft.character,
            character_name: draft.characterName.trim().slice(0, 30) || null,
            locale: language,
            timezone: deviceTimeZone(),
          })
          .eq('user_id', user.id);
        if (pErr) throw pErr;

        const { error: gErr } = await supabase
          .from('goals')
          .insert({ user_id: user.id, goal_type: draft.goal, pace: draft.pace, effective_from: today });
        if (gErr) throw gErr;

        const { error: wErr } = await supabase.from('health_samples').insert({
          user_id: user.id,
          type: 'weight',
          unit: 'kg',
          value: Math.round(draft.weightKg * 10) / 10,
          source: 'manual',
          start_at: new Date().toISOString(),
          local_date: today,
          metadata: { origin: 'onboarding' },
        });
        if (wErr) throw wErr;

        const { error: tErr } = await supabase.from('nutrition_targets').insert({
          user_id: user.id,
          reason: 'manual',
          effective_from: today,
          ...result.targets,
          explanation: toJson({ ...result.explanation, origin: 'onboarding' }),
        });
        if (tErr) throw tErr;

        const { error: cErr } = await supabase
          .from('coach_settings')
          .update({ strictness: draft.strictness, voice: draft.voice, free_days_per_week: draft.freeDaysPerWeek })
          .eq('user_id', user.id);
        if (cErr) throw cErr;
      }
      await complete.mutateAsync();
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
