import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_ENDPOINTS, withPathParam } from '../src/api/endpoints';
import { ONBOARDING_DESTINATION_ROUTES, resolveEntryRoute } from '../src/lib/navigation';
import { TX_RECORDS } from '../src/features/main/data';
import { screenForPath } from '../src/features/main/routes';
import {
  applyTransactionReviews,
  filterTransactionsByMonth,
  sanitizeTransactionReviews,
} from '../src/features/main/transactions';
import { MAX_SCORE, MISSIONS } from '../src/features/missions/data/missions';
import {
  getQuizQuestionIndex,
  getTodayQuestion,
  isQuizAnswerCorrect,
  QUIZ_QUESTIONS,
} from '../src/features/missions/data/quiz';
import {
  calculateFinancialScore,
  completeMission,
  completePracticeForDate,
  completeQuizForDate,
  getDailyActivityStatus,
  getLocalDateKey,
  getWeeklyActivity,
} from '../src/features/missions/state';
import {
  generateDailyMission,
  getDailyMissionStorageKey,
  isDailyMission,
} from '../src/features/missions/dailyMission';
import { RISK_SCENARIOS } from '../src/features/missions/scenarios/scenarios';
import {
  MISSION_PRACTICE_PRESETS,
  SOLO_MANUAL_RETRY_PRESET,
} from '../src/features/practice/missionPresets';
import { getPracticeStepGuidance } from '../src/features/practice/guidance';
import {
  AMOUNT_MAX_DIGITS,
  appendDigits,
  formatWon,
  getPracticeReviewError,
  isValidPracticeAmount,
  isValidPracticeRecipient,
} from '../src/features/practice/utils';
import {
  createVoicePracticeStatePatch,
  isCompleteVoiceTransfer,
  parseSpokenAmount,
  parseVoiceTransfer,
  PRACTICE_VOICE_EXAMPLES,
} from '../src/features/practice/voiceTransfer';
import {
  resolveOnboardingResumeStep,
  sanitizeOnboardingDraft,
} from '../src/features/onboarding/onboardingDraft';

test('major paths map to their intended screens', () => {
  assert.equal(screenForPath('/home'), 'home');
  assert.equal(screenForPath('/transfer'), 'transfer');
  assert.equal(screenForPath('/history'), 'transactions');
  assert.equal(screenForPath('/accounts'), 'savings');
  assert.equal(screenForPath('/practice'), 'financialIndependence');
});

test('entry and onboarding destination routes remain distinct', () => {
  assert.equal(resolveEntryRoute(null, false), '/welcome');
  assert.equal(resolveEntryRoute('danbi', false), '/join');
  assert.equal(resolveEntryRoute('standard', true), '/(app)/home');
  assert.equal(ONBOARDING_DESTINATION_ROUTES.home, '/(app)/home');
  assert.equal(ONBOARDING_DESTINATION_ROUTES.accounts, '/(app)/accounts');
  assert.equal(ONBOARDING_DESTINATION_ROUTES.practice, '/(app)/practice');
});

test('transaction reviews are sanitized and applied', () => {
  const reviews = sanitizeTransactionReviews({
    1: 'known',
    3: 'unknown',
    5: 'pending',
  });
  const records = applyTransactionReviews(TX_RECORDS, reviews);

  assert.deepEqual(reviews, { 1: 'KNOWN', 3: 'UNKNOWN' });
  assert.equal(records.find((record) => record.transactionId === 1)?.reviewStatus, 'KNOWN');
  assert.equal(records.find((record) => record.transactionId === 3)?.reviewStatus, 'UNKNOWN');
});

test('transaction month selection filters the rendered records', () => {
  assert.equal(filterTransactionsByMonth(TX_RECORDS, 2026 * 12 + 7).length, 5);
  assert.equal(filterTransactionsByMonth(TX_RECORDS, 2026 * 12 + 6).length, 0);
});

test('API scaffold covers every endpoint in the Notion specification', () => {
  const endpointCount = Object.values(API_ENDPOINTS).reduce(
    (count, domain) => count + Object.keys(domain).length,
    0,
  );
  assert.equal(endpointCount, 56);
  assert.equal(
    withPathParam(API_ENDPOINTS.transfer.getResult.path, 'transferId', 9001),
    '/transfer/9001',
  );
});

test('deposit protection quiz reflects the current 100 million won limit', () => {
  const question = QUIZ_QUESTIONS.find((item) => item.id === 14);
  assert.equal(question?.correctIndex, 0);
  assert.match(question?.question ?? '', /1억 원/);
  assert.match(question?.explanation ?? '', /2025년 9월 1일/);
});

test('daily quiz selection is deterministic for the same local date', () => {
  const morning = new Date(2026, 8, 6, 8);
  const evening = new Date(2026, 8, 6, 22);

  assert.equal(getQuizQuestionIndex(morning), getQuizQuestionIndex(evening));
  assert.strictEqual(getTodayQuestion(morning), getTodayQuestion(evening));
});

test('daily mission generator keeps risk scenarios solo and creates valid combinations', () => {
  const values = [0.1, 0.7, 0.9, 0.9, 0.5];
  const riskMission = generateDailyMission('2026-09-07', () => values.shift() ?? 0);

  assert.equal(riskMission.date, '2026-09-07');
  assert.equal(riskMission.assistanceMode, 'solo');
  assert.equal(riskMission.scenarioId, 'loan-scam');
  assert.equal(riskMission.inputMethod, 'manual');
  assert.equal(isDailyMission(riskMission, '2026-09-07'), true);
  assert.equal(getDailyMissionStorageKey(riskMission.date), 'danbi.daily.mission.2026-09-07');
});

test('daily mission validation rejects guided risk data and a mismatched date', () => {
  const invalidRisk = {
    date: '2026-09-07',
    assistanceMode: 'guided',
    inputMethod: 'voice',
    recipientType: 'saved',
    recipientId: 'minsu',
    amount: 30000,
    scenarioId: 'prosecutor-scam',
  };

  assert.equal(isDailyMission(invalidRisk), false);
  assert.equal(isDailyMission({ ...invalidRisk, assistanceMode: 'solo' }, '2026-09-08'), false);
});

test('scenario data covers four shared call/message simulations with review signals', () => {
  assert.deepEqual(
    RISK_SCENARIOS.map((scenario) => scenario.id),
    ['prosecutor-scam', 'family-impersonation', 'loan-scam', 'refund-scam'],
  );
  assert.equal(
    RISK_SCENARIOS.some((scenario) => scenario.contactType === 'call'),
    true,
  );
  assert.equal(
    RISK_SCENARIOS.some((scenario) => scenario.contactType === 'message'),
    true,
  );
  RISK_SCENARIOS.forEach((scenario) => {
    assert.ok(scenario.dialogueSteps.length >= 4);
    assert.ok(scenario.riskSignals.length >= 4);
    assert.ok(scenario.transferRequest.amount > 0);
  });
});

test('daily quiz index advances by local calendar day', () => {
  const todayIndex = getQuizQuestionIndex(new Date(2026, 8, 6, 23, 59));
  const tomorrowIndex = getQuizQuestionIndex(new Date(2026, 8, 7, 0, 1));

  assert.equal(tomorrowIndex, (todayIndex + 1) % QUIZ_QUESTIONS.length);
});

test('quiz answer correctness uses the question answer index', () => {
  const question = QUIZ_QUESTIONS.find((item) => item.type === 'ox' && item.correctIndex === 0);
  assert.ok(question);

  assert.equal(isQuizAnswerCorrect(question, 0), true);
  assert.equal(isQuizAnswerCorrect(question, 1), false);
});

test('scored transfer missions enter their required practice path', () => {
  assert.equal(MISSION_PRACTICE_PRESETS['guided-transfer']?.practiceStyle, 'guided');
  assert.equal(MISSION_PRACTICE_PRESETS['guided-transfer']?.transferMethod, 'voice');

  assert.equal(MISSION_PRACTICE_PRESETS['voice-transfer']?.practiceStyle, 'solo');
  assert.equal(MISSION_PRACTICE_PRESETS['voice-transfer']?.transferMethod, 'voice');
  assert.equal(MISSION_PRACTICE_PRESETS['voice-transfer']?.screen, 'practiceVoice');

  assert.equal(MISSION_PRACTICE_PRESETS['solo-transfer']?.practiceStyle, 'solo');
  assert.equal(MISSION_PRACTICE_PRESETS['solo-transfer']?.transferMethod, 'manual');
  assert.equal(MISSION_PRACTICE_PRESETS['solo-transfer']?.screen, 'practiceRecipient');

  assert.equal(MISSION_PRACTICE_PRESETS['review-transfer']?.practiceStyle, 'solo');
  assert.equal(MISSION_PRACTICE_PRESETS['review-transfer']?.transferMethod, 'manual');
  assert.equal(MISSION_PRACTICE_PRESETS['review-transfer']?.screen, 'practiceReview');

  assert.equal(SOLO_MANUAL_RETRY_PRESET.practiceStyle, 'solo');
  assert.equal(SOLO_MANUAL_RETRY_PRESET.transferMethod, 'manual');
  assert.equal(SOLO_MANUAL_RETRY_PRESET.screen, 'practiceMethod');
});

test('guided practice provides one focused instruction for each action step', () => {
  assert.match(getPracticeStepGuidance('guided', 'practiceMethod') ?? '', /연습할 방법/);
  assert.match(getPracticeStepGuidance('guided', 'practiceVoice') ?? '', /마이크/);
  assert.match(getPracticeStepGuidance('guided', 'practiceRecipient') ?? '', /김민수/);
  assert.match(getPracticeStepGuidance('guided', 'practiceAmount') ?? '', /30,000원/);
  assert.match(getPracticeStepGuidance('guided', 'practiceReview') ?? '', /확인/);
  assert.match(getPracticeStepGuidance('guided', 'practicePin') ?? '', /네 자리/);
});

test('solo practice does not automatically reuse guided step instructions', () => {
  assert.equal(getPracticeStepGuidance('solo', 'practiceVoice'), null);
  assert.equal(getPracticeStepGuidance('solo', 'practiceRecipient'), null);
  assert.equal(getPracticeStepGuidance('solo', 'practiceAmount'), null);
  assert.equal(getPracticeStepGuidance('solo', 'practiceReview'), null);
  assert.equal(getPracticeStepGuidance('solo', 'practicePin'), null);
});

test('manual practice validates a selected or newly entered recipient', () => {
  assert.equal(isValidPracticeRecipient(null), false);
  assert.equal(isValidPracticeRecipient('minsu'), true);
  assert.equal(isValidPracticeRecipient('new', '1234567'), false);
  assert.equal(isValidPracticeRecipient('new', '12345678'), true);
  assert.equal(isValidPracticeRecipient('new', '1234abcd'), false);
});

test('manual practice amount stays numeric, bounded, and greater than zero', () => {
  assert.equal(isValidPracticeAmount(''), false);
  assert.equal(isValidPracticeAmount('0'), false);
  assert.equal(isValidPracticeAmount('30000'), true);
  assert.equal(isValidPracticeAmount('30,000'), false);
  assert.equal(appendDigits('1234567890', '9', { maxLength: AMOUNT_MAX_DIGITS }), '1234567890');
});

test('manual practice review keeps solo values and formats the amount', () => {
  assert.equal(
    getPracticeReviewError({
      guided: false,
      recipientMatches: false,
      amountMatches: false,
    }),
    null,
  );
  assert.equal(formatWon('30000'), '30,000');
});

test('guided practice review still enforces the guided mission values', () => {
  assert.equal(
    getPracticeReviewError({
      guided: true,
      recipientMatches: true,
      amountMatches: true,
    }),
    null,
  );
  assert.equal(
    getPracticeReviewError({
      guided: true,
      recipientMatches: false,
      amountMatches: false,
    }),
    'both',
  );
});

test('voice parser recognizes saved recipient aliases and a basic amount', () => {
  const shortName = parseVoiceTransfer('민수에게 3만원 보내줘');
  const fullName = parseVoiceTransfer('김민수한테 3만원 보내줘');

  assert.equal(shortName.recipient?.id, 'minsu');
  assert.equal(shortName.amount, '30000');
  assert.equal(shortName.issue, 'none');
  assert.equal(fullName.recipient?.id, 'minsu');
  assert.equal(isCompleteVoiceTransfer(fullName), true);
});

test('voice parser supports numeric won amounts and comma formatting', () => {
  assert.equal(parseVoiceTransfer('민수에게 30000원 보내줘').amount, '30000');
  assert.equal(parseSpokenAmount('민수에게 30,000원 보내줘'), 30000);
});

test('voice parser supports Korean ten-thousand and thousand expressions', () => {
  assert.equal(parseSpokenAmount('민수에게 삼만원 보내줘'), 30000);
  assert.equal(parseSpokenAmount('민수에게 만원 보내줘'), 10000);
  assert.equal(parseSpokenAmount('민수에게 5천원 보내줘'), 5000);
  assert.equal(parseSpokenAmount('민수에게 오천원 보내줘'), 5000);
  assert.equal(parseSpokenAmount('민수에게 삼만오천원 보내줘'), 35000);
});

test('voice parser preserves a recognized recipient when amount is missing', () => {
  const result = parseVoiceTransfer('민수에게 보내줘');
  const patch = createVoicePracticeStatePatch(result);

  assert.equal(result.issue, 'missing-amount');
  assert.equal(result.recipient?.id, 'minsu');
  assert.equal(result.amount, '');
  assert.equal(patch.recipientChoice, 'minsu');
  assert.equal('amount' in patch, false);
});

test('voice parser preserves a recognized amount when recipient is missing', () => {
  const result = parseVoiceTransfer('3만원 보내줘');
  const patch = createVoicePracticeStatePatch(result);

  assert.equal(result.issue, 'missing-recipient');
  assert.equal(result.recipient, null);
  assert.equal(result.amount, '30000');
  assert.equal(patch.amount, '30000');
  assert.equal('recipientChoice' in patch, false);
});

test('voice parser never completes an uninterpretable sentence', () => {
  const result = parseVoiceTransfer('돈 보내줘');

  assert.equal(result.issue, 'missing-both');
  assert.equal(result.recipient, null);
  assert.equal(result.amount, '');
  assert.equal(isCompleteVoiceTransfer(result), false);
  assert.deepEqual(createVoicePracticeStatePatch(result), {});
});

test('voice parser reports an unknown recipient without inventing an account', () => {
  const result = parseVoiceTransfer('철수에게 3만원 보내줘');

  assert.equal(result.issue, 'unknown-recipient');
  assert.equal(result.recipientName, '철수');
  assert.equal(result.recipient, null);
  assert.equal(result.amount, '30000');
  assert.equal(isCompleteVoiceTransfer(result), false);
});

test('voice parser can use a scenario recipient without adding it to saved accounts', () => {
  const result = parseVoiceTransfer('김정훈에게 50만원 보내줘', [
    {
      id: 'new',
      name: '김정훈',
      bank: '단비연습은행',
      account: '101234567890',
    },
  ]);
  const patch = createVoicePracticeStatePatch(result);

  assert.equal(isCompleteVoiceTransfer(result), true);
  assert.equal(patch.recipientChoice, 'new');
  assert.equal(patch.recipientAccount, '101234567890');
  assert.equal(patch.amount, '500000');
});

test('practice voice examples use the same parser path', () => {
  const expected = [
    ['minsu', '30000'],
    ['younghee', '30000'],
    ['minsu', '10000'],
  ] as const;

  PRACTICE_VOICE_EXAMPLES.forEach((example, index) => {
    const [recipientId, amount] = expected[index];
    const result = parseVoiceTransfer(example);
    assert.equal(result.recipient?.id, recipientId);
    assert.equal(result.amount, amount);
    assert.equal(isCompleteVoiceTransfer(result), true);
  });
});

test('quiz completion is date-specific and idempotent', () => {
  const today = '2026-09-06';
  const previousRecord = {
    '2026-09-05': { qId: 1, answeredIndex: 1 },
  };

  assert.equal(getDailyActivityStatus(previousRecord, {}, today).quizCompleted, false);
  assert.equal(getDailyActivityStatus(previousRecord, {}, '2026-09-05').quizCompleted, true);

  const completed = completeQuizForDate(previousRecord, today, {
    qId: 2,
    answeredIndex: 0,
  });
  const repeated = completeQuizForDate(completed, today, {
    qId: 2,
    answeredIndex: 1,
  });

  assert.notStrictEqual(completed, previousRecord);
  assert.strictEqual(repeated, completed);
  assert.deepEqual(repeated[today], { qId: 2, answeredIndex: 0 });
});

test('practice completion is date-specific and idempotent', () => {
  const today = '2026-09-06';
  const previousRecord = { '2026-09-05': 'guided-transfer' as const };

  assert.equal(getDailyActivityStatus({}, previousRecord, today).practiceCompleted, false);
  assert.equal(getDailyActivityStatus({}, previousRecord, '2026-09-05').practiceCompleted, true);

  const completed = completePracticeForDate(previousRecord, today, 'voice-transfer');
  const repeated = completePracticeForDate(completed, today, 'solo-transfer');

  assert.notStrictEqual(completed, previousRecord);
  assert.strictEqual(repeated, completed);
  assert.equal(repeated[today], 'voice-transfer');
});

test('daily completion requires both quiz and practice records for the same date', () => {
  const today = '2026-09-06';
  const quiz = { [today]: { qId: 1, answeredIndex: 1 } };
  const practice = { [today]: 'guided-transfer' as const };

  assert.equal(getDailyActivityStatus({}, {}, today).completed, false);
  assert.equal(getDailyActivityStatus(quiz, {}, today).completed, false);
  assert.equal(getDailyActivityStatus({}, practice, today).completed, false);
  assert.equal(getDailyActivityStatus(quiz, practice, today).completed, true);
});

test('daily completion and score are independent of quiz/practice order', () => {
  const today = '2026-09-07';
  const answer = { qId: 5, answeredIndex: 0 };
  const mission = MISSIONS.find((item) => item.type === 'transfer')!;

  // 경우 A: O/X → 송금 연습
  const aQuiz = completeQuizForDate({}, today, answer);
  const aPractice = completePracticeForDate({}, today, mission.id);
  const aMissions = completeMission(new Set(), mission).completedMissionIds;

  // 경우 B: 송금 연습 → O/X
  const bPractice = completePracticeForDate({}, today, mission.id);
  const bQuiz = completeQuizForDate({}, today, answer);
  const bMissions = completeMission(new Set(), mission).completedMissionIds;

  assert.deepEqual(
    getDailyActivityStatus(aQuiz, aPractice, today),
    getDailyActivityStatus(bQuiz, bPractice, today),
  );
  assert.equal(getDailyActivityStatus(aQuiz, aPractice, today).completed, true);
  assert.equal(calculateFinancialScore(aMissions), calculateFinancialScore(bMissions));

  // 어느 순서든 활동을 한 번 더 반복해도 완료 기록·점수는 그대로다.
  const aQuizRepeat = completeQuizForDate(aQuiz, today, {
    qId: 9,
    answeredIndex: 1,
  });
  const aPracticeRepeat = completePracticeForDate(aPractice, today, 'solo-transfer');
  const aMissionsRepeat = completeMission(aMissions, mission).completedMissionIds;
  assert.strictEqual(aQuizRepeat, aQuiz);
  assert.strictEqual(aPracticeRepeat, aPractice);
  assert.strictEqual(aMissionsRepeat, aMissions);
  assert.equal(calculateFinancialScore(aMissionsRepeat), calculateFinancialScore(aMissions));
});

test('weekly activity uses local calendar dates and preserves prior records', () => {
  const referenceDate = new Date(2026, 8, 6, 12);
  const today = getLocalDateKey(referenceDate);
  const quiz = {
    '2026-08-30': { qId: 1, answeredIndex: 1 },
    [today]: { qId: 2, answeredIndex: 0 },
  };
  const practice = {
    '2026-08-30': 'guided-transfer' as const,
    [today]: 'voice-transfer' as const,
  };

  const week = getWeeklyActivity(quiz, practice, referenceDate);

  assert.equal(today, '2026-09-06');
  assert.equal(week.length, 7);
  assert.equal(week[0].date, '2026-08-31');
  assert.equal(week[6].date, today);
  assert.equal(week[6].completed, true);
  assert.equal(quiz['2026-08-30'].qId, 1);
  assert.equal(practice['2026-08-30'], 'guided-transfer');
});

test('mission completion keeps score deterministic, idempotent, and capped', () => {
  const mission = MISSIONS[0];
  const first = completeMission(new Set(), mission);
  const repeated = completeMission(first.completedMissionIds, mission);

  assert.equal(first.earnedPoints, mission.points);
  assert.equal(repeated.earnedPoints, 0);
  assert.strictEqual(repeated.completedMissionIds, first.completedMissionIds);
  assert.equal(
    calculateFinancialScore(repeated.completedMissionIds),
    calculateFinancialScore(first.completedMissionIds),
  );

  const duplicatedMissionIds = MISSIONS.flatMap((item) => [item.id, item.id]);
  assert.equal(calculateFinancialScore(duplicatedMissionIds), MAX_SCORE);
  assert.equal(MAX_SCORE, 100);
});

test('onboarding draft rejects unknown versions and strips invalid values', () => {
  assert.equal(sanitizeOnboardingDraft({ version: 2, step: 10 }), null);

  const draft = sanitizeOnboardingDraft({
    version: 1,
    step: 999,
    termsStep: 7,
    carrier: 'invalid',
    idType: 'passport',
    requiredTerms: [true, 'yes'],
    certificateTerms: [true, true],
  });

  assert.equal(draft?.step, 16);
  assert.equal(draft?.termsStep, 0);
  assert.equal(draft?.carrier, null);
  assert.equal(draft?.idType, null);
  assert.deepEqual(draft?.requiredTerms, [true, false]);
});

test('onboarding resume never skips a sensitive verification boundary', () => {
  const base = sanitizeOnboardingDraft({
    version: 1,
    step: 15,
    phoneVerified: true,
    idType: '주민등록증',
    idScanCompleted: true,
    idInformationConfirmed: true,
    faceVerified: true,
    accountVerified: false,
  });
  assert.ok(base);
  assert.equal(resolveOnboardingResumeStep(base), 13);

  const verified = { ...base, accountVerified: true };
  assert.equal(resolveOnboardingResumeStep(verified), 15);
});
