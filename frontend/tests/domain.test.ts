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
import { extractAccountNumberCandidates } from '../src/features/main/transfer/ocrAccountNumber';
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
import { TERMS } from '../src/features/onboarding/terms';

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

test('OCR account candidates accept compact, spaced, and hyphenated numbers', () => {
  const candidates = extractAccountNumberCandidates([
    'KB국민은행 123-456-789012',
    '계좌 123456789012',
    '입금 계좌 110 234 567890',
  ]);

  assert.deepEqual(candidates, [
    { digits: '123456789012', display: '123-456-789012' },
    { digits: '110234567890', display: '110-234-567890' },
  ]);
});

test('OCR account candidates stay unconfirmed and reject weak numeric matches', () => {
  const candidates = extractAccountNumberCandidates([
    '문의 010-1234-5678',
    '날짜 20260908',
    '잡음 000000000000',
    '한 줄의 여러 계좌 123-456-789012 333-222-111000',
    '공백 계좌 555 444 333000',
  ]);

  assert.deepEqual(
    candidates.map((candidate) => candidate.digits),
    ['123456789012', '333222111000', '555444333000'],
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
  assert.equal(sanitizeOnboardingDraft({ version: 1, step: 10 }), null);
  assert.equal(sanitizeOnboardingDraft({ version: 3, step: 10 }), null);

  const draft = sanitizeOnboardingDraft({
    version: 2,
    step: 999,
    carrier: 'invalid',
    idType: 'passport',
    requiredTerms: [true, 'yes'],
    certificateTerms: [true, true],
  });

  assert.equal(draft?.step, 20);
  assert.equal(draft?.carrier, null);
  assert.equal(draft?.idType, null);
  assert.deepEqual(draft?.requiredTerms, [false]);
  assert.deepEqual(draft?.certificateTerms, [true]);
  assert.equal(draft?.faceTermAccepted, false);
  assert.deepEqual(
    sanitizeOnboardingDraft({ version: 2, requiredTerms: [false, false, true] })?.requiredTerms,
    [true],
  );
  assert.deepEqual(
    sanitizeOnboardingDraft({ version: 2, requiredTerms: [true] })?.requiredTerms,
    [true],
  );
  assert.equal(draft?.electronicDocTermAccepted, false);
});

test('onboarding resume never skips a sensitive verification boundary', () => {
  const base = sanitizeOnboardingDraft({
    version: 2,
    step: 19, // PIN
    phoneVerified: true,
    idType: '주민등록증',
    idScanCompleted: true,
    idInformationConfirmed: true,
    faceVerified: true,
    accountVerified: false,
  });
  assert.ok(base);
  // 계좌 인증이 끝나지 않았다면 은행 선택(15)부터 다시 시작한다.
  assert.equal(resolveOnboardingResumeStep(base), 15);

  const verified = { ...base, accountVerified: true };
  assert.equal(resolveOnboardingResumeStep(verified), 19);
});

test('onboarding terms include KB certificate, electronic document, phone, and face full text', () => {
  assert.match(TERMS['kb-certificate'].body, /KB국민인증서 서비스/);
  assert.match(TERMS['kb-certificate'].body, /제1조 \(목적\)/);
  assert.match(TERMS['kb-certificate'].summary, /로그인, 본인확인과 전자서명/);
  assert.match(TERMS['electronic-document'].body, /전자문서 중계서비스/);
  assert.match(TERMS['electronic-document'].summary, /동의하지 않아도 기본 가입에는 영향이 없습니다/);
  assert.match(TERMS['phone-auth'].body, /고유식별정보 처리 동의/);
  assert.match(TERMS['phone-auth'].body, /휴대폰본인확인/);
  assert.match(TERMS['phone-auth'].summary, /본인 명의인지 확인/);
  assert.match(TERMS['face-auth'].body, /얼굴확인\(인증거래용\)/);
  assert.match(TERMS['face-auth'].body, /얼굴사진 특징정보/);
  assert.match(TERMS['face-auth'].summary, /본인확인이 끝나면 바로 삭제/);
});
