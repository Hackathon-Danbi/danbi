import { savedRecipients } from './data/recipients.mock';
import type { SavedRecipient } from './types';

export type VoiceTransferIssue =
  | 'none'
  | 'missing-recipient'
  | 'missing-amount'
  | 'missing-both'
  | 'unknown-recipient';

export interface ParsedVoiceTransfer {
  transcript: string;
  recipientName: string;
  recipient: SavedRecipient | null;
  amount: string;
  issue: VoiceTransferIssue;
}

const koreanDigits: Record<string, number> = {
  영: 0,
  공: 0,
  일: 1,
  한: 1,
  이: 2,
  삼: 3,
  사: 4,
  오: 5,
  육: 6,
  칠: 7,
  팔: 8,
  구: 9,
};

/** 음성에서 자주 나오는 1~99 범위의 한글 숫자를 숫자로 바꾼다. */
function parseKoreanUnderHundred(value: string): number | null {
  if (!value) return 1;
  if (/^\d+$/.test(value)) return Number(value);

  const tenIndex = value.indexOf('십');
  if (tenIndex >= 0) {
    const tensText = value.slice(0, tenIndex);
    const onesText = value.slice(tenIndex + 1);
    const tens = tensText ? koreanDigits[tensText] : 1;
    const ones = onesText ? koreanDigits[onesText] : 0;
    return tens === undefined || ones === undefined ? null : (tens * 10) + ones;
  }

  return koreanDigits[value] ?? null;
}

export function parseSpokenAmount(transcript: string): number | null {
  const compact = transcript.replace(/[\s,]/g, '');
  const manWon = compact.match(/(\d+|[영공일한이삼사오육칠팔구십]+)?만원/);
  if (manWon) {
    const units = parseKoreanUnderHundred(manWon[1] ?? '');
    return units && units > 0 ? units * 10_000 : null;
  }

  const plainWon = compact.match(/(\d+)원/);
  return plainWon ? Number(plainWon[1]) : null;
}

function findSavedRecipient(spokenName: string): SavedRecipient | null {
  const normalized = spokenName.replace(/님$/, '');
  return savedRecipients.find((recipient) => (
    recipient.name === normalized || recipient.name.slice(1) === normalized
  )) ?? null;
}

/**
 * STT 결과와 예시 클릭이 함께 사용하는 단일 송금 문장 파서.
 * 찾지 못한 값은 비워 두며 임의 수취인이나 금액을 채우지 않는다.
 */
export function parseVoiceTransfer(transcript: string): ParsedVoiceTransfer {
  const heard = transcript.trim();
  const compact = heard.replace(/\s/g, '');
  const spokenName = compact.match(/^(.+?)(?:님)?(?:에게|한테)/)?.[1]?.replace(/님$/, '') ?? '';
  const amount = parseSpokenAmount(heard);
  const recipient = spokenName ? findSavedRecipient(spokenName) : null;

  let issue: VoiceTransferIssue = 'none';
  if (!spokenName && !amount) issue = 'missing-both';
  else if (!spokenName) issue = 'missing-recipient';
  else if (!amount) issue = 'missing-amount';
  else if (!recipient) issue = 'unknown-recipient';

  return {
    transcript: heard,
    recipientName: recipient?.name ?? spokenName,
    recipient,
    amount: amount ? String(amount) : '',
    issue,
  };
}

export function voiceTransferIssueMessage(result: ParsedVoiceTransfer): string {
  if (result.issue === 'missing-recipient') return '받는 사람을 잘 듣지 못했어요.';
  if (result.issue === 'missing-amount') return '보낼 금액을 잘 듣지 못했어요.';
  if (result.issue === 'unknown-recipient') {
    return `저장된 계좌에서 ${result.recipientName}님을 찾지 못했어요.`;
  }
  if (result.issue === 'missing-both') return '잘 듣지 못했어요. 다시 한번 말씀해주세요.';
  return '';
}
