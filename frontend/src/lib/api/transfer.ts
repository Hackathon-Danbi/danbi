import type { SavedRecipient } from '@/features/main/types';

import { apiJson } from './http';
import { bankNameOf, digitsOnly } from './map';

export type TransferMethod = 'VOICE' | 'MANUAL';

export type RemoteBank = { code: string; name: string };

export type AccountHolderResponse = {
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  registered: boolean;
};

/** 백엔드 RiskReason enum 과 1:1. 알 수 없는 값은 무시한다. */
export type RiskReasonCode =
  | 'AMOUNT_INVALID'
  | 'ACCOUNT_NUMBER_INVALID'
  | 'AMOUNT_EXCEEDS_BALANCE'
  | 'NEW_RECIPIENT'
  | 'HIGH_AMOUNT'
  | 'REPEATED_TRANSFER'
  | 'IN_CALL'
  | 'RUSHED'
  | 'PHISHING_KEYWORD_DETECTED';

export type RiskCheckResponse = {
  risky: boolean;
  blocked: boolean;
  requiresSafetyCheck: boolean;
  recipientIsNew: boolean;
  reasons?: RiskReasonCode[];
};

export type TransferExecuteInput = {
  accountId: number;
  savedRecipientId?: number;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  amount: number;
  transferMethod: TransferMethod;
  accountPassword: string;
  riskAcknowledged: boolean;
  flowSessionId: string;
};

export type RemoteSavedRecipient = {
  savedRecipientId: number | null;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  nickname: string | null;
  source?: string;
};

export function listTransferBanks() {
  return apiJson<RemoteBank[]>('/api/transfer/banks');
}

export function lookupAccountHolder(bankCode: string, accountNumber: string) {
  return apiJson<AccountHolderResponse>('/api/transfer/account-holder', {
    method: 'POST',
    body: JSON.stringify({ bankCode, accountNumber: digitsOnly(accountNumber) }),
  });
}

export function riskCheckTransfer(params: {
  accountId: number;
  amount: number;
  recipientAccountNumber: string;
  isNewAccount: boolean;
}) {
  const query = new URLSearchParams({
    accountId: String(params.accountId),
    amount: String(params.amount),
    recipientAccountNumber: digitsOnly(params.recipientAccountNumber),
    isNewAccount: String(params.isNewAccount),
    isInCall: 'false',
    requestedByCaller: 'false',
    phishingKeywordDetected: 'false',
  });
  return apiJson<RiskCheckResponse>(`/api/transfer/risk-check?${query.toString()}`);
}

export function executeTransfer(input: TransferExecuteInput) {
  return apiJson('/api/transfer/execute', {
    method: 'POST',
    body: JSON.stringify({
      accountId: input.accountId,
      savedRecipientId: input.savedRecipientId && input.savedRecipientId > 0 ? input.savedRecipientId : null,
      recipientBankCode: input.recipientBankCode,
      recipientAccountNumber: digitsOnly(input.recipientAccountNumber),
      recipientName: input.recipientName,
      amount: input.amount,
      transferMethod: input.transferMethod,
      accountPassword: input.accountPassword,
      riskAcknowledged: input.riskAcknowledged,
      isInCall: false,
      requestedByCaller: false,
      phishingKeywordDetected: false,
      flowSessionId: input.flowSessionId,
    }),
  });
}

const safetyEventBody = (
  userId: number,
  flowSessionId: string,
  eventType: 'RISK_DETECTED' | 'HELP_RESPONSE',
  userResponse?: 'SAFETY_CONFIRMED' | 'TRANSFER_PAUSED',
) => ({
  userId,
  flowSessionId,
  flowType: 'REAL_TRANSFER',
  screenCode: 'SAFETY_CHECK',
  eventType,
  reasonCode: eventType === 'RISK_DETECTED' ? 'NEW_RECIPIENT' : null,
  eventValue: null,
  transferId: null,
  helpStage: eventType === 'HELP_RESPONSE' ? 'SAFETY_CHECK' : null,
  userResponse: userResponse ?? null,
});

/** 서버가 동일 송금 세션에 SAFETY_CHECK 노출 기록을 남기도록 위험 감지와 trigger를 연속 호출한다. */
export async function beginTransferSafetyCheck(userId: number, flowSessionId: string) {
  await apiJson('/api/help/behavior-events', {
    method: 'POST',
    body: JSON.stringify(safetyEventBody(userId, flowSessionId, 'RISK_DETECTED')),
  });
  return apiJson('/api/help/trigger', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      flowSessionId,
      flowType: 'REAL_TRANSFER',
      screenCode: 'SAFETY_CHECK',
      signal: 'LONG_STAY',
    }),
  });
}

export function finishTransferSafetyCheck(
  userId: number,
  flowSessionId: string,
  response: 'SAFETY_CONFIRMED' | 'TRANSFER_PAUSED',
) {
  return apiJson('/api/help/behavior-events', {
    method: 'POST',
    body: JSON.stringify(safetyEventBody(userId, flowSessionId, 'HELP_RESPONSE', response)),
  });
}

export function listSavedRecipients(userId: number) {
  const query = new URLSearchParams({ userId: String(userId) });
  return apiJson<RemoteSavedRecipient[]>(`/api/saved-recipients?${query.toString()}`);
}

export function addSavedRecipient(input: {
  userId: number;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  nickname?: string | null;
}) {
  return apiJson<RemoteSavedRecipient>('/api/saved-recipients', {
    method: 'POST',
    body: JSON.stringify({
      userId: input.userId,
      recipientBankCode: input.recipientBankCode,
      recipientAccountNumber: digitsOnly(input.recipientAccountNumber),
      recipientName: input.recipientName,
      nickname: input.nickname ?? null,
    }),
  });
}

export function mapSavedRecipient(row: RemoteSavedRecipient, fallbackId: number): SavedRecipient {
  return {
    savedRecipientId: row.savedRecipientId && row.savedRecipientId > 0 ? row.savedRecipientId : fallbackId,
    recipientBankCode: row.recipientBankCode,
    recipientBankName: bankNameOf(row.recipientBankCode),
    recipientAccountNumber: row.recipientAccountNumber,
    recipientName: row.recipientName,
    nickname: row.nickname,
  };
}
