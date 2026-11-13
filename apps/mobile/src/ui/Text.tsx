import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { TextVariant } from './theme';
import { resolveColor, useTheme, type SemanticColor } from './useTheme';

export type TextProps = RNTextProps & {
  /** HIG text style. `metric`/`metricLarge` use SF Pro Rounded + tabular digits. Default `body`. */
  variant?: TextVariant;
  /** Semantic color or any color string. Default `label`. */
  color?: SemanticColor | (string & {});
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'auto' | 'left' | 'center' | 'right';
};

const MAX_SCALE: Partial<Record<TextVariant, number>> = {
  largeTitle: 1.5,
  metric: 1.4,
  metricLarge: 1.3,
};

/** Text with Dynamic Type enabled (allowFontScaling) and semantic colors. */
export function Text({ variant = 'body', color = 'label', weight, align, style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_SCALE[variant]}
      {...rest}
      style={[
        typography[variant],
        { color: resolveColor(colors, color) },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
