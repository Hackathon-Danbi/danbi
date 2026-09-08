import { savedRecipients } from './data/recipients.mock';
import type { RecipientChoice, SavedRecipient, SavedRecipientId } from './types';

export type VoiceRecipient = Omit<SavedRecipient, 'id' | 'initials'> & {
  id: string;
  initials?: string;
};

export type VoiceTransferIssue =
  | 'none'
  | 'missing-recipient'
  | 'missing-amount'
  | 'missing-both'
  | 'unknown-recipient';

export interface ParsedVoiceTransfer {
  transcript: string;
  recipientName: string;
  recipient: VoiceRecipient | null;
  amount: string;
  issue: VoiceTransferIssue;
}

export interface VoicePracticeStatePatch {
  recipientChoice?: RecipientChoice;
  recipientAccount?: string;
  recipientName?: string;
  amount?: string;
}

export const PRACTICE_VOICE_EXAMPLES = [
  '민수에게 3만원 보내줘',
  '이영희에게 3만원 송금해줘',
  '민수에게 만원 보내줘',
] as const;

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
  const compoundWon = compact.match(
    /(\d+|[영공일한이삼사오육칠팔구십]+)?만(\d+|[영공일한이삼사오육칠팔구십]+)?천원/,
  );
  if (compoundWon) {
    const tenThousands = parseKoreanUnderHundred(compoundWon[1] ?? '');
    const thousands = parseKoreanUnderHundred(compoundWon[2] ?? '');
    return tenThousands && thousands
      ? (tenThousands * 10_000) + (thousands * 1_000)
      : null;
  }

  const manWon = compact.match(/(\d+|[영공일한이삼사오육칠팔구십]+)?만원/);
  if (manWon) {
    const units = parseKoreanUnderHundred(manWon[1] ?? '');
    return units && units > 0 ? units * 10_000 : null;
  }

  const thousandWon = compact.match(/(\d+|[영공일한이삼사오육칠팔구십]+)?천원/);
  if (thousandWon) {
    const units = parseKoreanUnderHundred(thousandWon[1] ?? '');
    return units && units > 0 ? units * 1_000 : null;
  }

  const plainWon = compact.match(/(\d+)원/);
  return plainWon ? Number(plainWon[1]) : null;
}

function findRecipient(
  spokenName: string,
  recipients: readonly VoiceRecipient[],
): VoiceRecipient | null {
  const normalized = spokenName.replace(/님$/, '');
  return recipients.find((recipient) => (
    recipient.name === normalized || recipient.name.slice(1) === normalized
  )) ?? null;
}

/**
 * STT 결과와 예시 클릭이 함께 사용하는 단일 송금 문장 파서.
 * 찾지 못한 값은 비워 두며 임의 수취인이나 금액을 채우지 않는다.
 */
export function parseVoiceTransfer(
  transcript: string,
  additionalRecipients: readonly VoiceRecipient[] = [],
): ParsedVoiceTransfer {
  const heard = transcript.trim();
  const compact = heard.replace(/\s/g, '');
  const spokenName = compact.match(/^(.+?)(?:님)?(?:에게|한테)/)?.[1]?.replace(/님$/, '') ?? '';
  const amount = parseSpokenAmount(heard);
  const recipient = spokenName
    ? findRecipient(spokenName, [...savedRecipients, ...additionalRecipients])
    : null;

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
  if (result.issue === 'missing-recipient') return '누구에게 보내실지 말씀해주세요.';
  if (result.issue === 'missing-amount') return '얼마를 보내실지 말씀해주세요.';
  if (result.issue === 'unknown-recipient') {
    return `저장된 받는 사람에서 ${result.recipientName}님을 찾지 못했어요.`;
  }
  if (result.issue === 'missing-both') {
    return '말씀을 정확히 이해하지 못했어요. 다시 천천히 말씀해주세요.';
  }
  return '';
}

export function isCompleteVoiceTransfer(result: ParsedVoiceTransfer): boolean {
  return result.issue === 'none' && !!result.recipient && !!result.amount;
}

/** 인식에 성공한 값만 기존 practice state에 합칠 수 있도록 만든다. */
export function createVoicePracticeStatePatch(
  result: ParsedVoiceTransfer,
): VoicePracticeStatePatch {
  return {
    ...(result.recipient
      ? {
          recipientChoice: (
            result.recipient.id === 'minsu' || result.recipient.id === 'younghee'
              ? result.recipient.id as SavedRecipientId
              : 'new'
          ),
          recipientAccount: result.recipient.account,
          recipientName: result.recipient.name,
        }
      : {}),
    ...(result.amount ? { amount: result.amount } : {}),
  };
}
