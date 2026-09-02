import { Redirect, useRouter } from 'expo-router';

import { WelcomeModeScreen, type DisplayMode } from '@/features/onboarding/screens/WelcomeModeScreen';
import { useBootstrap } from '@/lib/bootstrap';

export default function WelcomeRoute() {
  const router = useRouter();
  const { displayMode, onboardingDone, selectDisplayMode } = useBootstrap();

  const handleSelect = async (mode: DisplayMode) => {
    await selectDisplayMode(mode);
    router.replace('/join');
  };

  if (displayMode && onboardingDone) return <Redirect href="/(app)/home" />;

  return <WelcomeModeScreen onSelect={handleSelect} />;
}
