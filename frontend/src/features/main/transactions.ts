import type { TransactionReviewStatus, TxRecord } from './types';

export type StoredTransactionReview = Exclude<TransactionReviewStatus, 'UNREAD'>;
export type TransactionReviewRecord = Record<string, StoredTransactionReview>;

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
    reviewStatus: reviews[String(record.transactionId)] ?? record.reviewStatus,
  }));
}

export function sanitizeTransactionReviews(value: unknown): TransactionReviewRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce<TransactionReviewRecord>(
    (reviews, [transactionId, status]) => {
      if (status === 'KNOWN' || status === 'known') reviews[transactionId] = 'KNOWN';
      if (status === 'UNKNOWN' || status === 'unknown') reviews[transactionId] = 'UNKNOWN';
      return reviews;
    },
    {},
  );
}
