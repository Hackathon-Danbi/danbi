import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { SavingsOverviewScreen } from './screens/SavingsOverviewScreen';
import { SavingsDetailScreen } from './screens/SavingsDetailScreen';
import { DepositDetailScreen } from './screens/DepositDetailScreen';

type FlowScreen = 'savings' | 'savingsdetail' | 'depositdetail';

/**
 * danbi_jj main/MainBankingApp.tsx 의 예적금 화면(savings/savingsdetail/depositdetail)을
 * 하나의 내부 상태 머신으로 이식. 상세에서 뒤로가기는 개요로, 개요에서만 상위 라우트로.
 */
export function SavingsFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<FlowScreen>('savings');

  const goHome = () => router.dismissTo('/(app)/home');
  const goOverview = () => setScreen('savings');

  useAndroidBack(() => {
    if (screen !== 'savings') {
      goOverview();
      return true;
    }
    return false;
  });

  return (
    <Screen background="#FBFAF7" edges={['top', 'bottom']}>
      <ScreenIn key={screen}>
        {screen === 'savings' && (
          <SavingsOverviewScreen
            onBack={goHome}
            onSavingsDetail={() => setScreen('savingsdetail')}
            onDepositDetail={() => setScreen('depositdetail')}
            onHome={goHome}
          />
        )}
        {screen === 'savingsdetail' && <SavingsDetailScreen onBack={goOverview} onHome={goHome} />}
        {screen === 'depositdetail' && <DepositDetailScreen onBack={goOverview} onHome={goHome} />}
      </ScreenIn>
    </Screen>
  );
}
