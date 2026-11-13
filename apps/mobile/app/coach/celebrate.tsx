import { time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, View } from 'react-native';

import { useCoachSettings, useCoachState, useDailyScore } from '@/features/coach/api';
import { BackHeader } from '@/features/coach/components/BackHeader';
import { CharacterAvatar } from '@/features/coach/components/CharacterAvatar';
import { asAuraTier, asVoice } from '@/features/coach/insights';
import { localToday } from '@/features/coach/lib/clock';
import { useMyProfile } from '@/features/profile/api';
import { Button, Card, Screen, Text, haptics, spacing } from '@/ui';

/** Tuyên dương (COA-08, COA-02): yesterday's closed score, shields, streak – all server values. */
export default function CelebrateScreen() {
  const { t } = useTranslation(['coach', 'common']);
  const router = useRouter();
  const yesterday = time.addDays(localToday(), -1);
  const score = useDailyScore(yesterday);
  const state = useCoachState();
  const settings = useCoachSettings();
  const profile = useMyProfile();
  const voice = asVoice(settings.data?.voice);
  const character = profile.data?.character === 'mira' ? 'mira' : 'kai';
  const name = profile.data?.character_name ?? (character === 'mira' ? 'Mira' : 'Kai');
  const total = score.data?.total ?? null;
  const streak = state.data?.streak ?? 0;

  useEffect(() => {
    if (total != null) haptics.heavy();
  }, [total]);

  const stats = [
    { value: `+${state.data?.shield_fragments ?? 0}`, label: t('coach:celebrate.fragments', { have: state.data?.shield_fragments ?? 0 }) },
    { value: String(state.data?.level ?? 1), label: t('coach:celebrate.level') },
    { value: String(streak), label: t('coach:celebrate.streakDays') },
  ];

  return (
    <>
      <BackHeader />
      <Screen title={t('coach:celebrate.title')}>
        {total == null ? (
          <Text variant="body" color="secondary">
            {score.isLoading ? null : t('coach:celebrate.empty')}
          </Text>
        ) : (
          <>
            <View style={styles.center}>
              <CharacterAvatar
                character={character}
                name={name}
                mood="radiant"
                aura={asAuraTier(state.data?.aura_tier)}
                size={150}
              />
              <Text variant="metricLarge" color="tint">
                {total}
              </Text>
              <Text variant="subheadline" color="secondary">
                {t('coach:celebrate.points')}
              </Text>
            </View>
            <Card level="nested">
              <Text variant="subheadline">
                {t('coach:lineWithName', { name, line: t(`coach:celebrate.line.${voice}`, { score: total }) })}
              </Text>
            </Card>
            <View style={styles.stats}>
              {stats.map((s) => (
                <Card key={s.label} style={styles.stat}>
                  <Text variant="metric">{s.value}</Text>
                  <Text variant="caption" color="secondary" align="center">
                    {s.label}
                  </Text>
                </Card>
              ))}
            </View>
            <Button
              title={t('coach:celebrate.share')}
              variant="gray"
              symbol="square.and.arrow.up"
              onPress={() => void Share.share({ message: t('coach:celebrate.shareMessage', { score: total, streak }) })}
            />
          </>
        )}
        <Button title={t('common:actions.continue')} onPress={() => router.back()} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.xs },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
});
