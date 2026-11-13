import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Refetch stale queries when the app returns to the foreground. */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}
AppState.addEventListener('change', onAppStateChange);

/** Query-key factory root – each feature adds its own keys under its module name. */
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
} as const;
