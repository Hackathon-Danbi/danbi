/** 실제 금융(메인) 앱 셸이 다루는 화면과 도메인 타입. danbi_jj app/features/main/types.ts 이식. */

export type Screen =
  | 'home'
  | 'listening'
  | 'transfer'
  | 'savedaccounts'
  | 'recipient'
  | 'bankselect'
  | 'accountinput'
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

export interface TransferDraft {
  accountId: number;
  savedRecipientId: number | null;
  recipientName: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  amount: string;
  transferMethod: 'DIRECT' | 'VOICE';
  isInCall: boolean;
  riskAcknowledged: boolean;
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

export type TransactionReviewStatus = 'UNREAD' | 'KNOWN' | 'UNKNOWN';

export interface TxRecord {
  transactionId: number;
  accountId: number;
  occurredAt: string; // ISO 8601, 월 필터/정렬 기준
  date: string; // "8월 29일"
  time: string; // "오후 2:10"
  transactionType: string; // "체크카드"
  description: string;
  amount: number; // negative = outgoing
  reviewStatus: TransactionReviewStatus;
  reviewedAt: string | null;
}
