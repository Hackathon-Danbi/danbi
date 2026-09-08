/** Figma Make 연습모드에서 필요한 타입만 분리. */
export type PracticeStyle = 'guided' | 'solo' | null;
export type TransferMethod = 'voice' | 'manual';
export type SavedRecipientId = 'minsu' | 'younghee';
export type RecipientChoice = SavedRecipientId | 'new' | null;

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
}
