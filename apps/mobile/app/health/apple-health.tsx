import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { HEALTH_READ_TYPES, appleHealthSource, type HealthReadType, type PermissionResult } from '@/features/health/sources';
import { kv } from '@/lib/storage';
import { Button, GroupedList, ListRow, Screen, Symbol, Text, haptics, spacing, useTheme } from '@/ui';

const KEY = 'aurafit.apple-health-types';

function loadTypes(): Record<HealthReadType, boolean> {
  const defaults = { sleep: true, steps: true, active_energy: true, weight: true, resting_hr: false };
  try {
    const raw = kv.getString(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Record<HealthReadType, boolean>>) } : defaults;
  } catch {
    return defaults;
  }
}

/** Kết nối Apple Health (HLT-05) – explainer + read toggles. HealthKit adapter is still a stub. */
export default function AppleHealthScreen() {
  const { t } = useTranslation(['health', 'common']);
  const { colors } = useTheme();
  const [types, setTypes] = useState(loadTypes);
  const [result, setResult] = useState<PermissionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (k: HealthReadType, v: boolean) => {
    const next = { ...types, [k]: v };
    setTypes(next);
    kv.setString(KEY, JSON.stringify(next));
  };

  const allow = async () => {
    setBusy(true);
    try {
      const r = await appleHealthSource.requestPermissions(HEALTH_READ_TYPES.filter((k) => types[k]));
      setResult(r);
      if (r === 'granted') haptics.success();
      else haptics.warning();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BackHeader />
      <Screen>
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: colors.surface }]}>
            <Symbol name="heart.fill" size={40} color={colors.icon.pink} />
          </View>
          <Text variant="title" align="center" accessibilityRole="header">
            {t('health:apple.title')}
          </Text>
          <Text variant="subheadline" color="secondary" align="center">
            {t('health:apple.body')}
          </Text>
        </View>

        <GroupedList header={t('health:apple.readTitle')} footer={t('health:apple.priority')}>
          {HEALTH_READ_TYPES.map((k) => (
            <ListRow
              key={k}
              title={t(`health:apple.types.${k}.name`)}
              subtitle={t(`health:apple.types.${k}.use`)}
              trailing={
                <Switch
                  value={types[k]}
                  onValueChange={(v) => {
                    haptics.selection();
                    toggle(k, v);
                  }}
                  trackColor={{ true: colors.success, false: colors.fill }}
                  accessibilityLabel={t(`health:apple.types.${k}.name`)}
                />
              }
            />
          ))}
        </GroupedList>

        {result ? (
          <Text variant="footnote" color={result === 'granted' ? 'tint' : 'secondary'} accessibilityLiveRegion="polite">
            {result === 'granted'
              ? t('health:apple.granted')
              : result === 'denied'
                ? t('health:apple.denied')
                : t('health:apple.unavailable')}
          </Text>
        ) : null}
        <Button title={t('health:apple.allow')} loading={busy} onPress={() => void allow()} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  icon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
