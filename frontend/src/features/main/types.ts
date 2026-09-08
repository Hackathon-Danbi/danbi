/** 실제 금융(메인) 앱 셸이 다루는 화면과 도메인 타입. danbi_jj app/features/main/types.ts 이식. */

export type Screen =
  | 'home'
  | 'listening'
  | 'transfer'
  | 'savedaccounts'
  | 'recipient'
  | 'bankselect'
  | 'accountinput'
  | 'ocrprocessing'
  | 'ocrconfirm'
  | 'ocrselect'
  | 'ocrfailure'
  | 'amountinput'
  | 'voiceconfirm'
  | 'pretransfer'
  | 'password'
  | 'transferdone'
  | 'result'
  | 'transactions'
  | 'unconfirmed'
  | 'savings'
  | 'savingsdetail'
  | 'depositdetail'
  | 'financialIndependence';

export type ListeningPhase = 'idle' | 'heard' | 'confirmed';
export type ListenTarget = 'balance' | 'transfer';

export interface TxInfo {
  recipient: string;
  bank: string;
  account: string;
  amount: string;
}

export interface SavedRecipient {
  savedRecipientId: number;
  recipientBankCode: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientName: string;
  nickname: string | null;
}

export interface RecentRecipientCandidate extends Omit<
  SavedRecipient,
  'savedRecipientId' | 'nickname'
> {
  recentTransferCount: number;
  lastTransferredAt: string;
}

export type TransactionReviewStatus = 'pending' | 'known' | 'unknown';

export interface TxRecord {
  id: number;
  /** 어느 통장의 거래인지. 없으면 기본 통장(생활비 통장)으로 본다. */
  accountId?: number;
  occurredAt: string; // ISO 8601, 월 필터/정렬 기준
  date: string; // "8월 29일"
  time: string; // "오후 2:10"
  type: string; // 결제수단. "체크카드" | "이체" | "입금"
  name: string;
  amount: number; // negative = outgoing
  merchant: string; // 사용처
  category: string;
  memo: string;
  reviewStatus: TransactionReviewStatus;
}
