/**
 * 사용자 본인 소유의 통장 목록(목데이터).
 * 송금 "출금 계좌" 선택(transfer)과 통장별 거래내역(history) 양쪽에서 쓰이므로 shared 에 둔다.
 */

export interface Account {
  accountId: number;
  bankName: string;
  accountName: string;
  maskedAccountNumber: string;
  color: string;
}

export const accounts: Account[] = [
  {
    accountId: 10,
    bankName: 'KB국민은행',
    accountName: '생활비 통장',
    maskedAccountNumber: '****3456',
    color: '#ffcc00',
  },
  {
    accountId: 11,
    bankName: 'KB국민은행',
    accountName: '연금 통장',
    maskedAccountNumber: '****7821',
    color: '#8c7a58',
  },
  {
    accountId: 12,
    bankName: '우체국',
    accountName: '저축 통장',
    maskedAccountNumber: '****1190',
    color: '#ef8575',
  },
];
