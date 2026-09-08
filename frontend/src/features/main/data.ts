import type { RecentRecipientCandidate, SavedRecipient, TxRecord } from './types';

/** danbi_jj app/features/main/data.ts 이식. */

export const BANKS = [
  { bankCode: '004', name: 'KB국민은행', short: 'KB', bg: '#F5C100', fg: '#111' },
  { bankCode: '088', name: '신한은행', short: '신', bg: '#E85C2A', fg: '#fff' },
  { bankCode: '020', name: '우리은행', short: '우', bg: '#0073CF', fg: '#fff' },
  { bankCode: '081', name: '하나은행', short: '하', bg: '#009B63', fg: '#fff' },
  { bankCode: '011', name: 'NH농협은행', short: 'NH', bg: '#00A0C4', fg: '#fff' },
  { bankCode: '090', name: '카카오뱅크', short: '카', bg: '#FEE500', fg: '#111' },
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
  { id: 1, occurredAt: '2026-08-29T14:10:00+09:00', date: '8월 29일', time: '오후 2:10', type: '체크카드', name: '편의점 결제', amount: -40000, reviewStatus: 'pending' },
  { id: 2, occurredAt: '2026-08-29T09:21:00+09:00', date: '8월 29일', time: '오전 9:21', type: '이체', name: '이영희', amount: -80000, reviewStatus: 'known' },
  { id: 3, occurredAt: '2026-08-28T13:45:00+09:00', date: '8월 28일', time: '오후 1:45', type: '체크카드', name: '전자제품 매장', amount: -780000, reviewStatus: 'pending' },
  { id: 4, occurredAt: '2026-08-28T09:00:00+09:00', date: '8월 28일', time: '오전 9:00', type: '입금', name: '국민연금', amount: 650000, reviewStatus: 'known' },
  { id: 5, occurredAt: '2026-08-27T19:30:00+09:00', date: '8월 27일', time: '오후 7:30', type: '체크카드', name: '마트 결제', amount: -53000, reviewStatus: 'known' },
];

/** 숫자 문자열을 천단위 콤마로. 빈 값이면 빈 문자열. */
export const fmt = (s: string) => (s ? parseInt(s, 10).toLocaleString() : '');

/** 은행 이름으로 표시 정보를 찾는다. 없으면 두 번째 은행으로 대체. */
export const bankOf = (name: string) => BANKS.find((b) => b.name === name) ?? BANKS[1];
