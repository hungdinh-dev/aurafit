import { workout } from '@aurafit/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { usePersonalBests } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PreviewNote, PushedHeader } from '@/features/workout/components/common';
import { RestTimerCard } from '@/features/workout/components/RestTimerCard';
import { formatClock } from '@/features/workout/format';
import { useElapsed } from '@/features/workout/restTimer';
import {
  addSet,
  exerciseBest,
  removeLastSet,
  sessionProgress,
  swapExercise,
} from '@/features/workout/sessionLogic';
import { useWorkoutStore } from '@/features/workout/store';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { useFinishWorkout, useSetActions } from '@/features/workout/useWorkoutActions';
import {
  Button,
  Card,
  GlassButton,
  GroupedList,
  ListRow,
  MIN_TOUCH,
  Screen,
  Symbol,
  Text,
  haptics,
  spacing,
  useTheme,
} from '@/ui';

/** Buổi tập – Workout mockup: sets, auto load suggestions (WRK-05), PR / 1RM (WRK-07), rest timer (WRK-16). */
export default function WorkoutSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { t } = useTranslation(['workout', 'common']);
  const { colors } = useTheme();
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const active = useWorkoutStore((s) => (s.active?.id === sessionId ? s.active : null));
  const setCurrent = useWorkoutStore((s) => s.setCurrent);
  const updateExercise = useWorkoutStore((s) => s.updateExercise);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const elapsed = useElapsed(active?.startedAt);
  const actions = useSetActions();
  const finisher = useFinishWorkout();
  const index = active ? Math.min(active.currentIndex, Math.max(0, active.exercises.length - 1)) : 0;
  const ex = active?.exercises[index];
  const bests = usePersonalBests(ex?.slug);

  if (!active) {
    return (
      <Screen title={t('workout:session.notFound')}>
        <PushedHeader />
        <EmptyCard symbol="figure.strengthtraining.traditional" body={t('workout:session.notFound')}>
          <Button title={t('common:actions.back')} variant="gray" onPress={() => router.back()} />
        </EmptyCard>
      </Screen>
    );
  }

  const progress = sessionProgress(active.exercises);
  const best = ex ? exerciseBest(ex, bests.data ?? {}) : null;
  const total = active.exercises.length;
  const next = active.exercises.slice(index + 1);

  const confirmFinish = () => {
    haptics.warning();
    Alert.alert(t('workout:session.finishTitle'), t('workout:session.finishBody', progress), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('workout:session.cancelSession'), style: 'destructive', onPress: () => void finisher.finish('cancelled') },
      { text: t('workout:session.finishConfirm'), onPress: () => void finisher.finish('completed') },
    ]);
  };

  const openSet = (setIndex: number) =>
    router.push({ pathname: '/workout/set', params: { exercise: String(index), set: String(setIndex) } });

  const swapOptions = () => {
    if (!ex) return;
    const candidates = workout.findBackupExercises(ex.mainSlug, { limit: 4, excludeSlugs: [ex.slug] });
    const slugs = [...new Set([ex.backupSlug, ex.slug !== ex.mainSlug ? ex.mainSlug : null, ...candidates.map((c) => c.slug)])]
      .filter((s): s is string => !!s && s !== ex.slug)
      .slice(0, 5);
    Alert.alert(t('workout:session.swapTitle'), undefined, [
      ...slugs.map((slug) => ({
        text: names.exercise(slug),
        onPress: () => updateExercise(index, (e) => swapExercise(e, slug, active.inventory)),
      })),
      { text: t('common:actions.cancel'), style: 'cancel' as const },
    ]);
  };

  return (
    <Screen
      title={active.title}
      eyebrow={`${t('workout:session.exerciseOf', { index: index + 1, total: Math.max(total, 1) })} · ${formatClock(elapsed)}`}>
      <PushedHeader
        headerRight={() => (
          <GlassButton
            symbol="plus"
            accessibilityLabel={t('workout:session.addExercise')}
            onPress={() => router.push({ pathname: '/exercises', params: { pick: '1' } })}
          />
        )}
      />
      {active.local ? <PreviewNote /> : null}
      {actions.syncError || finisher.error ? (
        <Text variant="footnote" color="destructive">
          {t('workout:session.saveError')}
        </Text>
      ) : null}

      {!ex ? (
        <EmptyCard symbol="dumbbell" body={t('workout:session.empty')} />
      ) : (
        <>
          <View className="flex-row items-center" style={{ gap: spacing.sm }}>
            <GlassButton
              symbol="chevron.left"
              accessibilityLabel={t('workout:session.prevExercise')}
              onPress={() => setCurrent(Math.max(0, index - 1))}
            />
            <View style={{ flex: 1 }}>
              <Text variant="title" numberOfLines={2}>
                {names.exercise(ex.slug)}
              </Text>
            </View>
            <GlassButton
              symbol="chevron.right"
              accessibilityLabel={t('workout:session.nextExercise')}
              onPress={() => setCurrent(Math.min(total - 1, index + 1))}
            />
          </View>

          <Pressable accessibilityRole="link" onPress={() => openSet(Math.max(0, ex.sets.findIndex((s) => !s.done)))}>
            <Text variant="subheadline" color="secondary">
              {t('workout:session.scheme', {
                sets: ex.sets.length,
                min: ex.repMin,
                max: ex.repMax,
                rest: formatClock(ex.restSec),
              })}
              {' · '}
              <Text variant="subheadline" color="tint">
                {t('workout:session.logDetail')} ›
              </Text>
            </Text>
          </Pressable>

          <View style={[styles.sets, { backgroundColor: colors.surface }]}>
            {ex.sets.map((s, i) => {
              const label = t('workout:session.toggleSet', {
                n: i + 1,
                kg: fmt.kg(s.loadKg),
                reps: s.done ? s.reps : `${ex.repMin}–${ex.repMax}`,
              });
              return (
                <View
                  key={i}
                  style={[
                    styles.setRow,
                    i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator } : null,
                  ]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint={t('workout:session.logDetail')}
                    onPress={() => openSet(i)}
                    style={styles.setMain}>
                    <Text variant="metric" color="secondary" style={{ width: 28 }}>
                      {i + 1}
                    </Text>
                    <Text variant="body" color={s.done ? 'label' : 'secondary'} style={{ flex: 1 }}>
                      {fmt.kg(s.loadKg)} × {s.done ? s.reps : `${ex.repMin}–${ex.repMax}`}
                      {s.done && s.rir !== null ? ` · RIR ${s.rir}` : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: s.done }}
                    hitSlop={8}
                    onPress={() => (s.done ? actions.undo(index, i) : actions.complete(index, i, {}))}
                    style={[
                      styles.check,
                      s.done
                        ? { backgroundColor: colors.tint }
                        : { borderWidth: 2, borderColor: colors.separator },
                    ]}>
                    {s.done ? <Symbol name="checkmark" size={16} color="onTint" weight="bold" /> : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
            <Button
              title={t('workout:session.addSet')}
              symbol="plus"
              variant="gray"
              size="small"
              onPress={() => updateExercise(index, addSet)}
            />
            <Button
              title={t('workout:session.removeSet')}
              symbol="minus"
              variant="gray"
              size="small"
              disabled={ex.sets.length <= 1 || !!ex.sets[ex.sets.length - 1]?.done}
              onPress={() => updateExercise(index, removeLastSet)}
            />
            <Button
              title={t('workout:session.swap')}
              symbol="arrow.triangle.2.circlepath"
              variant="gray"
              size="small"
              onPress={swapOptions}
            />
            <Button
              title={t('workout:session.removeExercise')}
              symbol="trash"
              variant="plain"
              size="small"
              destructive
              disabled={ex.sets.some((s) => s.done)}
              onPress={() => {
                setExercises((list) => list.filter((_, i) => i !== index));
                setCurrent(Math.max(0, index - 1));
              }}
            />
          </View>

          {ex.note ? (
            <Card level="nested" padding={12}>
              <Text variant="footnote" color="tint">
                {t(`workout:session.suggestion.${ex.note.kind}`, { n: ex.note.setNo, kg: fmt.kg(ex.note.kg) })}
              </Text>
            </Card>
          ) : null}

          {best ? (
            <View className="flex-row items-center" style={{ gap: spacing.sm }}>
              <Symbol name="trophy.fill" size={16} color={colors.streak} />
              <Text variant="footnote" color="secondary" style={{ flex: 1 }}>
                {best.oneRmKg
                  ? t('workout:session.pr', { kg: fmt.kg(best.loadKg), reps: best.reps, oneRm: fmt.kg(best.oneRmKg) })
                  : `${fmt.kg(best.loadKg)} × ${best.reps}`}
              </Text>
              {best.newRecords.length > 0 ? (
                <Text variant="footnote" weight="700" color="tint">
                  {t('workout:session.newPr')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <RestTimerCard />

      {next.length > 0 ? (
        <GroupedList header={t('workout:session.next')}>
          {next.map((e, i) => (
            <ListRow
              key={e.key}
              title={names.exercise(e.slug)}
              value={t('workout:session.schemeShort', { sets: e.sets.length, min: e.repMin, max: e.repMax })}
              onPress={() => setCurrent(index + 1 + i)}
            />
          ))}
        </GroupedList>
      ) : null}

      <Button
        title={t('workout:session.finish')}
        symbol="flag.checkered"
        loading={finisher.isPending}
        onPress={confirmFinish}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sets: { borderRadius: 26, overflow: 'hidden' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, minHeight: MIN_TOUCH + 8 },
  setMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH + 8 },
  check: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
