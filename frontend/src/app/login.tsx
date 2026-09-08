import { Redirect, useRouter } from 'expo-router';

import { PinAuthScreen } from '@/features/auth/screens/PinAuthScreen';
import { useBootstrap } from '@/lib/bootstrap';
import { resolveEntryRoute } from '@/lib/navigation';

/**
 * 앱 잠금 해제(로그인). 앱을 다시 켤 때마다 가입 때 정한 간편 비밀번호를 확인한다.
 * 뒤로 가기가 없는 유일한 화면이라 NavBar 없이 본문만 보여준다.
 */
export default function LoginRoute() {
  const router = useRouter();
  const { displayMode, onboardingDone, pinRegistered, unlocked, unlock } = useBootstrap();

  // 아직 가입을 안 했거나 비밀번호가 없으면 잠글 것이 없다.
  if (!displayMode || !onboardingDone || !pinRegistered || unlocked) {
    return <Redirect href={resolveEntryRoute(displayMode, onboardingDone, { pinRegistered, unlocked })} />;
  }

  return (
    <PinAuthScreen
      title="로그인"
      onSuccess={() => {
        unlock();
        router.replace('/(app)/home');
      }}
      onForgot={() => router.push('/reauth')}
    />
  );
}
