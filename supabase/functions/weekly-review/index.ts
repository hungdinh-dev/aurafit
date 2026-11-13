// POST /functions/v1/weekly-review
//
// Two callers:
//  • User (JWT): returns the user's weekly summary (last 7 closed days) and a read-only preview of
//    the adaptive TDEE proposal. No writes.
//  • Service (Bearer CRON_SECRET / service role, hourly on Sun–Mon UTC via pg_cron): for each user
//    whose local time is Sunday ≥ 20:00, runs core `health.adaptTdee` and, when it adjusts, inserts
//    a `nutrition_targets` row (reason 'weekly_adjust', effective tomorrow) with the explanation.
//    Idempotent: skipped when a weekly_adjust row was created in the last 6 days.
// Spec: lifestyle.md §2 (Sunday TDEE), progress-insights.md (weekly summary), nutrition.md §1.6.
import { z } from 'zod';
import type { Json } from '@aurafit/db';
import { json, readJson, serve } from '../_shared/http.ts';
import { createAdminClient, type Db, isServiceCaller, requireUser } from '../_shared/supabase.ts';
import { addDays, isoWeekday, localDateOf, localTimeOf } from '../_shared/time.ts';
import { adaptiveTdee, type AdaptiveTdeeResult, type BodyFacts, safetyFloor } from './adaptive.ts';

const BodySchema = z.object({
  now: z.string().datetime({ offset: true }).optional(),
  dry_run: z.boolean().optional().default(false),
});

/** Days of history passed to core (trend warm-up before the 14-day window). */
const HISTORY_DAYS = 60;

interface WeeklySummary {
  week_end: string;
  days_closed: number;
  avg_score: number | null;
  passed_days: number;
  best_day: { local_date: string; total: number } | null;
  avg_kcal_in: number | null;
  avg_protein_g: number | null;
  weight_trend_change_kg: number | null;
}

async function weeklySummary(db: Db, userId: string, weekEnd: string): Promise<WeeklySummary> {
  const from = addDays(weekEnd, -6);
  const [scores, summaries] = await Promise.all([
    db.from('daily_scores').select('local_date, total, result').eq('user_id', userId)
      .gte('local_date', from).lte('local_date', weekEnd).order('local_date'),
    db.from('daily_summaries').select('local_date, kcal_in, protein_g, weight_trend_kg').eq('user_id', userId)
      .gte('local_date', from).lte('local_date', weekEnd).order('local_date'),
  ]);
  if (scores.error) throw scores.error;
  if (summaries.error) throw summaries.error;
  const s = scores.data ?? [];
  const m = (summaries.data ?? []).filter((d) => Number(d.kcal_in) > 0);
  const trend = (summaries.data ?? []).filter((d) => d.weight_trend_kg !== null);
  const best = s.reduce<{ local_date: string; total: number } | null>(
    (acc, d) => (!acc || d.total > acc.total ? { local_date: d.local_date, total: d.total } : acc), null);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return {
    week_end: weekEnd,
    days_closed: s.length,
    avg_score: avg(s.map((d) => d.total)),
    passed_days: s.filter((d) => d.result !== 'fail').length,
    best_day: best,
    avg_kcal_in: avg(m.map((d) => Number(d.kcal_in))),
    avg_protein_g: avg(m.map((d) => Number(d.protein_g))),
    weight_trend_change_kg: trend.length >= 2
      ? Math.round((Number(trend[trend.length - 1]!.weight_trend_kg) - Number(trend[0]!.weight_trend_kg)) * 100) / 100
      : null,
  };
}

async function proposeTdee(db: Db, userId: string, lastClosed: string) {
  const [target, days, profile] = await Promise.all([
    db.from('nutrition_targets').select('*').eq('user_id', userId).lte('effective_from', addDays(lastClosed, 1))
      .order('effective_from', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('daily_summaries').select('local_date, kcal_in, weight_kg, weight_trend_kg').eq('user_id', userId)
      .gte('local_date', addDays(lastClosed, -(HISTORY_DAYS - 1))).lte('local_date', lastClosed).order('local_date'),
    db.from('profiles').select('sex, birth_date, height_cm').eq('user_id', userId).maybeSingle(),
  ]);
  if (target.error) throw target.error;
  if (days.error) throw days.error;
  if (profile.error) throw profile.error;
  const rows = days.data ?? [];
  const lastTrend = [...rows].reverse().find((d) => d.weight_trend_kg !== null)?.weight_trend_kg ?? null;
  const body: BodyFacts = {
    sex: profile.data?.sex === 'male' || profile.data?.sex === 'female' ? profile.data.sex : null,
    birthDate: profile.data?.birth_date ?? null,
    heightCm: profile.data?.height_cm == null ? null : Number(profile.data.height_cm),
    weightKg: lastTrend === null ? null : Number(lastTrend),
  };
  if (!target.data?.tdee_kcal) return { target: target.data, body, result: null as AdaptiveTdeeResult | null };
  const result = adaptiveTdee(lastClosed, target.data.tdee_kcal, rows.map((d) => ({
    local_date: d.local_date,
    kcal_in: Number(d.kcal_in),
    weight_kg: d.weight_kg === null ? null : Number(d.weight_kg),
  })), body);
  return { target: target.data, body, result };
}

serve(async (req) => {
  const body = await readJson(req, BodySchema);
  const now = body.now ? new Date(body.now) : new Date();

  // ---------------------------------------------------------------- user mode
  if (!isServiceCaller(req)) {
    const { user, client } = await requireUser(req);
    const { data: profile } = await client.from('profiles').select('timezone').eq('user_id', user.id).maybeSingle();
    const tz = profile?.timezone ?? 'Asia/Ho_Chi_Minh';
    const lastClosed = addDays(localDateOf(now, tz), -1);
    const [summary, proposal] = await Promise.all([
      weeklySummary(client, user.id, lastClosed),
      proposeTdee(client, user.id, lastClosed),
    ]);
    return json({ summary, tdee_proposal: proposal.result });
  }

  // ---------------------------------------------------------------- cron mode
  const admin = createAdminClient();
  const { data: profiles, error } = await admin.from('profiles').select('user_id, timezone')
    .not('onboarding_completed_at', 'is', null);
  if (error) throw error;

  const results: Array<Record<string, unknown>> = [];
  for (const p of profiles ?? []) {
    const today = localDateOf(now, p.timezone);
    if (isoWeekday(today) !== 7 || localTimeOf(now, p.timezone) < '20:00') continue;

    const recent = await admin.from('nutrition_targets').select('id').eq('user_id', p.user_id)
      .eq('reason', 'weekly_adjust').gte('created_at', new Date(now.getTime() - 6 * 86_400_000).toISOString()).limit(1);
    if (recent.error) throw recent.error;
    if ((recent.data ?? []).length > 0) continue;

    const lastClosed = addDays(today, -1);
    const { target, body: facts, result } = await proposeTdee(admin, p.user_id, lastClosed);
    const summary = await weeklySummary(admin, p.user_id, lastClosed);
    if (!target || !result || result.status !== 'adjusted') {
      results.push({ user_id: p.user_id, adjusted: false, status: result?.status ?? 'no_tdee', reasons: result?.reasons ?? [], summary });
      continue;
    }

    const floor = safetyFloor(facts, lastClosed);
    const kcal = Math.max(floor, target.kcal + result.deltaKcal);
    const applied = kcal - target.kcal;
    const row = {
      user_id: p.user_id,
      effective_from: addDays(today, 1),
      tdee_kcal: result.newTdeeKcal,
      kcal,
      protein_g: target.protein_g,
      carb_g: Math.max(0, target.carb_g + Math.round(applied / 4)),
      fat_g: target.fat_g,
      sugar_g: target.sugar_g,
      fiber_g: target.fiber_g,
      sodium_mg: target.sodium_mg,
      reason: 'weekly_adjust',
      explanation: {
        ...result.explanation,
        previousTdeeKcal: result.previousTdeeKcal,
        newTdeeKcal: result.newTdeeKcal,
        observedTdeeKcal: result.observedTdeeKcal,
        deltaKcal: result.deltaKcal,
        reasons: result.reasons,
        floorKcal: floor,
        floorApplied: kcal !== target.kcal + result.deltaKcal,
      } as unknown as Json,
    };
    if (!body.dry_run) {
      const ins = await admin.from('nutrition_targets').insert(row);
      if (ins.error) throw ins.error;
    }
    results.push({ user_id: p.user_id, adjusted: true, tdee: { from: result.previousTdeeKcal, to: result.newTdeeKcal }, kcal, summary });
  }

  return json({ processed: results.length, dry_run: body.dry_run, results });
});
