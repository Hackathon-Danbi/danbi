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

export type OnboardingDraft = {
  version: 1;
  step: number;
  termsStep: 0 | 1;
  phoneOwnership: boolean | null;
  carrier: DraftCarrier;
  requiredTerms: [boolean, boolean];
  marketingTermAccepted: boolean;
  phoneVerified: boolean;
  certificateTerms: [boolean, boolean];
  idType: DraftIdType;
  idScanCompleted: boolean;
  idInformationConfirmed: boolean;
  faceVerified: boolean;
  bank: DraftBank;
  accountVerified: boolean;
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

function booleanPair(value: unknown): [boolean, boolean] {
  return Array.isArray(value) && value.length === 2
    ? [value[0] === true, value[1] === true]
    : [false, false];
}

/** AsyncStorage의 손상되거나 이전 버전인 값을 앱 상태에 넣지 않는다. */
export function sanitizeOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1) return null;

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
    version: 1,
    step: Math.max(0, Math.min(18, rawStep)),
    termsStep: record.termsStep === 1 ? 1 : 0,
    phoneOwnership: typeof record.phoneOwnership === 'boolean' ? record.phoneOwnership : null,
    carrier,
    requiredTerms: booleanPair(record.requiredTerms),
    marketingTermAccepted: record.marketingTermAccepted === true,
    phoneVerified: record.phoneVerified === true,
    certificateTerms: booleanPair(record.certificateTerms),
    idType,
    idScanCompleted: record.idScanCompleted === true,
    idInformationConfirmed: record.idInformationConfirmed === true,
    faceVerified: record.faceVerified === true,
    bank,
    accountVerified: record.accountVerified === true,
  };
}

/** 민감 입력이 필요한 경계를 건너뛰지 않도록 재개 위치를 뒤로 조정한다. */
export function resolveOnboardingResumeStep(draft: OnboardingDraft): number {
  if (draft.step === 0) return 0;
  if (draft.step <= 6 || !draft.phoneVerified) return 1;
  if (draft.step <= 9) return draft.step;
  if (!draft.idType) return 9;
  if (draft.step === 10 || !draft.idScanCompleted) return 10;
  if (draft.step === 11 || !draft.idInformationConfirmed) return 11;
  if (draft.step === 12 || !draft.faceVerified) return 12;
  // 13(은행 선택)~16(1원 인증/계좌 비밀번호) 사이는 계좌번호·비밀번호를 다시 입력받도록
  // 항상 은행 선택부터 되돌린다.
  if (draft.step <= 16 || !draft.accountVerified) return 13;
  return draft.step;
}
