import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ONBOARDING_DESTINATION_ROUTES,
  resolveEntryRoute,
} from '../src/lib/navigation';
import { RECENT_RECIPIENT_CANDIDATES, TX_RECORDS } from '../src/features/main/data';
import {
  filterUnsavedRecentRecipients,
  findRecipientBySpokenName,
  recipientDisplayName,
  sanitizeSavedRecipients,
  saveRecipient,
  updateRecipientNickname,
} from '../src/features/main/savedRecipients';
import {
  applyTransactionReviews,
  filterTransactionsByMonth,
  formatTxOccurredAt,
  sanitizeTransactionReviews,
} from '../src/features/main/transactions';
import { QUIZ_QUESTIONS } from '../src/features/missions/data/quiz';
import { MISSION_PRACTICE_PRESETS } from '../src/features/practice/missionPresets';
import {
  resolveOnboardingResumeStep,
  sanitizeOnboardingDraft,
} from '../src/features/onboarding/onboardingDraft';

test('entry and onboarding destination routes remain distinct', () => {
  assert.equal(resolveEntryRoute(null, false), '/welcome');
  assert.equal(resolveEntryRoute('danbi', false), '/join');
  assert.equal(resolveEntryRoute('standard', true), '/(app)/home');
  assert.equal(ONBOARDING_DESTINATION_ROUTES.accounts, '/(app)/accounts');
});

test('app lock keeps the main app behind the login screen', () => {
  const locked = { pinRegistered: true, unlocked: false };
  const unlocked = { pinRegistered: true, unlocked: true };
  const noPin = { pinRegistered: false, unlocked: false };

  assert.equal(resolveEntryRoute('danbi', true, locked), '/login');
  assert.equal(resolveEntryRoute('danbi', true, unlocked), '/(app)/home');
  // 비밀번호를 저장하지 않은 기존 사용자는 잠금 화면에 갇히지 않는다.
  assert.equal(resolveEntryRoute('danbi', true, noPin), '/(app)/home');
  // 가입/모드 선택이 끝나지 않았으면 잠금보다 앞선 단계를 먼저 처리한다.
  assert.equal(resolveEntryRoute('danbi', false, locked), '/join');
  assert.equal(resolveEntryRoute(null, true, locked), '/welcome');
});

test('transaction reviews are sanitized and applied', () => {
  const reviews = sanitizeTransactionReviews({ 1: 'known', 3: 'unknown', 5: 'pending' });
  const records = applyTransactionReviews(TX_RECORDS, reviews);

  assert.deepEqual(reviews, { 1: 'known', 3: 'unknown' });
  assert.equal(records.find((record) => record.id === 1)?.reviewStatus, 'known');
  assert.equal(records.find((record) => record.id === 3)?.reviewStatus, 'unknown');
});

test('transaction month selection filters the rendered records', () => {
  assert.equal(filterTransactionsByMonth(TX_RECORDS, 2026 * 12 + 7).length, 5);
  assert.equal(filterTransactionsByMonth(TX_RECORDS, 2026 * 12 + 6).length, 0);
});

test('transaction records expose detail fields for the history popup', () => {
  for (const record of TX_RECORDS) {
    assert.ok(record.merchant);
    assert.ok(record.category);
    assert.equal(typeof record.memo, 'string');
    assert.ok(record.type);
    assert.ok(record.date);
    assert.ok(record.time);
  }

  const convenience = TX_RECORDS.find((record) => record.id === 1);
  assert.equal(convenience?.merchant, 'CU 선릉점');
  assert.equal(convenience?.category, '식비');
  assert.equal(formatTxOccurredAt(convenience!), '8월 29일 오후 2:10');
});

test('saved recipients support aliases and reject duplicate account saves', () => {
  const initial = sanitizeSavedRecipients([
    {
      savedRecipientId: 7,
      recipientBankCode: '004',
      recipientBankName: 'KB국민은행',
      recipientAccountNumber: '123-456',
      recipientName: '김민수',
      nickname: null,
    },
    { savedRecipientId: 'invalid' },
  ]);
  const renamed = updateRecipientNickname(initial, 7, '아들');
  const duplicateSave = saveRecipient(renamed, {
    recipientBankCode: '004',
    recipientBankName: 'KB국민은행',
    recipientAccountNumber: '123456',
    recipientName: '김민수',
    nickname: '민수',
  });

  assert.equal(initial.length, 1);
  assert.equal(recipientDisplayName(renamed[0]), '아들');
  assert.equal(findRecipientBySpokenName(renamed, '아들')?.savedRecipientId, 7);
  assert.equal(duplicateSave.length, 1);
  assert.equal(recipientDisplayName(duplicateSave[0]), '민수');
});

test('saving a frequent recent account removes it from recommendations', () => {
  const candidate = RECENT_RECIPIENT_CANDIDATES[0];
  const saved = saveRecipient([], { ...candidate, nickname: null });

  assert.equal(filterUnsavedRecentRecipients([], RECENT_RECIPIENT_CANDIDATES).length, 2);
  assert.deepEqual(
    filterUnsavedRecentRecipients(saved, RECENT_RECIPIENT_CANDIDATES).map(
      (recipient) => recipient.recipientName,
    ),
    ['최영호'],
  );
});
test('deposit protection quiz reflects the current 100 million won limit', () => {
  const question = QUIZ_QUESTIONS.find((item) => item.id === 14);
  assert.equal(question?.correctIndex, 0);
  assert.match(question?.question ?? '', /1억 원/);
  assert.match(question?.explanation ?? '', /2025년 9월 1일/);
});

test('scored transfer missions enter their required practice path', () => {
  assert.equal(MISSION_PRACTICE_PRESETS['guided-transfer']?.practiceStyle, 'guided');
  assert.equal(MISSION_PRACTICE_PRESETS['voice-transfer']?.screen, 'practiceVoice');
  assert.equal(MISSION_PRACTICE_PRESETS['solo-transfer']?.transferMethod, 'manual');
  assert.equal(MISSION_PRACTICE_PRESETS['review-transfer']?.screen, 'practiceReview');
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

  assert.equal(draft?.step, 18);
  assert.equal(draft?.termsStep, 0);
  assert.equal(draft?.carrier, null);
  assert.equal(draft?.idType, null);
  assert.deepEqual(draft?.requiredTerms, [true, false]);
});

test('onboarding resume never skips a sensitive verification boundary', () => {
  const base = sanitizeOnboardingDraft({
    version: 1,
    step: 17, // PIN
    phoneVerified: true,
    idType: '주민등록증',
    idScanCompleted: true,
    idInformationConfirmed: true,
    faceVerified: true,
    accountVerified: false,
  });
  assert.ok(base);
  // 계좌 인증이 끝나지 않았다면 은행 선택(13)부터 다시 시작한다.
  assert.equal(resolveOnboardingResumeStep(base), 13);

  const verified = { ...base, accountVerified: true };
  assert.equal(resolveOnboardingResumeStep(verified), 17);
});
