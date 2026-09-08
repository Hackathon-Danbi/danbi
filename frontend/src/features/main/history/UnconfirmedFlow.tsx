import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { useSelectedAccount } from '@/features/shared/state/selectedAccount';
import { useTransactions } from '../TransactionContext';
import { groupUnconfirmedByAccount, summaryLines, totalUnconfirmed } from './unconfirmed';
import { UnconfirmedScreen } from './screens/UnconfirmedScreen';
import { SummaryReadScreen } from './screens/SummaryReadScreen';
import { AccountBreakdownScreen } from './screens/AccountBreakdownScreen';

type FlowScreen = 'intro' | 'summary' | 'breakdown';

const asFlowScreen = (value?: string): FlowScreen =>
  value === 'summary' || value === 'breakdown' ? value : 'intro';

/**
 * 미확인 거래내역 흐름. 홈의 미확인 게이트에서 진입한다.
 *
 *   intro     최근 7일 미확인 건수 + 다음 행동 선택
 *   summary   통장별 요약을 TTS 로 읽어주기
 *   breakdown 통장별 미확인 건수 → 통장 선택 시 드롭다운으로 거래 항목
 *
 * 세부 단계는 URL 에 넣지 않고 내부 상태 머신으로만 전환한다(SavingsFlow 와 동일).
 * 단, 홈에서 특정 단계로 바로 보내고 싶을 때만 `?view=summary|breakdown` 로 진입점을 지정한다.
 */
export function UnconfirmedFlow() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { accounts } = useSelectedAccount();
  const { transactions } = useTransactions();
  const [screen, setScreen] = useState<FlowScreen>(() => asFlowScreen(view));

  const groups = useMemo(
    () => groupUnconfirmedByAccount(accounts, transactions),
    [accounts, transactions],
  );
  const total = useMemo(() => totalUnconfirmed(groups), [groups]);
  const lines = useMemo(() => summaryLines(groups), [groups]);

  const goHome = () => router.dismissTo('/(app)/home');
  const goIntro = () => setScreen('intro');

  useAndroidBack(() => {
    if (screen !== 'intro') {
      goIntro();
      return true;
    }
    return false;
  });

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <ScreenIn key={screen}>
        {screen === 'intro' && (
          <UnconfirmedScreen
            count={total}
            onReadSummary={() => setScreen('summary')}
            onDetail={() => setScreen('breakdown')}
            onHome={goHome}
          />
        )}

        {screen === 'summary' && (
          <SummaryReadScreen
            total={total}
            lines={lines}
            onDetail={() => setScreen('breakdown')}
            onBack={goIntro}
          />
        )}

        {screen === 'breakdown' && (
          <AccountBreakdownScreen groups={groups} onBack={goIntro} onHome={goHome} />
        )}
      </ScreenIn>
    </Screen>
  );
}
