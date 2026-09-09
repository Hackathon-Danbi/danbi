import type { MissionId } from '../missions/data/missions';
import type { PracticeInitialState } from './types';
import { practiceMission } from './data/mission.mock';

export const SOLO_MANUAL_RETRY_PRESET: PracticeInitialState = {
  screen: 'practiceMethod',
  practiceStyle: 'solo',
  transferMethod: 'manual',
};

/** 각 점수 미션이 요구하는 실제 연습 경로. 선택 화면을 건너뛰어 다른 방식 완료를 막는다. */
export const MISSION_PRACTICE_PRESETS: Partial<Record<MissionId, PracticeInitialState>> = {
  'guided-transfer': {
    screen: 'practiceMethod',
    practiceStyle: 'guided',
    // "차근차근 따라하기"는 단계별 안내 + 직접 입력을 기본으로 한다. (말로 송금은 voice-transfer)
    transferMethod: 'manual',
  },
  'voice-transfer': {
    screen: 'practiceVoice',
    practiceStyle: 'solo',
    transferMethod: 'voice',
  },
  'solo-transfer': {
    screen: 'practiceRecipient',
    practiceStyle: 'solo',
    transferMethod: 'manual',
  },
  'review-transfer': {
    screen: 'practiceReview',
    practiceStyle: 'solo',
    transferMethod: 'manual',
    practiceRecipient: practiceMission.recipient.account,
    practiceRecipientChoice: practiceMission.recipient.id,
    practiceVoiceRecipientName: practiceMission.recipient.name,
    practiceAmount: practiceMission.amount,
  },
};
