import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Symbol, Text, radii, spacing, useTheme } from '@/ui';

export interface ExerciseMediaProps {
  /** Licensed GIF / WebP / image URL (exercise_media). `null` → placeholder until media is licensed. */
  mediaUrl: string | null | undefined;
  accessibilityLabel: string;
  height?: number;
}

/** Guide animation area. No media is bundled yet: shows a neutral placeholder when `mediaUrl` is empty. */
export function ExerciseMedia({ mediaUrl, accessibilityLabel, height = 200 }: ExerciseMediaProps) {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  if (mediaUrl) {
    return (
      <Image
        source={{ uri: mediaUrl }}
        contentFit="contain"
        autoplay
        accessibilityLabel={accessibilityLabel}
        style={[styles.box, { height, backgroundColor: colors.surfaceNested }]}
      />
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={`${accessibilityLabel}. ${t('exercise.mediaPlaceholder')}`}
      style={[styles.box, styles.placeholder, { height, backgroundColor: colors.surfaceNested }]}>
      <Symbol name="figure.strengthtraining.traditional" size={44} color="tertiary" />
      <Text variant="footnote" color="secondary" align="center">
        {t('exercise.mediaPlaceholder')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', borderRadius: radii.inner, overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
});
