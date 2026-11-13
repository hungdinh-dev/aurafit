/**
 * WRK-16 rest timer: in-app countdown + a local notification so the user is pinged when the
 * rest ends while the app is in the background. Notification failures never block the timer.
 */
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

import i18n from '@/i18n';
import { haptics } from '@/ui';

import { useWorkoutStore, type RestState } from './store';

export const REST_STEP_SEC = 15;
export const REST_MIN_SEC = 15;
export const REST_MAX_SEC = 600;

let permissionAsked = false;

async function scheduleRestEnd(seconds: number): Promise<string | null> {
  try {
    if (!permissionAsked) {
      permissionAsked = true;
      const current = await Notifications.getPermissionsAsync();
      if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync();
    }
    const status = await Notifications.getPermissionsAsync();
    if (!status.granted) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('workout:session.notification.title'),
        body: i18n.t('workout:session.notification.body'),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, seconds) },
    });
  } catch {
    return null;
  }
}

async function cancel(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired / unavailable
  }
}

const clampRest = (sec: number) => Math.min(REST_MAX_SEC, Math.max(REST_MIN_SEC, Math.round(sec)));

export async function startRest(durationSec: number, target: Pick<RestState, 'exerciseIndex' | 'setIndex'>) {
  const { rest, setRest } = useWorkoutStore.getState();
  await cancel(rest?.notificationId);
  const duration = clampRest(durationSec);
  const endsAt = Date.now() + duration * 1000;
  setRest({ endsAt, durationSec: duration, notificationId: null, ...target });
  const notificationId = await scheduleRestEnd(duration);
  const latest = useWorkoutStore.getState().rest;
  if (latest && latest.endsAt === endsAt) setRest({ ...latest, notificationId });
  else await cancel(notificationId);
}

/** ±15 s on a running timer (reschedules the notification). */
export async function adjustRest(deltaSec: number) {
  const { rest, setRest } = useWorkoutStore.getState();
  if (!rest) return;
  const remaining = Math.max(0, (rest.endsAt - Date.now()) / 1000) + deltaSec;
  if (remaining <= 0) return skipRest();
  await cancel(rest.notificationId);
  const endsAt = Date.now() + remaining * 1000;
  setRest({ ...rest, endsAt, durationSec: Math.max(REST_MIN_SEC, rest.durationSec + deltaSec), notificationId: null });
  const notificationId = await scheduleRestEnd(remaining);
  const latest = useWorkoutStore.getState().rest;
  if (latest && latest.endsAt === endsAt) setRest({ ...latest, notificationId });
  else await cancel(notificationId);
}

export async function skipRest() {
  const { rest, setRest } = useWorkoutStore.getState();
  setRest(null);
  await cancel(rest?.notificationId);
}

/** Seconds left on the rest timer (null when no rest). Fires a success haptic at zero. */
export function useRestRemaining(): number | null {
  const rest = useWorkoutStore((s) => s.rest);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!rest) return;
    const msLeft = Math.max(0, rest.endsAt - Date.now());
    const tick = setInterval(() => setNow(Date.now()), 250);
    const done = setTimeout(() => haptics.success(), msLeft);
    const clear = setTimeout(() => {
      if (useWorkoutStore.getState().rest?.endsAt === rest.endsAt) useWorkoutStore.getState().setRest(null);
    }, msLeft + 1500);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
      clearTimeout(clear);
    };
  }, [rest]);
  if (!rest) return null;
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
}

/** Elapsed seconds since an ISO start time, ticking every second. */
export function useElapsed(startIso: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return startIso ? Math.max(0, Math.floor((now - Date.parse(startIso)) / 1000)) : 0;
}
