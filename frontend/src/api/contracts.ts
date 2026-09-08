/**
 * Notion `API 명세서`의 요청/응답 계약.
 *
 * 화면은 아직 이 타입을 사용하는 API 요청을 호출하지 않는다. 백엔드 필드가 확정되면
 * mock view-model과 이 계약 사이의 변환을 한 곳에서만 처리할 수 있도록 분리해 둔다.
 */

export type ISODate = string;
export type ISODateTime = string;
export type OnboardingSessionId = string;
export type IssuanceId = string;
export type VerificationSessionId = string;
export type VerificationId = string;
export type PracticeSessionId = string;

export type OnboardingStep =
  | 'NAME_INPUT'
  | 'PHONE_OWNERSHIP'
  | 'CARRIER_SELECTION'
  | 'CERTIFICATE_ISSUANCE'
  | 'CERTIFICATE_TERMS'
  | 'ID_CARD_SCAN'
  | 'ID_CARD_CONFIRMATION'
  | 'FACE_VERIFICATION'
  | 'ACCOUNT_VERIFICATION'
  | 'ACCOUNT_PASSWORD_VERIFICATION'
  | 'ONE_WON_VERIFICATION'
  | 'PASSWORD_SETUP'
  | 'COMPLETED';

export type CarrierCode = 'SKT' | 'KT' | 'LGU_PLUS' | 'MVNO';
export type IdCardType = 'RESIDENT_CARD' | 'DRIVER_LICENSE';
export type FaceDirection = 'FRONT' | 'RIGHT' | 'LEFT';
export type AccountVerificationMethod = 'ACCOUNT_PASSWORD' | 'ONE_WON';

export interface StartOnboardingResponse {
  onboardingSessionId: OnboardingSessionId;
  onboardingStep: OnboardingStep;
  estimatedMinutes: number;
}

export interface SaveOnboardingNameRequest {
  onboardingSessionId: OnboardingSessionId;
  name: string;
}

export interface SaveOnboardingNameResponse extends SaveOnboardingNameRequest {
  onboardingStep: OnboardingStep;
}

export interface SavePhoneOwnershipRequest {
  onboardingSessionId: OnboardingSessionId;
  isOwner: boolean;
}

export interface SavePhoneOwnershipResponse extends SavePhoneOwnershipRequest {
  onboardingStep: OnboardingStep;
}

export interface CarrierItem {
  code: CarrierCode;
  name: string;
}

export interface GetCarriersResponse {
  carriers: CarrierItem[];
}

export type TermsType = 'required' | 'optional';

export interface TermItem {
  termId: number;
  title: string;
  termType: string;
  isRequired: boolean;
  version: string;
  content: string;
}

export interface GetTermsResponse {
  terms: TermItem[];
}

export interface AgreeTermsRequest {
  termIds: number[];
  agreed: boolean;
}

export interface AgreeTermsResponse {
  agreementIds: number[];
  agreedAt: ISODateTime;
}

export interface SendPhoneVerificationRequest {
  onboardingSessionId: OnboardingSessionId;
  carrier: CarrierCode;
  phoneNumber: string;
}

export interface PhoneVerificationSessionResponse {
  onboardingSessionId: OnboardingSessionId;
  verificationSessionId: VerificationSessionId;
  expiresInSeconds: number;
}

export interface ResendPhoneVerificationRequest {
  onboardingSessionId: OnboardingSessionId;
  verificationSessionId: VerificationSessionId;
}

export interface ConfirmPhoneVerificationRequest extends ResendPhoneVerificationRequest {
  verificationCode: string;
}

export interface ConfirmPhoneVerificationResponse extends ResendPhoneVerificationRequest {
  identityVerified: boolean;
  onboardingStep: OnboardingStep;
}

export interface StartCertificateIssuanceRequest {
  onboardingSessionId: OnboardingSessionId;
}

export interface StartCertificateIssuanceResponse extends StartCertificateIssuanceRequest {
  issuanceId: IssuanceId;
  onboardingStep: OnboardingStep;
}

export interface ScanIdCardRequest {
  issuanceId: IssuanceId;
  idCardType: IdCardType;
  image: Blob;
}

export interface ScanIdCardResponse {
  issuanceId: IssuanceId;
  scanId: string;
  idCardType: IdCardType;
  recognizedName: string;
  maskedIdNumber: string;
  issueDate: ISODate;
  onboardingStep: OnboardingStep;
}

export interface ConfirmIdCardRequest {
  issuanceId: IssuanceId;
  scanId: string;
  confirmed: boolean;
}

export interface ConfirmIdCardResponse extends ConfirmIdCardRequest {
  onboardingStep: OnboardingStep;
}

export interface VerifyFaceRequest {
  issuanceId: IssuanceId;
  scanId: string;
  faceDirection: FaceDirection;
  faceImage: Blob;
}

export interface VerifyFaceResponse {
  issuanceId: IssuanceId;
  faceDirection: FaceDirection;
  nextDirection: FaceDirection | null;
  verified: boolean | null;
  onboardingStep: OnboardingStep;
}

export interface FindCertificateAccountRequest {
  issuanceId: IssuanceId;
  bankCode: string;
  accountNumber: string;
}

export interface CertificateAccountResponse {
  issuanceId: IssuanceId;
  accountId: number;
  bankCode: string;
  bankName: string;
  maskedAccountNumber: string;
  verificationMethod: AccountVerificationMethod;
  onboardingStep: OnboardingStep;
}

export interface VerifyAccountPasswordRequest {
  issuanceId: IssuanceId;
  accountPassword: string;
}

export interface VerifyAccountPasswordResponse {
  issuanceId: IssuanceId;
  accountId: number;
  verified: boolean;
  onboardingStep: OnboardingStep;
}

export interface SendOneWonVerificationRequest {
  issuanceId: IssuanceId;
}

export interface SendOneWonVerificationResponse {
  issuanceId: IssuanceId;
  accountId: number;
  verificationId: VerificationId;
  expiresInSeconds: number;
  onboardingStep: OnboardingStep;
}

export interface ConfirmOneWonVerificationRequest {
  issuanceId: IssuanceId;
  verificationId: VerificationId;
  verificationCode: string;
}

export interface ConfirmOneWonVerificationResponse {
  issuanceId: IssuanceId;
  accountId: number;
  verificationId: VerificationId;
  verified: boolean;
  onboardingStep: OnboardingStep;
}

export interface SetCertificatePasswordRequest {
  issuanceId: IssuanceId;
  password: string;
  passwordConfirm: string;
}

export interface SetCertificatePasswordResponse {
  issuanceId: IssuanceId;
  certificateIssued: boolean;
  onboardingStep: OnboardingStep;
}

export interface CompleteOnboardingResponse {
  onboardingSessionId: OnboardingSessionId;
  userId: number;
  name: string;
  certificateIssued: boolean;
  onboardingStep: OnboardingStep;
}

export interface CurrentUserResponse {
  userId: number;
  name: string;
}

export type HelpStage = 'HIGHLIGHT' | 'VOICE_GUIDE' | 'AGENT';

export interface ConnectAgentRequest {
  screenId: string;
  errorType: string;
}

export interface ConnectAgentResponse {
  channel: 'AGENT';
  available: boolean;
  contact: string;
}

export interface GetHelpTriggerQuery {
  flowSessionId: string;
  flowType: string;
  screenId: string;
}

export interface GetHelpTriggerResponse {
  triggered: boolean;
  helpStage: HelpStage;
  message: string;
  audioUrl: string | null;
}

export interface CreateBehaviorEventRequest {
  flowSessionId: string;
  flowType: string;
  screenId: string;
  eventType: string;
  reasonCode?: string;
  eventValue?: string | number | boolean;
  transferId?: number;
}

export interface CreateBehaviorEventResponse {
  eventId: number;
  triggered: boolean;
}

export interface GetRetryStatusResponse {
  failureCount: number;
  remainingAttempts: number;
  nextAction: 'RETRY' | 'AGENT' | 'BRANCH';
  message: string;
}

/** 명세의 상담원 운영시간 응답 필드는 아직 비어 있어 확정 전 unknown으로 둔다. */
export type AgentAvailabilityResponse = Record<string, unknown>;

export type SavingsProductType = 'TIME_DEPOSIT' | 'FIXED_SAVINGS' | 'FREE_SAVINGS';
export type PaymentStatus = 'PAID' | 'SCHEDULED' | 'MISSED';

export interface CurrentMonthPayment {
  paymentDate: ISODate;
  scheduledAmount: number;
  amount: number;
  status: PaymentStatus;
}

export interface SavingsProductSummary {
  accountId: number;
  productName: string;
  productType: SavingsProductType;
  balance: number;
  appliedInterestRate: number;
  maturityAt: ISODate;
  remainingMonths: number;
  currentMonthPayment: CurrentMonthPayment | null;
}

export interface GetSavingsResponse {
  savings: SavingsProductSummary[];
}

export interface DepositDetailResponse {
  accountId: number;
  contractId: number;
  productName: string;
  productType: 'TIME_DEPOSIT';
  balance: number;
  appliedInterestRate: number;
  expectedMaturityAmount: number;
  openedAt: ISODate;
  maturityAt: ISODate;
  additionalPaymentAllowed: boolean;
}

export interface InstallmentDetailResponse {
  accountId: number;
  contractId: number;
  productName: string;
  productType: 'FIXED_SAVINGS' | 'FREE_SAVINGS';
  balance: number;
  appliedInterestRate: number;
  expectedMaturityAmount: number;
  maturityAt: ISODate;
  currentMonthPayment: CurrentMonthPayment | null;
}

export interface SavingsVoiceQueryRequest {
  productId: number;
  queryText: string;
}

export interface SavingsVoiceQueryResponse {
  answerText: string;
  audioUrl: string | null;
  accountId: number;
}

export type MissionType = 'TRANSFER';

export interface PracticeMission {
  missionId: number;
  missionType: MissionType;
  title: string;
  description: string;
  scoreReward: number;
}

export interface GetPracticeMissionsResponse {
  missions: PracticeMission[];
}

export type PracticeMode = 'GUIDED' | 'SOLO';
export type PracticeInputType = 'VOICE' | 'MANUAL';

export interface StartPracticeSessionRequest {
  mode: PracticeMode;
  inputType: PracticeInputType;
  missionId: number;
}

export interface StartPracticeSessionResponse {
  sessionId: PracticeSessionId;
  mission: PracticeMission;
  mode: PracticeMode;
  inputType: PracticeInputType;
}

export interface PracticeAccount {
  accountId: number;
  recipientName: string;
  bankCode: string;
  accountNumber: string;
}

export interface GetPracticeAccountsResponse {
  accounts: PracticeAccount[];
}

export interface PracticeVoiceRecognitionRequest {
  sessionId: PracticeSessionId;
  audio: Blob;
}

export interface PracticeVoiceRecognitionResponse {
  recognizedText: string;
  recipientName: string;
  amount: number;
  matchesMission: boolean;
}

export interface ExecutePracticeTransferRequest {
  accountId: number;
  amount: number;
  practicePassword: string;
}

export interface PracticeResultResponse {
  practiceCompleted: boolean;
  earnedScore: number;
  actualTransferCreated: false;
}

export interface GetPracticeResultResponse extends PracticeResultResponse {
  steps: ('RECIPIENT' | 'AMOUNT' | 'CONFIRM' | 'PASSWORD')[];
}

export interface DailyQuestion {
  questionId: number;
  questionText: string;
  selectedAnswer: boolean | null;
}

export interface TodayActivityResponse {
  dailyActivityId: number;
  activityDate: ISODate;
  question: DailyQuestion;
  mission: PracticeMission;
  practiceCompleted: boolean;
  earnedScore: number;
}

export interface CompleteDailyPracticeRequest {
  missionId: number;
  practiceCompleted: boolean;
}

export interface CompleteDailyPracticeResponse extends CompleteDailyPracticeRequest {
  dailyActivityId: number;
  earnedScore: number;
}

export interface SubmitQuizAnswerRequest {
  selectedAnswer: boolean;
}

export interface SubmitQuizAnswerResponse {
  questionId: number;
  selectedAnswer: boolean;
  correct: boolean;
  correctAnswer: boolean;
  explanation: string;
  earnedScore: number;
}

export interface BankItem {
  bankCode: string;
  bankName: string;
}

export interface GetBanksResponse {
  banks: BankItem[];
}

export interface SavedRecipient {
  savedRecipientId: number;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  nickname: string | null;
}

export interface GetSavedRecipientsResponse {
  recipients: SavedRecipient[];
}

export interface SaveRecipientRequest {
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientName: string;
  nickname: string | null;
}

export interface SaveRecipientResponse {
  recipients: SavedRecipient[];
}

export interface DeleteSavedRecipientResponse {
  deleted: boolean;
  savedRecipientId: number;
}

export interface FindAccountHolderRequest {
  bankCode: string;
  accountNumber: string;
}

export interface AccountHolderResponse {
  recipientName: string;
  recipientBankCode: string;
  recipientAccountNumber: string;
}

export interface RecognizeTransferVoiceRequest {
  audio: Blob;
}

export interface RecognizeTransferVoiceResponse {
  recognizedText: string;
  recipientName: string;
  amount: number;
  confidence: number;
}

export type TransferMethod = 'DIRECT' | 'VOICE';

export interface ExecuteTransferRequest {
  accountId: number;
  savedRecipientId?: number;
  bankCode: string;
  accountNumber: string;
  recipientName: string;
  amount: number;
  password: string;
  transferMethod: TransferMethod;
  isInCall: boolean;
  riskAcknowledged?: boolean;
}

export interface ExecuteTransferResponse {
  transferId: number;
  status: 'COMPLETED';
  requestedAt: ISODateTime;
  completedAt: ISODateTime;
  isRisky: boolean;
}

export interface TransferResultResponse {
  transferId: number;
  recipientName: string;
  recipientBankCode: string;
  recipientAccountNumber: string;
  amount: number;
  status: 'COMPLETED';
  completedAt: ISODateTime;
}

export interface TransferRiskQuery {
  accountId: number;
  amount: number;
  isNewAccount: boolean;
  isInCall: boolean;
  requestedByCaller: boolean;
  phishingKeywordDetected: boolean;
}

export interface TransferRiskResponse {
  isRisky: boolean;
  reasonCodes: string[];
  requiredSteps: string[];
}

export interface SaveCallTransferIntentRequest {
  requestedByCaller: boolean;
}

export interface SaveCallTransferIntentResponse {
  isInCall: boolean;
  isRisky: boolean;
  warningLevel: 'STRONG' | 'NORMAL';
}

export type SetCallTransferRecipientRequest =
  { savedRecipientId: number } | { bankCode: string; accountNumber: string };

export interface SetCallTransferRecipientResponse extends AccountHolderResponse {
  recipientIsNew: boolean;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'CARD';
export type TransactionReviewStatus = 'UNREAD' | 'READ' | 'KNOWN' | 'UNKNOWN';

export interface TransactionItem {
  transactionId: number;
  accountId: number;
  transactionType: TransactionType;
  description: string;
  amount: number;
  occurredAt: ISODateTime;
  reviewStatus: TransactionReviewStatus;
  reviewedAt: ISODateTime | null;
}

export interface GetTransactionsResponse {
  transactions: TransactionItem[];
}

export interface GetTransactionsQuery {
  accountId: number;
  month: string;
}

export interface UnreadSummaryResponse {
  daysSinceLastVisit: number;
  unreadCount: number;
}

export interface UnreadAccountSummary {
  accountId: number;
  accountName: string;
  unreadCount: number;
}

export interface UnreadByAccountResponse {
  accounts: UnreadAccountSummary[];
}

/**
 * 명세의 URL/param과 본문 예시가 서로 달라 두 후보를 모두 보존한다.
 * 백엔드 확정 후 하나로 좁혀야 한다.
 */
export type ReviewTransactionRequest =
  { reviewStatus: 'KNOWN' | 'UNKNOWN' } | { accountId: number; transactionIds: number[] };

export interface ReviewTransactionResponse {
  updatedCount: number;
  reviewStatus: TransactionReviewStatus;
  reviewedAt: ISODateTime;
}

export interface VoiceRecognitionRequest {
  audio: Blob;
}

export interface VoiceRecognitionResponse {
  queryText: string;
  confidence: number;
}

export interface VoiceQueryRequest {
  queryText: string;
}

export interface VoiceQueryResponse {
  answerText: string;
  audioUrl: string | null;
  relatedAccountId: number | null;
}

export interface VoiceUnreadSummaryResponse extends UnreadByAccountResponse {
  unreadCount: number;
  summaryText: string;
  audioUrl: string | null;
}
