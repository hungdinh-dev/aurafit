import '../global.css';
import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useOnboardingStatus } from '@/features/profile/api';
import { startAuthListener, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { sheetOptions, useTheme } from '@/ui';

void SplashScreen.preventAutoHideAsync();
startAuthListener();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppTheme>
          <RootNavigator />
        </AppTheme>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/** React Navigation theme derived from our tokens (native headers, sheets, backgrounds). */
function AppTheme({ children }: { children: React.ReactNode }) {
  const { isDark, colors } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const theme: NavigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.surface,
      text: colors.label,
      border: colors.separator,
    },
  };
  return (
    <ThemeProvider value={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}

/**
 * Auth guard: (auth) when signed out → (onboarding) until profile.onboarding_completed_at → (tabs).
 * Stack.Protected removes unreachable groups and redirects automatically when state changes.
 */
function RootNavigator() {
  const { colors } = useTheme();
  const { initialized, isSignedIn } = useAuth();
  const onboarding = useOnboardingStatus();
  const ready = initialized && (!isSignedIn || onboarding.ready);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const onboarded = isSignedIn && onboarding.completed;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && !onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="food/add"
          options={sheetOptions({ detents: [0.6, 1], backgroundColor: colors.surface })}
        />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
