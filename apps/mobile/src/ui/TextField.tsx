import type { ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from './Text';
import { radii, spacing, typography } from './theme';
import { useTheme } from './useTheme';

/** All TextInput props (including `ref`, React 19 style) plus: */
export type TextFieldProps = ComponentProps<typeof TextInput> & {
  /** Label above the field (already translated). */
  label?: string;
  /** Error/help text below the field (already translated). */
  message?: string;
  error?: boolean;
  /** Large rounded digits (OTP, weights). */
  numeric?: boolean;
};

/** Filled iOS-style text field (radius 14, height 52). */
export function TextField({ label, message, error, numeric, style, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.tertiaryLabel}
        selectionColor={colors.tint}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        {...rest}
        style={[
          numeric ? typography.metric : typography.body,
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.label,
            borderColor: error ? colors.destructive : 'transparent',
          },
          style,
        ]}
      />
      {message ? (
        <Text variant="footnote" color={error ? 'destructive' : 'secondary'} style={styles.caption}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  caption: { paddingHorizontal: spacing.xs },
  input: {
    minHeight: 52,
    borderRadius: radii.field,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
});
