import type { RecentRecipientCandidate, SavedRecipient } from './types';

export type SaveRecipientInput = Pick<
  SavedRecipient,
  | 'recipientBankCode'
  | 'recipientBankName'
  | 'recipientAccountNumber'
  | 'recipientName'
  | 'nickname'
>;

const accountKey = (bankCode: string, accountNumber: string) =>
  `${bankCode}:${accountNumber.replace(/\D/g, '')}`;

export function recipientDisplayName(recipient: SavedRecipient): string {
  return recipient.nickname?.trim() || recipient.recipientName;
}

export function sanitizeSavedRecipients(value: unknown): SavedRecipient[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.reduce<SavedRecipient[]>((recipients, item) => {
    if (!item || typeof item !== 'object') return recipients;
    const candidate = item as Partial<SavedRecipient>;
    if (
      typeof candidate.savedRecipientId !== 'number' ||
      !Number.isFinite(candidate.savedRecipientId) ||
      typeof candidate.recipientBankCode !== 'string' ||
      typeof candidate.recipientBankName !== 'string' ||
      typeof candidate.recipientAccountNumber !== 'string' ||
      typeof candidate.recipientName !== 'string' ||
      (candidate.nickname !== null && typeof candidate.nickname !== 'string')
    ) return recipients;

    const key = accountKey(candidate.recipientBankCode, candidate.recipientAccountNumber);
    if (!candidate.recipientAccountNumber.replace(/\D/g, '') || seen.has(key)) return recipients;
    seen.add(key);
    recipients.push({
      savedRecipientId: candidate.savedRecipientId,
      recipientBankCode: candidate.recipientBankCode,
      recipientBankName: candidate.recipientBankName,
      recipientAccountNumber: candidate.recipientAccountNumber,
      recipientName: candidate.recipientName,
      nickname: candidate.nickname?.trim() || null,
    });
    return recipients;
  }, []);
}

export function parseSavedRecipients(raw: string): SavedRecipient[] {
  return sanitizeSavedRecipients(JSON.parse(raw));
}

export function saveRecipient(
  recipients: readonly SavedRecipient[],
  input: SaveRecipientInput,
): SavedRecipient[] {
  const key = accountKey(input.recipientBankCode, input.recipientAccountNumber);
  const existing = recipients.find(
    (recipient) => accountKey(recipient.recipientBankCode, recipient.recipientAccountNumber) === key,
  );
  if (existing) {
    return recipients.map((recipient) =>
      recipient.savedRecipientId === existing.savedRecipientId
        ? { ...recipient, ...input, savedRecipientId: existing.savedRecipientId }
        : recipient,
    );
  }

  const nextId = Math.max(0, ...recipients.map((recipient) => recipient.savedRecipientId)) + 1;
  return [...recipients, { ...input, savedRecipientId: nextId }];
}

export function updateRecipientNickname(
  recipients: readonly SavedRecipient[],
  savedRecipientId: number,
  nickname: string,
): SavedRecipient[] {
  return recipients.map((recipient) =>
    recipient.savedRecipientId === savedRecipientId
      ? { ...recipient, nickname: nickname.trim() || null }
      : recipient,
  );
}

export function filterUnsavedRecentRecipients(
  recipients: readonly SavedRecipient[],
  candidates: readonly RecentRecipientCandidate[],
): RecentRecipientCandidate[] {
  const savedKeys = new Set(
    recipients.map((recipient) =>
      accountKey(recipient.recipientBankCode, recipient.recipientAccountNumber),
    ),
  );
  return candidates.filter(
    (candidate) =>
      !savedKeys.has(accountKey(candidate.recipientBankCode, candidate.recipientAccountNumber)),
  );
}

export function findRecipientBySpokenName(
  recipients: readonly SavedRecipient[],
  spokenName: string,
): SavedRecipient | undefined {
  const normalized = spokenName.replace(/님$/, '');
  return recipients.find((recipient) => {
    const nameMatches = recipient.recipientName === normalized
      || recipient.recipientName.slice(1) === normalized;
    return nameMatches || recipient.nickname?.trim() === normalized;
  });
}
