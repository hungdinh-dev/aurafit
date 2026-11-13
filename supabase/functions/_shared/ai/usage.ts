// ai_requests logging and daily quotas (02-nutrition.md ai_requests, tech-stack.md quotas).
import type { Db } from '../supabase.ts';
import { localDateOf, startOfLocalDay } from '../time.ts';
import type { AiUsage, Locale } from './types.ts';

export type AiRequestKind = 'meal_image' | 'meal_text' | 'reanalyze';
export type AiRequestStatus = 'ok' | 'error' | 'quota_exceeded';

export interface UserAiContext {
  timezone: string;
  locale: Locale;
  photoQuota: number;
}

export async function getUserAiContext(admin: Db, userId: string): Promise<UserAiContext> {
  const [profile, settings] = await Promise.all([
    admin.from('profiles').select('timezone, locale').eq('user_id', userId).maybeSingle(),
    admin.from('coach_settings').select('photo_quota_per_day').eq('user_id', userId).maybeSingle(),
  ]);
  if (profile.error) throw profile.error;
  if (settings.error) throw settings.error;
  return {
    timezone: profile.data?.timezone ?? 'Asia/Ho_Chi_Minh',
    locale: profile.data?.locale === 'en' ? 'en' : 'vi',
    photoQuota: settings.data?.photo_quota_per_day ?? 15,
  };
}

/** Successful requests of the given kinds since the user's local midnight. */
export async function countRequestsToday(
  admin: Db,
  userId: string,
  timezone: string,
  kinds: AiRequestKind[],
): Promise<number> {
  const since = startOfLocalDay(localDateOf(new Date(), timezone), timezone);
  const { count, error } = await admin
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('kind', kinds)
    .eq('status', 'ok')
    .gte('created_at', since.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export interface AiLogEntry {
  userId: string;
  kind: AiRequestKind;
  status: AiRequestStatus;
  usage: Partial<AiUsage> & { provider: string; model: string };
  error?: string;
}

/** Logs every AI call (ok / error / quota_exceeded). Never throws: logging must not break the request. */
export async function logAiRequest(admin: Db, entry: AiLogEntry): Promise<string | null> {
  const { data, error } = await admin
    .from('ai_requests')
    .insert({
      user_id: entry.userId,
      kind: entry.kind,
      provider: entry.usage.provider,
      model: entry.usage.model,
      input_tokens: entry.usage.inputTokens ?? 0,
      output_tokens: entry.usage.outputTokens ?? 0,
      cost_usd: entry.usage.costUsd ?? 0,
      latency_ms: entry.usage.latencyMs ?? null,
      status: entry.status,
      error: entry.error?.slice(0, 500) ?? null,
    })
    .select('id')
    .single();
  if (error) {
    console.error('ai_requests insert failed', error);
    return null;
  }
  return data.id;
}
