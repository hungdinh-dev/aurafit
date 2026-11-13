import { time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { useDailySummaries } from '@/features/health/api';
import {
  TaskLimitError,
  useAddTask,
  useRemoveTask,
  useSetTaskLog,
  useTaskDefinitions,
  useTaskLogs,
  useTaskTemplates,
  type TaskDefinition,
} from '@/features/tasks/api';
import { DEFAULT_FOCUS_MIN, MAX_ACTIVE_TASKS, isTaskComplete, taskProgress, tasksForWeekday } from '@/features/tasks/logic';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { Button, Chip, GroupedList, Screen, Stepper, Symbol, Text, TextField, haptics, spacing, useTheme, MIN_TOUCH } from '@/ui';

/** Sống chất lượng – daily tasks of 4 kinds (TSK-01) + template library (TSK-03). */
export default function TasksScreen() {
  const { t } = useTranslation(['tasks', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const [language] = useLanguage();
  const { user } = useAuth();
  const today = localToday();
  const defs = useTaskDefinitions();
  const logs = useTaskLogs(today);
  const templates = useTaskTemplates();
  const summary = useDailySummaries(today, today);
  const setLog = useSetTaskLog(today);
  const add = useAddTask();
  const remove = useRemoveTask();
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const all = defs.data ?? [];
  const scheduled = tasksForWeekday(all, time.isoWeekday(today));
  const progress = taskProgress(scheduled, logs.data ?? []);
  const logOf = (id: string) => (logs.data ?? []).find((l) => l.task_id === id);
  const usedCodes = new Set(all.map((d) => d.template_code).filter(Boolean));
  const available = (templates.data ?? []).filter((tpl) => !usedCodes.has(tpl.code));
  const full = all.length >= MAX_ACTIVE_TASKS;

  const onError = (e: unknown) => {
    haptics.error();
    setError(e instanceof TaskLimitError ? t('tasks:limit') : t('tasks:error'));
  };

  const setValue = (task: TaskDefinition, value: number) =>
    setLog.mutate(
      { taskId: task.id, value, completed: isTaskComplete(task.kind, value, task.target_value) },
      { onError },
    );

  const confirmRemove = (task: TaskDefinition) =>
    Alert.alert(t('tasks:removeTitle'), t('tasks:removeBody'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('tasks:remove'), style: 'destructive', onPress: () => remove.mutate(task.id, { onError }) },
    ]);

  return (
    <>
      <BackHeader />
      <Screen title={t('tasks:title')}>
        <Text variant="subheadline" color="secondary">
          {t('tasks:summary', progress)}
        </Text>
        {!user ? (
          <Text variant="footnote" color="secondary">
            {t('tasks:preview')}
          </Text>
        ) : null}
        {error ? (
          <Text variant="footnote" color="destructive" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <GroupedList footer={user && !defs.isLoading && all.length === 0 ? t('tasks:empty') : undefined}>
          {scheduled.map((task) => {
            const log = logOf(task.id);
            const value = Number(log?.value ?? 0);
            const done = !!log?.is_completed;
            const kind = task.kind as 'check' | 'count' | 'timer' | 'auto';
            const target = task.target_value ?? 1;
            let meta = t(`tasks:kinds.${kind}`);
            let trailing: React.ReactNode = null;
            if (kind === 'check') {
              meta = `${meta} · ${t('tasks:everyDay')}`;
              trailing = (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={done ? t('tasks:markUndone', { name: task.title }) : t('tasks:markDone', { name: task.title })}
                  onPress={() => {
                    haptics.light();
                    setValue(task, done ? 0 : 1);
                  }}
                  style={styles.checkHit}>
                  <View
                    style={[
                      styles.check,
                      done ? { backgroundColor: colors.tint } : { borderWidth: 2, borderColor: colors.separator },
                    ]}>
                    {done ? <Symbol name="checkmark" size={15} color={colors.onTint} weight="bold" /> : null}
                  </View>
                </Pressable>
              );
            } else if (kind === 'count') {
              meta = `${meta} · ${t('tasks:countTarget', { target: f.num(target), unit: task.unit ?? '' }).trim()}`;
              trailing = (
                <Stepper
                  value={value}
                  onChange={(v) => setValue(task, v)}
                  min={0}
                  max={9999}
                  format={(v) => `${f.num(v)}/${f.num(target)}`}
                  accessibilityLabel={task.title}
                  decrementLabel={t('common:actions.decrease')}
                  incrementLabel={t('common:actions.increase')}
                />
              );
            } else if (kind === 'timer') {
              meta = `${meta} · ${t('tasks:timerSessions', { done: f.num(value), target: f.num(target), min: DEFAULT_FOCUS_MIN })}`;
              trailing = (
                <Button
                  title={t('tasks:start')}
                  accessibilityLabel={t('tasks:startA11y', { name: task.title })}
                  size="small"
                  variant="tinted"
                  onPress={() =>
                    router.push({
                      pathname: '/tasks/focus',
                      params: { taskId: task.id, title: task.title, done: String(value), target: String(target) },
                    })
                  }
                />
              );
            } else {
              const steps = summary.data?.[0]?.steps ?? null;
              meta = t('tasks:autoMeta');
              trailing = (
                <Text variant="headline" color={steps != null && steps >= target ? 'tint' : 'label'}>
                  {steps != null ? f.num(steps) : '—'}
                </Text>
              );
            }
            return (
              <Pressable
                key={task.id}
                onLongPress={() => confirmRemove(task)}
                accessibilityHint={t('tasks:removeTitle')}
                style={styles.row}>
                <View style={styles.texts}>
                  <Text variant="body" color={done ? 'secondary' : 'label'}>
                    {task.title}
                  </Text>
                  <Text variant="footnote" color="secondary" numberOfLines={2}>
                    {meta}
                  </Text>
                </View>
                {trailing}
              </Pressable>
            );
          })}
        </GroupedList>

        {user ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="footnote" color="secondary" style={styles.caption}>
              {t('tasks:templatesTitle')}
            </Text>
            <View style={styles.chips}>
              {available.map((tpl) => {
                const title = language === 'vi' ? tpl.title_vi : tpl.title_en;
                return (
                  <Chip
                    key={tpl.code}
                    label={title}
                    symbol="plus"
                    disabled={full || add.isPending}
                    onPress={() => add.mutate({ template: tpl, title, activeCount: all.length }, { onError })}
                  />
                );
              })}
            </View>
            <View style={styles.customRow}>
              <View style={styles.flex}>
                <TextField
                  value={custom}
                  onChangeText={setCustom}
                  placeholder={t('tasks:customPlaceholder')}
                  accessibilityLabel={t('tasks:custom')}
                  maxLength={80}
                />
              </View>
              <Button
                title={t('tasks:add')}
                accessibilityLabel={t('tasks:addA11y', { name: custom })}
                size="medium"
                variant="tinted"
                disabled={full || custom.trim().length === 0}
                loading={add.isPending}
                onPress={() =>
                  add.mutate(
                    { title: custom, activeCount: all.length },
                    {
                      onSuccess: () => {
                        haptics.success();
                        setCustom('');
                      },
                      onError,
                    },
                  )
                }
              />
            </View>
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH + 16,
  },
  texts: { flex: 1, gap: 2 },
  checkHit: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  caption: { paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
