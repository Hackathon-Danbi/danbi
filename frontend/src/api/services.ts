import { appendRecordedAudio } from './audio';
import { ApiError, apiRequest } from './client';
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

/**
 * 200이지만 명세와 형식이 어긋난 응답을 오류로 바꿔, 호출 화면의 폴백(FALLBACK_* / mock)이
 * 받도록 한다. 렌더 도중 undefined 접근으로 크래시하는 것을 막는 마지막 방어선.
 */
function check<T>(value: T, ok: boolean): T {
  if (!ok) throw new ApiError('API 응답 형식이 명세와 다릅니다.', 0);
  return value;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function validTodayActivity(v: unknown): v is TodayDailyActivity {
  return isObj(v) && isNum(v.dailyActivityId)
    && isObj(v.question) && isNum((v.question as Record<string, unknown>).questionId)
    && isStr((v.question as Record<string, unknown>).questionText)
    && isObj(v.mission) && isNum((v.mission as Record<string, unknown>).missionId);
}

function validQuizAnswer(v: unknown): v is QuizAnswerResult {
  return isObj(v) && isBool(v.correctAnswer) && isBool(v.selectedAnswer) && isStr(v.explanation);
}

function validSavingsSummary(v: unknown): v is SavingsProductSummary {
  return isObj(v) && isNum(v.accountId) && isStr(v.productName) && isStr(v.productType) && isNum(v.balance);
}

function validPracticeAccount(v: unknown): v is PracticeAccount {
  return isObj(v) && isNum(v.accountId) && isStr(v.recipientName)
    && isStr(v.bankCode) && isStr(v.accountNumber);
}

export const financialIndependenceApi = {
  getToday: async () => {
    const body = await apiRequest<TodayDailyActivity>(API_ENDPOINTS.dailyActivity.today);
    return check(body, validTodayActivity(body));
  },
  answerQuiz: async (dailyActivityId: number, selectedAnswer: boolean) => {
    const body = await apiRequest<QuizAnswerResult>(
      API_ENDPOINTS.dailyActivity.answer(dailyActivityId),
      { method: 'POST', body: JSON.stringify({ selectedAnswer }) },
    );
    return check(body, validQuizAnswer(body));
  },
  completePractice: async (dailyActivityId: number, missionId: number) => {
    const body = await apiRequest<PracticeCompletionResult>(
      API_ENDPOINTS.dailyActivity.practice(dailyActivityId),
      { method: 'PATCH', body: JSON.stringify({ missionId, practiceCompleted: true }) },
    );
    return check(body, isObj(body) && isBool(body.practiceCompleted));
  },
};

export const practiceApi = {
  getMissions: async () => {
    const body = await apiRequest<{ missions: PracticeMission[] }>(API_ENDPOINTS.practice.missions);
    return check(
      body?.missions ?? [],
      isObj(body) && Array.isArray(body.missions)
        && body.missions.every((m) => isObj(m) && isNum(m.missionId)),
    );
  },
  createSession: async (missionId: number, mode: PracticeMode, inputType: PracticeInputType) => {
    const body = await apiRequest<PracticeSession>(API_ENDPOINTS.practice.sessions, {
      method: 'POST',
      body: JSON.stringify({ mode, inputType, missionId }),
    });
    return check(body, isObj(body) && isStr(body.sessionId));
  },
  getAccounts: async () => {
    const body = await apiRequest<{ accounts: PracticeAccount[] }>(API_ENDPOINTS.practice.accounts);
    return check(
      body?.accounts ?? [],
      isObj(body) && Array.isArray(body.accounts) && body.accounts.every(validPracticeAccount),
    );
  },
  recognizeVoice: async (sessionId: string, audio: RecordedAudio) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    await appendRecordedAudio(formData, audio);
    const body = await apiRequest<PracticeVoiceRecognition>(API_ENDPOINTS.practice.recognizeVoice, {
      method: 'POST',
      body: formData,
    });
    return check(body, isObj(body) && isStr(body.recognizedText));
  },
  transfer: async (sessionId: string, accountId: number, amount: number, practicePassword: string) => {
    const body = await apiRequest<PracticeTransferResult>(API_ENDPOINTS.practice.transfer(sessionId), {
      method: 'POST',
      body: JSON.stringify({ accountId, amount, practicePassword }),
    });
    return check(body, isObj(body) && isBool(body.practiceCompleted));
  },
  getResult: async (sessionId: string) => {
    const body = await apiRequest<PracticeSessionResult>(API_ENDPOINTS.practice.result(sessionId));
    return check(body, isObj(body) && isBool(body.practiceCompleted));
  },
};

export const savingsApi = {
  getAll: async () => {
    const body = await apiRequest<{ savings: SavingsProductSummary[] }>(API_ENDPOINTS.savings.list);
    return check(
      body?.savings ?? [],
      isObj(body) && Array.isArray(body.savings) && body.savings.every(validSavingsSummary),
    );
  },
  getDeposit: async (accountId: number) => {
    const body = await apiRequest<SavingsDepositDetail>(API_ENDPOINTS.savings.deposit(accountId));
    return check(
      body,
      isObj(body) && isStr(body.productName) && isNum(body.balance)
        && isNum(body.appliedInterestRate) && isStr(body.openedAt) && isStr(body.maturityAt),
    );
  },
  getInstallment: async (accountId: number) => {
    const body = await apiRequest<SavingsInstallmentDetail>(API_ENDPOINTS.savings.installment(accountId));
    return check(
      body,
      isObj(body) && isStr(body.productName) && isNum(body.balance)
        && isNum(body.appliedInterestRate) && isStr(body.maturityAt),
    );
  },
  ask: async (productId: number, queryText: string) => {
    const body = await apiRequest<SavingsVoiceAnswer>(API_ENDPOINTS.savings.voiceQuery, {
      method: 'POST',
      body: JSON.stringify({ productId, queryText }),
    });
    return check(body, isObj(body) && isStr(body.answerText));
  },
};

export const voiceApi = {
  recognize: async (audio: RecordedAudio) => {
    const formData = new FormData();
    await appendRecordedAudio(formData, audio);
    const body = await apiRequest<VoiceRecognitionResult>(API_ENDPOINTS.voice.recognize, {
      method: 'POST',
      body: formData,
    });
    return check(body, isObj(body) && isStr(body.queryText));
  },
  query: async (queryText: string) => {
    const body = await apiRequest<VoiceQueryResult>(API_ENDPOINTS.voice.query, {
      method: 'POST',
      body: JSON.stringify({ queryText }),
    });
    return check(body, isObj(body) && isStr(body.answerText));
  },
  getUnreadSummary: async () => {
    const body = await apiRequest<UnreadVoiceSummary>(API_ENDPOINTS.voice.unreadSummary);
    return check(
      body,
      isObj(body) && isNum(body.unreadCount) && Array.isArray(body.accounts) && isStr(body.summaryText),
    );
  },
};
