import { Stack } from 'expo-router';

import { useTheme } from '@/ui';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: colors.tint,
        }}
      />
    </Stack>
  );
}
