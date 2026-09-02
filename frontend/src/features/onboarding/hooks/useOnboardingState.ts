import { useEffect, useRef, useState } from 'react';

import { currentUser } from '@/features/shared/data';
import type { OnboardingDraft } from '../onboardingDraft';

export const MOCK_OTP = '381529';
export const MOCK_ACCOUNT_CODE = '4821';
export const MOCK_ID_NAME = currentUser.name;
export const MOCK_ID_NUMBER = '900101-1******';
export const MOCK_ID_ISSUED_DATE = '2020년 3월 12일';
const MOCK_FACE_FAILURE = false;

export const MOCK_ACCOUNT = {
  id: 'kb-1234',
  bank: 'KB국민',
  number: '1234',
  productName: '입출금 통장',
} as const;

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
  const [requiredTerms, setRequiredTerms] = useState<boolean[]>([false, false]);
  const [marketingTermAccepted, setMarketingTermAccepted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [certificateTerms, setCertificateTerms] = useState<boolean[]>([false, false]);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('idle');
  const [faceVerified, setFaceVerified] = useState(false);
  const [selectedAccount] = useState(MOCK_ACCOUNT);
  const [accountVerificationSent, setAccountVerificationSent] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountVerified, setAccountVerified] = useState(false);
  const [pinPhase, setPinPhase] = useState<PinPhase>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinMismatch, setPinMismatch] = useState(0);
  const [pinCreated, setPinCreated] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const idTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const faceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setUserName(MOCK_ID_NAME);
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

  const sendOtp = () => {
    setOtpSent(true);
    setOtpSendCount((count) => count + 1);
    setOtp('');
    setOtpError('');
    setOtpVerified(false);
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
    setAccountVerificationSent(false);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(false);
    resetPin();
    setOnboardingCompleted(false);
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

  const completeOnboarding = () => setOnboardingCompleted(true);

  const restoreDraft = (draft: OnboardingDraft) => {
    setPhoneOwnership(draft.phoneOwnership);
    setCarrier(draft.carrier);
    setRequiredTerms(draft.requiredTerms);
    setMarketingTermAccepted(draft.marketingTermAccepted);
    setOtpSent(false);
    setOtp('');
    setOtpError('');
    setOtpVerified(draft.phoneVerified);
    setCertificateTerms(draft.certificateTerms);
    setIdTypeState(draft.idType);
    setIdScanStatus(draft.idScanCompleted ? 'success' : 'idle');
    setIdInformationConfirmed(draft.idInformationConfirmed);
    setUserName(draft.idInformationConfirmed ? MOCK_ID_NAME : '');
    setFaceStatus(draft.faceVerified ? 'success' : 'idle');
    setFaceVerified(draft.faceVerified);
    setAccountVerificationSent(false);
    setAccountCode('');
    setAccountError('');
    setAccountVerified(draft.accountVerified);
    resetPin();
    setOnboardingCompleted(draft.step === 16);
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
    marketingTermAccepted,
    setMarketingTermAccepted,
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
    faceStatus,
    faceVerified,
    startFaceCheck,
    selectedAccount,
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
    completeOnboarding,
    restoreDraft,
  };
}
