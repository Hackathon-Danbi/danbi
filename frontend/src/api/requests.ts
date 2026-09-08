import type * as Contract from './contracts';
import { apiRequest } from './client';
import { API_ENDPOINTS, withPathParam } from './endpoints';

function multipart(fields: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

/**
 * 명세의 56개 요청 함수. 현재 feature 코드에서는 이 파일을 import하지 않으므로
 * 네트워크 요청은 발생하지 않는다. 백엔드 완료 후 필요한 화면의 `API 연결 대기` 주석을
 * 해제해 사용한다.
 */
export const onboardingApi = {
  start: () =>
    apiRequest<Contract.StartOnboardingResponse>({
      ...API_ENDPOINTS.onboarding.start,
    }),
  saveName: (body: Contract.SaveOnboardingNameRequest) =>
    apiRequest<Contract.SaveOnboardingNameResponse>({
      ...API_ENDPOINTS.onboarding.saveName,
      body,
    }),
  savePhoneOwnership: (body: Contract.SavePhoneOwnershipRequest) =>
    apiRequest<Contract.SavePhoneOwnershipResponse>({
      ...API_ENDPOINTS.onboarding.savePhoneOwnership,
      body,
    }),
  getCarriers: () =>
    apiRequest<Contract.GetCarriersResponse>({
      ...API_ENDPOINTS.onboarding.getCarriers,
    }),
  getTerms: (type: Contract.TermsType) =>
    apiRequest<Contract.GetTermsResponse>({
      ...API_ENDPOINTS.onboarding.getTerms,
      query: { type },
    }),
  agreeTerms: (body: Contract.AgreeTermsRequest) =>
    apiRequest<Contract.AgreeTermsResponse>({
      ...API_ENDPOINTS.onboarding.agreeTerms,
      body,
    }),
  sendPhoneVerification: (body: Contract.SendPhoneVerificationRequest) =>
    apiRequest<Contract.PhoneVerificationSessionResponse>({
      ...API_ENDPOINTS.onboarding.sendPhoneVerification,
      body,
    }),
  resendPhoneVerification: (body: Contract.ResendPhoneVerificationRequest) =>
    apiRequest<Contract.PhoneVerificationSessionResponse>({
      ...API_ENDPOINTS.onboarding.resendPhoneVerification,
      body,
    }),
  confirmPhoneVerification: (body: Contract.ConfirmPhoneVerificationRequest) =>
    apiRequest<Contract.ConfirmPhoneVerificationResponse>({
      ...API_ENDPOINTS.onboarding.confirmPhoneVerification,
      body,
    }),
  startCertificateIssuance: (body: Contract.StartCertificateIssuanceRequest) =>
    apiRequest<Contract.StartCertificateIssuanceResponse>({
      ...API_ENDPOINTS.onboarding.startCertificateIssuance,
      body,
    }),
  scanIdCard: ({ image, ...fields }: Contract.ScanIdCardRequest) =>
    apiRequest<Contract.ScanIdCardResponse>({
      ...API_ENDPOINTS.onboarding.scanIdCard,
      body: multipart({ ...fields, image }),
    }),
  confirmIdCard: (body: Contract.ConfirmIdCardRequest) =>
    apiRequest<Contract.ConfirmIdCardResponse>({
      ...API_ENDPOINTS.onboarding.confirmIdCard,
      body,
    }),
  verifyFace: ({ faceImage, ...fields }: Contract.VerifyFaceRequest) =>
    apiRequest<Contract.VerifyFaceResponse>({
      ...API_ENDPOINTS.onboarding.verifyFace,
      body: multipart({ ...fields, faceImage }),
    }),
  findAccount: (body: Contract.FindCertificateAccountRequest) =>
    apiRequest<Contract.CertificateAccountResponse>({
      ...API_ENDPOINTS.onboarding.findAccount,
      body,
    }),
  verifyAccountPassword: (accountId: number, body: Contract.VerifyAccountPasswordRequest) =>
    apiRequest<Contract.VerifyAccountPasswordResponse>({
      ...API_ENDPOINTS.onboarding.verifyAccountPassword,
      path: withPathParam(
        API_ENDPOINTS.onboarding.verifyAccountPassword.path,
        'accountId',
        accountId,
      ),
      body,
    }),
  sendOneWonVerification: (accountId: number, body: Contract.SendOneWonVerificationRequest) =>
    apiRequest<Contract.SendOneWonVerificationResponse>({
      ...API_ENDPOINTS.onboarding.sendOneWonVerification,
      path: withPathParam(
        API_ENDPOINTS.onboarding.sendOneWonVerification.path,
        'accountId',
        accountId,
      ),
      body,
    }),
  confirmOneWonVerification: (accountId: number, body: Contract.ConfirmOneWonVerificationRequest) =>
    apiRequest<Contract.ConfirmOneWonVerificationResponse>({
      ...API_ENDPOINTS.onboarding.confirmOneWonVerification,
      path: withPathParam(
        API_ENDPOINTS.onboarding.confirmOneWonVerification.path,
        'accountId',
        accountId,
      ),
      body,
    }),
  setCertificatePassword: (body: Contract.SetCertificatePasswordRequest) =>
    apiRequest<Contract.SetCertificatePasswordResponse>({
      ...API_ENDPOINTS.onboarding.setCertificatePassword,
      body,
    }),
  complete: (onboardingSessionId: Contract.OnboardingSessionId) =>
    apiRequest<Contract.CompleteOnboardingResponse>({
      ...API_ENDPOINTS.onboarding.complete,
      query: { onboardingSessionId },
    }),
  getCurrentUser: (accessToken: string) =>
    apiRequest<Contract.CurrentUserResponse>({
      ...API_ENDPOINTS.onboarding.getCurrentUser,
      accessToken,
    }),
};

export const helpApi = {
  connectAgent: (body: Contract.ConnectAgentRequest) =>
    apiRequest<Contract.ConnectAgentResponse>({
      ...API_ENDPOINTS.help.connectAgent,
      body,
    }),
  getTrigger: (query: Contract.GetHelpTriggerQuery) =>
    apiRequest<Contract.GetHelpTriggerResponse>({
      ...API_ENDPOINTS.help.getTrigger,
      query,
    }),
  createBehaviorEvent: (body: Contract.CreateBehaviorEventRequest) =>
    apiRequest<Contract.CreateBehaviorEventResponse>({
      ...API_ENDPOINTS.help.createBehaviorEvent,
      body,
    }),
  getRetryStatus: (authType: string) =>
    apiRequest<Contract.GetRetryStatusResponse>({
      ...API_ENDPOINTS.help.getRetryStatus,
      query: { authType },
    }),
  getAgentAvailability: () =>
    apiRequest<Contract.AgentAvailabilityResponse>({
      ...API_ENDPOINTS.help.getAgentAvailability,
    }),
};

export const savingsApi = {
  getAll: () =>
    apiRequest<Contract.GetSavingsResponse>({
      ...API_ENDPOINTS.savings.getAll,
    }),
  getDeposit: (accountId: number) =>
    apiRequest<Contract.DepositDetailResponse>({
      ...API_ENDPOINTS.savings.getDeposit,
      path: withPathParam(API_ENDPOINTS.savings.getDeposit.path, 'accountId', accountId),
    }),
  getInstallment: (accountId: number) =>
    apiRequest<Contract.InstallmentDetailResponse>({
      ...API_ENDPOINTS.savings.getInstallment,
      path: withPathParam(API_ENDPOINTS.savings.getInstallment.path, 'accountId', accountId),
    }),
  queryByVoice: (body: Contract.SavingsVoiceQueryRequest) =>
    apiRequest<Contract.SavingsVoiceQueryResponse>({
      ...API_ENDPOINTS.savings.queryByVoice,
      body,
    }),
};

export const practiceApi = {
  getMissions: () =>
    apiRequest<Contract.GetPracticeMissionsResponse>({
      ...API_ENDPOINTS.practice.getMissions,
    }),
  startSession: (body: Contract.StartPracticeSessionRequest) =>
    apiRequest<Contract.StartPracticeSessionResponse>({
      ...API_ENDPOINTS.practice.startSession,
      body,
    }),
  getAccounts: () =>
    apiRequest<Contract.GetPracticeAccountsResponse>({
      ...API_ENDPOINTS.practice.getAccounts,
    }),
  recognizeVoice: ({ audio, sessionId }: Contract.PracticeVoiceRecognitionRequest) =>
    apiRequest<Contract.PracticeVoiceRecognitionResponse>({
      ...API_ENDPOINTS.practice.recognizeVoice,
      body: multipart({ sessionId, audio }),
    }),
  executeTransfer: (sessionId: string, body: Contract.ExecutePracticeTransferRequest) =>
    apiRequest<Contract.PracticeResultResponse>({
      ...API_ENDPOINTS.practice.executeTransfer,
      path: withPathParam(API_ENDPOINTS.practice.executeTransfer.path, 'sessionId', sessionId),
      body,
    }),
  getResult: (sessionId: string) =>
    apiRequest<Contract.GetPracticeResultResponse>({
      ...API_ENDPOINTS.practice.getResult,
      path: withPathParam(API_ENDPOINTS.practice.getResult.path, 'sessionId', sessionId),
    }),
  getTodayActivity: () =>
    apiRequest<Contract.TodayActivityResponse>({
      ...API_ENDPOINTS.practice.getTodayActivity,
    }),
  completeDailyPractice: (dailyActivityId: number, body: Contract.CompleteDailyPracticeRequest) =>
    apiRequest<Contract.CompleteDailyPracticeResponse>({
      ...API_ENDPOINTS.practice.completeDailyPractice,
      path: withPathParam(
        API_ENDPOINTS.practice.completeDailyPractice.path,
        'dailyActivityId',
        dailyActivityId,
      ),
      body,
    }),
  submitQuizAnswer: (dailyActivityId: number, body: Contract.SubmitQuizAnswerRequest) =>
    apiRequest<Contract.SubmitQuizAnswerResponse>({
      ...API_ENDPOINTS.practice.submitQuizAnswer,
      path: withPathParam(
        API_ENDPOINTS.practice.submitQuizAnswer.path,
        'dailyActivityId',
        dailyActivityId,
      ),
      body,
    }),
};

export const transferApi = {
  recognizeVoice: ({ audio }: Contract.RecognizeTransferVoiceRequest) =>
    apiRequest<Contract.RecognizeTransferVoiceResponse>({
      ...API_ENDPOINTS.transfer.recognizeVoice,
      body: multipart({ audio }),
    }),
  getBanks: () =>
    apiRequest<Contract.GetBanksResponse>({
      ...API_ENDPOINTS.transfer.getBanks,
    }),
  getSavedRecipients: () =>
    apiRequest<Contract.GetSavedRecipientsResponse>({
      ...API_ENDPOINTS.transfer.getSavedRecipients,
    }),
  saveRecipient: (body: Contract.SaveRecipientRequest) =>
    apiRequest<Contract.SaveRecipientResponse>({
      ...API_ENDPOINTS.transfer.saveRecipient,
      body,
    }),
  deleteSavedRecipient: (savedRecipientId: number) =>
    apiRequest<Contract.DeleteSavedRecipientResponse>({
      ...API_ENDPOINTS.transfer.deleteSavedRecipient,
      path: withPathParam(
        API_ENDPOINTS.transfer.deleteSavedRecipient.path,
        'savedRecipientId',
        savedRecipientId,
      ),
    }),
  findAccountHolder: (body: Contract.FindAccountHolderRequest) =>
    apiRequest<Contract.AccountHolderResponse>({
      ...API_ENDPOINTS.transfer.findAccountHolder,
      body,
    }),
  checkRisk: (query: Contract.TransferRiskQuery) =>
    apiRequest<Contract.TransferRiskResponse>({
      ...API_ENDPOINTS.transfer.checkRisk,
      query,
    }),
  execute: (body: Contract.ExecuteTransferRequest) =>
    apiRequest<Contract.ExecuteTransferResponse>({
      ...API_ENDPOINTS.transfer.execute,
      body,
    }),
  getResult: (transferId: number) =>
    apiRequest<Contract.TransferResultResponse>({
      ...API_ENDPOINTS.transfer.getResult,
      path: withPathParam(API_ENDPOINTS.transfer.getResult.path, 'transferId', transferId),
    }),
  saveCallIntent: (body: Contract.SaveCallTransferIntentRequest) =>
    apiRequest<Contract.SaveCallTransferIntentResponse>({
      ...API_ENDPOINTS.transfer.saveCallIntent,
      body,
    }),
  setCallRecipient: (body: Contract.SetCallTransferRecipientRequest) =>
    apiRequest<Contract.SetCallTransferRecipientResponse>({
      ...API_ENDPOINTS.transfer.setCallRecipient,
      body,
    }),
};

export const transactionsApi = {
  getAll: (query: Contract.GetTransactionsQuery) =>
    apiRequest<Contract.GetTransactionsResponse>({
      ...API_ENDPOINTS.transactions.getAll,
      query,
    }),
  getUnreadSummary: () =>
    apiRequest<Contract.UnreadSummaryResponse>({
      ...API_ENDPOINTS.transactions.getUnreadSummary,
    }),
  getUnreadByAccount: () =>
    apiRequest<Contract.UnreadByAccountResponse>({
      ...API_ENDPOINTS.transactions.getUnreadByAccount,
    }),
  review: (transactionId: number, body: Contract.ReviewTransactionRequest) =>
    apiRequest<Contract.ReviewTransactionResponse>({
      ...API_ENDPOINTS.transactions.review,
      path: withPathParam(API_ENDPOINTS.transactions.review.path, 'transactionId', transactionId),
      body,
    }),
};

export const voiceApi = {
  recognize: ({ audio }: Contract.VoiceRecognitionRequest) =>
    apiRequest<Contract.VoiceRecognitionResponse>({
      ...API_ENDPOINTS.voice.recognize,
      body: multipart({ audio }),
    }),
  query: (body: Contract.VoiceQueryRequest) =>
    apiRequest<Contract.VoiceQueryResponse>({
      ...API_ENDPOINTS.voice.query,
      body,
    }),
  getUnreadSummary: () =>
    apiRequest<Contract.VoiceUnreadSummaryResponse>({
      ...API_ENDPOINTS.voice.getUnreadSummary,
    }),
};
