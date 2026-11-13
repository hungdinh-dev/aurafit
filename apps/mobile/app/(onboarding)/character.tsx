import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { CharacterAvatar } from '@/features/coach/components/CharacterAvatar';
import { VOICES } from '@/features/coach/insights';
import { useFinishOnboarding } from '@/features/onboarding/api';
import { ChoiceCard, StepProgress } from '@/features/onboarding/components';
import { useOnboardingDraft } from '@/features/onboarding/store';
import { Button, Card, Screen, SegmentedControl, Text, TextField, haptics, spacing } from '@/ui';

const CHARACTERS = [
  { code: 'kai', name: 'Kai', sexKey: 'male' },
  { code: 'mira', name: 'Mira', sexKey: 'female' },
] as const;

/** Onboarding step 3 – companion Kai / Mira + coach voice (ONB-04, ONB-05, COA-07). */
export default function CharacterScreen() {
  const { t } = useTranslation(['onboarding', 'coach', 'common']);
  const d = useOnboardingDraft();
  const finish = useFinishOnboarding();
  const name = d.characterName.trim() || (d.character === 'mira' ? 'Mira' : 'Kai');

  return (
    <>
      <BackHeader />
      <Screen title={t('onboarding:character.title')} eyebrow={t('onboarding:progress', { step: 3, total: 3 })}>
        <StepProgress step={3} total={3} />
        <Text variant="subheadline" color="secondary">
          {t('onboarding:character.body')}
        </Text>

        <View style={styles.row}>
          {CHARACTERS.map((c) => (
            <ChoiceCard
              key={c.code}
              selected={d.character === c.code}
              accessibilityLabel={`${c.name}, ${t(`onboarding:${c.sexKey}`)}`}
              onPress={() =>
                d.update({
                  character: c.code,
                  characterName: CHARACTERS.some((x) => x.name === d.characterName) || !d.characterName ? c.name : d.characterName,
                })
              }
              style={styles.card}>
              <CharacterAvatar character={c.code} name={c.name} aura="blue" mood="radiant" size={96} />
              <Text variant="headline">{c.name}</Text>
              <Text variant="caption" color="secondary">
                {t(`onboarding:${c.sexKey}`)}
              </Text>
            </ChoiceCard>
          ))}
        </View>

        <TextField
          label={t('onboarding:character.name')}
          value={d.characterName}
          onChangeText={(characterName) => d.update({ characterName })}
          placeholder={t('onboarding:character.namePlaceholder')}
          maxLength={30}
        />

        <View style={{ gap: 6 }}>
          <Text variant="footnote" color="secondary" style={styles.caption}>
            {t('onboarding:character.voice')}
          </Text>
          <SegmentedControl
            accessibilityLabel={t('onboarding:character.voice')}
            value={d.voice}
            onChange={(voice) => d.update({ voice })}
            options={VOICES.map((v) => ({ value: v, label: t(`coach:voices.${v}`) }))}
          />
        </View>

        <Card level="nested">
          <Text variant="subheadline">
            {t('coach:lineWithName', { name, line: t(`coach:lines.${d.voice}.thirsty`) })}
          </Text>
        </Card>

        {finish.isError ? (
          <Text variant="footnote" color="destructive">
            {t('onboarding:character.saveError')}
          </Text>
        ) : null}
        <Button
          title={t('onboarding:character.start', { name })}
          loading={finish.isPending}
          onPress={() =>
            finish.mutate(d, {
              onSuccess: () => haptics.success(),
              onError: () => haptics.error(),
            })
          }
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: { flex: 1, alignItems: 'center', gap: 2 },
  caption: { paddingHorizontal: spacing.lg },
});
