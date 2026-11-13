import { Redirect } from 'expo-router';

import { useOnboardingStatus } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';

/** Entry URL "/" – sends the user to the right group (the root layout guards the rest). */
export default function Index() {
  const { isSignedIn } = useAuth();
  const { completed } = useOnboardingStatus();
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (!completed) return <Redirect href="/basics" />;
  return <Redirect href="/today" />;
}
