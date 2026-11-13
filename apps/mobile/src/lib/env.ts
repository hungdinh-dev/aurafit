import { z } from 'zod';

/**
 * Public runtime config. Only EXPO_PUBLIC_* vars are inlined by Metro, and only when accessed
 * statically (process.env.EXPO_PUBLIC_X) – keep the object below literal.
 * Missing/invalid/placeholder values never crash the app: `isSupabaseConfigured` is false and the
 * welcome screen shows a dev warning instead.
 */
const raw = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

/** Empty strings and the `.env.example` placeholders ("YOUR-…") count as "not set". */
const blankToUndefined = (v: unknown) =>
  typeof v !== 'string' || v.trim() === '' || /YOUR-/i.test(v) ? undefined : v.trim();

const schema = {
  EXPO_PUBLIC_SUPABASE_URL: z.preprocess(blankToUndefined, z.url().optional()),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(blankToUndefined, z.string().min(20).optional()),
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.preprocess(blankToUndefined, z.string().optional()),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.preprocess(blankToUndefined, z.string().optional()),
};

const issues: string[] = [];

/** Parse one variable; an invalid value is reported and treated as missing. */
function read(name: keyof typeof schema): string | undefined {
  const result = schema[name].safeParse(raw[name]);
  if (result.success) return result.data;
  issues.push(`${name}: ${result.error.issues[0]?.message ?? 'invalid'}`);
  return undefined;
}

export type Env = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleIosClientId?: string;
  googleWebClientId?: string;
};

export const env: Readonly<Env> = Object.freeze({
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleIosClientId: read('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  googleWebClientId: read('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
});

/** Human-readable env problems (shown in the dev console). */
export const envIssues: readonly string[] = issues;
export const isSupabaseConfigured = !!(env.supabaseUrl && env.supabaseAnonKey);

if (__DEV__ && !isSupabaseConfigured && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[AuraFit] Supabase is not configured – copy apps/mobile/.env.example to apps/mobile/.env.' +
      (issues.length ? `\n${issues.join('\n')}` : '')
  );
}
