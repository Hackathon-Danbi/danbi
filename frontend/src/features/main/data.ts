import type { TxRecord } from './types';

/** danbi_jj app/features/main/data.ts 이식. */

export const BANKS = [
  { name: 'KB국민은행', short: 'KB', bg: '#F5C100', fg: '#111' },
  { name: '신한은행', short: '신', bg: '#E85C2A', fg: '#fff' },
  { name: '우리은행', short: '우', bg: '#0073CF', fg: '#fff' },
  { name: '하나은행', short: '하', bg: '#009B63', fg: '#fff' },
  { name: 'NH농협은행', short: 'NH', bg: '#00A0C4', fg: '#fff' },
  { name: '카카오뱅크', short: '카', bg: '#FEE500', fg: '#111' },
];

export const CONTACTS = [
  { name: '김민수', bank: 'KB국민은행', account: '123-456-789012', initial: '김', bg: '#F5C100', fg: '#111' },
  { name: '이영희', bank: '신한은행', account: '110-234-567890', initial: '이', bg: '#E85C2A', fg: '#fff' },
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
