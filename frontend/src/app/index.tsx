import { Redirect } from 'expo-router';

import { useBootstrap } from '@/lib/bootstrap';
import { resolveEntryRoute } from '@/lib/navigation';

/**
 * danbi_jj 의 IntegratedDanbiApp 진입 판별을 RN 게이트로 옮긴 것.
 *
 * RootLayout의 BootstrapProvider가 폰트와 AsyncStorage를 준비한 뒤 이 화면을
 * 렌더한다. 여기서는 준비된 상태에 맞는 진입 라우트만 선택한다.
 *
 *   displayMode 없음                   → /welcome
 *   displayMode 있음 + 온보딩 미완료    → /join
 *   온보딩 완료 + 아직 잠금 해제 안 함  → /login
 *   온보딩 완료                        → /(app)/home
 */
export default function Index() {
  const { displayMode, onboardingDone, pinRegistered, unlocked } = useBootstrap();
  const target = resolveEntryRoute(displayMode, onboardingDone, { pinRegistered, unlocked });

  return <Redirect href={target} />;
}
