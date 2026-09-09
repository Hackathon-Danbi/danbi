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
import { STEP_HELP, isFullBleedHelpStep } from '../src/features/onboarding/help/onboardingHelp';
import {
  FACE_CAPTURE_HELP,
  FACE_HELP_OPTIONS,
  ID_CAPTURE_HELP,
} from '../src/features/onboarding/help/captureHelp';
import {
  FACE_CAPTURE_STAGES,
  FACE_POSE_COPY,
  nextFaceCaptureStage,
} from '../src/features/onboarding/face-capture/faceStages';
import { SCREEN_HELP, TRANSFER_SCREENS } from '../src/features/main/proactiveHelp';
import {
  HISTORY_HELP,
  formatWonVoice,
  listHelpTarget,
  reviewDetailVoice,
} from '../src/features/main/history/historyHelp';
import { accounts } from '../src/features/shared/data/accounts.mock';
import {
  createBalanceVoiceAnswer,
  isBalanceVoiceQuery,
  isHistoryVoiceQuery,
  isReviewTxVoiceQuery,
  isTransferVoiceQuery,
} from '../src/features/main/voiceQuery';

test('entry and onboarding destination routes remain distinct', () => {
  assert.equal(resolveEntryRoute(null, false), '/welcome');
  assert.equal(ONBOARDING_DESTINATION_ROUTES.accounts, '/(app)/accounts');
});

test('demo entry always starts at welcome', () => {
  const locked = { pinRegistered: true, unlocked: false };
  const unlocked = { pinRegistered: true, unlocked: true };
  const noPin = { pinRegistered: false, unlocked: false };

  assert.equal(resolveEntryRoute('danbi', false), '/welcome');
  assert.equal(resolveEntryRoute('standard', true), '/welcome');
  assert.equal(resolveEntryRoute('danbi', true, locked), '/welcome');
  assert.equal(resolveEntryRoute('danbi', true, unlocked), '/welcome');
  assert.equal(resolveEntryRoute('danbi', true, noPin), '/welcome');
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

test('home balance voice answer uses the currently selected account', () => {
  const savingsAccount = accounts.find((account) => account.accountId === 12)!;
  const answer = createBalanceVoiceAnswer(savingsAccount);

  assert.equal(isBalanceVoiceQuery('내 통장에 얼마 있어?'), true);
  assert.equal(isBalanceVoiceQuery('잔액 알려줘'), true);
  assert.equal(isBalanceVoiceQuery('최근 거래내역 알려줘'), false);
  assert.equal(isBalanceVoiceQuery('오늘 날씨 어때?'), false);
  assert.equal(isBalanceVoiceQuery('안녕하세요'), false);
  assert.equal(isBalanceVoiceQuery('김민수한테 만원 보내줘'), false);
  assert.equal(answer.answerText, '우체국 저축 통장에 10,000,000원 있어요.');
  assert.equal(answer.relatedAccountId, 12);
});

test('home mic routes send phrases to the transfer flow, not balance', () => {
  for (const phrase of [
    '영희에게 3만원 보내줘',
    '이영희에게 삼만원 송금해줘',
    '엄마한테 10만원 부쳐줘',
    '내 계좌로 5만원 보내줘',
  ]) {
    assert.equal(isTransferVoiceQuery(phrase), true, phrase);
    assert.equal(isBalanceVoiceQuery(phrase), false, phrase);
  }

  // 잔액/일반 질문은 송금으로 새지 않는다.
  for (const phrase of ['잔액 알려줘', '내 통장에 얼마 있어?', '최근 거래내역 알려줘', '안녕하세요']) {
    assert.equal(isTransferVoiceQuery(phrase), false, phrase);
  }
});

test('home mic routes history phrases to the transaction list', () => {
  for (const phrase of [
    '거래내역 보여줘',
    '최근 거래내역 알려줘',
    '입출금 내역 보여줘',
    '이번달에 얼마 썼어?',
    '지난달에 돈 얼마나 나갔어?',
  ]) {
    assert.equal(isHistoryVoiceQuery(phrase), true, phrase);
    assert.equal(isBalanceVoiceQuery(phrase), false, phrase);
    assert.equal(isTransferVoiceQuery(phrase), false, phrase);
  }

  // 잔액/송금/인사는 거래내역으로 새지 않는다.
  for (const phrase of ['잔액 알려줘', '영희에게 3만원 보내줘', '안녕하세요']) {
    assert.equal(isHistoryVoiceQuery(phrase), false, phrase);
  }
});

test('home mic routes unknown-transaction phrases to the review screen', () => {
  for (const phrase of ['모르는 거래 확인해줘', '이상한 결제 있어?', '미확인 거래 보여줘']) {
    assert.equal(isReviewTxVoiceQuery(phrase), true, phrase);
  }
  assert.equal(isReviewTxVoiceQuery('거래내역 보여줘'), false);
  assert.equal(isReviewTxVoiceQuery('잔액 알려줘'), false);
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

test('onboarding proactive help covers every join step', () => {
  for (let step = 0; step <= 20; step += 1) {
    const help = STEP_HELP[step];
    assert.ok(help, `step ${step} needs help copy`);
    assert.ok(help.entryVoice.length > 8, `step ${step} needs entry voice`);
    assert.ok(help.hint.length > 8, `step ${step} needs a short hint`);
  }
  assert.equal(STEP_HELP[2].showBar, true);
  assert.equal(STEP_HELP[0].showBar, false);
  assert.equal(STEP_HELP[11].showBar, false);
  assert.equal(STEP_HELP[14].showBar, false);
  assert.equal(isFullBleedHelpStep(11), true);
  assert.equal(isFullBleedHelpStep(14), true);
  assert.equal(isFullBleedHelpStep(12), false);
});

test('onboarding capture help covers permission, idle, and coaching', () => {
  for (const help of [ID_CAPTURE_HELP, FACE_CAPTURE_HELP]) {
    assert.ok(help.entry.length > 8);
    assert.ok(help.idle.length > 8);
    assert.ok(help.permission.length > 8);
    assert.ok(help.permissionBlocked.length > 8);
    assert.ok(help.captureFail.length > 8);
    assert.ok(help.openCoach.length > 8);
  }
  assert.match(ID_CAPTURE_HELP.idle, /촬영하기/);
  assert.match(FACE_CAPTURE_HELP.idle, /얼굴 찍기/);
  assert.equal(FACE_HELP_OPTIONS.length, 4);
});

test('face capture follows the four backend verification poses', () => {
  assert.deepEqual(FACE_CAPTURE_STAGES, ['FRONT_INITIAL', 'RIGHT', 'LEFT', 'FRONT_FINAL']);
  assert.equal(nextFaceCaptureStage('FRONT_INITIAL'), 'RIGHT');
  assert.equal(nextFaceCaptureStage('RIGHT'), 'LEFT');
  assert.equal(nextFaceCaptureStage('LEFT'), 'FRONT_FINAL');
  assert.equal(nextFaceCaptureStage('FRONT_FINAL'), null);
  assert.match(FACE_POSE_COPY.FRONT_INITIAL.guide, /귀와 턱/);
  assert.match(FACE_POSE_COPY.RIGHT.guide, /오른쪽 귀/);
  assert.match(FACE_POSE_COPY.LEFT.guide, /왼쪽 귀/);
  assert.match(FACE_POSE_COPY.FRONT_FINAL.guide, /턱선/);
});

test('transfer proactive help covers voice, ocr, and pin screens', () => {
  const screens = [
    'transfer',
    'listening',
    'voiceconfirm',
    'recipient',
    'bankselect',
    'accountinput',
    'ocrconfirm',
    'ocrselect',
    'ocrfailure',
    'amountinput',
    'pretransfer',
    'password',
  ] as const;
  for (const screen of screens) {
    const help = SCREEN_HELP[screen];
    assert.ok(help, `${screen} needs help copy`);
    assert.ok(help!.target, `${screen} needs a highlight target`);
    assert.ok(help!.hint.length > 8, `${screen} needs a short hint`);
    assert.ok(help!.voiceText.length > 8, `${screen} needs voice text`);
    assert.ok(TRANSFER_SCREENS.includes(screen), `${screen} should start the inactivity timer`);
  }
  assert.equal(SCREEN_HELP.listening?.target, 'listenExamples');
  assert.equal(SCREEN_HELP.password?.target, 'pinKeypad');
  assert.equal(SCREEN_HELP.ocrfailure?.target, 'ocrManual');
  assert.equal(SCREEN_HELP.ocrconfirm?.target, 'ocrConfirm');
  assert.equal(SCREEN_HELP.transfer?.target, 'micButton');
});

test('history proactive help prefers report, then empty month, then review', () => {
  assert.equal(formatWonVoice(40000), '4만 원');
  assert.equal(formatWonVoice(53000), '5만 3,000원');
  assert.match(HISTORY_HELP.gateIdle, /자세히 보기/);
  assert.equal(
    listHelpTarget({ unknownCount: 1, needCheckCount: 2, empty: false, hasReviewElsewhere: false }),
    'reportBtn',
  );
  assert.equal(
    listHelpTarget({ unknownCount: 0, needCheckCount: 0, empty: true, hasReviewElsewhere: true }),
    'prevMonth',
  );
  assert.equal(
    listHelpTarget({ unknownCount: 0, needCheckCount: 2, empty: false, hasReviewElsewhere: false }),
    'reviewBtn',
  );
  const pending = TX_RECORDS.find((tx) => tx.reviewStatus === 'pending');
  assert.ok(pending);
  assert.match(reviewDetailVoice(pending!), /노란 버튼/);
});
