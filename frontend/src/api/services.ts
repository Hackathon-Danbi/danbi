import { appendRecordedAudio } from './audio';
import { apiRequest } from './client';
import type {
  PracticeAccount,
  PracticeCompletionResult,
  PracticeInputType,
  PracticeMission,
  PracticeMode,
  PracticeSession,
  PracticeSessionResult,
  PracticeTransferResult,
  PracticeVoiceRecognition,
  QuizAnswerResult,
  RecordedAudio,
  SavingsDepositDetail,
  SavingsInstallmentDetail,
  SavingsProductSummary,
  SavingsVoiceAnswer,
  TodayDailyActivity,
  UnreadVoiceSummary,
  VoiceQueryResult,
  VoiceRecognitionResult,
} from './contracts';
import { API_ENDPOINTS } from './endpoints';

export const financialIndependenceApi = {
  getToday: () => apiRequest<TodayDailyActivity>(API_ENDPOINTS.dailyActivity.today),
  answerQuiz: (dailyActivityId: number, selectedAnswer: boolean) =>
    apiRequest<QuizAnswerResult>(API_ENDPOINTS.dailyActivity.answer(dailyActivityId), {
      method: 'POST',
      body: JSON.stringify({ selectedAnswer }),
    }),
  completePractice: (dailyActivityId: number, missionId: number) =>
    apiRequest<PracticeCompletionResult>(API_ENDPOINTS.dailyActivity.practice(dailyActivityId), {
      method: 'PATCH',
      body: JSON.stringify({ missionId, practiceCompleted: true }),
    }),
};

export const practiceApi = {
  getMissions: async () => (
    await apiRequest<{ missions: PracticeMission[] }>(API_ENDPOINTS.practice.missions)
  ).missions,
  createSession: (missionId: number, mode: PracticeMode, inputType: PracticeInputType) =>
    apiRequest<PracticeSession>(API_ENDPOINTS.practice.sessions, {
      method: 'POST',
      body: JSON.stringify({ mode, inputType, missionId }),
    }),
  getAccounts: async () => (
    await apiRequest<{ accounts: PracticeAccount[] }>(API_ENDPOINTS.practice.accounts)
  ).accounts,
  recognizeVoice: async (sessionId: string, audio: RecordedAudio) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    await appendRecordedAudio(formData, audio);
    return apiRequest<PracticeVoiceRecognition>(API_ENDPOINTS.practice.recognizeVoice, {
      method: 'POST',
      body: formData,
    });
  },
  transfer: (sessionId: string, accountId: number, amount: number, practicePassword: string) =>
    apiRequest<PracticeTransferResult>(API_ENDPOINTS.practice.transfer(sessionId), {
      method: 'POST',
      body: JSON.stringify({ accountId, amount, practicePassword }),
    }),
  getResult: (sessionId: string) =>
    apiRequest<PracticeSessionResult>(API_ENDPOINTS.practice.result(sessionId)),
};

export const savingsApi = {
  getAll: async () => (
    await apiRequest<{ savings: SavingsProductSummary[] }>(API_ENDPOINTS.savings.list)
  ).savings,
  getDeposit: (accountId: number) =>
    apiRequest<SavingsDepositDetail>(API_ENDPOINTS.savings.deposit(accountId)),
  getInstallment: (accountId: number) =>
    apiRequest<SavingsInstallmentDetail>(API_ENDPOINTS.savings.installment(accountId)),
  ask: (productId: number, queryText: string) =>
    apiRequest<SavingsVoiceAnswer>(API_ENDPOINTS.savings.voiceQuery, {
      method: 'POST',
      body: JSON.stringify({ productId, queryText }),
    }),
};

export const voiceApi = {
  recognize: async (audio: RecordedAudio) => {
    const formData = new FormData();
    await appendRecordedAudio(formData, audio);
    return apiRequest<VoiceRecognitionResult>(API_ENDPOINTS.voice.recognize, {
      method: 'POST',
      body: formData,
    });
  },
  query: (queryText: string) =>
    apiRequest<VoiceQueryResult>(API_ENDPOINTS.voice.query, {
      method: 'POST',
      body: JSON.stringify({ queryText }),
    }),
  getUnreadSummary: () => apiRequest<UnreadVoiceSummary>(API_ENDPOINTS.voice.unreadSummary),
};
