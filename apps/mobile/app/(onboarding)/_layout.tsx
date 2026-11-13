import { Stack } from 'expo-router';

import { useTheme } from '@/ui';

/** Onboarding flow (M1 adds goal · coach · character · ready after basics). */
export default function OnboardingLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
