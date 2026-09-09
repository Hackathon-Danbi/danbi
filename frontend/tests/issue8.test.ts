import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TX_RECORDS } from '../src/features/main/data';
import {
  applyTransactionReviews,
  filterReviewTransactions,
} from '../src/features/main/transactions';
import { generateDailyMission } from '../src/features/missions/dailyMission';
import {
  isReviewableTransferStep,
  mergeTransferDifficultyCompletion,
  reviewStepForTransferScreen,
  sanitizeTransferDifficulties,
  TRANSFER_DIFFICULTY_COPY,
} from '../src/features/missions/transferDifficulty';
import {
  initialStateForReviewStep,
  screenForReviewStep,
} from '../src/features/practice/reviewMode';

test('확인할 거래에는 미확인 또는 모르는 거래만 노출한다', () => {
  const reviewedRecords = applyTransactionReviews(TX_RECORDS, {
    1: 'unknown',
    3: 'known',
  });

  assert.deepEqual(
    filterReviewTransactions(reviewedRecords).map((record) => record.id),
    [1],
  );
});

test('송금 어려움 데이터는 유효한 항목과 완료 상태를 보존한다', () => {
  const difficulties = sanitizeTransferDifficulties([
    {
      id: 'difficulty-1',
      step: 'account',
      reason: 'inputError',
      occurredAt: '2026-09-08',
      completed: false,
    },
    { id: '', step: 'account', occurredAt: '2026-09-08', completed: false },
    { id: 'difficulty-2', step: 'unknown', occurredAt: '2026-09-08', completed: false },
  ]);

  assert.equal(difficulties.length, 1);
  assert.equal(TRANSFER_DIFFICULTY_COPY.account.title, '계좌번호 입력하기');
  assert.doesNotMatch(TRANSFER_DIFFICULTY_COPY.account.description, /실패|오답|못함|취약/);
  assert.equal(isReviewableTransferStep('account'), true);
  assert.equal(isReviewableTransferStep('bank'), false);

  const restored = mergeTransferDifficultyCompletion(
    [{ ...difficulties[0], completed: false }],
    [{ ...difficulties[0], completed: true }],
  );
  assert.equal(restored[0].completed, true);
});

test('맞춤 복습은 요청한 송금 단계부터 시작한다', () => {
  assert.equal(screenForReviewStep('recipient'), 'practiceRecipient');
  assert.equal(screenForReviewStep('account'), 'practiceRecipient');
  assert.equal(screenForReviewStep('amount'), 'practiceAmount');
  assert.equal(screenForReviewStep('voice'), 'practiceVoice');

  const account = initialStateForReviewStep('account');
  assert.equal(account.screen, 'practiceReviewIntro');
  assert.equal(account.practiceRecipientChoice, 'new');
  assert.equal(account.practiceRecipient, '');
});

test('송금 화면의 선제 도움은 연습 가능한 단계로 이어진다', () => {
  assert.equal(reviewStepForTransferScreen('listening'), 'voice');
  assert.equal(reviewStepForTransferScreen('recipient'), 'recipient');
  assert.equal(reviewStepForTransferScreen('bankselect'), 'recipient');
  assert.equal(reviewStepForTransferScreen('accountinput'), 'account');
  assert.equal(reviewStepForTransferScreen('ocrfailure'), 'account');
  assert.equal(reviewStepForTransferScreen('amountinput'), 'amount');
  assert.equal(reviewStepForTransferScreen('pretransfer'), 'amount');
  assert.equal(reviewStepForTransferScreen('password'), null);
});

test('신규 수취인 일일 미션은 음성 송금과 조합하지 않는다', () => {
  const values = [0.9, 0.9, 0.1, 0.9, 0.5];
  const mission = generateDailyMission('2026-09-08', () => values.shift() ?? 0);

  assert.equal(mission.recipientType, 'new');
  assert.equal(mission.inputMethod, 'manual');
});
