/**
 * 사용자 본인 소유의 통장 목록(목데이터).
 * 송금 "출금 계좌" 선택(transfer)과 통장별 거래내역(history) 양쪽에서 쓰이므로 shared 에 둔다.
 * 실제 API 연동 전까지 잔액도 이 목데이터로 표시한다.
 */

export interface Account {
  accountId: number;
  bankName: string;
  accountName: string;
  /** 시니어가 통장을 구별할 수 있도록 앞자리는 남기고 뒷자리만 가린 형식. */
  maskedAccountNumber: string;
  balance: number;
  color: string;
}

export const accounts: Account[] = [
  {
    accountId: 10,
    bankName: 'KB국민은행',
    accountName: '생활비 통장',
    maskedAccountNumber: '123456-**-******',
    balance: 2_450_000,
    color: '#ffcc00',
  },
  {
    accountId: 11,
    bankName: 'KB국민은행',
    accountName: '연금 통장',
    maskedAccountNumber: '987654-**-******',
    balance: 5_320_000,
    color: '#8c7a58',
  },
  {
    accountId: 12,
    bankName: '우체국',
    accountName: '저축 통장',
    maskedAccountNumber: '456789-**-******',
    balance: 10_000_000,
    color: '#ef8575',
  },
];

/** 첫 번째 통장을 기본 선택으로 쓴다. */
export const defaultAccount: Account = accounts[0];

/** 2450000 → "2,450,000원". 시니어 화면에서 잔액을 크게 보여줄 때 공통으로 쓴다. */
export function formatWon(value: number): string {
  return `${value.toLocaleString('en-US')}원`;
}
