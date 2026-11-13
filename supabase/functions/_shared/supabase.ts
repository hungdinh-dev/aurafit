import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@aurafit/db';
import { env, envOptional } from './env.ts';
import { HttpError } from './http.ts';

export type Db = SupabaseClient<Database>;

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Service-role client: bypasses RLS. Only for server-authoritative writes. */
export function createAdminClient(): Db {
  return createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), noSession);
}

/** Client acting as the calling user (RLS applies). */
export function createUserClient(authorization: string): Db {
  return createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    ...noSession,
    global: { headers: { Authorization: authorization } },
  });
}

function bearer(req: Request): string | null {
  const header = req.headers.get('Authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
}

/** Verifies the caller's JWT with Supabase Auth (`getUser`) and returns a user-scoped client. */
export async function requireUser(req: Request): Promise<{ user: User; client: Db }> {
  const token = bearer(req);
  if (!token) throw new HttpError(401, 'unauthorized', 'Missing bearer token');
  const client = createUserClient(`Bearer ${token}`);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Invalid or expired session');
  return { user: data.user, client };
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** True when the caller presents CRON_SECRET or the service role key as bearer token. */
export function isServiceCaller(req: Request): boolean {
  const token = bearer(req);
  if (!token) return false;
  const secrets = [envOptional('CRON_SECRET'), envOptional('SUPABASE_SERVICE_ROLE_KEY')].filter(
    (s): s is string => typeof s === 'string' && s.length >= 16,
  );
  return secrets.some((s) => timingSafeEqual(token, s));
}

export function requireServiceCaller(req: Request): void {
  if (!isServiceCaller(req)) throw new HttpError(401, 'unauthorized', 'Service credentials required');
}
