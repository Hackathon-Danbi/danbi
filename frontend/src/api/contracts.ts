export type DailyMissionType = 'TRANSFER';

export interface TodayDailyActivity {
  dailyActivityId: number;
  activityDate: string;
  question: {
    questionId: number;
    questionText: string;
    selectedAnswer: boolean | null;
  };
  mission: {
    missionId: number;
    missionType: DailyMissionType;
    title: string;
    description: string;
    scoreReward: number;
  };
  practiceCompleted: boolean;
  earnedScore: number;
}

export interface QuizAnswerResult {
  questionId: number;
  selectedAnswer: boolean;
  correct: boolean;
  correctAnswer: boolean;
  explanation: string;
  earnedScore: number;
}

export interface PracticeCompletionResult {
  dailyActivityId: number;
  missionId: number;
  practiceCompleted: boolean;
  earnedScore: number;
}

export interface PracticeMission {
  missionId: number;
  missionType: 'TRANSFER';
  title: string;
  description: string;
  scoreReward: number;
}

export type PracticeMode = 'GUIDED' | 'SOLO';
export type PracticeInputType = 'VOICE' | 'DIRECT';

export interface PracticeSession {
  sessionId: string;
  mission: PracticeMission;
  mode: PracticeMode;
  inputType: PracticeInputType;
}

export interface PracticeAccount {
  accountId: number;
  recipientName: string;
  bankCode: string;
  accountNumber: string;
}

export interface PracticeVoiceRecognition {
  recognizedText: string;
  recipientName: string;
  amount: number;
  matchesMission: boolean;
}

export interface PracticeTransferResult {
  practiceCompleted: boolean;
  earnedScore: number;
  actualTransferCreated: false;
}

export interface PracticeSessionResult extends PracticeTransferResult {
  steps: ('RECIPIENT' | 'AMOUNT' | 'CONFIRM' | 'PASSWORD')[];
}

export type SavingsProductType = 'TIME_DEPOSIT' | 'FIXED_SAVINGS' | 'FREE_SAVINGS';
export type SavingsPaymentStatus = 'PAID' | 'SCHEDULED' | 'UNPAID';

export interface SavingsMonthlyPayment {
  paymentDate: string;
  scheduledAmount: number;
  amount: number;
  status: SavingsPaymentStatus;
}

export interface SavingsProductSummary {
  accountId: number;
  productName: string;
  productType: SavingsProductType;
  balance: number;
  appliedInterestRate: number;
  maturityAt: string;
  remainingMonths: number;
  currentMonthPayment: SavingsMonthlyPayment | null;
}

export interface SavingsDepositDetail {
  accountId: number;
  contractId: number;
  productName: string;
  productType: 'TIME_DEPOSIT';
  balance: number;
  appliedInterestRate: number;
  expectedMaturityAmount: number;
  openedAt: string;
  maturityAt: string;
  additionalPaymentAllowed: boolean;
}

export interface SavingsInstallmentDetail {
  accountId: number;
  contractId: number;
  productName: string;
  productType: 'FIXED_SAVINGS' | 'FREE_SAVINGS';
  balance: number;
  appliedInterestRate: number;
  expectedMaturityAmount: number;
  maturityAt: string;
  currentMonthPayment: SavingsMonthlyPayment | null;
}

export interface VoiceRecognitionResult {
  queryText: string;
  confidence: number;
}

export interface VoiceQueryResult {
  answerText: string;
  audioUrl: string | null;
  relatedAccountId: number | null;
}

export interface UnreadVoiceSummary {
  unreadCount: number;
  accounts: {
    accountId: number;
    accountName: string;
    unreadCount: number;
  }[];
  summaryText: string;
  audioUrl: string | null;
}

export interface SavingsVoiceAnswer {
  answerText: string;
  audioUrl: string | null;
  accountId: number;
}

export interface RecordedAudio {
  uri: string;
  name: string;
  mimeType: string;
}
