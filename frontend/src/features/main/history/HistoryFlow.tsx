import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { callCustomerCenter } from '@/lib/customerSupport';
import { useTransactions } from '../TransactionContext';
import { filterTransactionsByMonth, yearMonthOf } from '../transactions';
import type { TxRecord } from '../types';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { TxDetailPopup } from './screens/TxDetailPopup';

const MONTH_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/**
 * 거래 월 탐색과 거래 확인 팝업을 관리한다. 확인 결과는 TransactionProvider를 통해
 * 홈의 미확인 거래 게이트와 배지에도 즉시 반영된다.
 */
export function HistoryFlow() {
  const router = useRouter();
  const { transactions, reviewTransaction } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<TxRecord | null>(null);

  // 월 이동: 원본은 라벨만 바꿨지만, 미래 월로는 이동할 수 없게 현재 날짜 기준으로 제어한다.
  const now = new Date();
  const currentYm = now.getFullYear() * 12 + now.getMonth();
  const [viewYm, setViewYm] = useState(() => (
    transactions[0] ? yearMonthOf(transactions[0].occurredAt) : currentYm
  ));
  const year = Math.floor(viewYm / 12);
  const monthLabel = `${year}년 ${MONTH_NAMES[viewYm % 12]}월`;
  const canGoNext = viewYm < currentYm;

  const visibleTransactions = filterTransactionsByMonth(transactions, viewYm);
  // 확인 안내 배지와 '확인하기' 동작은 현재 보고 있는 달 기준으로만 처리한다.
  // (다른 달 거래로 목록이 갑자기 넘어가지 않도록)
  const visiblePending = visibleTransactions.filter((tx) => tx.reviewStatus === 'pending');
  const visibleUnknown = visibleTransactions.filter((tx) => tx.reviewStatus === 'unknown');

  const goHome = () => router.dismissTo('/(app)/home');

  const openTransaction = (tx: TxRecord | undefined) => {
    if (!tx) return;
    setSelectedTx(tx);
  };

  useAndroidBack(() => {
    if (selectedTx) {
      setSelectedTx(null);
      return true;
    }
    return false; // 최상위 → expo-router 가 상위 라우트로
  });

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <ScreenIn>
        <TransactionsScreen
          transactions={visibleTransactions}
          needCheckCount={visiblePending.length}
          unknownCount={visibleUnknown.length}
          month={monthLabel}
          canGoNext={canGoNext}
          onPrevMonth={() => setViewYm((v) => v - 1)}
          onNextMonth={() => setViewYm((v) => (v < currentYm ? v + 1 : v))}
          onSelectTx={(tx) => setSelectedTx(tx)}
          onReview={() => openTransaction(visiblePending[0])}
          onReviewUnknown={() => openTransaction(visibleUnknown[0])}
          onTransfer={() => router.replace('/(app)/transfer')}
          onHome={goHome}
        />
      </ScreenIn>

      <TxDetailPopup
        visible={!!selectedTx}
        tx={selectedTx}
        onKnown={() => {
          if (selectedTx) reviewTransaction(selectedTx.id, 'known');
          setSelectedTx(null);
        }}
        onUnknown={() => {
          if (selectedTx) reviewTransaction(selectedTx.id, 'unknown');
          setSelectedTx(null);
        }}
        onReport={() => void callCustomerCenter()}
        onClose={() => setSelectedTx(null)}
      />
    </Screen>
  );
}
