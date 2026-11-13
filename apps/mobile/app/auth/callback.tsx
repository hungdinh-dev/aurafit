import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { completeAuthFromUrl } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useTheme } from '@/ui';

/**
 * Deep-link target for aurafit://auth/callback (OAuth redirect opened outside the auth session,
 * e.g. after a cold start). Exchanges the PKCE code, then goes back to "/".
 */
export default function AuthCallback() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => typeof e[1] === 'string')
    ).toString();
    const run = isSupabaseConfigured && query ? completeAuthFromUrl(`aurafit://auth/callback?${query}`) : Promise.resolve();
    run.catch(() => {}).finally(() => setDone(true));
    // Run once for the URL that opened this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.tint} />
    </View>
  );
}
