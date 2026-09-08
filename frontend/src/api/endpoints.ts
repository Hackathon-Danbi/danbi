export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type Endpoint = Readonly<{
  method: ApiMethod;
  path: string;
}>;

const endpoint = (method: ApiMethod, path: string): Endpoint => ({
  method,
  path,
});

/** Notion API 명세서에 등록된 56개 엔드포인트. */
export const API_ENDPOINTS = {
  onboarding: {
    start: endpoint('POST', '/api/onboarding/sessions'),
    saveName: endpoint('POST', '/api/onboarding/name'),
    savePhoneOwnership: endpoint('POST', '/api/onboarding/phone/ownership'),
    getCarriers: endpoint('GET', '/api/onboarding/carriers'),
    getTerms: endpoint('GET', '/onboarding/terms'),
    agreeTerms: endpoint('POST', '/onboarding/terms/agree'),
    sendPhoneVerification: endpoint('POST', '/api/onboarding/phone/verify/send'),
    resendPhoneVerification: endpoint('POST', '/api/onboarding/phone/verify/resend'),
    confirmPhoneVerification: endpoint('POST', '/api/onboarding/phone/verify/confirm'),
    startCertificateIssuance: endpoint('POST', '/api/certificate/issuance'),
    scanIdCard: endpoint('POST', '/api/certificate/id-card/scan'),
    confirmIdCard: endpoint('POST', '/api/certificate/id-card/confirm'),
    verifyFace: endpoint('POST', '/api/certificate/face/verify'),
    findAccount: endpoint('POST', '/api/certificate/accounts'),
    verifyAccountPassword: endpoint(
      'POST',
      '/api/certificate/accounts/{accountId}/password/verify',
    ),
    sendOneWonVerification: endpoint('POST', '/api/certificate/accounts/{accountId}/verify/send'),
    confirmOneWonVerification: endpoint(
      'POST',
      '/api/certificate/accounts/{accountId}/verify/confirm',
    ),
    setCertificatePassword: endpoint('POST', '/api/certificate/password'),
    complete: endpoint('GET', '/api/onboarding/complete'),
    getCurrentUser: endpoint('GET', '/api/users/me'),
  },
  help: {
    connectAgent: endpoint('POST', '/help/agent-connect'),
    getTrigger: endpoint('GET', '/help/trigger'),
    createBehaviorEvent: endpoint('POST', '/help/behavior-events'),
    getRetryStatus: endpoint('GET', '/auth/retry-status'),
    getAgentAvailability: endpoint('GET', '/help/agent-availability'),
  },
  savings: {
    getAll: endpoint('GET', '/savings'),
    getDeposit: endpoint('GET', '/savings/deposits/{accountId}'),
    getInstallment: endpoint('GET', '/savings/installments/{accountId}'),
    queryByVoice: endpoint('POST', '/savings/voice/query'),
  },
  practice: {
    getMissions: endpoint('GET', '/practice/missions'),
    startSession: endpoint('POST', '/practice/sessions'),
    getAccounts: endpoint('GET', '/practice/accounts'),
    recognizeVoice: endpoint('POST', '/practice/voice/recognize'),
    executeTransfer: endpoint('POST', '/practice/sessions/{sessionId}/transfer'),
    getResult: endpoint('GET', '/practice/sessions/{sessionId}/result'),
    getTodayActivity: endpoint('GET', '/daily-activities/today'),
    completeDailyPractice: endpoint('PATCH', '/daily-activities/{dailyActivityId}/practice'),
    submitQuizAnswer: endpoint('POST', '/daily-activities/{dailyActivityId}/answer'),
  },
  transfer: {
    recognizeVoice: endpoint('POST', '/transfer/voice/recognize'),
    getBanks: endpoint('GET', '/transfer/banks'),
    getSavedRecipients: endpoint('GET', '/saved-recipients'),
    saveRecipient: endpoint('POST', '/saved-recipients'),
    deleteSavedRecipient: endpoint('DELETE', '/saved-recipients/{savedRecipientId}'),
    findAccountHolder: endpoint('POST', '/transfer/account-holder'),
    checkRisk: endpoint('GET', '/transfer/risk-check'),
    execute: endpoint('POST', '/transfer/execute'),
    getResult: endpoint('GET', '/transfer/{transferId}'),
    saveCallIntent: endpoint('POST', '/call-transfer/intent'),
    setCallRecipient: endpoint('POST', '/call-transfer/recipient'),
  },
  transactions: {
    getAll: endpoint('GET', '/transactions'),
    getUnreadSummary: endpoint('GET', '/transactions/unread/summary'),
    getUnreadByAccount: endpoint('GET', '/transactions/unread/by-account'),
    review: endpoint('PATCH', '/transactions/{transactionId}/review'),
  },
  voice: {
    recognize: endpoint('POST', '/voice/recognize'),
    query: endpoint('POST', '/voice/query'),
    getUnreadSummary: endpoint('GET', '/voice/unread-summary'),
  },
} as const;

export function withPathParam(path: string, key: string, value: string | number): string {
  return path.replace(`{${key}}`, encodeURIComponent(String(value)));
}
