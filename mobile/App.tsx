import '@/global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/src/components/ui/gluestack-ui-provider';
import DashboardScreen from '@/src/features/dashboard/screens/DashboardScreen';
import { useThemeStore } from '@/src/theme/themeStore';
import { useColorScheme } from 'nativewind';

export default function App() {
  const { theme } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();

  // Explicitly sync the store theme with NativeWind
  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode={theme}>
        <SafeAreaView className={`flex-1 bg-brand-light-bg dark:bg-brand-dark-bg ${colorScheme === 'dark' ? 'dark' : ''}`}>
          <DashboardScreen />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
