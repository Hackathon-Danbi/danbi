import { BANKS } from '../../features/main/data';
import type { TransactionReviewStatus, TxRecord } from '../../features/main/types';

type PhoneCarrierLabel = 'SKT' | 'KT' | 'LG U+' | '알뜰폰' | null;
type IdTypeLabel = '주민등록증' | '운전면허증' | null;

export type PhoneCarrierCode = 'SKT' | 'KT' | 'LG_U_PLUS' | 'MVNO';
export type IdCardTypeCode = 'RESIDENT_CARD' | 'DRIVER_LICENSE';
export type ReviewStatusCode = 'PENDING' | 'KNOWN' | 'UNKNOWN';

export function toPhoneCarrier(carrier: PhoneCarrierLabel): PhoneCarrierCode {
  if (carrier === 'KT') return 'KT';
  if (carrier === 'LG U+') return 'LG_U_PLUS';
  if (carrier === '알뜰폰') return 'MVNO';
  return 'SKT';
}

export function toIdCardType(idType: IdTypeLabel): IdCardTypeCode {
  return idType === '운전면허증' ? 'DRIVER_LICENSE' : 'RESIDENT_CARD';
}

export function bankCodeOf(bankName: string): string {
  return BANKS.find((bank) => bank.name === bankName)?.bankCode ?? '004';
}

export function bankNameOf(bankCode: string): string {
  return BANKS.find((bank) => bank.bankCode === bankCode)?.name ?? bankCode;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function toReviewStatus(value: string | undefined): TransactionReviewStatus {
  if (value === 'KNOWN') return 'known';
  if (value === 'UNKNOWN') return 'unknown';
  return 'pending';
}

export function fromReviewStatus(value: TransactionReviewStatus): ReviewStatusCode {
  if (value === 'known') return 'KNOWN';
  if (value === 'unknown') return 'UNKNOWN';
  return 'PENDING';
}

export type RemoteTransaction = {
  transactionId: number;
  accountId?: number;
  transactionType?: string;
  description?: string;
  amount?: number;
  occurredAt?: string | number[];
  reviewStatus?: string;
};

function parseOccurredAt(value: string | number[] | undefined): Date {
  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date();
}

export function mapTransaction(row: RemoteTransaction): TxRecord {
  const occurred = parseOccurredAt(row.occurredAt);
  const amount = Number(row.amount ?? 0);
  const outgoing = row.transactionType === 'WITHDRAWAL' || amount < 0;
  const signed = outgoing ? -Math.abs(amount) : Math.abs(amount);
  const place = row.description?.trim() || '거래';
  return {
    id: row.transactionId,
    accountId: row.accountId,
    occurredAt: occurred.toISOString(),
    date: `${occurred.getMonth() + 1}월 ${occurred.getDate()}일`,
    time: occurred.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
    type: outgoing ? '출금' : '입금',
    name: place,
    amount: signed,
    merchant: place,
    category: outgoing ? '출금' : '입금',
    memo: '',
    reviewStatus: toReviewStatus(row.reviewStatus),
  };
}
