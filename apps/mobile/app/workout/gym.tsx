import { workout } from '@aurafit/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EQUIPMENT_CODES, useCanSync, useGymProfile, useSaveGymProfile, type GymProfile } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { PreviewNote, PushedHeader } from '@/features/workout/components/common';
import { useWorkoutStore } from '@/features/workout/store';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { Button, Card, Chip, GroupedList, ListRow, Screen, SegmentedControl, Stepper, Text, haptics, spacing } from '@/ui';

/** Plate colours (competition plate convention, GymProfile mockup). Data colours. */
const PLATE_COLORS: Readonly<Record<string, string>> = {
  '25': '#FF453A',
  '20': '#0A84FF',
  '15': '#FFD60A',
  '10': '#30D158',
  '5': '#F2F2F7',
  '2.5': '#FF9F0A',
  '1.25': '#A1A1A8',
};
const MACHINES = ['leg_press', 'lat_pulldown', 'seated_cable_row', 'machine_chest_press', 'cable_pushdown'] as const;
const KINDS: readonly workout.EquipmentProfileKind[] = ['gym', 'home', 'bodyweight'];

/** Kho dụng cụ – GymProfile mockup: plates on/off, machine steps, plate calculator (WRK-18). */
export default function GymProfileScreen() {
  const kind = useWorkoutStore((s) => s.profileKind);
  const { profile, isLoading } = useGymProfile(kind);
  // Re-mount the editor when the place type or the saved profile changes.
  return <GymEditor key={`${kind}-${profile.id ?? 'local'}-${isLoading}`} profile={profile} />;
}

function GymEditor({ profile }: { profile: GymProfile }) {
  const { t } = useTranslation('workout');
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const canSync = useCanSync();
  const kind = profile.kind;
  const setKind = useWorkoutStore((s) => s.setProfileKind);
  const save = useSaveGymProfile();
  const [draft, setDraft] = useState<GymProfile>(profile);
  const [target, setTarget] = useState(72.5);

  const plates = draft.inventory.plates_kg ?? [...workout.DEFAULT_PLATES_KG];
  const barKg = draft.inventory.bars?.find((b) => b.type === 'olympic')?.kg ?? workout.DEFAULT_OLYMPIC_BAR_KG;
  const loadout = workout.calculatePlates(target, { barKg, platesKg: plates, plateCounts: draft.inventory.plate_counts });
  const togglePlate = (kg: number) => {
    const next = plates.includes(kg) ? plates.filter((p) => p !== kg) : [...plates, kg].sort((a, b) => b - a);
    setDraft({ ...draft, inventory: { ...draft.inventory, plates_kg: next } });
  };
  const toggleEquipment = (code: workout.EquipmentCode) => {
    const has = draft.equipment.includes(code);
    setDraft({ ...draft, equipment: has ? draft.equipment.filter((c) => c !== code) : [...draft.equipment, code] });
  };
  const machineStep = (slug: string) => {
    const ex = workout.requireExercise(slug);
    return draft.inventory.machines?.[slug]?.step_kg ?? ex.loadStepKg ?? workout.DEFAULT_MACHINE_STEP_KG;
  };
  const setMachineStep = (slug: string, step: number) =>
    setDraft({
      ...draft,
      inventory: { ...draft.inventory, machines: { ...draft.inventory.machines, [slug]: { step_kg: step } } },
    });

  const onSave = () =>
    save.mutate(
      { ...draft, kind, name: draft.name || t('gym.defaultName') },
      { onSuccess: () => haptics.success(), onError: () => haptics.error() }
    );

  return (
    <Screen title={t('gym.title')}>
      <PushedHeader />
      {!canSync ? <PreviewNote text={t('gym.localOnly')} /> : null}
      <SegmentedControl
        accessibilityLabel={t('gym.kind')}
        options={KINDS.map((k) => ({ value: k, label: t(`equipmentKind.${k}`) }))}
        value={kind}
        onChange={setKind}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="footnote" color="secondary">
          {t('gym.equipment')}
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
          {EQUIPMENT_CODES.map((code) => (
            <Chip
              key={code}
              label={names.equipment(code)}
              selected={draft.equipment.includes(code)}
              onPress={() => toggleEquipment(code)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="footnote" color="secondary">
          {t('gym.plates')}
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
          {workout.DEFAULT_PLATES_KG.map((kg) => (
            <Chip
              key={kg}
              label={fmt.num(kg)}
              selected={plates.includes(kg)}
              onPress={() => togglePlate(kg)}
            />
          ))}
        </View>
      </View>

      <GroupedList header={t('gym.machines')}>
        {MACHINES.map((slug) => (
          <ListRow
            key={slug}
            title={names.exercise(slug)}
            trailing={
              <Stepper
                value={machineStep(slug)}
                onChange={(v) => setMachineStep(slug, v)}
                min={0.5}
                max={20}
                step={0.5}
                format={(v) => t('gym.machineStep', { kg: fmt.kg(v) })}
                accessibilityLabel={names.exercise(slug)}
                decrementLabel={t('set.decLoad')}
                incrementLabel={t('set.incLoad')}
              />
            }
          />
        ))}
      </GroupedList>

      <Card style={{ gap: spacing.md }}>
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('gym.calculator')}</Text>
          <Text variant="footnote" color="secondary">
            {t('gym.bar', { kg: fmt.kg(barKg) })}
          </Text>
        </View>
        <Stepper
          value={target}
          onChange={setTarget}
          min={barKg}
          max={400}
          step={2.5}
          format={(v) => fmt.kg(v)}
          accessibilityLabel={t('gym.target')}
          decrementLabel={t('set.decLoad')}
          incrementLabel={t('set.incLoad')}
          style={{ justifyContent: 'space-between' }}
        />
        <View style={styles.bar} accessible accessibilityLabel={t('gym.perSide', { plates: loadout.perSide.map((p) => fmt.kg(p)).join(' + ') })}>
          <View style={[styles.sleeve]} />
          {loadout.perSide.map((kg, i) => (
            <View
              key={`${kg}-${i}`}
              style={[styles.plate, { height: 28 + kg * 2.4, backgroundColor: PLATE_COLORS[String(kg)] ?? '#8E8E93' }]}
            />
          ))}
        </View>
        <Text variant="subheadline">
          {loadout.perSide.length
            ? t('gym.perSide', { plates: loadout.perSide.map((p) => fmt.num(p)).join(' + ') + ' kg' })
            : t('gym.barOnly')}
        </Text>
        <Text variant="footnote" color={loadout.exact ? 'tint' : 'warning'}>
          {loadout.exact ? t('gym.exact') : t('gym.nearest', { kg: fmt.kg(loadout.achievedKg) })}
        </Text>
      </Card>

      {save.isError ? (
        <Text variant="footnote" color="destructive">
          {t('gym.saveError')}
        </Text>
      ) : null}
      {save.isSuccess ? (
        <Text variant="footnote" color="tint">
          {t('gym.saved')}
        </Text>
      ) : null}
      <Button title={t('gym.save')} symbol="tray.and.arrow.down.fill" loading={save.isPending} onPress={onSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 90 },
  sleeve: { width: 40, height: 10, borderRadius: 3, backgroundColor: '#8E8E93' },
  plate: { width: 14, borderRadius: 3 },
});
