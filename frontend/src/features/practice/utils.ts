export const ACCOUNT_NUMBER_MAX_DIGITS = 16;
export const AMOUNT_MAX_DIGITS = 10;

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
