import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Toast } from '@/components/ui/Toast';
import { ScanLine } from '@/components/anim/ScanLine';
import { PinDots, PinKeypad } from '@/features/auth/components/PinPad';
import { BankGrid } from '@/features/main/components/BankGrid';
import { BORDER, CREAM, INK, YELLOW } from '@/features/main/theme';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { getJSON, setJSON, StorageKeys } from '@/lib/storage';
import { useAndroidBack } from '@/lib/useAndroidBack';
import type { OnboardingDestination } from '@/lib/navigation';
import {
  AgreementAllToggle,
  AgreementCard,
  AgreementDetail,
  BottomActionArea,
  GuideBox,
  GuideText,
  LargeSelectionCard,
  OnboardingHeader,
  OnboardingIcon,
  OnboardingInfoCard,
  PageTitle,
  SeniorTextInput,
  StepBadge,
  VoiceGuideButton,
} from '../components/OnboardingComponents';
import {
  MOCK_ACCOUNT_CODE,
  MOCK_ID_ISSUED_DATE,
  MOCK_ID_NAME,
  MOCK_ID_NUMBER,
  MOCK_OTP,
  useOnboardingState,
} from '../hooks/useOnboardingState';
import { IdCaptureExperience } from '../id-capture/components/IdCaptureExperience';
import { useScreenHelp } from '../help/useScreenHelp';
import { ScreenHelpBar } from '../help/ScreenHelpBar';
import { EscalationSheet } from '../help/EscalationSheet';
import {
  resolveOnboardingResumeStep,
  sanitizeOnboardingDraft,
  type OnboardingDraft,
} from '../onboardingDraft';

export type { OnboardingDestination } from '@/lib/navigation';
type Props = {
  onComplete: (destination: OnboardingDestination) => void;
  onCancel: () => void;
  onDevHome?: () => void;
};

const STEPS = {
  INTRO: 0,
  NAME: 1,
  PHONE_OWNERSHIP: 2,
  CARRIER: 3,
  PHONE_NUMBER: 4,
  SIGNUP_TERMS: 5,
  OTP: 6,
  CERTIFICATE_INTRO: 7,
  CERTIFICATE_TERMS: 8,
  ID_SELECT: 9,
  ID_SCAN: 10,
  ID_CONFIRM: 11,
  FACE_CHECK: 12,
  ACCOUNT_BANK: 13,
  ACCOUNT_NUMBER: 14,
  ACCOUNT_PASSWORD: 15,
  ACCOUNT_CODE: 16,
  PIN: 17,
  COMPLETE: 18,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];
type PageMeta = readonly [title: string, progress: number];

// 임시 정책: 가입 과정에서는 약관과 신분증 촬영 화면에 TTS를 제공한다.
const TTS_ENABLED_STEPS: readonly Step[] = [STEPS.SIGNUP_TERMS, STEPS.CERTIFICATE_TERMS];

const REENTER_PIN_NOTICE = '이제 방금 정한 번호를 한 번 더 입력해주세요.';

const pageMeta: Record<Step, PageMeta> = {
  [STEPS.INTRO]: ['가입 안내', 0],
  [STEPS.NAME]: ['가입 준비', 8],
  [STEPS.PHONE_OWNERSHIP]: ['가입 준비', 14],
  [STEPS.CARRIER]: ['본인 확인', 22],
  [STEPS.PHONE_NUMBER]: ['본인 확인', 30],
  [STEPS.SIGNUP_TERMS]: ['본인 확인', 36],
  [STEPS.OTP]: ['본인 확인', 44],
  [STEPS.CERTIFICATE_INTRO]: ['국민인증서', 50],
  [STEPS.CERTIFICATE_TERMS]: ['국민인증서', 55],
  [STEPS.ID_SELECT]: ['신분증 확인', 60],
  [STEPS.ID_SCAN]: ['신분증 확인', 66],
  [STEPS.ID_CONFIRM]: ['신분증 확인', 72],
  [STEPS.FACE_CHECK]: ['얼굴 확인', 78],
  [STEPS.ACCOUNT_BANK]: ['계좌 확인', 82],
  [STEPS.ACCOUNT_NUMBER]: ['계좌 확인', 86],
  [STEPS.ACCOUNT_PASSWORD]: ['계좌 확인', 92],
  [STEPS.ACCOUNT_CODE]: ['계좌 확인', 92],
  [STEPS.PIN]: ['간편 비밀번호', 96],
  [STEPS.COMPLETE]: ['가입 완료', 100],
};

const voiceGuides: Record<Step, string> = {
  [STEPS.INTRO]: '가입은 가입 준비, 본인 확인, 국민인증서 만들기의 세 단계로 진행돼요.',
  [STEPS.NAME]: '가입에 사용할 본인 이름을 입력해주세요.',
  [STEPS.PHONE_OWNERSHIP]: '지금 사용 중인 휴대폰이 고객님 명의인지 확인해주세요.',
  [STEPS.CARRIER]: '현재 이용하고 있는 통신사를 선택해주세요.',
  [STEPS.PHONE_NUMBER]: '본인 명의 휴대폰 번호 열한 자리를 입력해주세요.',
  [STEPS.SIGNUP_TERMS]: '가입에 필요한 약관을 확인하고 필수 항목에 동의해주세요.',
  [STEPS.OTP]: '문자로 받은 숫자 여섯 자리를 입력해주세요.',
  [STEPS.CERTIFICATE_INTRO]: '국민인증서는 신분증, 얼굴, 계좌, 비밀번호 순서로 확인해요.',
  [STEPS.CERTIFICATE_TERMS]: '국민인증서 발급에 필요한 약관을 확인해주세요.',
  [STEPS.ID_SELECT]: '사용할 신분증을 골라주세요.',
  [STEPS.ID_SCAN]: '신분증 전체가 화면 안에 들어오도록 놓아주세요.',
  [STEPS.ID_CONFIRM]: '신분증에서 읽은 이름, 주민등록번호, 발급일자가 맞는지 확인해주세요.',
  [STEPS.FACE_CHECK]: '휴대폰을 눈높이에 들고 화면을 바라봐주세요.',
  [STEPS.ACCOUNT_BANK]: '가입에 사용할 계좌의 은행을 선택해주세요.',
  [STEPS.ACCOUNT_NUMBER]: '계좌번호를 천천히 입력해주세요.',
  [STEPS.ACCOUNT_PASSWORD]: '계좌 비밀번호 네 자리를 입력해주세요.',
  [STEPS.ACCOUNT_CODE]: '통장 입금 내역에서 케이비 뒤에 적힌 숫자 네 자리를 입력해주세요.',
  [STEPS.PIN]: '앞으로 사용할 숫자 여섯 자리를 정하고 한 번 더 입력해주세요.',
  [STEPS.COMPLETE]: '가입이 끝났어요. 다음에 할 일을 선택해주세요.',
};

function formatPhoneNumber(value: string) {
  if (value.length <= 3) return value;
  if (value.length <= 7) return `${value.slice(0, 3)} ${value.slice(3)}`;
  return `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7, 11)}`;
}

export function OnboardingFlow({ onComplete, onCancel, onDevHome }: Props) {
  const [step, setStep] = useState<Step>(STEPS.INTRO);
  const [termsStep, setTermsStep] = useState<0 | 1>(0);
  const [notice, setNotice] = useState('');
  const [agreementDetail, setAgreementDetail] = useState('');
  const [showExit, setShowExit] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const state = useOnboardingState();
  const [title, progress] = pageMeta[step];
  const requiredTermsComplete = state.requiredTerms.every(Boolean);
  const certificateTermsComplete = state.certificateTerms.every(Boolean);
  const isTtsEnabled = TTS_ENABLED_STEPS.includes(step);

  const help = useScreenHelp();
  const [otpFailCount, setOtpFailCount] = useState(0);
  const [faceFailCount, setFaceFailCount] = useState(0);
  const [accountFailCount, setAccountFailCount] = useState(0);
  const [escalationDismissed, setEscalationDismissed] = useState(false);
  const prevOtpErrorRef = useRef('');
  const prevFaceStatusRef = useRef('');
  const prevAccountErrorRef = useRef('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = sanitizeOnboardingDraft(
        await getJSON<unknown>(StorageKeys.onboardingDraft),
      );
      if (!active) return;
      if (stored) {
        state.restoreDraft(stored);
        setStep(resolveOnboardingResumeStep(stored) as Step);
        setTermsStep(stored.termsStep);
      }
      setDraftReady(true);
    })();
    return () => {
      active = false;
    };
    // 최초 마운트에서 저장된 체크포인트를 한 번만 복원한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const draft: OnboardingDraft = {
      version: 1,
      step,
      termsStep,
      phoneOwnership: state.phoneOwnership,
      carrier: state.carrier,
      requiredTerms: [state.requiredTerms[0], state.requiredTerms[1]],
      marketingTermAccepted: state.marketingTermAccepted,
      phoneVerified: state.otpVerified,
      certificateTerms: [state.certificateTerms[0], state.certificateTerms[1]],
      idType: state.idType,
      idScanCompleted: state.idScanStatus === 'success',
      idInformationConfirmed: state.idInformationConfirmed,
      faceVerified: state.faceVerified,
      bank: state.bank as OnboardingDraft['bank'],
      accountVerified: state.accountVerified,
    };
    void setJSON(StorageKeys.onboardingDraft, draft);
  }, [
    draftReady,
    state.accountVerified,
    state.bank,
    state.certificateTerms,
    state.faceVerified,
    state.idInformationConfirmed,
    state.idScanStatus,
    state.idType,
    state.marketingTermAccepted,
    state.otpVerified,
    state.phoneOwnership,
    state.requiredTerms,
    state.carrier,
    step,
    termsStep,
  ]);

  const stopReading = () => {
    ttsStop();
    setIsReading(false);
  };
  const next = () => {
    stopReading();
    setStep((current) => Math.min(STEPS.COMPLETE, current + 1) as Step);
  };
  const back = () => {
    stopReading();
    if (step === STEPS.SIGNUP_TERMS && termsStep === 1) {
      setTermsStep(0);
      return;
    }
    if (step === STEPS.OTP) {
      setTermsStep(1);
      setStep(STEPS.SIGNUP_TERMS);
      return;
    }
    // 계좌 확인은 은행에 따라 두 갈래(계좌 비밀번호 / 1원 인증)로 나뉘므로,
    // 되돌아갈 때는 항상 계좌번호 입력 화면으로 모은다.
    if (step === STEPS.ACCOUNT_PASSWORD || step === STEPS.ACCOUNT_CODE) {
      setStep(STEPS.ACCOUNT_NUMBER);
      return;
    }
    if (step === STEPS.PIN) {
      setStep(state.isKbAccount ? STEPS.ACCOUNT_PASSWORD : STEPS.ACCOUNT_CODE);
      return;
    }
    setStep((current) => Math.max(STEPS.INTRO, current - 1) as Step);
  };
  const finish = (destination: OnboardingDestination) => {
    stopReading();
    onComplete(destination);
  };

  // Android 하드웨어 back: 온보딩 내부 상태 머신이 expo-router 보다 우선.
  // INTRO(첫 화면)에서만 기본 동작(상위 라우트)을 허용한다.
  useAndroidBack(() => {
    if (showExit) {
      setShowExit(false);
      return true;
    }
    if (agreementDetail) {
      setAgreementDetail('');
      return true;
    }
    if (step === STEPS.INTRO) return false;
    back();
    return true;
  });

  // TTS 지원 화면을 벗어나면 재생 중인 안내를 끊는다.
  useEffect(() => {
    if (!isTtsEnabled) ttsStop();
    return () => ttsStop();
  }, [isTtsEnabled]);

  useEffect(() => {
    if (step === STEPS.PIN && state.pinPhase === 'confirm') {
      const noticeTimer = setTimeout(() => setNotice(REENTER_PIN_NOTICE), 0);
      return () => clearTimeout(noticeTimer);
    }
    // confirm 단계를 벗어나면(success 등) 재입력 안내 토스트를 걷어낸다.
    const noticeTimer = setTimeout(
      () => setNotice((current) => (current === REENTER_PIN_NOTICE ? '' : current)),
      0,
    );
    return () => clearTimeout(noticeTimer);
  }, [step, state.pinPhase]);

  const activeVoiceGuide = useMemo(() => {
    if (step === STEPS.SIGNUP_TERMS) {
      return termsStep === 0
        ? '가입에 꼭 필요한 내용을 확인해주세요. 필수 항목에 모두 동의해주세요.'
        : '선택해서 동의할 수 있는 내용을 확인해주세요. 동의하지 않아도 가입할 수 있어요.';
    }
    if (step === STEPS.OTP && state.otpVerified) {
      return '본인 확인이 끝났어요. 이제 국민인증서를 만들게요.';
    }
    if (step === STEPS.ID_SCAN) {
      if (state.idScanStatus === 'capturing' || state.idScanStatus === 'checking') {
        return '신분증을 확인하고 있어요. 잠시만 기다려주세요.';
      }
      if (state.idScanStatus === 'success') {
        return '신분증을 확인했어요. 읽은 정보가 맞는지 확인해주세요.';
      }
    }
    if (step === STEPS.FACE_CHECK) {
      if (state.faceStatus === 'checking') return '얼굴을 확인하고 있어요. 잠시만 기다려주세요.';
      if (state.faceStatus === 'success') return '얼굴 확인이 끝났어요. 다음 단계로 이동해주세요.';
      if (state.faceStatus === 'failure') return '얼굴이 잘 보이지 않았어요. 밝은 곳에서 다시 확인해주세요.';
    }
    if (step === STEPS.PIN) {
      if (state.pinError) return '비밀번호가 서로 달라요. 다시 입력해주세요.';
      if (state.pinPhase === 'success') return '간편 비밀번호 설정이 끝났어요.';
      if (state.pinPhase === 'confirm') return '같은 비밀번호를 한 번 더 입력해주세요.';
      return '사용할 간편 비밀번호를 입력해주세요.';
    }
    return voiceGuides[step];
  }, [step, termsStep, state.otpVerified, state.idScanStatus, state.faceStatus, state.pinPhase, state.pinError]);

  const speakGuide = () => {
    if (!isTtsEnabled) return;
    if (isReading) {
      stopReading();
      setNotice('읽어주기를 멈췄어요.');
      return;
    }
    setIsReading(true);
    ttsSpeak(activeVoiceGuide, { onDone: () => setIsReading(false) });
    setNotice('화면 안내를 천천히 읽어드리고 있어요.');
  };

  // 선제적 도움: 화면 진입 시 TTS
  useEffect(() => {
    if (step === STEPS.OTP && !state.otpVerified) {
      help.speakIfEnabled(
        '인증번호 입력 화면이에요. 방금 받은 문자에서 숫자 6자리를 확인해주세요. 자동으로 입력되지 않았다면 직접 입력해주세요. 인증번호는 다른 사람에게 알려주지 마세요.',
      );
    } else if (step === STEPS.ID_SCAN) {
      help.speakIfEnabled('신분증 촬영 화면이에요. 신분증 전체가 네모 안에 들어오도록 놓아주세요.');
    } else if (step === STEPS.FACE_CHECK && state.faceStatus === 'idle') {
      help.speakIfEnabled('얼굴 확인 화면이에요. 화면을 정면으로 바라봐주세요. 밝은 곳에서 하면 더 잘 돼요.');
    } else if (step === STEPS.ACCOUNT_BANK) {
      help.speakIfEnabled('계좌 은행 선택 화면이에요. 가입에 사용할 계좌의 은행을 하나 선택해주세요.');
    } else if (step === STEPS.ACCOUNT_NUMBER) {
      help.speakIfEnabled('계좌번호 입력 화면이에요. 통장이나 카드에 적힌 계좌번호를 순서대로 입력해주세요.');
    } else if (step === STEPS.ACCOUNT_PASSWORD) {
      help.speakIfEnabled('계좌 비밀번호 입력 화면이에요. 계좌를 만들 때 정한 비밀번호 4자리를 입력해주세요.');
    } else if (step === STEPS.ACCOUNT_CODE) {
      help.speakIfEnabled('1원 인증 화면이에요. 통장 입금 내역에서 KB 뒤에 적힌 숫자 4자리를 입력해주세요.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 선제적 도움: OTP 오류 감지 및 실패 횟수 추적
  useEffect(() => {
    if (step !== STEPS.OTP) return;
    if (!state.otpError) {
      prevOtpErrorRef.current = '';
      return;
    }
    if (state.otpError === prevOtpErrorRef.current) return;
    prevOtpErrorRef.current = state.otpError;
    setOtpFailCount((c) => c + 1);
    help.speakIfEnabled('번호가 맞지 않아요. 방금 받은 문자에서 숫자 6자리를 다시 확인해주세요.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.otpError, step]);

  // 선제적 도움: 얼굴 인증 상태 변화 안내
  useEffect(() => {
    if (step !== STEPS.FACE_CHECK) return;
    const prev = prevFaceStatusRef.current;
    if (state.faceStatus === prev) return;
    prevFaceStatusRef.current = state.faceStatus;
    setFaceFailCount((c) => (state.faceStatus === 'failure' ? c + 1 : c));
    const message =
      state.faceStatus === 'checking'
        ? '얼굴을 확인하고 있어요. 움직이지 말고 잠시 기다려주세요.'
        : state.faceStatus === 'failure'
          ? '얼굴이 잘 보이지 않았어요. 더 밝은 곳에서 다시 시도해주세요.'
          : state.faceStatus === 'success'
            ? '얼굴 확인이 끝났어요. 다음 단계로 이동해주세요.'
            : '';
    if (message) help.speakIfEnabled(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.faceStatus, step]);

  // 선제적 도움: 1원 인증 오류 감지 및 실패 횟수 추적
  useEffect(() => {
    if (step !== STEPS.ACCOUNT_CODE) return;
    if (!state.accountError) {
      prevAccountErrorRef.current = '';
      return;
    }
    if (state.accountError === prevAccountErrorRef.current) return;
    prevAccountErrorRef.current = state.accountError;
    setAccountFailCount((c) => c + 1);
    help.speakIfEnabled('숫자가 맞지 않아요. 통장 입금 내역에서 KB 뒤의 숫자 4자리를 다시 확인해주세요.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.accountError, step]);

  // 에스컬레이션 임계값: OTP 3회, 얼굴 5회, 계좌 3회 실패.
  const escalationThresholdHit = otpFailCount >= 3 || faceFailCount >= 5 || accountFailCount >= 3;
  const showEscalation = escalationThresholdHit && !escalationDismissed;

  const currentGuidance = useMemo(() => {
    if (step === STEPS.OTP && !state.otpVerified) {
      return state.otpError
        ? '번호가 맞지 않아요. 문자에서 숫자 6자리를 다시 확인해주세요.'
        : '방금 받은 문자에서 숫자 6자리를 확인해주세요.';
    }
    if (step === STEPS.FACE_CHECK) {
      if (state.faceStatus === 'checking') return '얼굴을 확인하고 있어요. 움직이지 말고 기다려주세요.';
      if (state.faceStatus === 'failure') return '얼굴이 잘 보이지 않았어요. 더 밝은 곳에서 다시 시도해주세요.';
      if (state.faceStatus === 'success') return '얼굴 확인이 끝났어요.';
      return '화면을 정면으로 바라봐주세요. 밝은 곳이 더 좋아요.';
    }
    if (step === STEPS.ACCOUNT_BANK) return '계좌가 있는 은행을 하나 선택해주세요.';
    if (step === STEPS.ACCOUNT_NUMBER) return '계좌번호를 순서대로 입력해주세요.';
    if (step === STEPS.ACCOUNT_PASSWORD) return '계좌 비밀번호 4자리를 입력해주세요.';
    if (step === STEPS.ACCOUNT_CODE) {
      return state.accountError
        ? '숫자가 맞지 않아요. 통장 입금 내역에서 KB 뒤의 숫자 4자리를 다시 확인해주세요.'
        : '통장 입금 내역에서 KB 뒤에 적힌 숫자 4자리를 입력해주세요.';
    }
    return '';
  }, [step, state.otpVerified, state.otpError, state.faceStatus, state.accountError]);

  const helpBarProps = {
    guidance: currentGuidance,
    voiceEnabled: help.voiceEnabled,
    onReplay: help.replay,
    onToggleVoice: help.toggleVoice,
  };

  if (!draftReady) return <Screen background="#fff" edges={['top']}>{null}</Screen>;

  const page = buildPage();

  return (
    <Screen background="#fff" edges={['top', 'bottom']}>
      <OnboardingHeader
        title={title}
        progress={progress}
        onBack={back}
        onExit={() => setShowExit(true)}
        showBack={step !== STEPS.INTRO && step !== STEPS.COMPLETE}
      />

      {page.fullBleed ? (
        <View style={st.fullBleed}>{page.body}</View>
      ) : (
        // 스크롤을 두지 않는 대신 한 화면에 담는 내용을 줄였다. 화면마다 배율을
        // 바꾸면 단계 간 글자 크기가 튀므로 크기는 고정한다.
        // iOS 는 키보드가 화면 위에 겹치므로 padding 으로 버튼을 밀어올리고,
        // Android 는 adjustResize 로 이미 화면이 줄어든다.
        <KeyboardAvoidingView
          style={st.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={st.page}>
            {isTtsEnabled ? <VoiceGuideButton onClick={speakGuide} isReading={isReading} /> : null}
            {page.body}
          </View>
          {page.actions}
        </KeyboardAvoidingView>
      )}

      {page.fullBleed ? page.actions : null}

      <EscalationSheet visible={showEscalation} onDismiss={() => setEscalationDismissed(true)} />
      <Toast message={notice} onDismiss={() => setNotice('')} />
      <AgreementDetail
        visible={!!agreementDetail}
        title={agreementDetail}
        onClose={() => setAgreementDetail('')}
      />

      <Sheet visible={showExit} onClose={() => setShowExit(false)} title="가입을 그만하시겠어요?">
        <AppText size={14} lineHeight={21} color="#888" style={st.exitBody}>
          인증번호와 비밀번호는 저장하지 않아요. 나중에 안전한 단계부터 이어서 가입할 수 있어요.
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => setShowExit(false)} style={st.exitPrimary}>
          <AppText size={17} weight={900} color={INK}>
            계속 가입할게요
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            stopReading();
            onCancel();
          }}
          style={st.exitQuiet}
        >
          <AppText size={14} weight={700} color="#888" style={st.underline}>
            그만하기
          </AppText>
        </Pressable>
      </Sheet>
    </Screen>
  );

  // ── step body/actions ────────────────────────────────────
  function buildPage(): { body: ReactNode; actions: ReactNode | null; fullBleed?: boolean } {
    switch (step) {
      case STEPS.INTRO:
        return {
          body: (
            <>
              <StepBadge icon="shield">가입 안내 · 약 15분</StepBadge>
              <PageTitle>{'가입은 세 단계로\n천천히 진행해요'}</PageTitle>
              <GuideText>신분증을 준비해주세요. 필요한 확인은 단비가 차례로 안내할게요.</GuideText>
              <StepList
                rows={[
                  ['가입 준비', '필요한 것을 함께 확인해요'],
                  ['휴대폰 본인 확인', '문자로 본인임을 확인해요'],
                  ['국민인증서 만들기', '신분증·얼굴·계좌를 확인해요'],
                ]}
              />
              {onDevHome ? (
                <Pressable accessibilityRole="button" onPress={onDevHome} style={st.devSkip}>
                  <AppText size={13} weight={700} color="#BBB" style={st.underline}>
                    홈 바로가기
                  </AppText>
                </Pressable>
              ) : null}
            </>
          ),
          actions: <BottomActionArea primary="가입 시작하기" onPrimary={next} />,
        };

      case STEPS.NAME:
        return {
          body: (
            <>
              <StepBadge icon="user">1단계 · 이름 입력</StepBadge>
              <PageTitle>{'이름을\n입력해주세요'}</PageTitle>
              <GuideText>신분증에 적힌 이름과 똑같이 입력해주세요.</GuideText>
              <SeniorTextInput
                label="이름"
                value={state.userName}
                onChangeText={state.setUserName}
                placeholder="예: 홍길동"
                support="본인 이름을 정확히 입력해주세요."
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="다음"
              onPrimary={next}
              primaryDisabled={!state.userName.trim()}
            />
          ),
        };

      case STEPS.PHONE_OWNERSHIP: {
        const blocked = state.phoneOwnership === false;
        return {
          body: (
            <>
              <StepBadge icon="phone">1단계 · 휴대폰 확인</StepBadge>
              <PageTitle>{'이 휴대폰은\n고객님 명의인가요?'}</PageTitle>
              <GuideText>잠시 뒤 문자로 본인 확인을 할게요.</GuideText>
              <OnboardingInfoCard
                icon="phone"
                title="본인 휴대폰 확인"
                description="고객님 명의의 휴대폰으로 문자를 받을게요."
              />
              {blocked ? (
                <View style={st.helpExit}>
                  <GuideBox
                    tone="error"
                    title="이 휴대폰으로는 지금 가입을 끝내기 어려워요."
                    description="문자 본인 확인은 본인 명의 휴대폰에서만 할 수 있어요."
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => Linking.openURL('tel:15889999')}
                    style={st.helpExitBtn}
                  >
                    <AppText size={17} weight={900} color={INK}>
                      전화로 상담받기 (1588-9999)
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setNotice('가까운 영업점은 국민은행 홈페이지나 콜센터에서 안내받을 수 있어요.')
                    }
                    style={st.helpExitBtn}
                  >
                    <AppText size={17} weight={900} color={INK}>
                      영업점에서 도움받기
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowExit(true)}
                    style={st.quietInline}
                  >
                    <AppText size={14} weight={700} color="#888" style={st.underline}>
                      나중에 다시 할게요
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </>
          ),
          actions: blocked ? (
            <BottomActionArea
              primary="아니요, 제 휴대폰이 맞아요"
              onPrimary={() => state.setPhoneOwnership(null)}
            />
          ) : (
            <BottomActionArea
              primary="네, 제 휴대폰이에요"
              onPrimary={() => {
                state.setPhoneOwnership(true);
                next();
              }}
              secondary="다른 사람 명의예요"
              onSecondary={() => state.setPhoneOwnership(false)}
            />
          ),
        };
      }

      case STEPS.CARRIER:
        return {
          body: (
            <>
              <StepBadge icon="phone">2단계 · 통신사 선택</StepBadge>
              <PageTitle>{'이용 중인 통신사를\n선택해주세요'}</PageTitle>
              <GuideText>현재 휴대폰의 통신사를 하나만 선택해주세요.</GuideText>
              <View style={st.list}>
                {(['SKT', 'KT', 'LG U+', '알뜰폰'] as const).map((carrier) => (
                  <LargeSelectionCard
                    key={carrier}
                    title={carrier}
                    selected={state.carrier === carrier}
                    onClick={() => state.setCarrier(carrier)}
                  />
                ))}
              </View>
            </>
          ),
          actions: (
            <BottomActionArea
              primary="이 통신사로 할게요"
              onPrimary={next}
              primaryDisabled={!state.carrier}
            />
          ),
        };

      case STEPS.PHONE_NUMBER:
        return {
          body: (
            <>
              <StepBadge icon="phone">2단계 · 휴대폰 번호</StepBadge>
              <PageTitle>{'휴대폰 번호를\n입력해주세요'}</PageTitle>
              <GuideText>본인 명의의 휴대폰 번호를 천천히 입력해주세요.</GuideText>
              <SeniorTextInput
                label="전화번호"
                value={formatPhoneNumber(state.phoneNumber)}
                onChangeText={(t) => state.setPhoneNumber(t.replace(/\D/g, '').slice(0, 11))}
                placeholder="010 1234 5678"
                inputMode="numeric"
                support="숫자 11자리를 모두 입력해주세요."
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="약관 확인하기"
              onPrimary={() => {
                setTermsStep(0);
                next();
              }}
              primaryDisabled={state.phoneNumber.length !== 11}
            />
          ),
        };

      case STEPS.SIGNUP_TERMS: {
        if (termsStep === 0) {
          return {
            body: (
              <>
                <StepBadge icon="shield">약관 1/2 · 꼭 필요한 동의</StepBadge>
                <PageTitle>{'꼭 필요한 약관을\n확인해주세요'}</PageTitle>
                <GuideText>가입을 위해 꼭 필요한 내용이에요.</GuideText>
                <AgreementAllToggle
                  label="필수 약관 모두 동의"
                  checked={requiredTermsComplete}
                  onToggle={() => state.setAllRequiredTerms(!requiredTermsComplete)}
                />
                <View style={st.agreeList}>
                  <AgreementCard
                    title="전자금융거래 기본약관"
                    description="가입·송금 등 서비스 이용"
                    checked={state.requiredTerms[0]}
                    onToggle={() => state.toggleRequiredTerm(0)}
                    onDetail={() => setAgreementDetail('전자금융거래 기본약관')}
                  />
                  <AgreementCard
                    title="개인정보 수집·이용"
                    description="본인 확인과 고객 등록"
                    checked={state.requiredTerms[1]}
                    onToggle={() => state.toggleRequiredTerm(1)}
                    onDetail={() => setAgreementDetail('개인정보 수집·이용')}
                  />
                </View>
                {!requiredTermsComplete ? (
                  <InlineError text="필수 약관 두 개에 모두 동의해주세요." />
                ) : null}
              </>
            ),
            actions: (
              <BottomActionArea
                primary="필수 약관 확인했어요"
                onPrimary={() => {
                  stopReading();
                  setTermsStep(1);
                }}
                primaryDisabled={!requiredTermsComplete}
              />
            ),
          };
        }
        return {
          body: (
            <>
              <StepBadge icon="sparkle">약관 2/2 · 선택 동의</StepBadge>
              <PageTitle>{'선택 약관도\n확인해볼까요?'}</PageTitle>
              <GuideText>동의하지 않아도 가입할 수 있어요.</GuideText>
              <View style={st.agreeList}>
                <AgreementCard
                  title="혜택 및 이벤트 안내"
                  description="새로운 혜택과 서비스 소식"
                  checked={state.marketingTermAccepted}
                  onToggle={() => state.setMarketingTermAccepted(!state.marketingTermAccepted)}
                  onDetail={() => setAgreementDetail('혜택 및 이벤트 안내')}
                />
              </View>
            </>
          ),
          actions: (
            <BottomActionArea
              primary="선택 약관도 동의할게요"
              onPrimary={() => {
                state.setMarketingTermAccepted(true);
                state.sendOtp();
                next();
              }}
              secondary="동의하지 않고 계속할게요"
              onSecondary={() => {
                state.setMarketingTermAccepted(false);
                state.sendOtp();
                next();
              }}
            />
          ),
        };
      }

      case STEPS.OTP:
        return state.otpVerified
          ? {
              body: (
                <>
                  <StepBadge icon="check">2단계 · 본인 확인 완료</StepBadge>
                  <PageTitle>{'휴대폰 본인 확인이\n끝났어요'}</PageTitle>
                  <GuideText>이제 국민인증서를 만들게요.</GuideText>
                  <View style={st.centerBlock}>
                    <SuccessMark />
                    <AppText size={15} weight={800} color={INK} align="center">
                      인증번호를 확인했어요
                    </AppText>
                  </View>
                </>
              ),
              actions: <BottomActionArea primary="국민인증서 만들기" onPrimary={next} />,
            }
          : {
              body: (
                <>
                  <StepBadge icon="message">2단계 · 문자 확인</StepBadge>
                  <PageTitle>{'문자로 받은 숫자\n6자리를 입력해주세요'}</PageTitle>
                  <ScreenHelpBar {...helpBarProps} />
                  <SeniorTextInput
                    label="인증번호"
                    value={state.otp}
                    onChangeText={(t) => state.setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="숫자 6자리"
                    inputMode="numeric"
                    maxLength={6}
                    error={state.otpError}
                    support={`프로토타입에서는 ${MOCK_OTP}를 입력하면 확인이 끝나요.`}
                  />
                </>
              ),
              actions: (
                <BottomActionArea
                  primary="인증번호 확인"
                  onPrimary={() => {
                    stopReading();
                    state.verifyOtp();
                  }}
                  primaryDisabled={!state.otpSent || state.otp.length !== 6}
                  secondary="인증번호 다시 받기"
                  onSecondary={() => {
                    state.sendOtp();
                    setNotice('새 인증번호를 보냈어요.');
                  }}
                />
              ),
            };

      case STEPS.CERTIFICATE_INTRO:
        return {
          body: (
            <>
              <StepBadge icon="shield">3단계 · 인증서 만들기</StepBadge>
              <PageTitle>{'국민인증서를\n만들게요'}</PageTitle>
              <StepList
                rows={[
                  ['신분증 확인', '신분증을 촬영해 정보를 확인해요'],
                  ['얼굴 확인', '신분증 사진과 비교해요'],
                  ['계좌 확인', '내 계좌인지 확인해요'],
                  ['비밀번호 설정', '나만의 번호를 만들어요'],
                ]}
              />
            </>
          ),
          actions: <BottomActionArea primary="인증서 발급하기" onPrimary={next} />,
        };

      case STEPS.CERTIFICATE_TERMS:
        return {
          body: (
            <>
              <StepBadge icon="shield">3단계 · 인증서 약관</StepBadge>
              <PageTitle>{'발급 약관을\n확인해주세요'}</PageTitle>
              <GuideText>두 항목을 천천히 확인하고 선택해주세요.</GuideText>
              <View style={st.agreeList}>
                <AgreementCard
                  title="국민인증서 이용약관"
                  description="인증서 발급과 사용"
                  checked={state.certificateTerms[0]}
                  onToggle={() => state.toggleCertificateTerm(0)}
                  onDetail={() => setAgreementDetail('국민인증서 이용약관')}
                />
                <AgreementCard
                  title="개인정보 수집·이용"
                  description="본인 확인과 부정 사용 방지"
                  checked={state.certificateTerms[1]}
                  onToggle={() => state.toggleCertificateTerm(1)}
                  onDetail={() => setAgreementDetail('인증서 개인정보 수집·이용')}
                />
              </View>
              {!certificateTermsComplete ? (
                <InlineError text="약관 두 개를 모두 선택해주세요." />
              ) : null}
            </>
          ),
          actions: (
            <BottomActionArea
              primary="동의하고 계속하기"
              onPrimary={next}
              primaryDisabled={!certificateTermsComplete}
            />
          ),
        };

      case STEPS.ID_SELECT:
        return {
          body: (
            <>
              <StepBadge icon="id">3단계 · 신분증 확인</StepBadge>
              <PageTitle>{'사용할 신분증을\n선택해주세요'}</PageTitle>
              <GuideText>빛이 잘 드는 곳에서 원본 신분증을 준비해주세요.</GuideText>
              <View style={st.list}>
                <LargeSelectionCard
                  icon="id"
                  title="주민등록증"
                  selected={state.idType === '주민등록증'}
                  onClick={() => state.setIdType('주민등록증')}
                />
                <LargeSelectionCard
                  icon="id"
                  title="운전면허증"
                  selected={state.idType === '운전면허증'}
                  onClick={() => state.setIdType('운전면허증')}
                />
              </View>
            </>
          ),
          actions: (
            <BottomActionArea
              primary="이 신분증으로 할게요"
              onPrimary={next}
              primaryDisabled={!state.idType}
            />
          ),
        };

      case STEPS.ID_SCAN:
        return {
          fullBleed: true,
          body: (
            <IdCaptureExperience
              initiallyCaptured={state.idScanStatus === 'success'}
              onCaptured={state.completeIdScan}
              onAccepted={next}
              onRetake={state.resetIdVerification}
            />
          ),
          actions: null,
        };

      case STEPS.ID_CONFIRM:
        return {
          body: (
            <>
              <StepBadge icon="user">3단계 · 신분증 정보 확인</StepBadge>
              <PageTitle>{'읽은 정보가\n맞나요?'}</PageTitle>
              <GuideText>다르면 아래에서 다시 촬영할 수 있어요.</GuideText>
              <ReadResult
                idType={state.idType ?? ''}
                rows={[
                  ['이름', MOCK_ID_NAME],
                  ['주민등록번호', MOCK_ID_NUMBER],
                  ['발급일자', MOCK_ID_ISSUED_DATE],
                ]}
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="네, 맞아요"
              onPrimary={() => {
                state.confirmIdInformation();
                next();
              }}
              secondary="다시 촬영할게요"
              onSecondary={() => {
                stopReading();
                state.resetIdVerification();
                setStep(STEPS.ID_SCAN);
              }}
            />
          ),
        };

      case STEPS.FACE_CHECK: {
        const checking = state.faceStatus === 'checking';
        const failed = state.faceStatus === 'failure';
        const success = state.faceStatus === 'success';
        return {
          body: (
            <>
              <StepBadge icon="face">3단계 · 얼굴 확인</StepBadge>
              <PageTitle>
                {checking
                  ? '얼굴을 확인하고 있어요'
                  : failed
                    ? '얼굴이 잘 보이지 않았어요'
                    : success
                      ? '얼굴을 확인했어요'
                      : '얼굴을 확인해볼게요'}
              </PageTitle>
              <ScreenHelpBar {...helpBarProps} />
              <FaceCheckCircle status={state.faceStatus} />
              {checking ? (
                <AppText size={15} weight={800} color={INK} align="center" style={st.mt16}>
                  움직이지 말고 잠시 기다려주세요.
                </AppText>
              ) : null}
              {failed ? (
                <GuideBox tone="error" title="괜찮아요. 밝은 곳에서 다시 해볼게요." />
              ) : null}
              {success ? (
                <GuideBox tone="success" title={`${state.userName}님으로 확인했어요.`} />
              ) : null}
            </>
          ),
          actions: (
            <BottomActionArea
              primary={
                success
                  ? '계좌 확인으로 갈게요'
                  : checking
                    ? '확인하고 있어요'
                    : failed
                      ? '다시 확인할게요'
                      : '얼굴 확인 시작'
              }
              onPrimary={
                success
                  ? next
                  : () => {
                      stopReading();
                      state.startFaceCheck();
                    }
              }
              primaryDisabled={checking}
            />
          ),
        };
      }

      case STEPS.ACCOUNT_BANK:
        return {
          body: (
            <>
              <StepBadge icon="bank">3단계 · 계좌 확인</StepBadge>
              <PageTitle>{'계좌가 있는\n은행을 선택해주세요'}</PageTitle>
              <GuideText>가입에 사용할 계좌의 은행을 하나 선택해주세요.</GuideText>
              <View style={st.bankGrid}>
                <BankGrid selected={state.bank ?? ''} onSelect={state.setBank} />
              </View>
            </>
          ),
          actions: (
            <BottomActionArea
              primary="이 은행으로 할게요"
              onPrimary={next}
              primaryDisabled={!state.bank}
            />
          ),
        };

      case STEPS.ACCOUNT_NUMBER: {
        const accountNumberValid = state.accountNumber.length >= 10;
        return {
          body: (
            <>
              <StepBadge icon="bank">3단계 · 계좌번호 입력</StepBadge>
              <PageTitle>{'계좌번호를\n입력해주세요'}</PageTitle>
              <GuideText>{`${state.bank} 계좌번호를 통장이나 카드에서 확인해주세요.`}</GuideText>
              <ScreenHelpBar {...helpBarProps} />
              <SeniorTextInput
                label="계좌번호"
                value={state.accountNumber}
                onChangeText={(t) => state.setAccountNumber(t.replace(/\D/g, '').slice(0, 14))}
                placeholder="숫자만 입력해주세요"
                inputMode="numeric"
                support="계좌번호 숫자만 순서대로 입력해주세요."
              />
              <GuideBox
                title={
                  state.isKbAccount
                    ? '국민은행 계좌는 계좌 비밀번호로 바로 확인해요.'
                    : '다른 은행 계좌는 1원을 보내 입금자명으로 확인해요.'
                }
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="다음"
              onPrimary={() => {
                if (state.isKbAccount) {
                  setStep(STEPS.ACCOUNT_PASSWORD);
                } else {
                  state.sendAccountVerification();
                  setStep(STEPS.ACCOUNT_CODE);
                }
              }}
              primaryDisabled={!accountNumberValid}
            />
          ),
        };
      }

      case STEPS.ACCOUNT_PASSWORD: {
        const passwordValid = state.accountPassword.length === 4;
        return {
          body: (
            <>
              <StepBadge icon="lock">3단계 · 계좌 비밀번호</StepBadge>
              <PageTitle>{'계좌 비밀번호\n4자리를 입력해주세요'}</PageTitle>
              <GuideText>{`${state.bank} ${state.accountNumber} 계좌의 비밀번호예요.`}</GuideText>
              <ScreenHelpBar {...helpBarProps} />
              <SeniorTextInput
                label="계좌 비밀번호"
                value={state.accountPassword}
                onChangeText={(t) => state.setAccountPassword(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="숫자 4자리"
                inputMode="numeric"
                maxLength={4}
                support="계좌를 만들 때 정한 비밀번호 4자리를 입력해주세요."
              />
              <GuideBox title="프로토타입에서는 숫자 4자리를 입력하면 확인이 끝나요." />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="계좌 확인 완료"
              onPrimary={() => {
                state.verifyAccountPassword();
                setStep(STEPS.PIN);
              }}
              primaryDisabled={!passwordValid}
            />
          ),
        };
      }

      case STEPS.ACCOUNT_CODE:
        return {
          body: (
            <>
              <StepBadge icon="bank">3단계 · 1원 인증</StepBadge>
              <PageTitle>{'입금자명 숫자\n4자리를 입력해주세요'}</PageTitle>
              <ScreenHelpBar {...helpBarProps} />
              <SeniorTextInput
                label="숫자 4자리"
                value={state.accountCode}
                onChangeText={(t) => state.setAccountCode(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                error={state.accountError}
                support={
                  state.accountVerificationSent
                    ? `1원을 보냈어요. 프로토타입 입금자명은 KB ${MOCK_ACCOUNT_CODE}예요.`
                    : `${state.bank} 통장 입금 내역에서 'KB' 뒤의 숫자를 확인해주세요.`
                }
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="계좌 확인 완료"
              onPrimary={() => {
                if (state.verifyAccountCode()) setStep(STEPS.PIN);
              }}
              primaryDisabled={!state.accountVerificationSent || state.accountCode.length !== 4}
              secondary="입금 내역 찾는 법"
              onSecondary={() => setNotice('거래내역에서 가장 최근의 1원 입금을 열어보세요.')}
            />
          ),
        };

      case STEPS.PIN: {
        const confirming = state.pinPhase === 'confirm';
        const success = state.pinPhase === 'success';
        return {
          body: (
            <>
              <PageTitle>
                {success
                  ? '비밀번호를 설정했어요'
                  : confirming
                    ? '한 번 더 입력해주세요'
                    : '앞으로 쓸 숫자 6자리를\n정해주세요'}
              </PageTitle>
              <GuideText>
                {success
                  ? '두 번 입력한 번호가 같아요. 로그인할 때 이 번호를 사용해요.'
                  : confirming
                    ? '처음 정한 번호를 그대로 입력해주세요.'
                    : '생일이나 전화번호처럼 알기 쉬운 번호는 피해주세요.'}
              </GuideText>
              {success ? (
                <View style={st.centerBlock}>
                  <SuccessMark />
                </View>
              ) : (
                <View style={st.pinArea}>
                  <View style={st.pinDotsBox}>
                    <PinDots length={6} filled={state.currentPin.length} />
                  </View>
                  <PinKeypad
                    onDigit={(digit) => {
                      stopReading();
                      state.enterPin(digit);
                    }}
                    onBackspace={() => state.enterPin('⌫')}
                    onClear={() => {
                      state.resetPin();
                      setNotice('');
                    }}
                  />
                  {state.pinError ? (
                    <InlineError text={state.pinError} />
                  ) : (
                    <AppText size={13} color="#AAA" align="center" style={st.pinHint}>
                      비밀번호는 다른 사람에게 보이지 않게 입력해 주세요.
                    </AppText>
                  )}
                </View>
              )}
            </>
          ),
          actions: success ? (
            <BottomActionArea
              primary="가입 마치기"
              onPrimary={() => {
                state.completeOnboarding();
                next();
              }}
              primaryDisabled={!state.pinCreated || !state.accountVerified}
            />
          ) : null,
        };
      }

      default:
        return {
          body: (
            <View style={st.complete}>
              <SuccessMark />
              <AppText size={24} weight={900} color={INK} align="center" lineHeight={33}>
                가입이 끝났어요!
              </AppText>
              <AppText size={15} color="#888" align="center" lineHeight={22} style={st.mt8}>
                이제 단비와 함께 천천히 은행 업무를 시작해볼 수 있어요.
              </AppText>
            </View>
          ),
          actions: (
            <BottomActionArea
              primary="송금 먼저 연습하기"
              onPrimary={() => finish('practice')}
              secondary="내 계좌 확인하기"
              onSecondary={() => finish('accounts')}
              quiet="홈으로 갈게요"
              onQuiet={() => finish('home')}
            />
          ),
        };
    }
  }
}

// ──────────────────────────────────────────────────────────
// step 전용 소형 컴포넌트 — 크기/색은 메인(홈) 화면 규격을 따른다.
// ──────────────────────────────────────────────────────────
function StepList({ rows }: { rows: [string, string][] }) {
  return (
    <View style={st.stepList}>
      {rows.map(([label, detail], i) => (
        <View key={label} style={st.stepRow}>
          <View style={st.stepNum}>
            <AppText size={13} weight={900} color={INK}>
              {i + 1}
            </AppText>
          </View>
          <View style={st.flex1}>
            <AppText size={16} weight={900} color={INK}>
              {label}
            </AppText>
            <AppText size={13} lineHeight={19} color="#888" style={st.mt2}>
              {detail}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function ReadResult({ idType, rows }: { idType: string; rows: [string, string][] }) {
  return (
    <View style={st.readResult}>
      <View style={st.idTypeChip}>
        <AppText size={12} weight={800} color={INK}>
          {idType}
        </AppText>
      </View>
      {rows.map(([label, value], i) => (
        <View key={label} style={[st.readRow, i > 0 && st.readRowBorder]}>
          <AppText size={13} weight={700} color="#888" style={st.readLabel}>
            {label}
          </AppText>
          <AppText size={17} weight={900} color={INK} style={st.flex1}>
            {value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function FaceCheckCircle({ status }: { status: string }) {
  const success = status === 'success';
  const checking = status === 'checking';
  const failure = status === 'failure';
  return (
    <View
      style={[
        st.faceCircle,
        checking && st.faceCircleActive,
        success && st.faceCircleSuccess,
        failure && st.faceCircleFailure,
      ]}
    >
      <OnboardingIcon name={success ? 'check' : 'user'} size={34} color={INK} />
      {checking ? <ScanLine travel={44} inset={20} /> : null}
    </View>
  );
}

function SuccessMark() {
  return (
    <View style={st.successMark}>
      <OnboardingIcon name="check" size={34} color={INK} />
    </View>
  );
}

function InlineError({ text }: { text: string }) {
  return (
    <AppText size={13} weight={700} lineHeight={19} color="#E05050" style={st.inlineError}>
      {text}
    </AppText>
  );
}

const st = StyleSheet.create({
  flex1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  underline: { textDecorationLine: 'underline' },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  fullBleed: { flex: 1 },

  list: { gap: 8, marginTop: 14 },
  bankGrid: { marginTop: 16 },
  agreeList: { gap: 2, marginTop: 6 },

  inlineError: { marginTop: 10 },

  helpExit: { gap: 8, marginTop: 14 },
  helpExitBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  quietInline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },

  devSkip: { marginTop: 14, alignSelf: 'center', padding: 8 },

  stepList: { gap: 8, marginTop: 16 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: CREAM,
  },
  stepNum: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: YELLOW,
  },

  readResult: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: CREAM,
  },
  idTypeChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 20,
    backgroundColor: YELLOW,
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  readRowBorder: { borderTopWidth: 1, borderTopColor: '#F0E6C4' },
  readLabel: { width: 92 },

  faceCircle: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#EBEBEB',
    borderRadius: 75,
    backgroundColor: '#FAFAFA',
  },
  faceCircleActive: { borderColor: YELLOW },
  faceCircleSuccess: { borderColor: '#A8DCC0', backgroundColor: '#EFF9F3' },
  faceCircleFailure: { borderColor: '#F0B4AC', backgroundColor: '#FDF0EE' },

  pinArea: { alignItems: 'center', marginTop: 18 },
  pinDotsBox: { marginBottom: 22 },
  pinHint: { marginTop: 12 },
  centerBlock: { alignItems: 'center', marginTop: 24 },

  complete: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successMark: {
    width: 68,
    height: 68,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: YELLOW,
  },

  exitBody: { marginTop: 10, marginBottom: 14 },
  exitPrimary: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  exitQuiet: { width: '100%', marginTop: 6, alignItems: 'center', paddingVertical: 10 },
});
