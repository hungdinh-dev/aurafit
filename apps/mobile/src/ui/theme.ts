/**
 * Design tokens – docs/03-design/design-language.md (D-039, D-040).
 * iOS semantic colors (light/dark) + ONE brand accent (mint). Data colors only in charts/bars.
 * Use through `useTheme()`; never hard-code hex values in screens.
 */
import { Platform, type TextStyle } from 'react-native';

export type ColorSchemeName = 'light' | 'dark';

const dark = {
  /** systemBackground / grouped background */
  background: '#000000',
  /** secondarySystemGroupedBackground – cards, grouped lists */
  surface: '#1C1C1E',
  /** tertiary – nested elements, tracks, inputs inside cards */
  surfaceNested: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235,235,245,0.6)',
  tertiaryLabel: 'rgba(235,235,245,0.3)',
  separator: '#38383A',
  /** systemFill – segmented control track, plain chips */
  fill: 'rgba(118,118,128,0.24)',
  fillSelected: '#636366',
  /** Brand accent (tint): primary actions + the user's own progress only */
  tint: '#4BE3A7',
  /** Text/icon on top of a filled tint button */
  onTint: '#00140C',
  tintSoft: 'rgba(75,227,167,0.16)',
  destructive: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  streak: '#FF9F0A',
  shield: '#64D2FF',
  /** Used by GlassButton fallback when Liquid Glass is unavailable (iOS < 26 / Android) */
  glassFallback: 'rgba(58,58,64,0.45)',
  glassBorder: 'rgba(255,255,255,0.22)',
  data: {
    protein: '#8F84FF',
    carb: '#5AB0FF',
    fat: '#FFB36B',
    sugar: '#F58FB4',
    water: '#5AB0FF',
    sleep: '#A79FFF',
  },
  /** Tile colors behind ListRow icons (iOS Settings style) */
  icon: {
    blue: '#0A84FF',
    indigo: '#5E5CE6',
    green: '#30D158',
    orange: '#FF9F0A',
    red: '#FF453A',
    pink: '#FF375F',
    teal: '#40C8E0',
    gray: '#8E8E93',
    mint: '#4BE3A7',
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type ThemeColors = Widen<typeof dark>;

const light: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceNested: '#E5E5EA',
  label: '#000000',
  secondaryLabel: 'rgba(60,60,67,0.6)',
  tertiaryLabel: 'rgba(60,60,67,0.3)',
  separator: '#C6C6C8',
  fill: 'rgba(118,118,128,0.12)',
  fillSelected: '#FFFFFF',
  tint: '#0F9D6B',
  onTint: '#FFFFFF',
  tintSoft: 'rgba(15,157,107,0.12)',
  destructive: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  streak: '#FF9500',
  shield: '#32ADE6',
  glassFallback: 'rgba(255,255,255,0.6)',
  glassBorder: 'rgba(0,0,0,0.08)',
  data: {
    protein: '#5E52E0',
    carb: '#1E7FD8',
    fat: '#D9822B',
    sugar: '#D6538A',
    water: '#1E7FD8',
    sleep: '#6F63E0',
  },
  icon: {
    blue: '#007AFF',
    indigo: '#5856D6',
    green: '#34C759',
    orange: '#FF9500',
    red: '#FF3B30',
    pink: '#FF2D55',
    teal: '#30B0C7',
    gray: '#8E8E93',
    mint: '#0F9D6B',
  },
};

export const colors: Record<ColorSchemeName, ThemeColors> = { light, dark };

/** Brand accent of the mockups (dark theme). Prefer `useTheme().colors.tint`. */
export const BRAND_MINT = dark.tint;

/** 8-pt grid. Screen gutter = 16, gap between groups 24–32. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  /** Horizontal screen margin */
  gutter: 16,
  /** Vertical gap between groups/sections */
  section: 28,
} as const;

/** Concentric radii: group 26 → inner 16–18 → pill (fully rounded). */
export const radii = {
  group: 26,
  inner: 16,
  field: 14,
  tile: 8,
  pill: 999,
} as const;

/** Minimum touch target (HIG). */
export const MIN_TOUCH = 44;

/** SF Pro Rounded for numbers (iOS `ui-rounded`); system font elsewhere. */
export const ROUNDED_FONT = Platform.select({ ios: 'ui-rounded', default: undefined });

export type TextVariant =
  | 'largeTitle'
  | 'title'
  | 'headline'
  | 'body'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'metric'
  | 'metricLarge';

/** Dynamic Type base sizes (iOS default "Large" content size). */
export const typography: Record<TextVariant, TextStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.26 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.43 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.43 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.23 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  metric: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: ROUNDED_FONT,
    fontVariant: ['tabular-nums'],
  },
  metricLarge: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '700',
    fontFamily: ROUNDED_FONT,
    fontVariant: ['tabular-nums'],
  },
};

/** Animation: short springs, ≤ 300 ms (respect Reduce Motion – Reanimated does by default). */
export const motion = {
  duration: 250,
  spring: { damping: 18, stiffness: 220, mass: 1 },
} as const;
