import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getJSON, setJSON, StorageKeys } from '@/lib/storage';
import { TX_RECORDS } from './data';
import type { TxRecord } from './types';
import {
  applyTransactionReviews,
  sanitizeTransactionReviews,
  type StoredTransactionReview,
  type TransactionReviewRecord,
} from './transactions';

type TransactionContextValue = {
  transactions: TxRecord[];
  pendingTransactions: TxRecord[];
  unknownTransactions: TxRecord[];
  reviewTransaction: (id: number, status: StoredTransactionReview) => void;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<TransactionReviewRecord>({});
  const [hydrated, setHydrated] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const stored = await getJSON<unknown>(StorageKeys.transactionReviews);
      if (!mounted.current) return;
      setReviews(sanitizeTransactionReviews(stored));
      setHydrated(true);
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const reviewTransaction = useCallback((id: number, status: StoredTransactionReview) => {
    setReviews((current) => {
      const next = { ...current, [String(id)]: status };
      void setJSON(StorageKeys.transactionReviews, next);
      return next;
    });
  }, []);

  const value = useMemo<TransactionContextValue>(() => {
    const transactions = applyTransactionReviews(TX_RECORDS, reviews);
    return {
      transactions,
      pendingTransactions: transactions.filter(
        (transaction) => transaction.reviewStatus === 'UNREAD',
      ),
      unknownTransactions: transactions.filter(
        (transaction) => transaction.reviewStatus === 'UNKNOWN',
      ),
      reviewTransaction,
    };
  }, [reviewTransaction, reviews]);

  if (!hydrated) return null;
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const value = useContext(TransactionContext);
  if (!value) throw new Error('useTransactions must be used inside <TransactionProvider>');
  return value;
}
