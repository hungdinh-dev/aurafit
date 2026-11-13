import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button, Card, Symbol, Text, spacing, type SFSymbol } from '@/ui';

/**
 * Native header for pushed screens (transparent bar with the iOS back button). The large title
 * stays in `<Screen title>`; pass `headerRight` for glass actions.
 */
export function PushedHeader({ headerRight }: { headerRight?: () => React.ReactNode }) {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        headerTransparent: true,
        title: '',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerRight,
      }}
    />
  );
}

export function LoadingCard() {
  const { t } = useTranslation('workout');
  return (
    <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <ActivityIndicator accessibilityLabel={t('state.loading')} />
      <Text variant="footnote" color="secondary">
        {t('state.loading')}
      </Text>
    </Card>
  );
}

export function ErrorCard({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation('workout');
  return (
    <Card style={{ alignItems: 'center', gap: spacing.md }}>
      <Symbol name="exclamationmark.triangle.fill" size={24} color="warning" />
      <Text variant="subheadline" align="center">
        {message ?? t('state.error')}
      </Text>
      {onRetry ? <Button title={t('state.retry')} variant="gray" size="medium" onPress={onRetry} /> : null}
    </Card>
  );
}

export function EmptyCard({ symbol, title, body, children }: { symbol: SFSymbol; title?: string; body: string; children?: React.ReactNode }) {
  return (
    <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <Symbol name={symbol} size={28} color="tint" />
      {title ? (
        <Text variant="headline" align="center">
          {title}
        </Text>
      ) : null}
      <Text variant="footnote" color="secondary" align="center">
        {body}
      </Text>
      {children ? <View style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}>{children}</View> : null}
    </Card>
  );
}

/** Small banner shown when the screen runs without an account / Supabase. */
export function PreviewNote({ text }: { text?: string }) {
  const { t } = useTranslation('workout');
  return (
    <Card level="nested" padding={12} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
      <Symbol name="eye" size={16} color="secondary" />
      <Text variant="footnote" color="secondary" style={{ flex: 1 }}>
        {text ?? t('state.preview')}
      </Text>
    </Card>
  );
}
