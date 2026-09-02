import { savedRecipients } from './recipients.mock';

/** 연습 모드 고정 미션: 김민수님에게 3만원 보내기 */
export const practiceMission = {
  recipient: savedRecipients[0],
  amount: '30000',
  amountLabel: '30,000원',
} as const;
