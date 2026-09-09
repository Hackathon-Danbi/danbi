import type { TxRecord } from '../../types';

/**
 * 통장별 거래내역 목데이터.
 *
 * 실제 API 연동 전이라, "지금 보고 있는 통장"을 바꾸면 이 표에서 해당 통장의
 * 거래를 꺼내 보여준다. 기본 통장(생활비 통장)은 기존 TX_RECORDS 를 그대로 쓰고,
 * (홈의 "확인할 거래" 게이트가 이 배열을 공유하므로 건드리지 않는다) 나머지
 * 통장만 여기서 별도로 정의한다.
 */
export const DEFAULT_TX_ACCOUNT_ID = 10;

const PENSION_TX: TxRecord[] = [
  {
    id: 1104,
    accountId: 11,
    occurredAt: '2026-09-03T16:40:00+09:00',
    date: '9월 3일',
    time: '오후 4:40',
    type: '체크카드',
    name: '백화점 결제',
    amount: -620000,
    merchant: '롯데백화점 본점',
    category: '쇼핑',
    memo: '',
    reviewStatus: 'pending',
  },
  {
    id: 1101,
    accountId: 11,
    occurredAt: '2026-08-25T09:00:00+09:00',
    date: '8월 25일',
    time: '오전 9:00',
    type: '입금',
    name: '국민연금',
    amount: 620000,
    merchant: '국민연금공단',
    category: '수입',
    memo: '8월분 연금',
    reviewStatus: 'known',
  },
  {
    id: 1102,
    accountId: 11,
    occurredAt: '2026-08-20T11:20:00+09:00',
    date: '8월 20일',
    time: '오전 11:20',
    type: '이체',
    name: '생활비 통장',
    amount: -300000,
    merchant: '생활비 통장',
    category: '이체',
    memo: '생활비 이체',
    reviewStatus: 'known',
  },
  {
    id: 1103,
    accountId: 11,
    occurredAt: '2026-08-10T08:30:00+09:00',
    date: '8월 10일',
    time: '오전 8:30',
    type: '입금',
    name: '주택연금',
    amount: 450000,
    merchant: '한국주택금융공사',
    category: '수입',
    memo: '',
    reviewStatus: 'known',
  },
];

const SAVINGS_TX: TxRecord[] = [
  {
    id: 1201,
    accountId: 12,
    occurredAt: '2026-08-27T10:00:00+09:00',
    date: '8월 27일',
    time: '오전 10:00',
    type: '입금',
    name: '자동 저축',
    amount: 200000,
    merchant: '자동이체',
    category: '저축',
    memo: '매달 27일 저축',
    reviewStatus: 'known',
  },
  {
    id: 1202,
    accountId: 12,
    occurredAt: '2026-08-15T15:40:00+09:00',
    date: '8월 15일',
    time: '오후 3:40',
    type: '이체',
    name: '생활비 통장',
    amount: -500000,
    merchant: '생활비 통장',
    category: '이체',
    memo: '병원비',
    reviewStatus: 'pending',
  },
  {
    id: 1203,
    accountId: 12,
    occurredAt: '2026-08-05T09:10:00+09:00',
    date: '8월 5일',
    time: '오전 9:10',
    type: '입금',
    name: '이자',
    amount: 18500,
    merchant: '우체국',
    category: '수입',
    memo: '분기 이자',
    reviewStatus: 'known',
  },
];

/** 기본(생활비) 통장은 호출부에서 review 가 적용된 TX_RECORDS 를 넘겨 쓰므로 여기엔 넣지 않는다. */
export const ACCOUNT_TX_BY_ID: Record<number, TxRecord[]> = {
  11: PENSION_TX,
  12: SAVINGS_TX,
};

/**
 * 선택된 통장의 거래내역을 돌려준다.
 * @param defaultAccountTx review 가 적용된 기본 통장 거래(useTransactions 결과)
 */
export function transactionsForAccount(
  accountId: number,
  defaultAccountTx: TxRecord[],
): TxRecord[] {
  if (accountId === DEFAULT_TX_ACCOUNT_ID) return defaultAccountTx;
  return ACCOUNT_TX_BY_ID[accountId] ?? [];
}
