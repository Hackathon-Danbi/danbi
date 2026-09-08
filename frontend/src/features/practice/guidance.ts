import { practiceMission } from './data/mission.mock';
import type { PracticeScreen, PracticeStyle } from './types';
import { PRACTICE_VOICE_EXAMPLES } from './voiceTransfer';

const GUIDED_STEP_GUIDANCE: Partial<Record<PracticeScreen, string>> = {
  practiceMethod: '음성 또는 직접 입력 중 연습할 방법을 선택해주세요.',
  practiceVoice: `“${PRACTICE_VOICE_EXAMPLES[0]}”라고 말해보세요. 안내가 끝나면 마이크를 눌러주세요.`,
  practiceRecipient: `받는 사람에서 ${practiceMission.recipient.name}님을 선택해주세요.`,
  practiceAmount: `보낼 금액 ${practiceMission.amountLabel}을 입력해주세요.`,
  practiceReview: '받는 사람과 금액을 확인한 뒤 확인을 눌러주세요.',
  practicePin: '실제 비밀번호 대신 연습용 비밀번호 네 자리를 입력해주세요.',
};

/** 단계별 따라하기에서만 한 화면당 하나의 자동 안내를 제공한다. */
export function getPracticeStepGuidance(
  style: PracticeStyle,
  screen: PracticeScreen,
): string | null {
  if (style !== 'guided') return null;
  return GUIDED_STEP_GUIDANCE[screen] ?? null;
}
