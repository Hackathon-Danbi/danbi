import { useRef } from 'react';
import { Redirect, useRouter } from 'expo-router';

import { OnboardingFlow } from '@/features/onboarding/screens/OnboardingFlow';
import { useBootstrap } from '@/lib/bootstrap';
import {
  ONBOARDING_DESTINATION_ROUTES,
  type OnboardingDestination,
} from '@/lib/navigation';

/**
 * 가입(온보딩) 라우트. 세부 step은 <OnboardingFlow /> 내부 상태 머신으로만 관리한다.
 */
export default function JoinRoute() {
  const router = useRouter();
  const { completeOnboarding, displayMode } = useBootstrap();
  const completingRef = useRef(false);

  const handleComplete = async (destination: OnboardingDestination) => {
    if (completingRef.current) return;
    completingRef.current = true;
    await completeOnboarding();
    router.replace(ONBOARDING_DESTINATION_ROUTES[destination]);
  };

  if (!displayMode) return <Redirect href="/welcome" />;

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      onCancel={() => router.replace('/welcome')}
    />
  );
}
