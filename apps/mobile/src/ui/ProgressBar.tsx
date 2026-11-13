import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from './theme';
import { useTheme } from './useTheme';

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export type ProgressBarProps = {
  /** 0…1 (clamped). */
  progress: number;
  /** Default brand tint. Macros: `colors.data.protein` etc. */
  color?: string;
  trackColor?: string;
  /** Bar thickness, default 4. */
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Thin horizontal progress bar (macros, daily score, water). */
export function ProgressBar({ progress, color, trackColor, height = 4, accessibilityLabel, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(clamp01(progress), { duration: motion.duration * 2 });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(progress) * 100) }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor ?? colors.surfaceNested,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={[{ height: '100%', borderRadius: height / 2, backgroundColor: color ?? colors.tint }, fillStyle]}
      />
    </View>
  );
}
