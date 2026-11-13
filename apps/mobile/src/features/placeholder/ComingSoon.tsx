import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Symbol, Text, spacing, type SFSymbol } from '@/ui';

/** Temporary body for screens that later milestones will build. Delete when the screen is real. */
export function ComingSoon({ symbol = 'sparkles', body }: { symbol?: SFSymbol; body?: string }) {
  const { t } = useTranslation('common');
  return (
    <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <Symbol name={symbol} size={28} color="tint" />
      <View className="items-center gap-1">
        <Text variant="headline">{t('placeholder.title')}</Text>
        <Text variant="footnote" color="secondary" align="center">
          {body ?? t('placeholder.body')}
        </Text>
      </View>
    </Card>
  );
}
