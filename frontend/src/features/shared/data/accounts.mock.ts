/**
 * 사용자 본인 소유의 통장 목록(목데이터).
 * 송금 "출금 계좌" 선택(transfer)과 통장별 거래내역(history) 양쪽에서 쓰이므로 shared 에 둔다.
 */

export interface Account {
  id: string;
  bank: string;
  name: string;
  number: string;
  color: string;
}

export const accounts: Account[] = [
  { id: 'a', bank: 'KB국민은행', name: '생활비 통장', number: '3456', color: '#ffcc00' },
  { id: 'b', bank: 'KB국민은행', name: '연금 통장', number: '7821', color: '#8c7a58' },
  { id: 'c', bank: '우체국', name: '저축 통장', number: '1190', color: '#ef8575' },
];
