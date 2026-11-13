import { workout } from '@aurafit/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useExerciseContent, useExerciseHistory, useGymProfile, usePersonalBests } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PushedHeader } from '@/features/workout/components/common';
import { ExerciseMedia } from '@/features/workout/components/ExerciseMedia';
import { formatClock, formatShortDate } from '@/features/workout/format';
import { draftForExercise } from '@/features/workout/sessionLogic';
import { useWorkoutStore } from '@/features/workout/store';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { useStartWorkout } from '@/features/workout/useWorkoutActions';
import { Button, Card, Chip, GroupedList, ListRow, Screen, SegmentedControl, Text, haptics, spacing, useTheme } from '@/ui';

type Tab = 'guide' | 'history';
const GENERIC_STEPS = ['setup', 'brace', 'move', 'finish'] as const;

/** Chi tiết bài tập – ExerciseDetail mockup: media placeholder, muscles, guide, history / PR (WRK-07). */
export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation('workout');
  const names = useCatalogNames();
  const { colors } = useTheme();
  const fmt = useWorkoutFormat();
  const [tab, setTab] = useState<Tab>('guide');
  const exercise = slug ? workout.getExercise(slug) : undefined;
  const content = useExerciseContent(exercise?.slug);
  const history = useExerciseHistory(exercise?.slug);
  const bests = usePersonalBests(exercise?.slug);
  const active = useWorkoutStore((s) => s.active);
  const kind = useWorkoutStore((s) => s.profileKind);
  const { profile } = useGymProfile(kind);
  const starter = useStartWorkout();

  if (!exercise) {
    return (
      <Screen title={t('library.title')}>
        <PushedHeader />
        <EmptyCard symbol="questionmark.circle" body={t('library.empty')} />
      </Screen>
    );
  }

  const name = names.exercise(exercise.slug);
  const steps = (fmt.language === 'vi' ? content.data?.stepsVi : content.data?.stepsEn) ?? [];
  const tips = (fmt.language === 'vi' ? content.data?.tipsVi : content.data?.tipsEn) ?? [];
  const best = history.data ? workout.bestEstimatedOneRm(history.data.logs) : null;
  const maxLoad = bests.data?.max_load;
  const defaultsKey =
    exercise.measure === 'time' ? 'exercise.defaultsTime' : exercise.measure === 'distance' ? 'exercise.defaultsDistance' : 'exercise.defaults';

  const add = () => {
    if (active) {
      haptics.success();
      const state = useWorkoutStore.getState();
      state.setExercises((l) => [...l, draftForExercise(exercise.slug, active.inventory)]);
      state.setCurrent(active.exercises.length);
      router.push({ pathname: '/workout/[sessionId]', params: { sessionId: active.id } });
      return;
    }
    const d = draftForExercise(exercise.slug, profile.inventory);
    void starter.start({
      title: name,
      exercises: [
        {
          exerciseSlug: d.slug,
          sortOrder: 1,
          sets: d.sets.length,
          repMin: d.repMin,
          repMax: d.repMax,
          targetRir: d.targetRir,
          restSec: d.restSec,
          targetLoadKg: null,
          backupExerciseSlug: d.backupSlug,
          isExtra: false,
        },
      ],
      profile,
      plannedSessionId: null,
      programId: null,
      rotationIndex: null,
      rotationCount: null,
      readiness: null,
    });
  };

  return (
    <Screen title={name} eyebrow={`${names.equipment(exercise.equipment)} · ${t(`level.${exercise.level}`)}`}>
      <PushedHeader />
      <ExerciseMedia mediaUrl={content.data?.mediaUrl} accessibilityLabel={name} />

      <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
        <Chip label={`${t('exercise.primary')}: ${names.muscle(exercise.primaryMuscle)}`} selected />
        {exercise.secondaryMuscles.map((m) => (
          <Chip key={m} label={names.muscle(m)} />
        ))}
      </View>
      <Text variant="footnote" color="secondary">
        {t(`exercise.mechanic.${exercise.mechanic}`)} ·{' '}
        {t(defaultsKey as 'exercise.defaults', {
          min: exercise.defaultRepMin,
          max: exercise.defaultRepMax,
          rest: formatClock(exercise.defaultRestSec),
        })}
      </Text>

      <SegmentedControl
        options={[
          { value: 'guide', label: t('exercise.guide') },
          { value: 'history', label: t('exercise.history') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'guide' ? (
        <Card style={{ gap: spacing.md }}>
          {(steps.length ? steps : GENERIC_STEPS.map((k) => t(`exercise.steps.${k}`))).map((s, i) => (
            <View key={i} className="flex-row" style={{ gap: spacing.md }}>
              <Text variant="headline" color="tint" style={{ width: 20 }}>
                {i + 1}
              </Text>
              <Text variant="subheadline" style={{ flex: 1 }}>
                {s}
              </Text>
            </View>
          ))}
          {tips.map((tip, i) => (
            <Text key={`tip-${i}`} variant="footnote" color="secondary">
              • {tip}
            </Text>
          ))}
        </Card>
      ) : (
        <>
          <GroupedList>
            <ListRow
              icon="trophy.fill"
              iconColor={colors.icon.orange}
              title={t('exercise.pr')}
              value={maxLoad != null ? fmt.kg(maxLoad) : best ? `${fmt.kg(best.set.loadKg)} × ${best.set.reps ?? 0}` : '—'}
            />
            <ListRow
              icon="chart.line.uptrend.xyaxis"
              iconColor={colors.icon.green}
              title={t('exercise.oneRm')}
              value={bests.data?.est_1rm != null ? fmt.kg(bests.data.est_1rm) : best ? fmt.kg(best.oneRmKg) : '—'}
            />
          </GroupedList>
          <GroupedList footer={history.data?.entries.length ? undefined : t('exercise.noHistory')}>
            {(history.data?.entries ?? []).map((h) => (
              <ListRow
                key={h.sessionId}
                title={formatShortDate(h.date, fmt.language)}
                subtitle={h.sets.map((s) => `${s.loadKg === null ? '—' : fmt.num(s.loadKg)} × ${s.reps ?? 0}`).join(' · ')}
              />
            ))}
          </GroupedList>
        </>
      )}

      <Button
        title={t('exercise.add')}
        symbol="plus.circle.fill"
        loading={starter.isPending}
        onPress={add}
      />
    </Screen>
  );
}
