import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useCoachSettings } from '@/features/coach/api';
import { BackHeader } from '@/features/coach/components/BackHeader';
import { localToday, shortTime } from '@/features/coach/lib/clock';
import { useFinishFocusSession, useSetTaskLog, useStartFocusSession } from '@/features/tasks/api';
import { DEFAULT_FOCUS_MIN, focusRemainingMs, formatCountdown } from '@/features/tasks/logic';
import { Button, GroupedList, GlassButton, ListRow, ProgressRing, Screen, SegmentedControl, Text, haptics, spacing } from '@/ui';

const LENGTHS = ['25', '50', '90'] as const;

/** Làm việc tập trung (TSK-02): focus timer with a local notification at the end. */
export default function FocusScreen() {
  const { t } = useTranslation(['tasks', 'common']);
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string; title?: string; done?: string; target?: string }>();
  const settings = useCoachSettings();
  const start = useStartFocusSession();
  const finish = useFinishFocusSession();
  const setLog = useSetTaskLog(localToday());

  const doneBefore = Number(params.done ?? 0) || 0;
  const target = Number(params.target ?? 1) || 1;
  const [length, setLength] = useState<(typeof LENGTHS)[number]>(String(DEFAULT_FOCUS_MIN) as '50');
  const plannedMin = Number(length);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const sessionId = useRef<string | null>(null);
  const notificationId = useRef<string | null>(null);

  const remaining = focusRemainingMs({ plannedMin, startedAt, pausedMs, pausedAt, now });
  const running = startedAt != null && pausedAt == null && !finished;

  const cancelNotification = () => {
    const id = notificationId.current;
    notificationId.current = null;
    if (id) void Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  };

  const scheduleEnd = async (ms: number) => {
    cancelNotification();
    try {
      const perm = await Notifications.getPermissionsAsync();
      const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
      if (!granted) return;
      notificationId.current = await Notifications.scheduleNotificationAsync({
        content: { title: t('tasks:notifTitle'), body: t('tasks:notifBody'), sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(ms / 1000)) },
      });
    } catch {
      // notifications are best-effort (simulator / permissions)
    }
  };

  const complete = () => {
    setFinished(true);
    cancelNotification();
    haptics.heavy();
    if (sessionId.current) finish.mutate({ sessionId: sessionId.current, completed: true });
    if (params.taskId) {
      const value = doneBefore + 1;
      setLog.mutate({ taskId: params.taskId, value, completed: value >= target, source: 'timer' });
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      if (focusRemainingMs({ plannedMin, startedAt, pausedMs, pausedAt: null, now: ts }) <= 0) complete();
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, startedAt, pausedMs, plannedMin]);

  useEffect(() => () => cancelNotification(), []);

  const onStart = () => {
    const ts = Date.now();
    setStartedAt(ts);
    setNow(ts);
    setPausedMs(0);
    setPausedAt(null);
    setFinished(false);
    void scheduleEnd(plannedMin * 60_000);
    start.mutate(
      { taskId: params.taskId ?? null, plannedMin },
      { onSuccess: (id) => (sessionId.current = id) },
    );
  };

  const onToggle = () => {
    const ts = Date.now();
    if (pausedAt == null) {
      setPausedAt(ts);
      cancelNotification();
    } else {
      const nextPaused = pausedMs + (ts - pausedAt);
      setPausedMs(nextPaused);
      setPausedAt(null);
      setNow(ts);
      void scheduleEnd(focusRemainingMs({ plannedMin, startedAt, pausedMs: nextPaused, pausedAt: null, now: ts }));
    }
  };

  const onStop = () => {
    cancelNotification();
    if (sessionId.current) finish.mutate({ sessionId: sessionId.current, completed: false });
    router.back();
  };

  const stateText = finished
    ? t('tasks:finished')
    : startedAt == null
      ? t('tasks:ready')
      : pausedAt != null
        ? t('tasks:paused')
        : t('tasks:running');
  const work = settings.data?.work_start && settings.data.work_end
    ? `${shortTime(settings.data.work_start)}–${shortTime(settings.data.work_end)}`
    : null;
  const countdown = formatCountdown(remaining);

  return (
    <>
      <BackHeader />
      <Screen title={params.title ?? t('tasks:focus')} eyebrow={t('tasks:focusSession', { n: Math.min(doneBefore + 1, target), total: target })}>
        {startedAt == null ? (
          <View style={{ gap: 6 }}>
            <Text variant="footnote" color="secondary" style={styles.caption}>
              {t('tasks:length')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('tasks:length')}
              value={length}
              onChange={setLength}
              options={LENGTHS.map((l) => ({ value: l, label: t('tasks:minutes', { count: Number(l) }) }))}
            />
          </View>
        ) : null}

        <View style={styles.center}>
          <ProgressRing
            size={240}
            strokeWidth={14}
            progress={1 - remaining / (plannedMin * 60_000)}
            accessibilityLabel={t('tasks:timerA11y', { time: countdown })}>
            <Text variant="metricLarge">{countdown}</Text>
            <Text variant="subheadline" color={pausedAt != null ? 'warning' : 'tint'}>
              {stateText}
            </Text>
          </ProgressRing>
        </View>

        <View style={styles.controls}>
          {startedAt == null || finished ? (
            <Button title={t('tasks:begin')} symbol="play.fill" onPress={onStart} />
          ) : (
            <>
              <GlassButton
                size={72}
                symbol={pausedAt == null ? 'pause.fill' : 'play.fill'}
                prominent
                accessibilityLabel={pausedAt == null ? t('tasks:pause') : t('tasks:resume')}
                onPress={onToggle}
              />
              <Button title={t('tasks:stop')} variant="gray" size="medium" onPress={onStop} />
            </>
          )}
        </View>

        <GroupedList footer={t('tasks:lockNote')}>
          {work ? <ListRow icon="moon.fill" title={t('tasks:workHours', { range: work })} /> : null}
          <ListRow icon="bell.fill" title={t('tasks:notifyOnEnd')} />
        </GroupedList>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  caption: { paddingHorizontal: spacing.lg },
  center: { alignItems: 'center', paddingVertical: spacing.lg },
  controls: { alignItems: 'center', gap: spacing.md },
});
