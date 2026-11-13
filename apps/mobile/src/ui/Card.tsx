import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type CardProps = ViewProps & {
  /** Inner padding (default 16). Use 0 when the card hosts full-bleed rows. */
  padding?: number;
  /** `nested` = one level deeper (inside another card): darker surface, radius 16. */
  level?: 'surface' | 'nested';
  style?: StyleProp<ViewStyle>;
};

/** Content-layer card: solid grouped surface, radius 26, NO border, NO glass (HIG). */
export function Card({ padding = spacing.lg, level = 'surface', style, ...rest }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: level === 'surface' ? colors.surface : colors.surfaceNested,
          borderRadius: level === 'surface' ? radii.group : radii.inner,
          padding,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
}
