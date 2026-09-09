import { useEffect, useRef, useState } from 'react';

import { savePin } from '@/features/auth/pinStore';
import { currentUser } from '@/features/shared/data';
import { nextFaceCaptureStage, type FaceCaptureStage } from '../face-capture/faceStages';
import { saveApiIdentity } from '@/lib/api/identity';
import { setBackendReachable } from '@/lib/api/live';
import { bankCodeOf } from '@/lib/api/map';
import * as onboardingApi from '@/lib/api/onboarding';
import type { OnboardingDraft } from '../onboardingDraft';

type ApiIds = {
  session: string;
  issuance: string;
  scan: string;
  verification: string;
  accountTarget: string;
  oneWon: string;
};

const EMPTY_API_IDS: ApiIds = {
  session: '',
  issuance: '',
  scan: '',
  verification: '',
  accountTarget: '',
  oneWon: '',
};

export const MOCK_OTP = '381529';
export const MOCK_ACCOUNT_CODE = '4821';
export const MOCK_ID_NAME = currentUser.name;
export const MOCK_ID_NUMBER = '900101-1******';
export const MOCK_ID_ISSUED_DATE = '2020년 3월 12일';
const MOCK_FACE_FAILURE = false;
/** KB국민은행 계좌는 1원 인증 대신 계좌 비밀번호로 확인한다. */
const KB_BANK_NAME = 'KB국민은행';

export type IdType = '주민등록증' | '운전면허증' | null;
export type Carrier = 'SKT' | 'KT' | 'LG U+' | '알뜰폰' | null;
export type IdScanStatus = 'idle' | 'capturing' | 'checking' | 'success';
export type FaceStatus = 'idle' | 'checking' | 'failure' | 'success';
export type PinPhase = 'create' | 'confirm' | 'success';

/**
 * 이 훅은 메모리 상태만 들고 있고 항상 초기값에서 시작한다. 진행 상태 저장/복원은
 * OnboardingFlow 가 담당한다: draft 스냅샷을 AsyncStorage(StorageKeys.onboardingDraft)에
 * 기록하고, 마운트 시 restoreDraft() 로 되살린다. 이때 resolveOnboardingResumeStep() 이
 * 민감 입력(OTP·PIN·휴대폰 번호)을 건너뛰지 않도록 안전한 단계로 되감으므로, 그 값들은
 * 복원하지 않고 재입력을 받는다. 온보딩 "완료 여부" 는 bootstrap(app/join.tsx)에서
 * 별도 플래그로 저장한다.
 */
export function useOnboardingState() {
  const [phoneOwnership, setPhoneOwnership] = useState<boolean | null>(null);
  const [idType, setIdTypeState] = useState<IdType>(null);
  const [idScanStatus, setIdScanStatus] = useState<IdScanStatus>('idle');
  const [idInformationConfirmed, setIdInformationConfirmed] = useState(false);
  const [userName, setUserName] = useState('');
  const [carrier, setCarrier] = useState<Carrier>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requiredTerms, setRequiredTerms] = useState<boolean[]>([false]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [certificateTerms, setCertificateTerms] = useState<boolean[]>([false]);
  const [electronicDocTermAccepted, setElectronicDocTermAccepted] = useState(false);
  const [faceTermAccepted, setFaceTermAccepted] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('idle');
  const [faceVerified, setFaceVerified] = useState(false);
  const [bank, setBankState] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountVerificationSent, setAccountVerificationSent] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountVerified, setAccountVerified] = useState(false);
  const isKbAccount = bank === KB_BANK_NAME;
  const [pinPhase, setPinPhase] = useState<PinPhase>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinMismatch, setPinMismatch] = useState(0);
  const [pinCreated, setPinCreated] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [liveApi, setLiveApi] = useState(false);
  const [apiIds, setApiIds] = useState<ApiIds>(EMPTY_API_IDS);
  const [idRecognizedName, setIdRecognizedName] = useState(MOCK_ID_NAME);
  const [idMaskedNumber, setIdMaskedNumber] = useState(MOCK_ID_NUMBER);
  const [idIssueDate, setIdIssueDate] = useState(MOCK_ID_ISSUED_DATE);

  const idTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const faceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idsRef = useRef<ApiIds>(EMPTY_API_IDS);
  const liveRef = useRef(false);

  const patchIds = (partial: Partial<ApiIds>) => {
    idsRef.current = { ...idsRef.current, ...partial };
    setApiIds({ ...idsRef.current });
  };

  const usingLiveApi = () =>
    liveRef.current && idsRef.current.session !== '' && idsRef.current.session !== 'local';

  useEffect(
    () => () => {
      idTimers.current.forEach(clearTimeout);
      if (faceTimer.current) clearTimeout(faceTimer.current);
    },
    [],
  );

  const startIdScan = () => {
    idTimers.current.forEach(clearTimeout);
    setIdScanStatus('capturing');
    idTimers.current = [
      setTimeout(() => setIdScanStatus('checking'), 550),
      setTimeout(() => {
        setIdScanStatus('success');
      }, 1550),
    ];
  };

  // 실시간 촬영 컴포넌트가 자동 촬영을 마쳤을 때 가입 상태에 완료 여부만 반영합니다.
  const completeIdScan = () => {
    idTimers.current.forEach(clearTimeout);
    idTimers.current = [];
    setIdScanStatus('success');
  };

  const confirmIdInformation = () => {
    setUserName(idRecognizedName || MOCK_ID_NAME);
    setIdInformationConfirmed(true);
  };

  const toggleRequiredTerm = (index: number) => {
    setRequiredTerms((current) =>
      current.map((checked, itemIndex) => (itemIndex === index ? !checked : checked)),
    );
  };

  const setAllRequiredTerms = (value: boolean) => {
    setRequiredTerms((current) => current.map(() => value));
  };

  const toggleCertificateTerm = (index: number) => {
    setCertificateTerms((current) =>
      current.map((checked, itemIndex) => (itemIndex === index ? !checked : checked)),
    );
  };

  const setAllCertificateTerms = (value: boolean) => {
    setCertificateTerms((current) => current.map(() => value));
  };

  const markOtpSent = () => {
    setOtpSent(true);
    setOtpSendCount((count) => count + 1);
    setOtp('');
    setOtpError('');
    setOtpVerified(false);
  };

  const sendOtp = () => {
    markOtpSent();
  };

  const updateOtp = (value: string) => {
    setOtp(value);
    setOtpError('');
  };

  const verifyOtp = () => {
    if (!otpSent || otp !== MOCK_OTP) {
      setOtpError('숫자가 맞지 않아요. 문자를 다시 확인해주세요.');
      return false;
    }
    setOtpError('');
    setOtpVerified(true);
    return true;
  };

  const startFaceCheck = () => {
    if (faceTimer.current) clearTimeout(faceTimer.current);
    setFaceStatus('checking');
    setFaceVerified(false);
    faceTimer.current = setTimeout(() => {
      if (MOCK_FACE_FAILURE) {
        setFaceStatus('failure');
        return;
      }
      setFaceStatus('success');
      setFaceVerified(true);
    }, 1500);
  };

  const resetFaceCheck = () => {
    if (faceTimer.current) clearTimeout(faceTimer.current);
    faceTimer.current = null;
    setFaceStatus('idle');
    setFaceVerified(false);
  };

  const resetAccountVerification = () => {
    setAccountNumber('');
    setAccountPassword('');
    setAccountVerificationSent(false);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(false);
  };

  const setBank = (nextBank: string | null) => {
    if (nextBank === bank) return;
    setBankState(nextBank);
    resetAccountVerification();
  };

  const sendAccountVerification = () => {
    setAccountVerificationSent(true);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(false);
  };

  const updateAccountCode = (value: string) => {
    setAccountCode(value);
    setAccountError('');
  };

  const verifyAccountCode = () => {
    if (!accountVerificationSent || accountCode !== MOCK_ACCOUNT_CODE) {
      setAccountError('숫자가 맞지 않아요. 입금 내역을 다시 확인해주세요.');
      return false;
    }
    setAccountError('');
    setAccountVerified(true);
    return true;
  };

  // 프로토타입: KB국민은행 계좌는 4자리 비밀번호를 입력하면(값 상관없이) 확인이 끝난다.
  const verifyAccountPassword = () => {
    setAccountVerified(true);
    return true;
  };

  const currentPin = pinPhase === 'create' ? firstPin : confirmPin;

  const resetPin = () => {
    setPinPhase('create');
    setFirstPin('');
    setConfirmPin('');
    setPinError('');
    setPinMismatch(0);
    setPinCreated(false);
  };

  const resetIdVerification = () => {
    idTimers.current.forEach(clearTimeout);
    idTimers.current = [];
    if (faceTimer.current) clearTimeout(faceTimer.current);
    faceTimer.current = null;

    setIdScanStatus('idle');
    setIdInformationConfirmed(false);
    setUserName('');
    setFaceStatus('idle');
    setFaceVerified(false);
    setBankState(null);
    setAccountNumber('');
    setAccountPassword('');
    setAccountVerificationSent(false);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(false);
    resetPin();
    setOnboardingCompleted(false);
    setIdRecognizedName(MOCK_ID_NAME);
    setIdMaskedNumber(MOCK_ID_NUMBER);
    setIdIssueDate(MOCK_ID_ISSUED_DATE);
    patchIds({ scan: '', accountTarget: '', oneWon: '' });
  };

  const setIdType = (nextIdType: IdType) => {
    if (nextIdType === idType) return;
    setIdTypeState(nextIdType);
    resetIdVerification();
  };

  const enterPin = (key: string) => {
    if (pinPhase === 'success') return;
    const current = pinPhase === 'create' ? firstPin : confirmPin;
    if (key === '⌫') {
      if (pinPhase === 'create') setFirstPin(current.slice(0, -1));
      else setConfirmPin(current.slice(0, -1));
      setPinError('');
      return;
    }
    setPinError('');
    const nextValue = `${current}${key}`.slice(0, 6);
    if (pinPhase === 'create') {
      setFirstPin(nextValue);
      if (nextValue.length === 6) {
        setPinPhase('confirm');
        setConfirmPin('');
      }
      return;
    }
    setConfirmPin(nextValue);
    if (nextValue.length !== 6) return;
    if (nextValue !== firstPin) {
      const attempts = pinMismatch + 1;
      setPinMismatch(attempts);
      setConfirmPin('');
      if (attempts >= 2) {
        setFirstPin('');
        setPinPhase('create');
        setPinError('두 번 다르게 입력됐어요. 처음부터 천천히 다시 정해볼게요.');
      } else {
        setPinError('처음 정한 번호와 달라요. 한 번 더 해보거나 처음부터 다시 정할 수 있어요.');
      }
      return;
    }
    setPinError('');
    setPinMismatch(0);
    setPinCreated(true);
    setPinPhase('success');
  };

  const ensureSession = async () => {
    if (idsRef.current.session) return;
    try {
      const created = await onboardingApi.createOnboardingSession();
      liveRef.current = true;
      setLiveApi(true);
      setBackendReachable(true);
      patchIds({ session: created.onboardingSessionId });
    } catch {
      liveRef.current = false;
      setLiveApi(false);
      setBackendReachable(false);
      patchIds({ session: 'local' });
    }
  };

  const submitName = async () => {
    if (!usingLiveApi()) return;
    await onboardingApi.saveOnboardingName(idsRef.current.session, userName);
  };

  const requestOtp = async () => {
    markOtpSent();
    if (!usingLiveApi()) return;
    const response = await onboardingApi.requestPhoneVerification(
      idsRef.current.session,
      carrier,
      phoneNumber,
    );
    patchIds({ verification: response.verificationSessionId });
  };

  const resendOtp = async () => {
    markOtpSent();
    if (!usingLiveApi()) return;
    if (!idsRef.current.verification) {
      if (!usingLiveApi()) return;
      const response = await onboardingApi.requestPhoneVerification(
        idsRef.current.session,
        carrier,
        phoneNumber,
      );
      patchIds({ verification: response.verificationSessionId });
      return;
    }
    await onboardingApi.resendPhoneVerification(idsRef.current.session, idsRef.current.verification);
  };

  const confirmOtp = async () => {
    if (!usingLiveApi()) {
      if (!verifyOtp()) {
        throw new Error('숫자가 맞지 않아요. 문자를 다시 확인해주세요.');
      }
      return;
    }
    await onboardingApi.confirmPhoneVerification(
      idsRef.current.session,
      idsRef.current.verification,
      otp,
    );
    setOtpError('');
    setOtpVerified(true);
  };

  const startCertificate = async () => {
    if (!usingLiveApi() || idsRef.current.issuance) return;
    const response = await onboardingApi.startCertificateIssuance(idsRef.current.session);
    patchIds({ issuance: response.issuanceId });
  };

  const scanIdPhoto = async (uri?: string) => {
    if (!usingLiveApi()) {
      setIdRecognizedName(MOCK_ID_NAME);
      setIdMaskedNumber(MOCK_ID_NUMBER);
      setIdIssueDate(MOCK_ID_ISSUED_DATE);
      completeIdScan();
      return;
    }
    if (!uri) {
      if (idsRef.current.scan) {
        completeIdScan();
        return;
      }
      throw new Error('신분증 사진이 없어요. 다시 찍어주세요.');
    }
    if (!idsRef.current.issuance) await startCertificate();
    const response = await onboardingApi.scanIdCard(idsRef.current.issuance, idType, uri);
    patchIds({
      scan: response.scanId,
      issuance: response.issuanceId || idsRef.current.issuance,
    });
    setIdRecognizedName(response.recognizedName || MOCK_ID_NAME);
    setIdMaskedNumber(response.maskedIdNumber || MOCK_ID_NUMBER);
    setIdIssueDate(onboardingApi.formatIssueDate(response.issueDate) || MOCK_ID_ISSUED_DATE);
    completeIdScan();
  };

  const confirmIdCard = async () => {
    confirmIdInformation();
    if (!usingLiveApi() || !idsRef.current.issuance || !idsRef.current.scan) return;
    await onboardingApi.confirmIdCard(idsRef.current.issuance, idsRef.current.scan, true);
  };

  const verifyFacePose = async (
    uri: string,
    stage: FaceCaptureStage,
  ): Promise<'advance' | 'success' | 'failure'> => {
    if (faceTimer.current) clearTimeout(faceTimer.current);
    setFaceStatus('checking');
    setFaceVerified(false);
    if (!usingLiveApi()) {
      const next = nextFaceCaptureStage(stage);
      if (next) {
        setFaceStatus('idle');
        return 'advance';
      }
      if (MOCK_FACE_FAILURE) {
        setFaceStatus('failure');
        return 'failure';
      }
      setFaceStatus('success');
      setFaceVerified(true);
      return 'success';
    }
    try {
      const response = await onboardingApi.verifyFace(
        idsRef.current.issuance,
        idsRef.current.scan,
        stage,
        uri,
      );
      if (response.verified) {
        setFaceStatus('success');
        setFaceVerified(true);
        return 'success';
      }
      if (response.nextStage) {
        setFaceStatus('idle');
        return 'advance';
      }
      setFaceStatus('failure');
      return 'failure';
    } catch {
      setFaceStatus('failure');
      return 'failure';
    }
  };

  const saveAccountTarget = async (): Promise<'ACCOUNT_PASSWORD' | 'ONE_WON'> => {
    const fallback = isKbAccount ? 'ACCOUNT_PASSWORD' : 'ONE_WON';
    if (!usingLiveApi()) return fallback;
    const response = await onboardingApi.saveAccountVerificationTarget(
      idsRef.current.issuance,
      bankCodeOf(bank ?? ''),
      accountNumber,
    );
    patchIds({ accountTarget: response.accountVerificationTargetId });
    return response.verificationMethod === 'ONE_WON' ? 'ONE_WON' : 'ACCOUNT_PASSWORD';
  };

  const verifyAccountPasswordLive = async () => {
    if (!usingLiveApi()) {
      verifyAccountPassword();
      return;
    }
    await onboardingApi.verifyAccountPassword(
      idsRef.current.accountTarget,
      idsRef.current.issuance,
      accountPassword,
    );
    setAccountVerified(true);
  };

  const requestOneWon = async () => {
    sendAccountVerification();
    if (!usingLiveApi()) return;
    const response = await onboardingApi.requestOneWonVerification(
      idsRef.current.accountTarget,
      idsRef.current.issuance,
    );
    patchIds({ oneWon: response.verificationId });
  };

  const confirmOneWon = async () => {
    if (!usingLiveApi()) {
      if (!verifyAccountCode()) {
        throw new Error('숫자가 맞지 않아요. 입금 내역을 다시 확인해주세요.');
      }
      return;
    }
    await onboardingApi.confirmOneWonVerification(
      idsRef.current.accountTarget,
      idsRef.current.issuance,
      idsRef.current.oneWon,
      accountCode,
    );
    setAccountError('');
    setAccountVerified(true);
  };

  const finishOnboarding = async () => {
    if (usingLiveApi()) {
      await onboardingApi.setSimplePassword(idsRef.current.issuance, firstPin);
      try {
        const done = await onboardingApi.getOnboardingCompletion(idsRef.current.session);
        if (done.userId) await saveApiIdentity({ userId: done.userId });
      } catch {
        /* 비밀번호는 저장됐으니 가입은 진행한다. */
      }
    }
    setOnboardingCompleted(true);
    if (pinCreated) void savePin(firstPin);
  };

  const restoreDraft = (draft: OnboardingDraft) => {
    setPhoneOwnership(draft.phoneOwnership);
    setCarrier(draft.carrier);
    setRequiredTerms(draft.requiredTerms);
    setElectronicDocTermAccepted(draft.electronicDocTermAccepted);
    setFaceTermAccepted(draft.faceTermAccepted);
    setOtpSent(false);
    setOtp('');
    setOtpError('');
    setOtpVerified(draft.phoneVerified);
    setCertificateTerms(draft.certificateTerms);
    setIdTypeState(draft.idType);
    setIdScanStatus(draft.idScanCompleted ? 'success' : 'idle');
    setIdInformationConfirmed(draft.idInformationConfirmed);
    setUserName(draft.userName || (draft.idInformationConfirmed ? draft.idRecognizedName || MOCK_ID_NAME : ''));
    setFaceStatus(draft.faceVerified ? 'success' : 'idle');
    setFaceVerified(draft.faceVerified);
    setBankState(draft.bank);
    setAccountNumber('');
    setAccountPassword('');
    setAccountVerificationSent(false);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(draft.accountVerified);
    setIdRecognizedName(draft.idRecognizedName || MOCK_ID_NAME);
    setIdMaskedNumber(draft.idMaskedNumber || MOCK_ID_NUMBER);
    setIdIssueDate(draft.idIssueDate || MOCK_ID_ISSUED_DATE);
    const restoredIds: ApiIds = {
      session: draft.onboardingSessionId ?? '',
      issuance: draft.issuanceId ?? '',
      scan: draft.scanId ?? '',
      verification: draft.verificationSessionId ?? '',
      accountTarget: draft.accountVerificationTargetId ?? '',
      oneWon: draft.oneWonVerificationId ?? '',
    };
    idsRef.current = restoredIds;
    setApiIds(restoredIds);
    const restoredLive = draft.liveApi === true && restoredIds.session !== '' && restoredIds.session !== 'local';
    liveRef.current = restoredLive;
    setLiveApi(restoredLive);
    if (restoredLive) setBackendReachable(true);
    resetPin();
    setOnboardingCompleted(draft.step === 20);
  };

  return {
    phoneOwnership,
    setPhoneOwnership,
    idType,
    setIdType,
    idScanStatus,
    idInformationConfirmed,
    startIdScan,
    completeIdScan,
    resetIdVerification,
    userName,
    setUserName,
    confirmIdInformation,
    carrier,
    setCarrier,
    phoneNumber,
    setPhoneNumber,
    requiredTerms,
    toggleRequiredTerm,
    setAllRequiredTerms,
    otpSent,
    otpSendCount,
    sendOtp,
    otp,
    setOtp: updateOtp,
    otpError,
    otpVerified,
    verifyOtp,
    certificateTerms,
    toggleCertificateTerm,
    setAllCertificateTerms,
    electronicDocTermAccepted,
    setElectronicDocTermAccepted,
    faceTermAccepted,
    setFaceTermAccepted,
    faceStatus,
    faceVerified,
    startFaceCheck,
    resetFaceCheck,
    bank,
    setBank,
    isKbAccount,
    accountNumber,
    setAccountNumber,
    accountPassword,
    setAccountPassword,
    verifyAccountPassword,
    accountVerificationSent,
    sendAccountVerification,
    accountCode,
    setAccountCode: updateAccountCode,
    accountError,
    accountVerified,
    verifyAccountCode,
    pinPhase,
    currentPin,
    pinError,
    pinCreated,
    enterPin,
    resetPin,
    onboardingCompleted,
    completeOnboarding: finishOnboarding,
    restoreDraft,
    liveApi,
    apiIds,
    idRecognizedName,
    idMaskedNumber,
    idIssueDate,
    ensureSession,
    submitName,
    requestOtp,
    resendOtp,
    confirmOtp,
    startCertificate,
    scanIdPhoto,
    confirmIdCard,
    verifyFacePose,
    saveAccountTarget,
    verifyAccountPasswordLive,
    requestOneWon,
    confirmOneWon,
  };
}
