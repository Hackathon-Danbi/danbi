import { Redirect, useRouter } from 'expo-router';

import { ReauthFlow } from '@/features/auth/screens/ReauthFlow';
import { useBootstrap } from '@/lib/bootstrap';

/**
 * 재인증 라우트. 간편 비밀번호를 잊었을 때(로그인 화면) 또는 중요한 작업 전에
 * 문자로 본인을 다시 확인하고 비밀번호를 새로 정한다.
 */
export default function ReauthRoute() {
  const router = useRouter();
  const { displayMode, onboardingDone, unlock } = useBootstrap();

  if (!displayMode) return <Redirect href="/welcome" />;
  if (!onboardingDone) return <Redirect href="/join" />;

  return (
    <ReauthFlow
      onDone={() => {
        unlock();
        router.replace('/(app)/home');
      }}
      onCancel={() => router.back()}
    />
  );
}
