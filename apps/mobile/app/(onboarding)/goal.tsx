import { coach } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { STRICTNESS_LEVELS } from '@/features/coach/insights';
import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { ChoiceCard, StepProgress } from '@/features/onboarding/components';
import { computeOnboardingTargets, useOnboardingDraft } from '@/features/onboarding/store';
import { Button, Card, GroupedList, ListRow, Screen, Stepper, Text, spacing, useTheme } from '@/ui';

/** Onboarding step 2 – targets with explanation (NUT-01), strictness (ONB-04), free days (NUT-09). */
export default function GoalScreen() {
  const { t } = useTranslation(['onboarding', 'coach', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const d = useOnboardingDraft();
  const { result } = computeOnboardingTargets(d, localToday());

  if (!result) {
    return (
      <>
        <BackHeader />
        <Screen title={t('onboarding:result.title')}>
          <Text variant="body" color="secondary">
            {t('onboarding:result.error')}
          </Text>
        </Screen>
      </>
    );
  }

  const { targets, explanation: e } = result;
  const kg = Math.abs(e.plannedKgPerWeek);
  const paceLine =
    e.goal === 'maintain'
      ? t('onboarding:result.maintain')
      : t(e.goal === 'lose_fat' ? 'onboarding:result.lose' : 'onboarding:result.gain', { kg: f.num(kg, 2) });
  const delta = e.plannedDailyDeltaKcal;
  const deltaText = delta === 0 ? '±0' : (delta > 0 ? '+' : '−') + f.num(Math.abs(delta));
  const autoReason = d.pace === 'auto' && e.resolvedPace ? e.paceReasons[0] : null;

  const macros = [
    { key: 'protein', g: targets.protein_g, color: colors.data.protein },
    { key: 'carb', g: targets.carb_g, color: colors.data.carb },
    { key: 'fat', g: targets.fat_g, color: colors.data.fat },
  ] as const;

  return (
    <>
      <BackHeader />
      <Screen title={t('onboarding:result.title')} eyebrow={t('onboarding:progress', { step: 2, total: 3 })}>
        <StepProgress step={2} total={3} />

        <Card style={{ gap: spacing.md }}>
          <Text variant="metricLarge" color="tint">
            {t('onboarding:result.kcal', { kcal: f.num(targets.kcal) })}
          </Text>
          <View style={styles.line}>
            <Text variant="subheadline" color="secondary" style={styles.flex}>
              {t('onboarding:result.bmr')}
            </Text>
            <Text variant="subheadline" weight="600">
              {f.num(e.bmrKcal)}
            </Text>
          </View>
          <View style={styles.line}>
            <Text variant="subheadline" color="secondary" style={styles.flex}>
              {t('onboarding:result.tdee', { factor: f.num(e.activityFactor, 3), tdee: f.num(e.tdeeKcal) })}
            </Text>
          </View>
          <View style={styles.line}>
            <Text variant="subheadline" color="secondary" style={styles.flex}>
              {paceLine}
            </Text>
            <Text variant="subheadline" weight="600">
              {deltaText}
            </Text>
          </View>
          {e.floorApplied ? (
            <Text variant="footnote" color="warning">
              {t('onboarding:result.floor', { kcal: f.num(e.floorKcal) })}
            </Text>
          ) : null}
          {autoReason ? (
            <Text variant="footnote" color="secondary">
              {t('onboarding:result.autoPace', {
                pace: t(`onboarding:paces.${e.resolvedPace ?? 'medium'}`),
                reason: t(`onboarding:result.reasons.${autoReason}`),
              })}
            </Text>
          ) : null}
          <View style={styles.macros}>
            {macros.map((m) => (
              <View key={m.key} style={styles.macro}>
                <Text variant="caption" color="secondary">
                  {t(`onboarding:result.${m.key}`)}
                </Text>
                <Text variant="headline" color={m.color}>
                  {t('onboarding:result.grams', { g: f.num(m.g) })}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="footnote" color="secondary">
            {t('onboarding:result.sugarMax', { g: f.num(targets.sugar_g) })}
          </Text>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Text variant="headline">{t('onboarding:result.strictnessTitle')}</Text>
          {STRICTNESS_LEVELS.map((level) => {
            const r = coach.rulesFor(level);
            const rule = t('coach:strictnessRule', {
              pct: Math.round(r.kcalTolerance * 100),
              pass: r.passThreshold,
              shield: r.autoShield ? t('coach:shieldAuto') : t('coach:shieldManual'),
            });
            return (
              <ChoiceCard
                key={level}
                selected={d.strictness === level}
                accessibilityLabel={`${t(`coach:strictness.${level}`)}, ${rule}`}
                onPress={() => d.update({ strictness: level, freeDaysPerWeek: r.defaultFreeDaysPerWeek })}>
                <Text variant="headline">{t(`coach:strictness.${level}`)}</Text>
                <Text variant="footnote" color="secondary">
                  {rule}
                </Text>
              </ChoiceCard>
            );
          })}
          <Text variant="footnote" color="secondary">
            {t('coach:strictnessNote')}
          </Text>
        </View>

        <GroupedList>
          <ListRow
            title={t('onboarding:result.freeDays')}
            subtitle={t('onboarding:result.freeDaysSub')}
            trailing={
              <Stepper
                value={d.freeDaysPerWeek}
                onChange={(freeDaysPerWeek) => d.update({ freeDaysPerWeek })}
                min={0}
                max={3}
                format={(v) => String(v)}
                accessibilityLabel={t('onboarding:result.freeDays')}
                decrementLabel={t('common:actions.decrease')}
                incrementLabel={t('common:actions.increase')}
              />
            }
          />
        </GroupedList>

        <Button title={t('common:actions.continue')} onPress={() => router.push('/character')} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  macros: { flexDirection: 'row', gap: spacing.md },
  macro: { flex: 1, gap: 2 },
});
