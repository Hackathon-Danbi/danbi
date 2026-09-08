import type { Screen } from './types';

/**
 * 선제적 도움(proactive help) 상태 머신의 타입과 화면별 안내 문구.
 * danbi_jj app/features/main/proactiveHelp.ts 이식 (정적 정의만; 타이머·전환 로직은 TransferFlow).
 */
export type HelpStep = 'idle' | 'highlight' | 'voice' | 'counselor';
export type HelpReason =
  | 'inactivity'
  | 'inputError'
  | 'wrongClick'
  | 'voiceFailure'
  | 'repeatedReentry'
  | null;

export interface HelpState {
  step: HelpStep;
  reason: HelpReason;
  target: string; // element to pulse-highlight
  hint: string; // non-blocking hint text (highlight step)
  voiceText: string; // guidance text in voice step
}

export const HELP_IDLE: HelpState = { step: 'idle', reason: null, target: '', hint: '', voiceText: '' };

export const TRANSFER_SCREENS: Screen[] = [
  'recipient',
  'bankselect',
  'accountinput',
  'amountinput',
  'pretransfer',
];

export const SCREEN_HELP: Partial<Record<Screen, { target: string; hint: string; voiceText: string }>> = {
  recipient: {
    target: 'contactList',
    hint: '받을 사람을 선택해주세요.',
    voiceText: '화면에서 받을 사람 이름을 눌러주세요.',
  },
  bankselect: {
    target: 'bankGrid',
    hint: '은행을 선택해주세요.',
    voiceText: '은행 이름 버튼을 눌러주세요.',
  },
  accountinput: {
    target: 'accountField',
    hint: '여기에 계좌번호를 입력해주세요.',
    voiceText: '계좌번호를 숫자로 차례대로 눌러보세요.',
  },
  amountinput: {
    target: 'amountField',
    hint: '보낼 금액을 입력해주세요.',
    voiceText: '보낼 금액을 숫자로 눌러주세요.\n예: 3만원이면 30000',
  },
  pretransfer: {
    target: 'txCard',
    hint: '받는 분과 금액이 맞는지 먼저 확인해주세요.',
    voiceText: '받는 분과 금액을 확인하신 뒤\n"송금하기" 버튼을 눌러주세요.',
  },
};

export const REENTRY_HINTS: Partial<Record<Screen, string>> = {
  recipient: '받을 사람 선택이 어려우신가요?',
  bankselect: '은행 선택이 어려우신가요?',
  accountinput: '계좌번호 입력이 어려우신가요?',
  amountinput: '금액 입력이 어려우신가요?',
  pretransfer: '송금 진행이 어려우신가요?',
};

export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();
  return day >= 1 && day <= 5 && h >= 9 && h < 18;
}
