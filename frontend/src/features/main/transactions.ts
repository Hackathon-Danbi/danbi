import type { TransactionReviewStatus, TxRecord } from './types';

export type StoredTransactionReview = Exclude<TransactionReviewStatus, 'pending'>;
export type TransactionReviewRecord = Record<string, StoredTransactionReview>;

export function formatTxOccurredAt(tx: Pick<TxRecord, 'date' | 'time'>): string {
  return `${tx.date} ${tx.time}`;
}

export function yearMonthOf(occurredAt: string): number {
  const date = new Date(occurredAt);
  return date.getFullYear() * 12 + date.getMonth();
}

export function filterTransactionsByMonth(records: TxRecord[], yearMonth: number): TxRecord[] {
  return records.filter((record) => yearMonthOf(record.occurredAt) === yearMonth);
}

export function applyTransactionReviews(
  records: TxRecord[],
  reviews: TransactionReviewRecord,
): TxRecord[] {
  return records.map((record) => ({
    ...record,
    reviewStatus: reviews[String(record.id)] ?? record.reviewStatus,
  }));
}

export function sanitizeTransactionReviews(value: unknown): TransactionReviewRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, StoredTransactionReview] => (
      entry[1] === 'known' || entry[1] === 'unknown'
    )),
  );
}
