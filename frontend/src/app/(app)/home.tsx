import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { HomeScreen } from '@/features/main/screens/HomeScreen';
import { ListeningScreen } from '@/features/main/transfer/screens/ListeningScreen';
import { ResultScreen } from '@/features/main/transfer/screens/ResultScreen';
import { UnconfirmedScreen } from '@/features/main/history/screens/UnconfirmedScreen';
import {
  groupUnconfirmedByAccount,
  totalUnconfirmed,
} from '@/features/main/history/unconfirmed';
import { useTransactions } from '@/features/main/TransactionContext';
import { useSelectedAccount } from '@/features/shared/state/selectedAccount';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { isApiConfigured, voiceApi } from '@/api';
import type { VoiceQueryResult } from '@/api';
import { speakResponse } from '@/lib/speech/tts';
import type { ListeningPhase } from '@/features/main/types';
import {
  createBalanceVoiceAnswer,
  isBalanceVoiceQuery,
} from '@/features/main/voiceQuery';

type View = 'unconfirmed' | 'home' | 'listening' | 'result';

/**
 * 메인 홈 라우트. 미확인 거래 게이트 + 홈 화면 + 실제 STT 기반 잔액 조회 어시스턴트.
 * danbi_jj MainBankingApp 의 firstScreen 정책: 미확인 거래가 있으면 홈보다 먼저 안내 화면.
 */
export default function HomeRoute() {
  const router = useRouter();
  const { transactions, pendingTransactions, unknownTransactions } = useTransactions();
  const { accounts, selectedAccount } = useSelectedAccount();
  // 미확인 게이트는 홈(생활비 통장)뿐 아니라 모든 통장의 미확인 건수를 합쳐서 안내한다.
  const unconfirmedTotal = useMemo(
    () => totalUnconfirmed(groupUnconfirmedByAccount(accounts, transactions)),
    [accounts, transactions],
  );
  const [view, setView] = useState<View>(unconfirmedTotal > 0 ? 'unconfirmed' : 'home');
  const [voiceAnswer, setVoiceAnswer] = useState<VoiceQueryResult | null>(null);
  const [queryError, setQueryError] = useState('');
  const recognition = useSpeechRecognition({
    serverTranscribe: isApiConfigured()
      ? async (audio) => (await voiceApi.recognize(audio)).queryText
      : undefined,
  });
  const activeView: View = view === 'unconfirmed' && unconfirmedTotal === 0 ? 'home' : view;
  const phase: ListeningPhase = recognition.status === 'recognized'
    ? 'confirmed'
    : recognition.status === 'listening' && recognition.transcript
      ? 'heard'
      : 'idle';

  const openBalance = () => {
    setVoiceAnswer(null);
    setQueryError('');
    setView('listening');
    recognition.start();
  };

  const goHome = () => {
    recognition.reset();
    setQueryError('');
    setView('home');
  };

  const confirmVoiceQuery = async () => {
    if (!recognition.transcript) return;
    setQueryError('');
    if (isBalanceVoiceQuery(recognition.transcript) || !isApiConfigured()) {
      const answer = createBalanceVoiceAnswer(selectedAccount);
      setVoiceAnswer(answer);
      setView('result');
      void speakResponse(answer.answerText);
      return;
    }
    try {
      const answer = await voiceApi.query(recognition.transcript);
      setVoiceAnswer(answer);
      setView('result');
      void speakResponse(answer.answerText, answer.audioUrl);
    } catch (cause) {
      setQueryError(cause instanceof Error ? cause.message : '질문을 처리하지 못했어요. 다시 시도해주세요.');
    }
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
            count={unconfirmedTotal}
            onReadSummary={() =>
              router.push({ pathname: '/(app)/unconfirmed', params: { view: 'summary' } })
            }
            onDetail={() =>
              router.push({ pathname: '/(app)/unconfirmed', params: { view: 'breakdown' } })
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
            error={queryError || recognition.error || undefined}
            recording={recognition.isRecording}
            onFinishRecording={() => void recognition.submit()}
            onBack={goHome}
            onRetry={recognition.start}
            onConfirm={() => void confirmVoiceQuery()}
          />
        )}

        {activeView === 'result' && (
          <ResultScreen
            onBack={goHome}
            onViewHistory={() => router.push('/(app)/history')}
            onMic={openBalance}
            question={recognition.transcript}
            answerText={voiceAnswer?.answerText ?? ''}
            relatedAccountId={voiceAnswer?.relatedAccountId}
            onReplay={voiceAnswer
              ? () => void speakResponse(voiceAnswer.answerText, voiceAnswer.audioUrl)
              : undefined}
          />
        )}
      </ScreenIn>
    </Screen>
  );
}
