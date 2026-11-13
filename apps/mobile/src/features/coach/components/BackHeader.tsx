import { Stack } from 'expo-router';

import { useTheme } from '@/ui';

/**
 * Shows the native (Liquid Glass on iOS 26) navigation bar with a back chevron for a pushed
 * screen. Render it once inside the route component; the screen keeps its own large title.
 */
export function BackHeader({ title = '' }: { title?: string }) {
  const { colors, isDark } = useTheme();
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: title,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.label,
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
      }}
    />
  );
}
