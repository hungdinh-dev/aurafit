import type { Database } from '@aurafit/db';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env, isSupabaseConfigured } from './env';
import { secureStorage } from './secureStorage';

export { isSupabaseConfigured };

/** Thrown by data/auth helpers when EXPO_PUBLIC_SUPABASE_* are missing (dev without .env). */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).');
    this.name = 'SupabaseNotConfiguredError';
  }
}

/**
 * Typed Supabase client (`Database` from @aurafit/db).
 * Without config it points at a dummy URL so imports never crash; call `assertSupabase()` (or check
 * `isSupabaseConfigured`) before network calls.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl ?? 'https://not-configured.invalid',
  env.supabaseAnonKey ?? 'not-configured',
  {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

export function assertSupabase(): void {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
}

// Refresh tokens only while the app is in the foreground (Supabase React Native guide).
if (isSupabaseConfigured && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
