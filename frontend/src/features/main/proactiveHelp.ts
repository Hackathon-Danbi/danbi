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
  'transfer',
  'listening',
  'voiceconfirm',
  'recipient',
  'bankselect',
  'accountinput',
  'ocrconfirm',
  'ocrselect',
  'ocrfailure',
  'amountinput',
  'pretransfer',
  'password',
];

export const SCREEN_HELP: Partial<Record<Screen, { target: string; hint: string; voiceText: string }>> = {
  transfer: {
    target: 'micButton',
    hint: '마이크를 누르고 말씀해주세요.',
    voiceText: '노란 마이크를 누른 뒤, 누구에게 얼마를 보낼지 말씀해주세요.',
  },
  listening: {
    target: 'listenExamples',
    hint: '예시처럼 짧게 말씀해주세요.',
    voiceText: '예를 들어, 엄마에게 십만원 보내줘, 처럼 말씀해주세요. 잘 안 들리면 직접 입력할 수 있어요.',
  },
  voiceconfirm: {
    target: 'confirmBtn',
    hint: '받는 분과 금액이 맞는지 확인해주세요.',
    voiceText: '받는 분과 금액을 확인한 뒤, 맞으면 송금하기를 눌러주세요.',
  },
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
  ocrconfirm: {
    target: 'ocrConfirm',
    hint: '찾은 계좌번호가 맞는지 확인해주세요.',
    voiceText: '사진에서 찾은 계좌번호가 맞으면 네, 맞아요를 눌러주세요.',
  },
  ocrselect: {
    target: 'ocrList',
    hint: '보내려는 계좌번호를 선택해주세요.',
    voiceText: '여러 개를 찾았어요. 보내려는 계좌번호 하나를 눌러주세요.',
  },
  ocrfailure: {
    target: 'ocrManual',
    hint: '직접 입력하거나 사진을 다시 골라주세요.',
    voiceText: '계좌번호를 찾지 못했어요. 직접 입력하거나 다른 사진을 골라주세요.',
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
  password: {
    target: 'pinKeypad',
    hint: '숫자 4자리를 눌러주세요.',
    voiceText: '아래 숫자 버튼을 눌러 계좌 비밀번호 네 자리를 입력해주세요.',
  },
};

export const REENTRY_HINTS: Partial<Record<Screen, string>> = {
  transfer: '말로 송금하는 방법이 어려우신가요?',
  listening: '음성 송금이 어려우신가요?',
  voiceconfirm: '인식한 내용 확인이 어려우신가요?',
  recipient: '받을 사람 선택이 어려우신가요?',
  bankselect: '은행 선택이 어려우신가요?',
  accountinput: '계좌번호 입력이 어려우신가요?',
  ocrconfirm: '찾은 계좌번호 확인이 어려우신가요?',
  ocrselect: '계좌번호 선택이 어려우신가요?',
  ocrfailure: '사진에서 찾기가 어려우신가요?',
  amountinput: '금액 입력이 어려우신가요?',
  pretransfer: '송금 진행이 어려우신가요?',
  password: '비밀번호 입력이 어려우신가요?',
};

export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();
  return day >= 1 && day <= 5 && h >= 9 && h < 18;
}
