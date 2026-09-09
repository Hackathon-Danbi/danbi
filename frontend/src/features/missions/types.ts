import type { MissionId } from './data/missions';

export type AssistanceMode = 'guided' | 'solo';
export type DailyInputMethod = 'voice' | 'manual';
export type DailyRecipientType = 'saved' | 'new';
export type RiskScenarioId =
  | 'prosecutor-scam'
  | 'family-impersonation'
  | 'loan-scam'
  | 'refund-scam';

export type DailyMission = {
  date: string;
  assistanceMode: AssistanceMode;
  inputMethod: DailyInputMethod;
  recipientType: DailyRecipientType;
  recipientId?: 'minsu' | 'younghee';
  amount: number;
  scenarioId: RiskScenarioId | null;
};

export type DailyMissionResult = {
  completed: boolean;
  detectedRisk?: boolean;
  attemptedTransfer?: boolean;
  stoppedTransfer?: boolean;
};

export type DailyMissionRecord = {
  date: string;
  mission: Pick<DailyMission, 'assistanceMode' | 'inputMethod' | 'scenarioId'>;
  result: DailyMissionResult;
};

export type DailyMissionRecords = Record<string, DailyMissionRecord>;
export type ExperiencedScenarios = RiskScenarioId[];

/** 날짜(YYYY-MM-DD)별 완료한 금융 연습 미션. */
export type DailyPracticeRecord = Record<string, MissionId>;

/** 날짜(YYYY-MM-DD)별 오늘의 금융 퀴즈 응답. */
export type QuizAnswerRecord = { qId: number; answeredIndex: number };
export type QuizRecord = Record<string, QuizAnswerRecord>;

/** AsyncStorage에서 복원한 원본 상태. 완료 여부·점수·주간 활동은 이 값에서 계산한다. */
export type FinancialIndependenceState = {
  completedMissionIds: ReadonlySet<MissionId>;
  dailyPracticeRecord: DailyPracticeRecord;
  quizRecord: QuizRecord;
  reviewBonus?: number;
};
