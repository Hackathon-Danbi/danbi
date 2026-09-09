import type { ReviewableTransferStep } from '../missions/transferDifficulty';
import { practiceMission } from './data/mission.mock';
import type { PracticeInitialState, PracticeScreen } from './types';

export function screenForReviewStep(step: ReviewableTransferStep): PracticeScreen {
  if (step === 'voice') return 'practiceVoice';
  if (step === 'amount') return 'practiceAmount';
  return 'practiceRecipient';
}

/** 각 단계를 독립적으로 연습할 수 있게 필요한 앞 단계 정보만 채운다. */
export function initialStateForReviewStep(step: ReviewableTransferStep): PracticeInitialState {
  const recipientReady = step === 'amount';
  return {
    screen: 'practiceReviewIntro',
    practiceStyle: 'guided',
    transferMethod: step === 'voice' ? 'voice' : 'manual',
    practiceRecipient: recipientReady ? practiceMission.recipient.account : '',
    practiceRecipientChoice: step === 'account'
      ? 'new'
      : recipientReady
        ? practiceMission.recipient.id
        : null,
    practiceVoiceRecipientName: recipientReady ? practiceMission.recipient.name : '',
    practiceAmount: '',
    target: practiceMission,
  };
}
