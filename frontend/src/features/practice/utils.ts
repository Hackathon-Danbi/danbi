import type { RecipientChoice } from './types';

export const ACCOUNT_NUMBER_MAX_DIGITS = 16;
export const AMOUNT_MAX_DIGITS = 10;
export const NEW_RECIPIENT_MIN_DIGITS = 8;

export type PracticeReviewError = 'recipient' | 'amount' | 'both' | null;

export function appendDigits(
  current: string,
  input: string,
  options: { maxLength: number; trimLeadingZeros?: boolean },
) {
  const onlyDigits = input.replace(/\D/g, '');
  let next = `${current}${onlyDigits}`.slice(0, options.maxLength);
  if (options.trimLeadingZeros) next = next.replace(/^0+(?=\d)/, '');
  return next;
}

export function removeLastDigit(value: string) {
  return value.slice(0, -1);
}

export function isValidPracticeRecipient(choice: RecipientChoice, accountNumber = '') {
  if (!choice) return false;
  if (choice !== 'new') return true;

  return (
    /^\d+$/.test(accountNumber) &&
    accountNumber.length >= NEW_RECIPIENT_MIN_DIGITS &&
    accountNumber.length <= ACCOUNT_NUMBER_MAX_DIGITS
  );
}

export function isValidPracticeAmount(value: string) {
  return /^\d+$/.test(value) && value.length <= AMOUNT_MAX_DIGITS && Number(value) > 0;
}

export function getPracticeReviewError({
  guided,
  recipientMatches,
  amountMatches,
}: {
  guided: boolean;
  recipientMatches: boolean;
  amountMatches: boolean;
}): PracticeReviewError {
  if (!guided) return null;
  if (!recipientMatches && !amountMatches) return 'both';
  if (!recipientMatches) return 'recipient';
  if (!amountMatches) return 'amount';
  return null;
}

export function formatWon(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return numeric.toLocaleString('ko-KR');
}

export function formatAccountNumber(value: string) {
  if (!value) return '계좌번호를 입력해주세요';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
}
