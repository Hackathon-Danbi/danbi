import { useRef, useState } from 'react';
import { Redirect, useRouter, type Href } from 'expo-router';

import { OnboardingFlow } from '@/features/onboarding/screens/OnboardingFlow';
import { useBootstrap } from '@/lib/bootstrap';
import { remove, StorageKeys } from '@/lib/storage';
import {
  ONBOARDING_DESTINATION_ROUTES,
  type OnboardingDestination,
} from '@/lib/navigation';

/**
 * 가입(온보딩) 라우트. 세부 step(0~16)은 <OnboardingFlow /> 내부 상태 머신으로만
 * 관리하고 URL 에는 노출하지 않는다. 완료 시 AsyncStorage 에 완료 플래그를 저장하고
 * 목적지 라우트로 replace 한다.
 */
export default function JoinRoute() {
  const router = useRouter();
  const { completeOnboarding, displayMode, onboardingDone } = useBootstrap();
  const [completionTarget, setCompletionTarget] = useState<Href | null>(null);
  const completionTargetRef = useRef<Href | null>(null);

  const handleComplete = async (destination: OnboardingDestination) => {
    if (completionTargetRef.current) return;
    const target = ONBOARDING_DESTINATION_ROUTES[destination];
    completionTargetRef.current = target;
    setCompletionTarget(target);
    await remove(StorageKeys.onboardingDraft);
    await completeOnboarding();
    router.replace(target);
  };

  if (!displayMode) return <Redirect href="/welcome" />;
  if (onboardingDone && !completionTarget) return <Redirect href="/(app)/home" />;

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      onCancel={() => router.replace('/welcome')}
    />
  );
}
