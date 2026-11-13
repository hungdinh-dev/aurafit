import { workout } from '@aurafit/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DEFAULT_BANDS, useLatestBodyweight } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PushedHeader } from '@/features/workout/components/common';
import { patchSet } from '@/features/workout/sessionLogic';
import { useWorkoutStore } from '@/features/workout/store';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { Button, Card, Chip, Screen, SegmentedControl, Stepper, Text, haptics, spacing } from '@/ui';

type Tab = 'belt' | 'side' | 'band';
/** Fallback until the user logs a weigh-in (only used for the on-screen total). */
const FALLBACK_BODYWEIGHT_KG = 70;
const BELT_STEP_KG = 2.5;

/** Tải đặc biệt – SpecialLoad mockup: belt load, per-side reps, bands (WRK-19). */
export default function SpecialLoadScreen() {
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
  const weight = useLatestBodyweight();

  const [tab, setTab] = useState<Tab>('belt');
  const [bodyweight, setBodyweight] = useState<number | null>(null);
  const [belt, setBelt] = useState(draft?.addedLoadKg ?? 0);
  const [left, setLeft] = useState(draft?.reps ?? 10);
  const [right, setRight] = useState(draft?.reps ?? 10);
  const [mode, setMode] = useState<'assist' | 'resist'>('assist');
  const bands = active?.inventory?.bands?.length ? active.inventory.bands : DEFAULT_BANDS;
  const [picked, setPicked] = useState<string[]>(draft?.bands?.map((b) => b.color) ?? []);

  if (!active || !ex || !draft) {
    return (
      <Screen title={t('workout:special.title')}>
        <PushedHeader />
        <EmptyCard symbol="scalemass" body={t('workout:session.notFound')} />
      </Screen>
    );
  }

  const bw = bodyweight ?? weight.data ?? FALLBACK_BODYWEIGHT_KG;
  const bandUses: workout.BandUse[] = bands
    .filter((b) => picked.includes(b.color))
    .map((b) => ({ color: b.color, kgEquiv: b.kg_equiv }));
  const total = workout.effectiveLoad({
    exerciseSlug: ex.slug,
    bodyweightKg: bw,
    addedLoadKg: tab === 'belt' ? belt : 0,
    bands: tab === 'band' ? bandUses : [],
    bandMode: mode,
  });
  const sides = workout.analyzeSides(left, right);
  const bandName = (color: string) =>
    color === 'yellow' || color === 'red' || color === 'blue' || color === 'black'
      ? t(`workout:special.bandColor.${color}`)
      : color;

  const apply = () => {
    haptics.success();
    updateExercise(exIndex, (e) =>
      patchSet(
        e,
        setIndex,
        tab === 'belt'
          ? { addedLoadKg: belt > 0 ? belt : null }
          : tab === 'side'
            ? { reps: sides.creditedReps }
            : { bands: bandUses.length ? bandUses : null }
      )
    );
    router.back();
  };

  return (
    <Screen title={t('workout:special.title')} eyebrow={names.exercise(ex.slug)}>
      <PushedHeader />
      <SegmentedControl
        options={(['belt', 'side', 'band'] as const).map((k) => ({ value: k, label: t(`workout:special.tabs.${k}`) }))}
        value={tab}
        onChange={setTab}
      />

      {tab !== 'side' ? (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="footnote" color="secondary">
            {t('workout:special.bodyweight')}
          </Text>
          <Stepper
            value={bw}
            onChange={setBodyweight}
            min={30}
            max={250}
            step={0.5}
            format={(v) => fmt.kg(v)}
            accessibilityLabel={t('workout:special.bodyweight')}
            decrementLabel={t('common:actions.decrease')}
            incrementLabel={t('common:actions.increase')}
            style={{ justifyContent: 'space-between' }}
          />
        </Card>
      ) : null}

      {tab === 'belt' ? (
        <Card style={{ gap: spacing.md }}>
          <Text variant="footnote" color="secondary">
            {t('workout:special.belt')}
          </Text>
          <Stepper
            value={belt}
            onChange={setBelt}
            min={0}
            max={200}
            step={BELT_STEP_KG}
            format={(v) => fmt.kg(v)}
            accessibilityLabel={t('workout:special.belt')}
            decrementLabel={t('common:actions.decrease')}
            incrementLabel={t('common:actions.increase')}
            style={{ justifyContent: 'space-between' }}
          />
          <View className="flex-row items-center justify-between">
            <Text variant="headline">{t('workout:special.total')}</Text>
            <Text variant="metric" color="tint">
              {fmt.kg(total.totalLoadKg)}
            </Text>
          </View>
          <Text variant="footnote" color="secondary">
            {t('workout:special.beltNote')}
          </Text>
        </Card>
      ) : null}

      {tab === 'side' ? (
        <Card style={{ gap: spacing.md }}>
          {(
            [
              ['left', left, setLeft],
              ['right', right, setRight],
            ] as const
          ).map(([side, value, set]) => (
            <View key={side} style={{ gap: spacing.xs }}>
              <Text variant="footnote" color="secondary">
                {t(`workout:special.${side}`)}
              </Text>
              <Stepper
                value={value}
                onChange={set}
                min={0}
                max={100}
                format={(v) => t('workout:units.reps', { value: v })}
                accessibilityLabel={t(`workout:special.${side}`)}
                decrementLabel={t('workout:set.decReps')}
                incrementLabel={t('workout:set.incReps')}
                style={{ justifyContent: 'space-between' }}
              />
            </View>
          ))}
          <Card level="nested" padding={12}>
            <Text variant="footnote" color={sides.imbalanced ? 'warning' : 'tint'}>
              {sides.imbalanced && sides.weakerSide
                ? t('workout:special.imbalance', {
                    pct: fmt.num(sides.imbalancePct, 0),
                    side: t(`workout:special.sideName.${sides.weakerSide}`),
                  })
                : t('workout:special.balanced')}
            </Text>
          </Card>
          <Text variant="footnote" color="secondary">
            {t('workout:special.credited', { reps: sides.creditedReps })}
          </Text>
        </Card>
      ) : null}

      {tab === 'band' ? (
        <Card style={{ gap: spacing.md }}>
          <SegmentedControl
            options={(['assist', 'resist'] as const).map((k) => ({ value: k, label: t(`workout:special.bandMode.${k}`) }))}
            value={mode}
            onChange={setMode}
          />
          <Text variant="footnote" color="secondary">
            {t('workout:special.bandsPick')}
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
            {bands.map((b) => (
              <Chip
                key={b.color}
                label={`${bandName(b.color)} ≈ ${fmt.kg(b.kg_equiv)}`}
                selected={picked.includes(b.color)}
                onPress={() =>
                  setPicked((p) => (p.includes(b.color) ? p.filter((c) => c !== b.color) : [...p, b.color]))
                }
              />
            ))}
          </View>
          <Text variant="headline">
            {t('workout:special.bandTotal', { kg: fmt.kg(Math.abs(total.bandKg)) })}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text variant="subheadline">{t('workout:special.total')}</Text>
            <Text variant="metric" color="tint">
              {fmt.kg(total.totalLoadKg)}
            </Text>
          </View>
          <Text variant="footnote" color="secondary">
            {t('workout:special.bandNote')}
          </Text>
        </Card>
      ) : null}

      <Button title={t('workout:special.apply')} symbol="checkmark" onPress={apply} />
    </Screen>
  );
}
