import type { MissionId } from '../missions/data/missions';
import type { PracticeInitialState } from './types';
import { practiceMission } from './data/mission.mock';

/** 각 점수 미션이 요구하는 실제 연습 경로. 선택 화면을 건너뛰어 다른 방식 완료를 막는다. */
export const MISSION_PRACTICE_PRESETS: Partial<Record<MissionId, PracticeInitialState>> = {
  'guided-transfer': {
    screen: 'practiceMethod',
    practiceStyle: 'guided',
    transferMethod: 'voice',
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
