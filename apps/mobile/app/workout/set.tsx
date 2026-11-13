import { workout } from '@aurafit/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PushedHeader } from '@/features/workout/components/common';
import { LoadStepper, stepSize } from '@/features/workout/components/LoadStepper';
import { formatClock } from '@/features/workout/format';
import { REST_MAX_SEC, REST_MIN_SEC, REST_STEP_SEC } from '@/features/workout/restTimer';
import { loadSpecOf, swapExercise } from '@/features/workout/sessionLogic';
import { useWorkoutStore } from '@/features/workout/store';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { useSetActions } from '@/features/workout/useWorkoutActions';
import { Button, Card, Chip, GlassButton, Screen, Stepper, Text, spacing } from '@/ui';

const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;

/** Ghi set – WorkoutSet mockup: real load steps, reps, RIR 0–4+ (WRK-14), rest ±15 s, machine busy (WRK-17). */
export default function WorkoutSetScreen() {
  const params = useLocalSearchParams<{ exercise: string; set: string }>();
  const exIndex = Number(params.exercise ?? 0);
  const setIndex = Number(params.set ?? 0);
  const { t } = useTranslation(['workout', 'common']);
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const active = useWorkoutStore((s) => s.active);
  const updateExercise = useWorkoutStore((s) => s.updateExercise);
  const ex = active?.exercises[exIndex];
  const draft = ex?.sets[setIndex];
  const actions = useSetActions();

  const [loadKg, setLoadKg] = useState<number | null>(draft?.loadKg ?? null);
  const [reps, setReps] = useState(draft?.reps ?? ex?.repMax ?? 8);
  const [rir, setRir] = useState<number | null>(draft?.rir ?? null);
  const [restSec, setRestSec] = useState(ex?.restSec ?? 90);
  const [slugSeen, setSlugSeen] = useState(ex?.slug);

  // Reset the load when the exercise is swapped (machine busy ↔ main).
  if (ex && ex.slug !== slugSeen) {
    setSlugSeen(ex.slug);
    setLoadKg(ex.sets[setIndex]?.loadKg ?? null);
  }

  if (!active || !ex || !draft) {
    return (
      <Screen title={t('workout:set.title')}>
        <PushedHeader />
        <EmptyCard symbol="figure.strengthtraining.traditional" body={t('workout:session.notFound')} />
      </Screen>
    );
  }

  const info = workout.requireExercise(ex.slug);
  const spec = loadSpecOf(ex.slug, active.inventory);
  const isBackup = ex.slug !== ex.mainSlug;
  const backup = isBackup
    ? ex.mainSlug
    : (ex.backupSlug ??
      workout.pickBackup(ex.slug, {
        availableEquipment: undefined,
        excludeSlugs: active.exercises.map((e) => e.slug),
      }));
  const step = loadKg !== null ? stepSize(loadKg, spec) : null;
  const effectiveLoad = loadKg !== null ? loadKg + (draft.addedLoadKg ?? 0) : draft.addedLoadKg;
  const isLast = ex.sets.every((s, i) => i === setIndex || s.done);
  const preview = workout.autoregulate({
    set: { loadKg: effectiveLoad ?? null, reps, rir },
    repMin: ex.repMin,
    repMax: ex.repMax,
    targetRir: ex.targetRir,
    loadSpec: spec,
    isLastSet: isLast,
  });
  const feedbackKey =
    preview.action === 'hold'
      ? 'hold'
      : preview.suggestedLoadKg === null
        ? preview.action === 'increase'
          ? 'increaseNoLoad'
          : 'decreaseNoLoad'
        : `${preview.action}${preview.scope === 'next_session' ? 'Session' : ''}`;
  const feedback = t(`workout:set.feedback.${feedbackKey}` as 'workout:set.feedback.hold', {
    kg: fmt.kg(preview.suggestedLoadKg),
  });
  const defaultRest = workout.defaultRest(info.mechanic, { repMax: ex.repMax }).restSec;

  const toggleBusy = () => {
    if (!backup) return;
    updateExercise(exIndex, (e) => swapExercise(e, backup, active.inventory));
  };

  const done = () => {
    actions.complete(exIndex, setIndex, { loadKg, reps, rir }, restSec);
    router.back();
  };

  return (
    <Screen
      title={names.exercise(ex.slug)}
      eyebrow={t('workout:set.position', {
        exercise: exIndex + 1,
        exercises: active.exercises.length,
        set: setIndex + 1,
        sets: ex.sets.length,
      })}>
      <PushedHeader
        headerRight={
          backup
            ? () => (
                <GlassButton
                  symbol={isBackup ? 'arrow.uturn.backward' : 'exclamationmark.circle'}
                  label={isBackup ? t('workout:set.busyBack') : t('workout:set.busy')}
                  accessibilityLabel={isBackup ? t('workout:set.busyBack') : t('workout:set.busy')}
                  onPress={toggleBusy}
                />
              )
            : undefined
        }
      />
      <Text variant="subheadline" color="secondary">
        {t('workout:set.target', {
          equipment: names.equipment(info.equipment),
          min: ex.repMin,
          max: ex.repMax,
          rir: ex.targetRir ?? workout.DEFAULT_TARGET_RIR,
        })}
      </Text>
      {isBackup ? (
        <Card level="nested" padding={12}>
          <Text variant="footnote" color="tint">
            {t('workout:set.backupNote', {
              sets: ex.sets.length,
              min: ex.repMin,
              max: ex.repMax,
              rir: ex.targetRir ?? workout.DEFAULT_TARGET_RIR,
            })}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="footnote" color="secondary">
            {t('workout:set.load')}
            {step ? ` · ${t('workout:set.stepNote', { step: fmt.kg(step) })}` : ''}
          </Text>
          {loadKg !== null && spec.kind !== 'bodyweight' ? (
            <LoadStepper
              value={loadKg}
              onChange={setLoadKg}
              spec={spec}
              format={(v) => fmt.kg(v)}
              accessibilityLabel={t('workout:set.load')}
              decrementLabel={t('workout:set.decLoad')}
              incrementLabel={t('workout:set.incLoad')}
            />
          ) : (
            <Text variant="metricLarge" align="center">
              {t('workout:set.noLoad')}
            </Text>
          )}
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text variant="footnote" color="secondary">
            {t('workout:set.reps')}
          </Text>
          <Stepper
            value={reps}
            onChange={setReps}
            min={0}
            max={100}
            format={(v) => String(v)}
            accessibilityLabel={t('workout:set.reps')}
            decrementLabel={t('workout:set.decReps')}
            incrementLabel={t('workout:set.incReps')}
            style={{ justifyContent: 'space-between' }}
          />
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            router.push({ pathname: '/workout/special-load', params: { exercise: String(exIndex), set: String(setIndex) } })
          }
          style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="subheadline" color="tint">
            {t('workout:set.special')} ›
          </Text>
        </Pressable>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="footnote" color="secondary">
          {t('workout:set.rirQuestion')}
        </Text>
        <View className="flex-row" style={{ gap: spacing.sm }}>
          {RIR_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={value === 4 ? '4+' : String(value)}
              selected={rir === value}
              onPress={() => setRir(rir === value ? null : value)}
              style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}
            />
          ))}
        </View>
        {rir !== null ? (
          <Text variant="footnote" color="secondary">
            {t(`workout:set.rirDesc.${rir}` as 'workout:set.rirDesc.0')}
          </Text>
        ) : null}
        <Card level="nested" padding={12}>
          <Text variant="footnote" color={preview.action === 'hold' ? 'tint' : 'warning'}>
            {feedback}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('workout:set.rest')}</Text>
          <Text variant="footnote" color="secondary">
            {t('workout:set.restDefault', {
              kind: t(`workout:set.kind.${info.mechanic}`),
              time: formatClock(defaultRest),
            })}
          </Text>
        </View>
        <Stepper
          value={restSec}
          onChange={setRestSec}
          min={REST_MIN_SEC}
          max={REST_MAX_SEC}
          step={REST_STEP_SEC}
          format={formatClock}
          accessibilityLabel={t('workout:set.rest')}
          decrementLabel={t('workout:session.restMinus')}
          incrementLabel={t('workout:session.restPlus')}
          style={{ justifyContent: 'space-between' }}
        />
      </Card>

      <Button title={t('workout:set.done')} symbol="checkmark" onPress={done} />
    </Screen>
  );
}
