import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { resolveColor, useTheme, type SemanticColor } from './useTheme';

export type { SFSymbol };

export type SymbolProps = {
  /** SF Symbol name, e.g. `camera.fill`. Browse with Apple's SF Symbols app. */
  name: SFSymbol;
  size?: number;
  color?: SemanticColor | (string & {});
  /** Match the weight of adjacent text (HIG). */
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
  /** Rendered where SF Symbols are unavailable (Android/web). Defaults to an empty box of `size`. */
  fallback?: React.ReactNode;
};

/** SF Symbol (expo-symbols) – decorative by default (hidden from VoiceOver). */
export function Symbol({ name, size = 22, color = 'label', weight = 'regular', style, fallback }: SymbolProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={name}
      size={size}
      weight={weight}
      tintColor={resolveColor(colors, color)}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
      fallback={fallback ?? <View style={{ width: size, height: size }} />}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
