import { time, workout } from '@aurafit/core';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useRecovery } from '@/features/recovery/useRecovery';
import {
  lastLoadBySlug,
  todayLocal,
  useActiveProgram,
  useCanSync,
  useGymProfile,
  useReadinessData,
  useTrainingSets,
  useWorkoutSessions,
} from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { ErrorCard, LoadingCard, PreviewNote } from '@/features/workout/components/common';
import { formatWeekday } from '@/features/workout/format';
import {
  adaptSession,
  pickTodaySession,
  plannedRecoveryPct,
  sampleSession,
  trainingLoad,
  weekStrip,
} from '@/features/workout/plan';
import { useWorkoutStore } from '@/features/workout/store';
import { useStartWorkout } from '@/features/workout/useWorkoutActions';
import { useLanguage } from '@/i18n';
import {
  Button,
  Card,
  Chip,
  GroupedList,
  ListRow,
  Screen,
  SegmentedControl,
  Text,
  spacing,
  useTheme,
} from '@/ui';

const KINDS: readonly workout.EquipmentProfileKind[] = ['gym', 'home', 'bodyweight'];

/** Tập – TrainPlan mockup: equipment profile, today's session, readiness, week schedule (WRK-02/06/15). */
export default function TrainScreen() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const [language] = useLanguage();
  const names = useCatalogNames();
  const canSync = useCanSync();
  const today = todayLocal();
  const weekFrom = time.startOfWeek(today);

  const kind = useWorkoutStore((s) => s.profileKind);
  const setKind = useWorkoutStore((s) => s.setProfileKind);
  const lighter = useWorkoutStore((s) => s.lighter);
  const setLighter = useWorkoutStore((s) => s.setLighter);
  const active = useWorkoutStore((s) => s.active);

  const { profile } = useGymProfile(kind);
  const program = useActiveProgram();
  const sessions = useWorkoutSessions(time.addDays(weekFrom, -14));
  const training = useTrainingSets(14);
  const recovery = useRecovery();
  const readinessData = useReadinessData(today);
  const starter = useStartWorkout();

  const plan = useMemo(() => {
    const done = sessions.data ?? [];
    if (program.data) {
      const pick = pickTodaySession(program.data, today, done);
      return { pick, strip: weekStrip(program.data, today, done) };
    }
    return { pick: null, strip: weekStrip(null, today, done) };
  }, [program.data, sessions.data, today]);

  const sample = useMemo(() => sampleSession(profile.equipment), [profile.equipment]);
  const planned = plan.pick?.session ?? null;
  const isRestDay = !!program.data && !planned;
  const target = planned ?? plan.pick?.next ?? null;
  const exercises = useMemo(
    () => (target ? adaptSession(target.exercises, profile.equipment) : { exercises: sample.exercises, replaced: sample.replaced }),
    [target, profile.equipment, sample]
  );

  const readiness = useMemo(() => {
    const load = trainingLoad(training.sets, Date.parse(recovery.nowIso));
    return workout.computeReadiness({
      sleepQuality: readinessData.data?.sleepQuality,
      kcalYesterday: readinessData.data?.kcalYesterday,
      kcalTargetYesterday: readinessData.data?.kcalTargetYesterday,
      hardSetsLast3Days: load.baseline === null ? null : load.last3,
      baselineHardSets3Days: load.baseline,
      plannedMusclesRecoveryPct: plannedRecoveryPct(exercises.exercises, recovery.muscles),
    });
  }, [training.sets, readinessData.data, exercises.exercises, recovery.muscles, recovery.nowIso]);

  const title = target
    ? target.name
    : names.templateSession(sample.templateSlug, sample.rotationIndex);
  const weekday = formatWeekday(new Date(), language);
  const program_ = program.data;
  const weekNo = plan.pick?.weekNo ?? 1;
  const nextDeload = program_?.sessions.find((s) => s.isDeload && s.weekNo >= weekNo)?.weekNo ?? null;

  const startNow = () =>
    void starter.start({
      title: target ? target.name : t('session.quickTitle'),
      exercises: exercises.exercises,
      profile,
      plannedSessionId: target?.id ?? null,
      programId: program_?.id ?? null,
      rotationIndex: target?.rotationIndex ?? null,
      rotationCount: program_ ? new Set(program_.sessions.map((s) => s.rotationIndex)).size : null,
      readiness: readiness.score,
      lastLoadBySlug: lastLoadBySlug(training.sets),
    });

  const links = [
    { key: 'recovery', label: t('plan.links.recovery'), href: '/recovery' as const, symbol: 'bolt.heart.fill' as const },
    { key: 'library', label: t('plan.links.library'), href: '/exercises' as const, symbol: 'books.vertical.fill' as const },
    { key: 'templates', label: t('plan.links.templates'), href: '/workout/templates' as const, symbol: 'list.bullet.rectangle' as const },
  ];

  return (
    <Screen title={t('title')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>
      <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
        {links.map((l) => (
          <Chip key={l.key} label={l.label} symbol={l.symbol} onPress={() => router.push(l.href)} />
        ))}
      </View>

      {!canSync ? <PreviewNote /> : null}

      {active ? (
        <Card style={{ gap: spacing.md }}>
          <Text variant="headline">{t('plan.inProgress')}</Text>
          <Text variant="subheadline" color="secondary">
            {active.title}
          </Text>
          <Button
            title={t('plan.resume')}
            symbol="play.fill"
            onPress={() => router.push({ pathname: '/workout/[sessionId]', params: { sessionId: active.id } })}
          />
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('plan.where')}</Text>
          <Pressable
            accessibilityRole="link"
            hitSlop={12}
            onPress={() => router.push('/workout/gym')}
            style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="subheadline" color="tint">
              {t('plan.gear')} ›
            </Text>
          </Pressable>
        </View>
        <SegmentedControl
          accessibilityLabel={t('plan.where')}
          options={KINDS.map((k) => ({ value: k, label: t(`equipmentKind.${k}`) }))}
          value={kind}
          onChange={setKind}
        />
      </View>

      {program.isLoading ? <LoadingCard /> : null}
      {program.isError ? <ErrorCard onRetry={() => void program.refetch()} /> : null}

      <Card style={{ gap: spacing.md }}>
        <View className="flex-row items-center justify-between">
          <Text variant="footnote" color="secondary">
            {t('plan.today', { weekday })}
          </Text>
          <Text
            variant="footnote"
            weight="600"
            color={readiness.band === 'low' ? 'warning' : 'tint'}
            accessibilityLabel={
              readiness.score === null ? t('plan.readinessNone') : t('plan.readinessA11y', { score: readiness.score })
            }>
            {readiness.score === null ? t('plan.readinessNone') : `${t('plan.readiness')} ${readiness.score}`}
          </Text>
        </View>

        {isRestDay && !target ? null : (
          <View style={{ gap: spacing.xs }}>
            <Text variant="title">
              {title} · {t(`equipmentKind.${kind}`)}
            </Text>
            <Text variant="subheadline" color="secondary">
              {exercises.exercises.map((e) => names.exercise(e.exerciseSlug)).join(' · ')}
            </Text>
            {exercises.replaced.length > 0 ? (
              <Text variant="footnote" color="secondary">
                {t('plan.replaced', { count: exercises.replaced.length })}
              </Text>
            ) : null}
          </View>
        )}

        {isRestDay ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="headline">{t('plan.restDay')}</Text>
            <Text variant="footnote" color="secondary">
              {t('plan.restDayBody')}
            </Text>
          </View>
        ) : null}

        {readiness.score !== null ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="footnote" color="secondary">
              {t(`plan.advice.${readiness.recommendation}`)}
            </Text>
            {readiness.recommendation === 'lighter_session' ? (
              <Chip
                label={lighter ? t('plan.lighterOn') : t('plan.applyLighter')}
                selected={lighter}
                symbol="minus.circle"
                onPress={() => setLighter(!lighter)}
              />
            ) : null}
          </View>
        ) : null}

        {starter.error ? (
          <Text variant="footnote" color="destructive">
            {t('plan.startError')}
          </Text>
        ) : null}

        <Button
          title={isRestDay ? t('plan.trainAnyway') : t('start')}
          symbol="figure.strengthtraining.traditional"
          variant={isRestDay ? 'tinted' : 'filled'}
          loading={starter.isPending}
          disabled={!!active || exercises.exercises.length === 0}
          onPress={startNow}
        />

        {program_ ? (
          <Text variant="footnote" color="secondary">
            {t('plan.programMeta', { weeks: program_.totalWeeks, split: t(`split.${program_.split}`), week: weekNo })}
            {nextDeload ? ` · ${t('plan.deloadAt', { week: nextDeload })}` : ''}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="footnote" color="secondary">
              {t('plan.noProgramBody')}
            </Text>
            <Button
              title={t('plan.pickTemplate')}
              variant="gray"
              size="medium"
              onPress={() => router.push('/workout/templates')}
            />
          </View>
        )}
      </Card>

      <GroupedList header={t('plan.week')}>
        {plan.strip.map((d) => (
          <ListRow
            key={d.date}
            title={`${t(`weekdayShort.${d.dayOfWeek}` as 'weekdayShort.1')} · ${d.name ?? t('plan.status.rest')}`}
            value={
              d.status === 'done'
                ? t('plan.status.done')
                : d.status === 'today'
                  ? t('plan.status.today')
                  : undefined
            }
            icon={d.status === 'done' ? 'checkmark.circle.fill' : d.status === 'today' ? 'star.fill' : 'circle'}
            iconColor={d.status === 'done' ? colors.icon.mint : d.status === 'today' ? colors.icon.orange : colors.icon.gray}
          />
        ))}
      </GroupedList>
    </Screen>
  );
}
