/** Figma Make 연습모드에서 필요한 타입만 분리. */
export type PracticeStyle = 'guided' | 'solo' | null;
export type TransferMethod = 'voice' | 'manual';
export type SavedRecipientId = 'minsu' | 'younghee';
export type RecipientChoice = SavedRecipientId | 'new' | null;

export interface PracticeTarget {
  recipient: {
    id: SavedRecipientId | 'new';
    name: string;
    bank: string;
    account: string;
  };
  amount: string;
  amountLabel: string;
}

export interface SavedRecipient {
  id: SavedRecipientId;
  name: string;
  bank: string;
  account: string;
  initials: string;
}

export type PracticeScreen =
  | 'practiceHub'
  | 'practiceMethod'
  | 'practiceVoice'
  | 'practiceRecipient'
  | 'practiceAmount'
  | 'practiceReview'
  | 'practicePin'
  | 'practiceComplete';

export interface Praise {
  text: string;
  next: PracticeScreen;
}

export interface PracticeInitialState {
  screen: PracticeScreen;
  practiceStyle: Exclude<PracticeStyle, null>;
  transferMethod: TransferMethod;
  practiceRecipient?: string;
  practiceRecipientChoice?: RecipientChoice;
  practiceVoiceRecipientName?: string;
  practiceAmount?: string;
  /** 오늘의 미션/위험 상황에서 받은 송금 요청. 없으면 기존 김민수 3만원 미션을 사용한다. */
  target?: PracticeTarget;
}
