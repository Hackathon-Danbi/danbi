import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bankCodeOf,
  fromReviewStatus,
  mapTransaction,
  toIdCardType,
  toPhoneCarrier,
  toReviewStatus,
} from '../src/lib/api/map';

test('onboarding enums map to backend codes', () => {
  assert.equal(toPhoneCarrier('SKT'), 'SKT');
  assert.equal(toPhoneCarrier('LG U+'), 'LG_U_PLUS');
  assert.equal(toPhoneCarrier('알뜰폰'), 'MVNO');
  assert.equal(toIdCardType('주민등록증'), 'RESIDENT_CARD');
  assert.equal(toIdCardType('운전면허증'), 'DRIVER_LICENSE');
  assert.equal(bankCodeOf('KB국민은행'), '004');
});

test('transaction payload maps into the history card shape', () => {
  const row = mapTransaction({
    transactionId: 42,
    accountId: 1,
    transactionType: 'WITHDRAWAL',
    description: '김민수',
    amount: 80000,
    occurredAt: '2026-08-29T14:10:00',
    reviewStatus: 'PENDING',
  });
  assert.equal(row.id, 42);
  assert.equal(row.amount, -80000);
  assert.equal(row.merchant, '김민수');
  assert.equal(row.reviewStatus, 'pending');
  assert.equal(toReviewStatus('KNOWN'), 'known');
  assert.equal(fromReviewStatus('unknown'), 'UNKNOWN');
});
