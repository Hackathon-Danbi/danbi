import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_ENDPOINTS, joinApiUrl } from '../src/api/endpoints';
import { isApiCircuitOpen, isApiConfigured } from '../src/api/client';
import {
  PRACTICE_PASSWORD,
  PRACTICE_PASSWORD_LENGTH,
} from '../src/features/practice/practicePassword';

test('selected Notion APIs keep the documented /api prefix', () => {
  assert.equal(API_ENDPOINTS.dailyActivity.today, '/api/daily-activities/today');
  assert.equal(API_ENDPOINTS.dailyActivity.answer(301), '/api/daily-activities/301/answer');
  assert.equal(API_ENDPOINTS.dailyActivity.practice(301), '/api/daily-activities/301/practice');

  assert.equal(API_ENDPOINTS.practice.missions, '/api/practice/missions');
  assert.equal(API_ENDPOINTS.practice.sessions, '/api/practice/sessions');
  assert.equal(API_ENDPOINTS.practice.accounts, '/api/practice/accounts');
  assert.equal(API_ENDPOINTS.practice.recognizeVoice, '/api/practice/voice/recognize');
  assert.equal(API_ENDPOINTS.practice.transfer('session/1'), '/api/practice/sessions/session%2F1/transfer');
  assert.equal(API_ENDPOINTS.practice.result('session/1'), '/api/practice/sessions/session%2F1/result');

  assert.equal(API_ENDPOINTS.savings.list, '/api/savings');
  assert.equal(API_ENDPOINTS.savings.deposit(10), '/api/savings/deposits/10');
  assert.equal(API_ENDPOINTS.savings.installment(20), '/api/savings/installments/20');
  assert.equal(API_ENDPOINTS.savings.voiceQuery, '/api/savings/voice/query');

  assert.equal(API_ENDPOINTS.voice.recognize, '/api/voice/recognize');
  assert.equal(API_ENDPOINTS.voice.query, '/api/voice/query');
  assert.equal(API_ENDPOINTS.voice.unreadSummary, '/api/voice/unread-summary');
});

test('API base URL and endpoint are joined without duplicate slashes', () => {
  assert.equal(joinApiUrl('http://localhost:8080/', '/api/savings'), 'http://localhost:8080/api/savings');
});

test('practice transfer uses the backend practice password contract', () => {
  assert.equal(PRACTICE_PASSWORD, '1234');
  assert.equal(PRACTICE_PASSWORD_LENGTH, 4);
});

test('api client without a base URL is unconfigured and its circuit starts closed', () => {
  assert.equal(isApiConfigured(), false);
  assert.equal(isApiCircuitOpen(), false);
});
