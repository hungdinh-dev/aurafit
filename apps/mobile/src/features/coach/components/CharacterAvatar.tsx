import type { coach } from '@aurafit/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Symbol, Text, useTheme, type SFSymbol, type ThemeColors } from '@/ui';

export type CharacterCode = 'kai' | 'mira';

export type CharacterAvatarProps = {
  /** Which companion (`profiles.character`). */
  character: CharacterCode;
  /** Current mood (`coach.deriveMood` or `coach_state.mood`). */
  mood?: coach.Mood;
  /** Aura tier (`coach_state.aura_tier`) – colors the halo. */
  aura?: coach.AuraTier;
  /** Display name (defaults to Kai / Mira). */
  name?: string;
  /** Width in pt (height = 1.15 × size). Default 104. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const MOOD_SYMBOL: Record<coach.Mood, SFSymbol> = {
  radiant: 'sparkles',
  sleepy: 'moon.zzz.fill',
  thirsty: 'drop.fill',
  hungry: 'fork.knife',
  fired_up: 'flame.fill',
  sad: 'cloud.rain.fill',
  neutral: 'face.smiling',
};

export function auraColor(colors: ThemeColors, aura: coach.AuraTier): string {
  switch (aura) {
    case 'green':
      return colors.icon.green;
    case 'blue':
      return colors.data.carb;
    case 'purple':
      return colors.data.protein;
    case 'gold':
      return colors.streak;
    case 'red':
      return colors.icon.red;
    default:
      return colors.icon.gray;
  }
}

/**
 * Companion character (COA-06). PLACEHOLDER art: an aura halo + initial + mood badge.
 * The owner will supply the real Kai / Mira art (Rive/PNG) – keep this props interface.
 */
export function CharacterAvatar({
  character,
  mood = 'neutral',
  aura = 'gray',
  name,
  size = 104,
  style,
}: CharacterAvatarProps) {
  const { t } = useTranslation('coach');
  const { colors } = useTheme();
  const color = auraColor(colors, aura);
  const displayName = name?.trim() || (character === 'mira' ? 'Mira' : 'Kai');
  const initial = displayName.charAt(0).toUpperCase();
  const height = Math.round(size * 1.15);
  const body = Math.round(size * 0.58);
  const gradientId = `aura-${character}-${aura}`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('avatar.label', {
        name: displayName,
        aura: t(`aura.${aura}`),
        mood: t(`moods.${mood}`),
      })}
      style={[{ width: size, height }, styles.center, style]}>
      <Svg width={size} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="55%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.7} />
            <Stop offset="65%" stopColor={color} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={size / 2} cy={height * 0.56} rx={size / 2} ry={height / 2} fill={`url(#${gradientId})`} />
      </Svg>
      <View
        style={[
          styles.center,
          {
            width: body,
            height: body,
            borderRadius: body / 2,
            backgroundColor: colors.surfaceNested,
            borderWidth: 2,
            borderColor: color,
          },
        ]}>
        <Text variant="metric" style={{ fontSize: Math.round(body * 0.45), lineHeight: Math.round(body * 0.55) }}>
          {initial}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          styles.center,
          { backgroundColor: colors.surface, borderColor: colors.background, right: size * 0.12, bottom: height * 0.14 },
        ]}>
        <Symbol name={MOOD_SYMBOL[mood]} size={14} color={color} weight="semibold" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
});
