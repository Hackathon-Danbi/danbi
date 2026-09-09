import { Redirect, Stack } from 'expo-router';

import { TransactionProvider } from '@/features/main/TransactionContext';
import { SelectedAccountProvider } from '@/features/shared/state/selectedAccount';
import { useBootstrap } from '@/lib/bootstrap';
import { resolveEntryRoute } from '@/lib/navigation';
import { colors } from '@/theme/tokens';

/**
 * 가입 완료 후의 메인 앱 영역. 세부 화면 전환은 각 Flow 내부 상태 머신이 담당한다.
 *
 * 간편 비밀번호가 저장돼 있으면 앱을 다시 켤 때마다 /login 을 거친다.
 *
 * 진입 게이트 전제: BootstrapProvider 가 폰트+AsyncStorage 하이드레이션(`ready`)
 * 전까지 자식을 렌더하지 않으므로, 이 컴포넌트가 실행되는 시점의 displayMode/
 * onboardingDone 은 항상 저장소에서 복원된 실제 값이다. 즉 onboardingDone 의
 * 초기값(false)이 "아직 로딩 중"과 "미가입"을 혼동시킬 일은 없다.
 * BootstrapProvider 가 로딩 중에도 자식을 렌더하도록 바뀌면 이 가정이 깨지므로,
 * 그때는 useBootstrap 에 준비 상태를 노출해 함께 확인해야 한다.
 */
export default function AppLayout() {
  const { displayMode, onboardingDone, pinRegistered, unlocked } = useBootstrap();
  const locked = pinRegistered && !unlocked;
  if (!displayMode || !onboardingDone || locked) {
    return (
      <Redirect href={resolveEntryRoute(displayMode, onboardingDone, { pinRegistered, unlocked })} />
    );
  }

  return (
    <TransactionProvider>
      <SelectedAccountProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </SelectedAccountProvider>
    </TransactionProvider>
  );
}
