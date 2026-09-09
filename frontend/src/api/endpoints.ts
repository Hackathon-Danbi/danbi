export const API_ENDPOINTS = {
  dailyActivity: {
    today: '/api/daily-activities/today',
    answer: (dailyActivityId: number) => `/api/daily-activities/${dailyActivityId}/answer`,
    practice: (dailyActivityId: number) => `/api/daily-activities/${dailyActivityId}/practice`,
  },
  practice: {
    missions: '/api/practice/missions',
    sessions: '/api/practice/sessions',
    accounts: '/api/practice/accounts',
    recognizeVoice: '/api/practice/voice/recognize',
    transfer: (sessionId: string) => `/api/practice/sessions/${encodeURIComponent(sessionId)}/transfer`,
    result: (sessionId: string) => `/api/practice/sessions/${encodeURIComponent(sessionId)}/result`,
  },
  savings: {
    list: '/api/savings',
    deposit: (accountId: number) => `/api/savings/deposits/${accountId}`,
    installment: (accountId: number) => `/api/savings/installments/${accountId}`,
    voiceQuery: '/api/savings/voice/query',
  },
  voice: {
    recognize: '/api/voice/recognize',
    query: '/api/voice/query',
    unreadSummary: '/api/voice/unread-summary',
  },
} as const;

export function joinApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
