import { useColorScheme } from 'react-native';

import { colors, radii, spacing, typography, type ColorSchemeName, type ThemeColors } from './theme';

export type Theme = {
  scheme: ColorSchemeName;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

/** Current theme (follows the system light/dark setting). */
export function useTheme(): Theme {
  const scheme: ColorSchemeName = useColorScheme() === 'light' ? 'light' : 'dark';
  return {
    scheme,
    isDark: scheme === 'dark',
    colors: colors[scheme],
    spacing,
    radii,
    typography,
  };
}

/** Semantic text colors accepted by `<Text color>` / `<Symbol color>`. */
export type SemanticColor =
  | 'label'
  | 'secondary'
  | 'tertiary'
  | 'tint'
  | 'onTint'
  | 'destructive'
  | 'warning'
  | 'success';

export function resolveColor(c: ThemeColors, color: SemanticColor | (string & {})): string {
  switch (color) {
    case 'label':
      return c.label;
    case 'secondary':
      return c.secondaryLabel;
    case 'tertiary':
      return c.tertiaryLabel;
    case 'tint':
      return c.tint;
    case 'onTint':
      return c.onTint;
    case 'destructive':
      return c.destructive;
    case 'warning':
      return c.warning;
    case 'success':
      return c.success;
    default:
      return color;
  }
}
