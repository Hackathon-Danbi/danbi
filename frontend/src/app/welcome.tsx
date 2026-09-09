import { useRouter } from 'expo-router';

import { WelcomeModeScreen, type DisplayMode } from '@/features/onboarding/screens/WelcomeModeScreen';
import { useBootstrap } from '@/lib/bootstrap';

export default function WelcomeRoute() {
  const router = useRouter();
  const { displayMode, selectDisplayMode } = useBootstrap();

  const handleSelect = async (mode: DisplayMode) => {
    await selectDisplayMode(mode);
    router.replace('/join');
  };

  const handleSkipHome = async () => {
    await selectDisplayMode(displayMode ?? 'danbi');
    router.replace('/(app)/home');
  };

  return <WelcomeModeScreen onSelect={handleSelect} onSkipHome={handleSkipHome} />;
}
