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
import { getApiIdentity } from '@/lib/api/identity';
import { tryBackend } from '@/lib/api/live';
import { fetchMonthlyTransactions, reviewRemoteTransaction } from '@/lib/api/transactions';
import { TX_RECORDS } from './data';
import { DEFAULT_TX_ACCOUNT_ID } from './history/data/accountTransactions.mock';
import type { TxRecord } from './types';
import {
  applyTransactionReviews,
  sanitizeTransactionReviews,
  yearMonthOf,
  type StoredTransactionReview,
  type TransactionReviewRecord,
} from './transactions';

type TransactionContextValue = {
  transactions: TxRecord[];
  pendingTransactions: TxRecord[];
  unknownTransactions: TxRecord[];
  reviewTransaction: (id: number, status: StoredTransactionReview) => void;
  ensureMonth: (year: number, month: number) => Promise<void>;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

function stampDefaultAccount(records: TxRecord[]): TxRecord[] {
  return records.map((record) => ({ ...record, accountId: record.accountId ?? DEFAULT_TX_ACCOUNT_ID }));
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<TransactionReviewRecord>({});
  const [records, setRecords] = useState<TxRecord[]>(TX_RECORDS);
  const [hydrated, setHydrated] = useState(false);
  const mounted = useRef(true);
  const loadedMonths = useRef(new Set<string>());
  const usingApiRef = useRef(false);

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

  const ensureMonth = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (loadedMonths.current.has(key)) return;
    loadedMonths.current.add(key);
    const identity = await getApiIdentity();
    const remote = await tryBackend(() => fetchMonthlyTransactions(identity.accountId, year, month));
    if (!mounted.current) return;
    if (remote == null) {
      loadedMonths.current.delete(key);
      return;
    }
    if (remote.length === 0 && !usingApiRef.current) return;
    const mapped = stampDefaultAccount(
      remote.map((record) => ({ ...record, accountId: DEFAULT_TX_ACCOUNT_ID })),
    );
    const yearMonth = year * 12 + (month - 1);
    const firstLive = !usingApiRef.current;
    usingApiRef.current = true;
    setRecords((current) => {
      const kept = firstLive ? [] : current.filter((item) => yearMonthOf(item.occurredAt) !== yearMonth);
      return [...mapped, ...kept];
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const now = new Date();
    void ensureMonth(now.getFullYear(), now.getMonth() + 1);
  }, [ensureMonth, hydrated]);

  const reviewTransaction = useCallback((id: number, status: StoredTransactionReview) => {
    setReviews((current) => {
      const next = { ...current, [String(id)]: status };
      void setJSON(StorageKeys.transactionReviews, next);
      return next;
    });
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, reviewStatus: status } : record)),
    );
    void tryBackend(() => reviewRemoteTransaction(id, status));
  }, []);

  const value = useMemo<TransactionContextValue>(() => {
    const transactions = applyTransactionReviews(records, reviews);
    return {
      transactions,
      pendingTransactions: transactions.filter((tx) => tx.reviewStatus === 'pending'),
      unknownTransactions: transactions.filter((tx) => tx.reviewStatus === 'unknown'),
      reviewTransaction,
      ensureMonth,
    };
  }, [ensureMonth, records, reviewTransaction, reviews]);

  if (!hydrated) return null;
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const value = useContext(TransactionContext);
  if (!value) throw new Error('useTransactions must be used inside <TransactionProvider>');
  return value;
}
