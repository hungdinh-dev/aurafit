// Duo streaks (07-friends.md, gamification.md §10): +1 when both friends pass the day
// (a day saved by a shield counts as passed); otherwise reset to 0. Counted once per date.
import type { Db } from '../_shared/supabase.ts';

export async function updateDuoStreaks(admin: Db, dates: string[]): Promise<number> {
  let updated = 0;
  for (const date of [...new Set(dates)].sort()) {
    const { data: duos, error } = await admin
      .from('duo_streaks')
      .select('id, user_a, user_b, streak, best_streak, started_at, last_counted_date')
      .eq('status', 'active')
      .or(`last_counted_date.is.null,last_counted_date.lt.${date}`);
    if (error) throw error;

    for (const duo of duos ?? []) {
      if (duo.started_at.slice(0, 10) > date) continue;
      const { data: scores, error: sErr } = await admin
        .from('daily_scores')
        .select('user_id, result, shield_used')
        .eq('local_date', date)
        .in('user_id', [duo.user_a, duo.user_b]);
      if (sErr) throw sErr;
      if (!scores || scores.length < 2) continue; // wait until both days are closed

      const passed = scores.every((s) => s.result !== 'fail' || s.shield_used);
      const streak = passed ? duo.streak + 1 : 0;
      const { error: uErr } = await admin
        .from('duo_streaks')
        .update({ streak, best_streak: Math.max(duo.best_streak, streak), last_counted_date: date })
        .eq('id', duo.id)
        .or(`last_counted_date.is.null,last_counted_date.lt.${date}`);
      if (uErr) throw uErr;
      updated += 1;
    }
  }
  return updated;
}
