import '@/global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import DashboardScreen from '@/src/features/dashboard/screens/DashboardScreen';

export default function App() {
  return (
    <GluestackUIProvider mode="dark">
      <SafeAreaView className="flex-1 bg-black">
        <DashboardScreen />
        <StatusBar style="light" />
      </SafeAreaView>
    </GluestackUIProvider>
  );
}
