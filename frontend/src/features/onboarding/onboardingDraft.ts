export type DraftCarrier = 'SKT' | 'KT' | 'LG U+' | '알뜰폰' | null;
export type DraftIdType = '주민등록증' | '운전면허증' | null;
export type DraftBank =
  | 'KB국민은행'
  | '신한은행'
  | '우리은행'
  | '하나은행'
  | 'NH농협은행'
  | '카카오뱅크'
  | null;

/** 온보딩 마지막 단계(가입 완료). */
export const ONBOARDING_LAST_STEP = 20;

export type OnboardingDraft = {
  version: 2;
  step: number;
  phoneOwnership: boolean | null;
  carrier: DraftCarrier;
  requiredTerms: [boolean];
  phoneVerified: boolean;
  certificateTerms: [boolean];
  electronicDocTermAccepted: boolean;
  faceTermAccepted: boolean;
  idType: DraftIdType;
  idScanCompleted: boolean;
  idInformationConfirmed: boolean;
  faceVerified: boolean;
  bank: DraftBank;
  accountVerified: boolean;
  userName?: string;
  onboardingSessionId?: string;
  issuanceId?: string;
  scanId?: string;
  verificationSessionId?: string;
  accountVerificationTargetId?: string;
  oneWonVerificationId?: string;
  idRecognizedName?: string;
  idMaskedNumber?: string;
  idIssueDate?: string;
  liveApi?: boolean;
};

const CARRIERS = new Set<Exclude<DraftCarrier, null>>(['SKT', 'KT', 'LG U+', '알뜰폰']);
const ID_TYPES = new Set<Exclude<DraftIdType, null>>(['주민등록증', '운전면허증']);
const BANK_NAMES = new Set<Exclude<DraftBank, null>>([
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  '카카오뱅크',
]);

function booleanFlag(value: unknown): [boolean] {
  if (!Array.isArray(value)) return [false];
  if (value.length >= 3) return [value[2] === true];
  if (value.length === 1) return [value[0] === true];
  return [false];
}

function firstFlag(value: unknown): [boolean] {
  return Array.isArray(value) ? [value[0] === true] : [false];
}

/** AsyncStorage의 손상되거나 이전 버전인 값을 앱 상태에 넣지 않는다. */
export function sanitizeOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 2) return null;

  const rawStep = typeof record.step === 'number' && Number.isFinite(record.step)
    ? Math.trunc(record.step)
    : 0;
  const carrier = typeof record.carrier === 'string' && CARRIERS.has(record.carrier as Exclude<DraftCarrier, null>)
    ? record.carrier as Exclude<DraftCarrier, null>
    : null;
  const idType = typeof record.idType === 'string' && ID_TYPES.has(record.idType as Exclude<DraftIdType, null>)
    ? record.idType as Exclude<DraftIdType, null>
    : null;
  const bank = typeof record.bank === 'string' && BANK_NAMES.has(record.bank as Exclude<DraftBank, null>)
    ? record.bank as Exclude<DraftBank, null>
    : null;

  return {
    version: 2,
    step: Math.max(0, Math.min(ONBOARDING_LAST_STEP, rawStep)),
    phoneOwnership: typeof record.phoneOwnership === 'boolean' ? record.phoneOwnership : null,
    carrier,
    requiredTerms: booleanFlag(record.requiredTerms),
    phoneVerified: record.phoneVerified === true,
    certificateTerms: firstFlag(record.certificateTerms),
    electronicDocTermAccepted: record.electronicDocTermAccepted === true,
    faceTermAccepted: record.faceTermAccepted === true,
    idType,
    idScanCompleted: record.idScanCompleted === true,
    idInformationConfirmed: record.idInformationConfirmed === true,
    faceVerified: record.faceVerified === true,
    bank,
    accountVerified: record.accountVerified === true,
    userName: optionalText(record.userName),
    onboardingSessionId: optionalText(record.onboardingSessionId),
    issuanceId: optionalText(record.issuanceId),
    scanId: optionalText(record.scanId),
    verificationSessionId: optionalText(record.verificationSessionId),
    accountVerificationTargetId: optionalText(record.accountVerificationTargetId),
    oneWonVerificationId: optionalText(record.oneWonVerificationId),
    idRecognizedName: optionalText(record.idRecognizedName),
    idMaskedNumber: optionalText(record.idMaskedNumber),
    idIssueDate: optionalText(record.idIssueDate),
    liveApi: record.liveApi === true,
  };
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** 민감 입력이 필요한 경계를 건너뛰지 않도록 재개 위치를 뒤로 조정한다. */
export function resolveOnboardingResumeStep(draft: OnboardingDraft): number {
  if (draft.step === 0) return 0;
  // 0 안내 · 1 준비 · 2 인증서 약관
  if (draft.step <= 2) return draft.step;
  // 3~9 휴대폰 본인확인. 끝나지 않았으면 안내부터 다시.
  if (draft.step <= 9 || !draft.phoneVerified) return 3;
  // 10~12 신분증
  if (draft.step <= 10) return draft.step;
  if (!draft.idType) return 10;
  if (draft.step === 11 || !draft.idScanCompleted) return 11;
  if (draft.step === 12 || !draft.idInformationConfirmed) return 12;
  // 13 얼굴 약관 · 14 얼굴 확인
  if (draft.step <= 14 || !draft.faceVerified) return 13;
  // 15~18 계좌. 번호·비밀번호를 다시 받도록 은행 선택부터.
  if (draft.step <= 18 || !draft.accountVerified) return 15;
  return draft.step;
}
