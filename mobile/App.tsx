import '@/global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/src/components/ui/gluestack-ui-provider';
import DashboardScreen from '@/src/features/dashboard/screens/DashboardScreen';
import OnboardingScreen from '@/src/features/onboarding/screens/OnboardingScreen';
import { useThemeStore } from '@/src/theme/themeStore';
import { useAuthStore } from '@/src/features/profile/store/authStore';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useColorScheme } from 'nativewind';

export default function App() {
  const { theme } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  
  // Auth Store
  const { session, isSandboxBypassed, setSession } = useAuthStore();

  // Explicitly sync the store theme with NativeWind
  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  // Synchronize Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setSession]);

  // Determine if we should show the onboarding flow
  const showOnboarding = isSupabaseConfigured ? !session : !isSandboxBypassed;

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode={theme}>
        <SafeAreaView className={`flex-1 bg-brand-light-bg dark:bg-brand-dark-bg ${colorScheme === 'dark' ? 'dark' : ''}`}>
          {showOnboarding ? (
            <OnboardingScreen />
          ) : (
            <DashboardScreen />
          )}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

