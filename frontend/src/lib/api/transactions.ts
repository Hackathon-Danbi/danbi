import type { TransactionReviewStatus, TxRecord } from '@/features/main/types';

import { apiJson } from './http';
import { fromReviewStatus, mapTransaction, type RemoteTransaction, type ReviewStatusCode } from './map';

type MonthlyTransactionsResponse = {
  accountId: number;
  year: number;
  month: number;
  transactions?: RemoteTransaction[];
};

export async function fetchMonthlyTransactions(
  accountId: number,
  year: number,
  month: number,
): Promise<TxRecord[]> {
  const query = new URLSearchParams({
    accountId: String(accountId),
    year: String(year),
    month: String(month),
  });
  const body = await apiJson<MonthlyTransactionsResponse>(`/api/transactions?${query.toString()}`);
  return (body.transactions ?? []).map(mapTransaction);
}

export function fetchUnreviewedCount(accountId: number) {
  const query = new URLSearchParams({ accountId: String(accountId) });
  return apiJson<{ unreviewedCount: number }>(`/api/transactions/unreviewed-count?${query.toString()}`);
}

export function reviewRemoteTransaction(transactionId: number, status: TransactionReviewStatus) {
  return apiJson(`/api/transactions/${transactionId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewStatus: fromReviewStatus(status) satisfies ReviewStatusCode }),
  });
}
