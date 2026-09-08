import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { EscalationSheet } from '@/features/onboarding/help/EscalationSheet';
import { useStagedIdle } from '@/features/onboarding/help/captureHelp';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { callCustomerCenter } from '@/lib/customerSupport';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { useTransactions } from '../TransactionContext';
import {
  filterReviewTransactions,
  filterTransactionsByMonth,
  yearMonthOf,
} from '../transactions';
import type { TxRecord } from '../types';
import {
  HISTORY_HELP,
  listHelpTarget,
  reviewDetailVoice,
  type HistoryHelpTarget,
} from './historyHelp';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { TxDetailPopup } from './screens/TxDetailPopup';

const MONTH_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/**
 * 거래 월 탐색과 거래 확인 팝업을 관리한다. 확인 결과는 TransactionProvider를 통해
 * 홈의 미확인 거래 게이트와 배지에도 즉시 반영된다.
 */
export function HistoryFlow() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { transactions, reviewTransaction } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<TxRecord | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const [forceListTarget, setForceListTarget] = useState<HistoryHelpTarget>('');
  const reviewOnly = view === 'review';
  const dismissCounts = useRef<Partial<Record<number, number>>>({});
  const escalatedRef = useRef(false);
  const listStageRef = useRef(0);
  const popupStageRef = useRef(0);
  const skipListVoiceRef = useRef(false);

  const now = new Date();
  const currentYm = now.getFullYear() * 12 + now.getMonth();
  const [viewYm, setViewYm] = useState(() => (
    transactions[0] ? yearMonthOf(transactions[0].occurredAt) : currentYm
  ));
  const year = Math.floor(viewYm / 12);
  const monthLabel = `${year}년 ${MONTH_NAMES[viewYm % 12]}월`;
  const canGoNext = viewYm < currentYm;

  const monthlyTransactions = filterTransactionsByMonth(transactions, viewYm);
  const visibleTransactions = reviewOnly
    ? filterReviewTransactions(monthlyTransactions)
    : monthlyTransactions;
  const visiblePending = visibleTransactions.filter((tx) => tx.reviewStatus === 'pending');
  const visibleUnknown = visibleTransactions.filter((tx) => tx.reviewStatus === 'unknown');
  const reviewElsewhere = filterReviewTransactions(transactions);
  const empty = visibleTransactions.length === 0;
  const hasReviewElsewhere = empty && reviewElsewhere.length > 0;
  const naturalTarget = listHelpTarget({
    unknownCount: visibleUnknown.length,
    needCheckCount: visiblePending.length,
    empty,
    hasReviewElsewhere,
  });

  const listIdle = useStagedIdle(!selectedTx && !showEscalation);
  const popupIdle = useStagedIdle(!!selectedTx && !showEscalation);

  const immediateListPulse = naturalTarget === 'reportBtn' || naturalTarget === 'prevMonth' || forceListTarget === 'reportBtn';
  const listTarget: HistoryHelpTarget =
    forceListTarget ||
    (immediateListPulse || listIdle.stage >= 1 ? naturalTarget : '');

  const popupTarget: HistoryHelpTarget = !selectedTx
    ? ''
    : selectedTx.reviewStatus === 'unknown'
      ? 'callBtn'
      : selectedTx.reviewStatus === 'pending'
        ? popupIdle.stage >= 2
          ? 'pendingIdle'
          : popupIdle.stage >= 1
            ? 'knownBtn'
            : ''
        : '';

  const escalate = () => {
    if (escalatedRef.current) return;
    escalatedRef.current = true;
    setShowEscalation(true);
  };

  const goHome = () => {
    ttsStop();
    router.dismissTo('/(app)/home');
  };

  const openTransaction = (tx: TxRecord | undefined) => {
    if (!tx) return;
    listIdle.bump();
    setForceListTarget('');
    setSelectedTx(tx);
  };

  const closePopup = (reviewed: boolean) => {
    if (selectedTx && !reviewed && selectedTx.reviewStatus === 'pending') {
      const next = (dismissCounts.current[selectedTx.id] ?? 0) + 1;
      dismissCounts.current[selectedTx.id] = next;
      if (next >= 3) escalate();
    }
    skipListVoiceRef.current = true;
    popupIdle.bump();
    setSelectedTx(null);
  };

  useEffect(() => {
    if (selectedTx) return;
    if (skipListVoiceRef.current) {
      skipListVoiceRef.current = false;
      return;
    }
    if (visibleUnknown.length > 0) {
      ttsSpeak(HISTORY_HELP.reportEntry(visibleUnknown.length));
      return () => ttsStop();
    }
    if (hasReviewElsewhere) {
      ttsSpeak(HISTORY_HELP.emptyOtherMonth);
      return () => ttsStop();
    }
    if (visiblePending.length > 0) {
      ttsSpeak(HISTORY_HELP.reviewEntry(visiblePending.length));
      return () => ttsStop();
    }
    return () => ttsStop();
  }, [hasReviewElsewhere, selectedTx, viewYm, visiblePending.length, visibleUnknown.length]);

  useEffect(() => {
    if (!selectedTx) return;
    ttsSpeak(
      selectedTx.reviewStatus === 'unknown' ? HISTORY_HELP.unknownCall : reviewDetailVoice(selectedTx),
    );
    return () => ttsStop();
  }, [selectedTx]);

  useEffect(() => {
    if (listIdle.stage === listStageRef.current) return;
    const previous = listStageRef.current;
    listStageRef.current = listIdle.stage;
    if (listIdle.stage <= previous || selectedTx) return;
    if (listIdle.stage >= 3 && naturalTarget) escalate();
  }, [listIdle.stage, naturalTarget, selectedTx]);

  useEffect(() => {
    if (popupIdle.stage === popupStageRef.current) return;
    const previous = popupStageRef.current;
    popupStageRef.current = popupIdle.stage;
    if (popupIdle.stage <= previous || !selectedTx) return;
    if (popupIdle.stage === 2 && selectedTx.reviewStatus === 'pending') {
      ttsSpeak(HISTORY_HELP.unknownHint);
    }
    if (
      popupIdle.stage >= 3 &&
      (selectedTx.reviewStatus === 'pending' || selectedTx.reviewStatus === 'unknown')
    ) {
      escalate();
    }
  }, [popupIdle.stage, selectedTx]);

  useAndroidBack(() => {
    if (showEscalation) {
      setShowEscalation(false);
      return true;
    }
    if (selectedTx) {
      closePopup(false);
      return true;
    }
    return false;
  });

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <ScreenIn>
        <TransactionsScreen
          reviewOnly={reviewOnly}
          transactions={visibleTransactions}
          needCheckCount={visiblePending.length}
          unknownCount={visibleUnknown.length}
          month={monthLabel}
          canGoNext={canGoNext}
          helpTarget={listTarget}
          onActivity={listIdle.bump}
          onPrevMonth={() => {
            listIdle.bump();
            setViewYm((v) => v - 1);
          }}
          onNextMonth={() => {
            listIdle.bump();
            setViewYm((v) => (v < currentYm ? v + 1 : v));
          }}
          onSelectTx={(tx) => openTransaction(tx)}
          onReview={() => openTransaction(visiblePending[0])}
          onReviewUnknown={() => openTransaction(visibleUnknown[0])}
          onHome={goHome}
        />
      </ScreenIn>

      <TxDetailPopup
        visible={!!selectedTx}
        tx={selectedTx}
        helpTarget={popupTarget}
        onActivity={popupIdle.bump}
        onKnown={() => {
          if (selectedTx) reviewTransaction(selectedTx.id, 'known');
          closePopup(true);
        }}
        onUnknown={() => {
          if (selectedTx) reviewTransaction(selectedTx.id, 'unknown');
          closePopup(true);
          setForceListTarget('reportBtn');
          ttsSpeak(HISTORY_HELP.markedUnknown);
        }}
        onReport={() => void callCustomerCenter()}
        onClose={() => closePopup(false)}
      />

      <EscalationSheet visible={showEscalation} onDismiss={() => setShowEscalation(false)} />
    </Screen>
  );
}
