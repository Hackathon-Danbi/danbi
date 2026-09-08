import type { RecentRecipientCandidate, SavedRecipient, TxRecord } from './types';

/** danbi_jj app/features/main/data.ts 이식. */

export const BANKS = [
  {
    bankCode: '004',
    bankName: 'KB국민은행',
    short: 'KB',
    bg: '#F5C100',
    fg: '#111',
  },
  {
    bankCode: '088',
    bankName: '신한은행',
    short: '신',
    bg: '#E85C2A',
    fg: '#fff',
  },
  {
    bankCode: '020',
    bankName: '우리은행',
    short: '우',
    bg: '#0073CF',
    fg: '#fff',
  },
  {
    bankCode: '081',
    bankName: '하나은행',
    short: '하',
    bg: '#009B63',
    fg: '#fff',
  },
  {
    bankCode: '011',
    bankName: 'NH농협은행',
    short: 'NH',
    bg: '#00A0C4',
    fg: '#fff',
  },
  {
    bankCode: '090',
    bankName: '카카오뱅크',
    short: '카',
    bg: '#FEE500',
    fg: '#111',
  },
];

export const CONTACTS: SavedRecipient[] = [
  {
    savedRecipientId: 7,
    recipientName: '김민수',
    recipientBankCode: '004',
    recipientBankName: 'KB국민은행',
    recipientAccountNumber: '123-456-789012',
    nickname: null,
  },
  {
    savedRecipientId: 8,
    recipientName: '이영희',
    recipientBankCode: '088',
    recipientBankName: '신한은행',
    recipientAccountNumber: '110-234-567890',
    nickname: '영희',
  },
];

/** 실제 연동 전, 최근 송금 이력을 계좌별로 집계한 추천 목데이터. */
export const RECENT_RECIPIENT_CANDIDATES: RecentRecipientCandidate[] = [
  {
    recipientName: '박수진',
    recipientBankCode: '020',
    recipientBankName: '우리은행',
    recipientAccountNumber: '1002-456-789012',
    recentTransferCount: 5,
    lastTransferredAt: '8월 27일',
  },
  {
    recipientName: '최영호',
    recipientBankCode: '081',
    recipientBankName: '하나은행',
    recipientAccountNumber: '357-910-246813',
    recentTransferCount: 3,
    lastTransferredAt: '8월 24일',
  },
];

export const TX_RECORDS: TxRecord[] = [
  {
    transactionId: 1,
    accountId: 10,
    occurredAt: '2026-08-29T14:10:00+09:00',
    date: '8월 29일',
    time: '오후 2:10',
    transactionType: '체크카드',
    description: '편의점 결제',
    amount: -40000,
    reviewStatus: 'UNREAD',
    reviewedAt: null,
  },
  {
    transactionId: 2,
    accountId: 10,
    occurredAt: '2026-08-29T09:21:00+09:00',
    date: '8월 29일',
    time: '오전 9:21',
    transactionType: '이체',
    description: '이영희',
    amount: -80000,
    reviewStatus: 'KNOWN',
    reviewedAt: '2026-08-29T09:22:00+09:00',
  },
  {
    transactionId: 3,
    accountId: 10,
    occurredAt: '2026-08-28T13:45:00+09:00',
    date: '8월 28일',
    time: '오후 1:45',
    transactionType: '체크카드',
    description: '전자제품 매장',
    amount: -780000,
    reviewStatus: 'UNREAD',
    reviewedAt: null,
  },
  {
    transactionId: 4,
    accountId: 10,
    occurredAt: '2026-08-28T09:00:00+09:00',
    date: '8월 28일',
    time: '오전 9:00',
    transactionType: '입금',
    description: '국민연금',
    amount: 650000,
    reviewStatus: 'KNOWN',
    reviewedAt: '2026-08-28T09:01:00+09:00',
  },
  {
    transactionId: 5,
    accountId: 10,
    occurredAt: '2026-08-27T19:30:00+09:00',
    date: '8월 27일',
    time: '오후 7:30',
    transactionType: '체크카드',
    description: '마트 결제',
    amount: -53000,
    reviewStatus: 'KNOWN',
    reviewedAt: '2026-08-27T19:31:00+09:00',
  },
];

/** 숫자 문자열을 천단위 콤마로. 빈 값이면 빈 문자열. */
export const fmt = (s: string) => (s ? parseInt(s, 10).toLocaleString() : '');

/** 은행 이름으로 표시 정보를 찾는다. 없으면 두 번째 은행으로 대체. */
export const bankOf = (bankName: string) =>
  BANKS.find((bank) => bank.bankName === bankName) ?? BANKS[1];
