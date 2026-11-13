import { AuthError } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import { ZodError } from 'zod';

import { SupabaseNotConfiguredError } from '@/lib/supabase';

/** Map an auth failure to a translated, user-facing message. */
export function authErrorMessage(error: unknown, t: TFunction<['auth', 'common']>, field: 'email' | 'code' = 'email') {
  if (error instanceof SupabaseNotConfiguredError) return t('common:errors.notConfigured');
  if (error instanceof ZodError) return field === 'email' ? t('auth:errors.invalidEmail') : t('auth:errors.invalidCode');
  if (error instanceof AuthError) {
    if (error.code === 'otp_expired' || error.code === 'invalid_credentials') return t('auth:errors.wrongCode');
    if (error.status === 0 || /network|fetch/i.test(error.message)) return t('common:errors.network');
  }
  return t('auth:errors.failed');
}
