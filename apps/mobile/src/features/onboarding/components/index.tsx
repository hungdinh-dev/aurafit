import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Symbol, Text, haptics, radii, spacing, typography, useTheme, MIN_TOUCH } from '@/ui';

/** Segmented progress bar of the onboarding flow. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const { t } = useTranslation('onboarding');
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('progress', { step, total })}
      accessibilityValue={{ min: 0, max: total, now: step }}
      style={styles.progress}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, { backgroundColor: i < step ? colors.tint : colors.fill }]} />
      ))}
    </View>
  );
}

/** Grouped-list style row with a right-aligned numeric input and a unit. */
export function NumberRow({
  label,
  value,
  unit,
  decimals = 0,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(String(value).replace('.', ','));
  return (
    <View style={styles.row}>
      <Text variant="body" style={styles.flex}>
        {label}
      </Text>
      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          const n = Number(v.replace(',', '.'));
          if (Number.isFinite(n) && v.trim() !== '') onChange(decimals > 0 ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n));
        }}
        keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
        accessibilityLabel={label}
        selectionColor={colors.tint}
        maxLength={6}
        style={[typography.body, styles.input, { color: colors.label, backgroundColor: colors.surfaceNested }]}
        textAlign="right"
      />
      {unit ? (
        <Text variant="body" color="secondary" style={styles.unit}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

/** Large selectable card (goal, strictness, character). */
export function ChoiceCard({
  selected,
  onPress,
  accessibilityLabel,
  children,
  style,
}: {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.tint : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {children}
      {selected ? (
        <View style={styles.check}>
          <Symbol name="checkmark.circle.fill" size={20} color="tint" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH + 8,
  },
  flex: { flex: 1 },
  input: { minWidth: 84, height: 36, borderRadius: radii.tile, paddingHorizontal: spacing.sm },
  unit: { minWidth: 28 },
  card: { borderRadius: radii.inner + 4, borderWidth: 2, padding: spacing.md, minHeight: MIN_TOUCH },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
