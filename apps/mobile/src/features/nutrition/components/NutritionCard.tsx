import type { nutrition } from '@aurafit/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useFormat } from '@/features/coach/lib/format';
import { usePrefs } from '@/features/settings/prefs';
import { Card, ProgressBar, ProgressRing, Text, spacing, useTheme } from '@/ui';

import type { NutritionTargetRow } from '../api';

type MacroKey = 'protein' | 'carb' | 'fat' | 'sugar' | 'fiber' | 'sodium';

const ratio = (v: number, t: number | null | undefined) => (t && t > 0 ? v / t : 0);

/** kcal ring + macro bars (NUT-01 / NUT-12) – Today screen. */
export function NutritionCard({
  consumed,
  targets,
  footer,
}: {
  consumed: nutrition.Nutrients;
  targets: NutritionTargetRow | null;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation('today');
  const { colors } = useTheme();
  const f = useFormat();
  const showFiber = usePrefs((s) => s.showFiber);
  const showSodium = usePrefs((s) => s.showSodium);

  const kcalTarget = targets?.kcal ?? null;
  const left = kcalTarget != null ? kcalTarget - consumed.kcal : null;
  const over = left != null && left < 0;

  const rows: { key: MacroKey; value: number; target: number | null; color: string; unit: 'g' | 'mg' }[] = [
    { key: 'protein', value: consumed.protein_g, target: targets?.protein_g ?? null, color: colors.data.protein, unit: 'g' },
    { key: 'carb', value: consumed.carb_g, target: targets?.carb_g ?? null, color: colors.data.carb, unit: 'g' },
    { key: 'fat', value: consumed.fat_g, target: targets?.fat_g ?? null, color: colors.data.fat, unit: 'g' },
    { key: 'sugar', value: consumed.sugar_g, target: targets?.sugar_g ?? null, color: colors.data.sugar, unit: 'g' },
  ];
  if (showFiber) rows.push({ key: 'fiber', value: consumed.fiber_g, target: targets?.fiber_g ?? null, color: colors.icon.green, unit: 'g' });
  if (showSodium) rows.push({ key: 'sodium', value: consumed.sodium_mg, target: targets?.sodium_mg ?? null, color: colors.icon.teal, unit: 'mg' });

  const kcalLabel = left == null ? t('noData') : `${f.num(Math.abs(left))} ${over ? t('kcalOver') : t('kcalLeft')}`;

  return (
    <Card padding={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: spacing.lg }}>
        <ProgressRing
          progress={ratio(consumed.kcal, kcalTarget)}
          color={over ? colors.warning : undefined}
          accessibilityLabel={kcalLabel}>
          <Text variant="metric">{left == null ? '—' : f.num(Math.abs(left))}</Text>
          <Text variant="caption" color={over ? 'warning' : 'secondary'}>
            {over ? t('kcalOver') : t('kcalLeft')}
          </Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: spacing.sm + 1 }}>
          {rows.map((m) => {
            const value = m.target != null
              ? t(m.unit === 'g' ? 'gramsOf' : 'mgOf', { value: f.num(m.value), target: f.num(m.target) })
              : f.num(m.value);
            return (
              <View key={m.key} style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" color="secondary">
                    {t(`macros.${m.key}`)}
                  </Text>
                  <Text variant="caption" weight="600">
                    {value}
                  </Text>
                </View>
                <ProgressBar
                  progress={ratio(m.value, m.target)}
                  color={m.color}
                  accessibilityLabel={`${t(`macros.${m.key}`)} ${value}`}
                />
              </View>
            );
          })}
        </View>
      </View>
      {footer}
    </Card>
  );
}
