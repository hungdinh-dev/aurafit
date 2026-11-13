import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AuraLogo, DevConfigWarning, LanguageToggle } from '@/features/auth/components';
import { authErrorMessage } from '@/features/auth/errors';
import { useSignInWithGoogle } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Screen, Text, haptics, spacing } from '@/ui';

/** Welcome & sign-in entry (mockup: Welcome.dc.html, screen 15 – ONB-01, ONB-02). */
export default function WelcomeScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const router = useRouter();
  const google = useSignInWithGoogle();

  const onGoogle = () =>
    google.mutate(undefined, {
      onSuccess: (result) => {
        if (result === 'success') haptics.success();
      },
    });

  return (
    <Screen contentStyle={styles.content} gap={spacing.xl}>
      <View className="flex-row justify-end">
        <LanguageToggle />
      </View>

      <View style={styles.hero}>
        <AuraLogo />
        <Text style={styles.brand} accessibilityRole="header">
          {t('common:appName')}
        </Text>
        <Text variant="title" align="center" style={styles.title}>
          {t('auth:welcome.title')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('auth:welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.actions}>
        <DevConfigWarning />
        <Button
          title={t('auth:google')}
          variant="inverted"
          symbol="g.circle.fill"
          loading={google.isPending}
          disabled={!isSupabaseConfigured}
          onPress={onGoogle}
        />
        <Button
          title={t('auth:email')}
          variant="gray"
          disabled={!isSupabaseConfigured}
          onPress={() => router.push('/sign-in')}
        />
        {google.isError ? (
          <Text variant="footnote" color="destructive" align="center">
            {authErrorMessage(google.error, t)}
          </Text>
        ) : null}
        <Text variant="caption" color="secondary" align="center" style={styles.legal}>
          {t('auth:welcome.legal')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 18, paddingHorizontal: spacing.xs },
  brand: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 30 },
  actions: { gap: spacing.md },
  legal: { fontWeight: '400', marginTop: spacing.xs },
});
