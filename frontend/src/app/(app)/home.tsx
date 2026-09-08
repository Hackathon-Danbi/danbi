import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { HomeScreen } from '@/features/main/screens/HomeScreen';
import { ListeningScreen } from '@/features/main/transfer/screens/ListeningScreen';
import { ResultScreen } from '@/features/main/transfer/screens/ResultScreen';
import { UnconfirmedScreen } from '@/features/main/history/screens/UnconfirmedScreen';
import { useTransactions } from '@/features/main/TransactionContext';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import type { ListeningPhase } from '@/features/main/types';

type View = 'unconfirmed' | 'home' | 'listening' | 'result';

/**
 * 메인 홈 라우트. 미확인 거래 게이트 + 홈 화면 + 실제 STT 기반 잔액 조회 어시스턴트.
 * danbi_jj MainBankingApp 의 firstScreen 정책: 미확인 거래가 있으면 홈보다 먼저 안내 화면.
 */
export default function HomeRoute() {
  const router = useRouter();
  const { pendingTransactions, unknownTransactions } = useTransactions();
  const [view, setView] = useState<View>(pendingTransactions.length > 0 ? 'unconfirmed' : 'home');
  const recognition = useSpeechRecognition();
  const activeView: View = view === 'unconfirmed' && pendingTransactions.length === 0 ? 'home' : view;
  const phase: ListeningPhase = recognition.status === 'recognized'
    ? 'confirmed'
    : recognition.status === 'listening' && recognition.transcript
      ? 'heard'
      : 'idle';

  const openBalance = () => {
    setView('listening');
    recognition.start();
  };

  const goHome = () => {
    recognition.reset();
    setView('home');
  };

  useAndroidBack(() => {
    if (activeView !== 'home') {
      goHome();
      return true;
    }
    return false;
  });

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <ScreenIn key={activeView}>
        {activeView === 'unconfirmed' && (
          <UnconfirmedScreen
            count={pendingTransactions.length}
            onDetail={() =>
              router.push({ pathname: '/(app)/history', params: { view: 'review' } })
            }
            onHome={goHome}
          />
        )}

        {activeView === 'home' && (
          <HomeScreen
            onMic={openBalance}
            onHistory={() => router.push('/(app)/history')}
            onReviewTransactions={() =>
              router.push({ pathname: '/(app)/history', params: { view: 'review' } })
            }
            onTransfer={() => router.push('/(app)/transfer')}
            onFinancialIndependence={() => router.push('/(app)/practice')}
            onSavings={() => router.push('/(app)/accounts')}
            needCheckCount={pendingTransactions.length}
            unknownCount={unknownTransactions.length}
          />
        )}

        {activeView === 'listening' && (
          <ListeningScreen
            mode="balance"
            phase={phase}
            transcript={recognition.transcript}
            error={recognition.error || undefined}
            onBack={goHome}
            onRetry={recognition.start}
            onConfirm={() => setView('result')}
          />
        )}

        {activeView === 'result' && (
          <ResultScreen
            onBack={goHome}
            onViewHistory={() => router.push('/(app)/history')}
            onMic={openBalance}
          />
        )}
      </ScreenIn>
    </Screen>
  );
}
