export type AccountNumberCandidate = {
  digits: string;
  display: string;
};

const MIN_ACCOUNT_DIGITS = 10;
const MAX_ACCOUNT_DIGITS = 16;
const MOBILE_PHONE = /^01[016789][ -]?\d{3,4}[ -]?\d{4}$/;
const NUMBER_PATTERNS = [
  /(?<!\d)\d{2,6}(?:[ \t]*-[ \t]*\d{2,6})+(?!\d)/g,
  /(?<!\d)\d{10,16}(?!\d)/g,
  /(?<!\d)\d{2,6}(?:[ \t]+\d{2,6})+(?!\d)/g,
];

/**
 * OCR 결과에는 전화번호·날짜 등도 섞일 수 있으므로, 계좌번호로 보기 충분한
 * 길이와 구분자만 허용한다. OCR 라이브러리가 신뢰도 점수를 제공하지 않기 때문에
 * 이 보수적인 필터를 통과하지 못한 값은 후보로 노출하지 않는다.
 */
export function extractAccountNumberCandidates(texts: readonly string[]): AccountNumberCandidate[] {
  const candidates = new Map<string, AccountNumberCandidate>();

  for (const text of texts) {
    for (const line of text.split(/\r?\n/)) {
      for (const pattern of NUMBER_PATTERNS) {
        for (const match of line.matchAll(pattern)) {
          const raw = match[0].trim();
          const digits = raw.replace(/\D/g, '');
          const hasPlausibleLength =
            digits.length >= MIN_ACCOUNT_DIGITS && digits.length <= MAX_ACCOUNT_DIGITS;
          const hasMoreThanOneDigit = new Set(digits).size > 1;

          if (!hasPlausibleLength || !hasMoreThanOneDigit || MOBILE_PHONE.test(raw)) continue;

          const display = /[ -]/.test(raw) ? raw.replace(/[ \t-]+/g, '-') : digits;
          if (!candidates.has(digits)) candidates.set(digits, { digits, display });
        }
      }
    }
  }

  return [...candidates.values()];
}
