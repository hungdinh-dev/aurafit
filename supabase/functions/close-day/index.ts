// POST /functions/v1/close-day  (service only: Bearer CRON_SECRET or service role key)
// Called hourly by pg_cron (see migrations/…_close_day_cron.sql). For every user whose local
// clock passed 03:00 of the next day (public.due_close_days), it loads the day (load.ts), runs
// `coach.closeDay` from @aurafit/core (coach-adapter.ts) and persists everything atomically via
// public.apply_close_day (idempotent: a day is never closed twice). Then updates duo streaks.
//
// Body (all optional): { now?: ISO timestamp, user_id?: uuid, max_backfill_days?: 1–14,
//                        limit?: number, dry_run?: boolean }
import { z } from 'zod';
import type { Json } from '@aurafit/db';
import { json, readJson, serve } from '../_shared/http.ts';
import { createAdminClient, type Db, requireServiceCaller } from '../_shared/supabase.ts';
import { closeLoadedDay, ENGINE_NAME } from './coach-adapter.ts';
import { updateDuoStreaks } from './duo.ts';
import { loadDay } from './load.ts';
import type { CloseDayPayload } from './types.ts';

const BodySchema = z.object({
  now: z.string().datetime({ offset: true }).optional(),
  user_id: z.string().uuid().optional(),
  max_backfill_days: z.number().int().min(1).max(14).optional().default(3),
  limit: z.number().int().min(1).max(5000).optional().default(500),
  dry_run: z.boolean().optional().default(false),
});

const USER_CONCURRENCY = 4;

type Outcome =
  | { user_id: string; local_date: string; status: 'applied' | 'already_closed' }
  | { user_id: string; local_date: string; status: 'dry_run'; payload: CloseDayPayload }
  | { user_id: string; local_date: string; status: 'error'; error: string };

async function closeUserDay(admin: Db, userId: string, localDate: string, timezone: string, dryRun: boolean): Promise<Outcome> {
  try {
    const day = await loadDay(admin, userId, localDate, timezone);
    const payload = closeLoadedDay(day);
    if (dryRun) return { user_id: userId, local_date: localDate, status: 'dry_run', payload };
    const { data, error } = await admin.rpc('apply_close_day', { p: payload as unknown as Json });
    if (error) throw error;
    return { user_id: userId, local_date: localDate, status: data ? 'applied' : 'already_closed' };
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    if (message.startsWith('day_already_closed:')) {
      return { user_id: userId, local_date: localDate, status: 'already_closed' };
    }
    console.error('close-day failed', userId, localDate, message);
    return { user_id: userId, local_date: localDate, status: 'error', error: message };
  }
}

serve(async (req) => {
  requireServiceCaller(req);
  const body = await readJson(req, BodySchema);
  const admin = createAdminClient();

  const { data: due, error } = await admin.rpc('due_close_days', {
    p_now: body.now ?? new Date().toISOString(),
    p_max_backfill: body.max_backfill_days,
    p_limit: body.limit,
  });
  if (error) throw error;

  // Days of one user must be closed in date order (state carries over); users run in parallel.
  const byUser = new Map<string, Array<{ local_date: string; timezone: string }>>();
  for (const row of due ?? []) {
    if (body.user_id && row.user_id !== body.user_id) continue;
    const list = byUser.get(row.user_id) ?? [];
    list.push({ local_date: row.local_date, timezone: row.timezone });
    byUser.set(row.user_id, list);
  }

  const outcomes: Outcome[] = [];
  const queue = [...byUser.entries()];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [userId, days] = next;
      for (const d of days.sort((a, b) => a.local_date.localeCompare(b.local_date))) {
        const outcome = await closeUserDay(admin, userId, d.local_date, d.timezone, body.dry_run);
        outcomes.push(outcome);
        // Stop on error (keep later days for the next run). In dry-run, later days would be
        // computed from unsaved state, so only the first due day per user is meaningful.
        if (outcome.status === 'error' || body.dry_run) break;
      }
    }
  };
  await Promise.all(Array.from({ length: USER_CONCURRENCY }, worker));

  const appliedDates = outcomes.filter((o) => o.status === 'applied').map((o) => o.local_date);
  const duoUpdated = body.dry_run || appliedDates.length === 0 ? 0 : await updateDuoStreaks(admin, appliedDates);

  return json({
    engine: ENGINE_NAME,
    due: due?.length ?? 0,
    applied: outcomes.filter((o) => o.status === 'applied').length,
    already_closed: outcomes.filter((o) => o.status === 'already_closed').length,
    failed: outcomes.filter((o) => o.status === 'error').length,
    duo_streaks_updated: duoUpdated,
    outcomes: body.dry_run || outcomes.length <= 50 ? outcomes : outcomes.filter((o) => o.status === 'error'),
  });
});
