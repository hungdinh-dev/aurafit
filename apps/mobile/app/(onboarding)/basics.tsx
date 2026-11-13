import { nutrition } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { ChoiceCard, NumberRow, StepProgress } from '@/features/onboarding/components';
import {
  GOALS,
  ONBOARDING_ACTIVITIES,
  PACES,
  computeOnboardingTargets,
  useOnboardingDraft,
} from '@/features/onboarding/store';
import { Button, GroupedList, Screen, SegmentedControl, Text, haptics, spacing } from '@/ui';

/** Onboarding step 1 – "Về bạn" (ONB-03): body data, activity, goal, pace. */
export default function BasicsScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const router = useRouter();
  const f = useFormat();
  const d = useOnboardingDraft();
  const { issues } = computeOnboardingTargets(d, localToday());

  const paceDesc =
    d.goal === 'maintain'
      ? t('onboarding:paceMaintain')
      : d.pace === 'auto'
        ? t('onboarding:paceAuto')
        : t(d.goal === 'lose_fat' ? 'onboarding:paceLose' : 'onboarding:paceGain', {
            kg: f.num(nutrition.PACE_KG_PER_WEEK[d.goal][d.pace], 2),
          });

  return (
    <Screen title={t('onboarding:basics.title')} eyebrow={t('onboarding:progress', { step: 1, total: 3 })}>
      <StepProgress step={1} total={3} />

      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {t('onboarding:sex')}
        </Text>
        <SegmentedControl
          accessibilityLabel={t('onboarding:sex')}
          value={d.sex}
          onChange={(sex) => d.update({ sex })}
          options={[
            { value: 'male', label: t('onboarding:male') },
            { value: 'female', label: t('onboarding:female') },
          ]}
        />
      </View>

      <GroupedList>
        <NumberRow label={t('onboarding:birthYear')} value={d.birthYear} onChange={(birthYear) => d.update({ birthYear })} />
        <NumberRow
          label={t('onboarding:height')}
          unit={t('onboarding:unitCm')}
          value={d.heightCm}
          onChange={(heightCm) => d.update({ heightCm })}
        />
        <NumberRow
          label={t('onboarding:weight')}
          unit={t('onboarding:unitKg')}
          decimals={1}
          value={d.weightKg}
          onChange={(weightKg) => d.update({ weightKg })}
        />
      </GroupedList>
      {issues.map((issue) => (
        <Text key={issue} variant="footnote" color="destructive">
          {t(`onboarding:issues.${issue}`)}
        </Text>
      ))}

      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {t('onboarding:activity')}
        </Text>
        <SegmentedControl
          accessibilityLabel={t('onboarding:activity')}
          value={d.activity}
          onChange={(activity) => d.update({ activity })}
          options={ONBOARDING_ACTIVITIES.map((a) => ({ value: a, label: t(`onboarding:activities.${a}.label`) }))}
        />
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {t(`onboarding:activities.${d.activity}.desc`)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {t('onboarding:goal')}
        </Text>
        <View style={styles.goals}>
          {GOALS.map((g) => (
            <ChoiceCard
              key={g}
              selected={d.goal === g}
              onPress={() => d.update({ goal: g })}
              accessibilityLabel={`${t(`onboarding:goals.${g}.label`)}, ${t(`onboarding:goals.${g}.sub`)}`}
              style={styles.goal}>
              <Text variant="headline">{t(`onboarding:goals.${g}.label`)}</Text>
              <Text variant="caption" color="secondary">
                {t(`onboarding:goals.${g}.sub`)}
              </Text>
            </ChoiceCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {t('onboarding:pace')}
        </Text>
        {d.goal !== 'maintain' ? (
          <SegmentedControl
            accessibilityLabel={t('onboarding:pace')}
            value={d.pace}
            onChange={(pace) => d.update({ pace })}
            options={PACES.map((p) => ({ value: p, label: t(`onboarding:paces.${p}`) }))}
          />
        ) : null}
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {paceDesc}
        </Text>
      </View>

      <Button
        title={t('onboarding:seeTargets')}
        disabled={issues.length > 0}
        onPress={() => {
          haptics.light();
          router.push('/goal');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  caption: { paddingHorizontal: spacing.lg },
  goals: { flexDirection: 'row', gap: spacing.sm },
  goal: { flex: 1, gap: 2, paddingTop: spacing.lg },
});
