import { coach, health, time, workout } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useCoachSettings, useCoachState, useDailyScore, useQuests } from '@/features/coach/api';
import { CharacterAvatar } from '@/features/coach/components/CharacterAvatar';
import { asAuraTier, asStrictness, asVoice, pickCoachLine, provisionalScore } from '@/features/coach/insights';
import { localNowMin, localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { useAddWater, useDailySummaries, useSleepFor, useWaterToday, useWeighIns } from '@/features/health/api';
import { slotForTime } from '@/features/nutrition/analysis';
import { useFreeDays, useSavedFoods } from '@/features/nutrition/api';
import { NutritionCard } from '@/features/nutrition/components/NutritionCard';
import { WhatToEat } from '@/features/nutrition/components/WhatToEat';
import { useDayNutrition } from '@/features/nutrition/useDayNutrition';
import { useMyProfile } from '@/features/profile/api';
import { useTaskDefinitions, useTaskLogs } from '@/features/tasks/api';
import { taskProgress, tasksForWeekday } from '@/features/tasks/logic';
import { useAuth } from '@/lib/auth';
import {
  Card,
  GlassButton,
  GroupedList,
  ListRow,
  Screen,
  Text,
  haptics,
  spacing,
  useTheme,
  MIN_TOUCH,
} from '@/ui';

const WATER_GLASS_ML = health.GLASS_PRESETS_ML[0];

/** Hôm nay (PRG-01, NUT-01, NUT-10, HLT-01, HLT-04, COA-01/02/04/06, WRK-06). */
export default function TodayScreen() {
  const { t } = useTranslation(['today', 'coach', 'health', 'tasks', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const canWrite = !!user;

  const today = localToday();
  const yesterday = time.addDays(today, -1);
  const nowMin = localNowMin();

  const profile = useMyProfile();
  const state = useCoachState();
  const settings = useCoachSettings();
  const day = useDayNutrition(today);
  const water = useWaterToday(today);
  const addWater = useAddWater(today);
  const sleep = useSleepFor(today);
  const weighIns = useWeighIns(30);
  const quests = useQuests(today);
  const taskDefs = useTaskDefinitions();
  const taskLogs = useTaskLogs(today);
  const saved = useSavedFoods();
  const yesterdayScore = useDailyScore(yesterday);
  const yesterdaySummary = useDailySummaries(yesterday, yesterday);
  const freeDays = useFreeDays(today, today);

  const character = profile.data?.character === 'mira' ? 'mira' : 'kai';
  const charName = profile.data?.character_name ?? (character === 'mira' ? 'Mira' : 'Kai');
  const strictness = asStrictness(settings.data?.strictness);
  const voice = asVoice(settings.data?.voice);
  const streak = state.data?.streak ?? 0;

  const latestWeight = weighIns.data?.at(-1)?.weightKg ?? null;
  const waterTarget = latestWeight ? health.waterTargetMl({ weightKg: latestWeight }) : null;
  const waterMl = water.data ?? 0;

  const age = profile.data?.birth_date ? time.ageOn(profile.data.birth_date, today) : 30;
  const sleepTarget = health.recommendedSleepRange(age).minMin;

  const scheduled = tasksForWeekday(taskDefs.data ?? [], time.isoWeekday(today));
  const tasks = taskProgress(scheduled, taskLogs.data ?? []);

  const score = useMemo(() => {
    const target = day.targets;
    return provisionalScore({
      strictness,
      isFreeDay: (freeDays.data ?? []).length > 0,
      nutrition: target
        ? {
            mealsLogged: day.mealsLogged,
            kcalIn: day.consumed.kcal,
            kcalTarget: target.kcal,
            kcalFloor: day.floorKcal,
            proteinG: day.consumed.protein_g,
            proteinTargetG: target.protein_g,
            sugarG: day.consumed.sugar_g,
            sugarLimitG: target.sugar_g,
          }
        : null,
      sleepMin: sleep.data?.durationMin ?? null,
      sleepTargetMin: sleepTarget,
      waterMl,
      waterTargetMl: waterTarget,
      tasks: { scheduled: tasks.total, completed: tasks.done },
    });
  }, [day, strictness, freeDays.data, sleep.data, sleepTarget, waterMl, waterTarget, tasks.total, tasks.done]);

  const mood = coach.deriveMood({
    today,
    localTimeMin: nowMin,
    scoreSoFar: score.total,
    lastNightSleepMin: sleep.data?.durationMin ?? null,
    waterMl,
    waterTargetMl: waterTarget,
    mealsLoggedToday: day.mealsLogged,
    streak,
    streakLostOn: state.data?.last_streak_lost_date ?? null,
  });
  const line = pickCoachLine({ mood, proteinLeftG: day.remaining?.protein_g ?? null, localTimeMin: nowMin });

  const ySum = yesterdaySummary.data?.[0];
  const readiness = workout.computeReadiness({
    sleepMin: sleep.data?.durationMin ?? null,
    sleepTargetMin: sleepTarget,
    sleepQuality: sleep.data?.quality ?? null,
    kcalYesterday: ySum?.kcal_in ?? null,
    kcalTargetYesterday: ySum?.kcal_target ?? null,
    proteinYesterdayG: ySum?.protein_g ?? null,
    proteinTargetG: day.targets?.protein_g ?? null,
  });

  const questsDone = (quests.data ?? []).filter((q) => q.completed_at).length;
  const questXp = (quests.data ?? []).reduce((s, q) => s + (q.completed_at ? q.xp_reward : 0), 0);
  const sleepHm = sleep.data ? f.hm(sleep.data.durationMin) : null;

  const refreshing = day.isLoading && !!user;
  const onRefresh = () => {
    day.refetch();
    void water.refetch();
    void sleep.refetch();
    void state.refetch();
    void quests.refetch();
  };

  return (
    <Screen
      title={t('today:title')}
      eyebrow={f.longDate(today)}
      bottomInset={CAPTURE_BUTTON_CLEARANCE}
      scrollProps={{ refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} /> }}
      headerRight={
        <>
          <GlassButton
            symbol="flame.fill"
            label={String(streak)}
            color={colors.streak}
            accessibilityLabel={t('coach:streak', { count: streak })}
            onPress={() => router.push('/coach/quests')}
          />
          <GlassButton
            symbol="shield.fill"
            label={String(state.data?.shields ?? 0)}
            color={colors.shield}
            accessibilityLabel={t('coach:shieldsFragments', {
              shields: state.data?.shields ?? 0,
              fragments: state.data?.shield_fragments ?? 0,
            })}
            onPress={() => router.push('/coach/quests')}
          />
        </>
      }>
      {!user ? (
        <Card level="nested">
          <Text variant="footnote" color="secondary">
            {t('today:preview')}
          </Text>
        </Card>
      ) : null}

      {yesterdayScore.data?.result === 'excellent' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/coach/celebrate')}
          style={({ pressed }) => [styles.banner, { backgroundColor: colors.tintSoft, opacity: pressed ? 0.7 : 1 }]}>
          <Text variant="subheadline" color="tint" weight="600" style={styles.flex}>
            {t('today:celebrateBanner')}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.hero}>
        <CharacterAvatar
          character={character}
          name={charName}
          mood={mood}
          aura={asAuraTier(state.data?.aura_tier)}
        />
        <View style={styles.heroText}>
          <View
            accessible
            accessibilityLabel={`${t('today:score')} ${score.total}${t('today:scoreOutOf')}`}
            style={styles.scoreRow}>
            <Text variant="metricLarge">{score.total}</Text>
            <Text variant="headline" color="secondary">
              {t('today:scoreOutOf')}
            </Text>
          </View>
          <Text variant="footnote" color={score.toExcellent === 0 ? 'tint' : 'secondary'}>
            {score.toExcellent === 0 ? t('today:excellentNow') : t('today:toExcellent', { count: score.toExcellent })}
          </Text>
          <Text variant="caption" color="tertiary">
            {t('today:provisional')}
          </Text>
          {state.data ? (
            <Text variant="footnote" weight="600">
              {t('today:auraLevel', { aura: t(`coach:aura.${asAuraTier(state.data.aura_tier)}`), level: state.data.level })}
            </Text>
          ) : null}
        </View>
      </View>

      <Card level="nested">
        <Text variant="subheadline">
          {t('coach:lineWithName', {
            name: charName,
            line:
              line.situation === 'protein_low'
                ? t(`coach:lines.${voice}.protein_low`, { grams: line.grams ?? 0 })
                : t(`coach:lines.${voice}.${line.situation}`),
          })}
        </Text>
      </Card>

      {day.isError ? (
        <Text variant="footnote" color="destructive">
          {t('today:loadError')}
        </Text>
      ) : null}
      {user && !day.isLoading && !day.targets ? (
        <Text variant="footnote" color="secondary">
          {t('today:noTargets')}
        </Text>
      ) : null}

      <NutritionCard
        consumed={day.consumed}
        targets={day.targets}
        footer={<WhatToEat remaining={day.remaining} foods={saved.data} slot={slotForTime(nowMin)} canLog={canWrite} />}
      />

      <GroupedList>
        <ListRow
          icon="drop.fill"
          iconColor={colors.icon.blue}
          title={t('health:water')}
          value={
            waterTarget
              ? t('today:waterValue', { value: f.liters(waterMl), target: f.liters(waterTarget) })
              : f.liters(waterMl)
          }
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('today:addWaterA11y', { ml: WATER_GLASS_ML })}
              disabled={!canWrite}
              hitSlop={6}
              onPress={() => {
                haptics.light();
                addWater.mutate(WATER_GLASS_ML, { onError: () => haptics.error() });
              }}
              style={({ pressed }) => [
                styles.waterBtn,
                { backgroundColor: colors.tintSoft, opacity: !canWrite ? 0.4 : pressed ? 0.6 : 1 },
              ]}>
              <Text variant="subheadline" color="tint" weight="700">
                {t('today:addWater', { ml: WATER_GLASS_ML })}
              </Text>
            </Pressable>
          }
        />
        <ListRow
          icon="moon.fill"
          iconColor={colors.icon.indigo}
          title={t('health:sleep')}
          value={sleepHm ? t('today:sleepValue', sleepHm) : t('today:noData')}
          onPress={() => router.push('/health/log')}
        />
        <ListRow
          icon="figure.strengthtraining.traditional"
          iconColor={colors.icon.green}
          title={t('today:training')}
          subtitle={readiness.score != null ? t('today:readiness', { score: readiness.score }) : t('today:readinessUnknown')}
          onPress={() => router.push('/train')}
        />
        <ListRow
          icon="checklist"
          iconColor={colors.icon.orange}
          title={t('coach:quests')}
          value={
            quests.data && quests.data.length > 0
              ? t('today:questsValue', { done: questsDone, total: quests.data.length, xp: questXp })
              : t('today:noData')
          }
          onPress={() => router.push('/coach/quests')}
        />
        <ListRow
          icon="leaf.fill"
          iconColor={colors.icon.mint}
          title={t('tasks:title')}
          value={tasks.total > 0 ? t('today:tasksValue', { done: tasks.done, total: tasks.total }) : undefined}
          onPress={() => router.push('/tasks')}
        />
      </GroupedList>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroText: { flex: 1, gap: spacing.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  banner: { borderRadius: 16, padding: spacing.md, minHeight: MIN_TOUCH, justifyContent: 'center' },
  waterBtn: {
    minHeight: 34,
    minWidth: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
