import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { setDevPreview } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Card, SegmentedControl, Symbol, Text, spacing, useTheme } from '@/ui';
import { useLanguage, type Language } from '@/i18n';

/** Brand mark from Welcome.dc.html: mint aura glow, ring and core. */
export function AuraLogo({ size = 168 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 168 168" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.tint} stopOpacity={0.55} />
          <Stop offset="70%" stopColor={colors.tint} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={colors.tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={84} cy={84} r={84} fill="url(#aura)" />
      <Circle cx={84} cy={84} r={46} fill="none" stroke={colors.tint} strokeWidth={6} />
      <Circle cx={84} cy={84} r={26} fill={colors.tint} />
    </Svg>
  );
}

/** VI / EN toggle (Welcome.dc.html). Switches the whole app instantly and persists the choice. */
export function LanguageToggle() {
  const { t } = useTranslation('common');
  const [language, setLanguage] = useLanguage();
  return (
    <SegmentedControl<Language>
      accessibilityLabel={t('language.label')}
      segmentWidth={48}
      value={language}
      onChange={(value) => void setLanguage(value)}
      options={[
        { value: 'vi', label: t('language.viShort'), accessibilityLabel: t('language.vi') },
        { value: 'en', label: t('language.enShort'), accessibilityLabel: t('language.en') },
      ]}
    />
  );
}

/** Dev-only notice when EXPO_PUBLIC_SUPABASE_* are missing, with a way to browse the app anyway. */
export function DevConfigWarning() {
  const { t } = useTranslation('common');
  if (!__DEV__ || isSupabaseConfigured) return null;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Symbol name="exclamationmark.triangle.fill" size={18} color="warning" />
        <Text variant="headline">{t('dev.supabaseMissingTitle')}</Text>
      </View>
      <Text variant="footnote" color="secondary">
        {t('dev.supabaseMissingBody')}
      </Text>
      <Button
        title={t('dev.previewWithoutAccount')}
        variant="tinted"
        size="medium"
        block
        onPress={() => setDevPreview(true)}
      />
    </Card>
  );
}
