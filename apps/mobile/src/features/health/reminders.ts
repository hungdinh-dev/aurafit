import { health } from '@aurafit/core';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { kv } from '@/lib/storage';

const IDS_KEY = 'aurafit.water-reminder-ids';

/** Cancels the water reminders scheduled earlier today. */
export async function cancelWaterReminders(): Promise<void> {
  const raw = kv.getString(IDS_KEY);
  kv.remove(IDS_KEY);
  if (!raw) return;
  try {
    const ids = JSON.parse(raw) as string[];
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  } catch {
    // ignore corrupt value
  }
}

/** Converts plan times (minutes after the wake day's midnight, may be ≥ 1440) to dates. */
export function reminderDates(times: readonly number[], now: Date, nowMin: number): Date[] {
  return times
    .map((t) => new Date(now.getTime() + (t - nowMin) * 60_000))
    .filter((d) => d.getTime() > now.getTime() + 30_000);
}

/**
 * Re-plans today's smart water reminders (HLT-01) with `health.waterReminderSchedule`:
 * only while awake (quiet hours = night), denser when behind, none once the target is met.
 */
export async function scheduleWaterReminders(input: {
  enabled: boolean;
  nowMin: number;
  consumedMl: number;
  targetMl: number;
  strictness: health.Strictness;
  quietStartMin: number;
  quietEndMin: number;
  title: string;
  body: string;
}): Promise<number> {
  await cancelWaterReminders();
  if (!input.enabled || Platform.OS === 'web') return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    const asked = await Notifications.requestPermissionsAsync();
    if (!asked.granted) return 0;
  }
  const plan = health.waterReminderSchedule({
    nowMin: input.nowMin,
    wakeMin: input.quietEndMin,
    bedMin: input.quietStartMin,
    consumedMl: input.consumedMl,
    targetMl: input.targetMl,
    strictness: input.strictness,
  });
  const dates = reminderDates(plan.times, new Date(), input.nowMin);
  const ids = await Promise.all(
    dates.map((date) =>
      Notifications.scheduleNotificationAsync({
        content: { title: input.title, body: input.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      }),
    ),
  );
  kv.setString(IDS_KEY, JSON.stringify(ids));
  return ids.length;
}
