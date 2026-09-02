import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Toast } from '@/components/ui/Toast';
import { ScanLine } from '@/components/anim/ScanLine';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { getJSON, setJSON, StorageKeys } from '@/lib/storage';
import { useAndroidBack } from '@/lib/useAndroidBack';
import type { OnboardingDestination } from '@/lib/navigation';
import { colors, radius } from '@/theme/tokens';
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
  OnboardingTipList,
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
  ACCOUNT_CHECK: 13,
  ACCOUNT_CODE: 14,
  PIN: 15,
  COMPLETE: 16,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];
type PageMeta = readonly [eyebrow: string, title: string, progress: number];

// 임시 정책: 가입 과정에서는 약관과 신분증 촬영 화면에 TTS를 제공한다.
const TTS_ENABLED_STEPS: readonly Step[] = [STEPS.SIGNUP_TERMS, STEPS.CERTIFICATE_TERMS];

const REENTER_PIN_NOTICE = '이제 방금 정한 번호를 한 번 더 입력해주세요.';

const pageMeta: Record<Step, PageMeta> = {
  [STEPS.INTRO]: ['가입 전', '가입 안내', 0],
  [STEPS.NAME]: ['1/3', '가입 준비', 33],
  [STEPS.PHONE_OWNERSHIP]: ['1/3', '가입 준비', 33],
  [STEPS.CARRIER]: ['2/3', '본인 확인', 66],
  [STEPS.PHONE_NUMBER]: ['2/3', '본인 확인', 66],
  [STEPS.SIGNUP_TERMS]: ['2/3', '본인 확인', 66],
  [STEPS.OTP]: ['2/3', '본인 확인', 66],
  [STEPS.CERTIFICATE_INTRO]: ['3/3', '국민인증서', 100],
  [STEPS.CERTIFICATE_TERMS]: ['3/3', '국민인증서', 100],
  [STEPS.ID_SELECT]: ['3/3', '국민인증서', 100],
  [STEPS.ID_SCAN]: ['3/3', '국민인증서', 100],
  [STEPS.ID_CONFIRM]: ['3/3', '국민인증서', 100],
  [STEPS.FACE_CHECK]: ['3/3', '국민인증서', 100],
  [STEPS.ACCOUNT_CHECK]: ['3/3', '국민인증서', 100],
  [STEPS.ACCOUNT_CODE]: ['3/3', '국민인증서', 100],
  [STEPS.PIN]: ['3/3', '국민인증서', 100],
  [STEPS.COMPLETE]: ['가입 완료', '단비', 100],
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
  [STEPS.ACCOUNT_CHECK]: '신분증에서 확인한 이름과 계좌 이름이 같은지 확인해주세요.',
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
  const [eyebrow, title, progress] = pageMeta[step];
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
      accountVerified: state.accountVerified,
    };
    void setJSON(StorageKeys.onboardingDraft, draft);
  }, [
    draftReady,
    state.accountVerified,
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
    } else if (step === STEPS.ACCOUNT_CHECK) {
      help.speakIfEnabled('계좌 확인 화면이에요. 화면의 계좌와 이름이 맞으면 1원 입금 버튼을 눌러주세요.');
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
    if (step === STEPS.ACCOUNT_CHECK) return '계좌와 이름이 맞으면 1원 입금 버튼을 눌러주세요.';
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

  if (!draftReady) return <Screen background={colors.paper} edges={['top']}>{null}</Screen>;

  const page = buildPage();

  return (
    <Screen background={colors.paper} edges={['top']}>
      <OnboardingHeader
        eyebrow={eyebrow}
        title={title}
        progress={progress}
        onBack={back}
        onExit={() => setShowExit(true)}
        showBack={step !== STEPS.INTRO && step !== STEPS.COMPLETE}
      />

      {page.fullBleed ? (
        <View style={st.fullBleed}>{page.body}</View>
      ) : (
        <ScrollView
          style={st.flex1}
          contentContainerStyle={st.page}
          keyboardShouldPersistTaps="handled"
        >
          {isTtsEnabled ? <VoiceGuideButton onClick={speakGuide} isReading={isReading} /> : null}
          {page.body}
        </ScrollView>
      )}

      {page.actions}

      <EscalationSheet visible={showEscalation} onDismiss={() => setEscalationDismissed(true)} />
      <Toast message={notice} onDismiss={() => setNotice('')} />
      <AgreementDetail
        visible={!!agreementDetail}
        title={agreementDetail}
        onClose={() => setAgreementDetail('')}
      />

      <Sheet visible={showExit} onClose={() => setShowExit(false)} title="가입을 그만하시겠어요?">
        <AppText size={17} lineHeight={26} color="#5d584f" style={st.exitBody}>
          인증번호와 비밀번호는 저장하지 않아요. 나중에 안전한 단계부터 이어서 가입할 수 있어요.
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => setShowExit(false)} style={st.exitPrimary}>
          <AppText size={20} weight={850} color="#241d08" align="center">
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
          <AppText size={18} weight={700} color="#4e4a43" style={st.underline}>
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
              <StageList
                rows={[
                  ['1', '가입 준비', '필요한 것을 함께 확인해요'],
                  ['2', '휴대폰 본인 확인', '문자로 본인임을 확인해요'],
                  ['3', '국민인증서 만들기', '신분증·얼굴·계좌를 확인해요'],
                ]}
              />
              {onDevHome ? (
                <Pressable accessibilityRole="button" onPress={onDevHome} style={st.devSkip}>
                  <AppText size={16} weight={700} color="#8a857a" style={st.underline}>
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
                    <AppText size={17} weight={850} color="#292721" align="center">
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
                    <AppText size={17} weight={850} color="#292721" align="center">
                      영업점에서 도움받기
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowExit(true)}
                    style={st.quietInline}
                  >
                    <AppText size={18} weight={700} color="#4e4a43" style={st.underline}>
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
                  <GuideText>본인 확인이 끝났어요. 이제 국민인증서를 만들게요.</GuideText>
                  <SuccessPanel />
                  <GuideBox
                    tone="success"
                    title="인증번호를 확인했어요."
                    description="다음 단계로 천천히 이동할게요."
                  />
                </>
              ),
              actions: <BottomActionArea primary="국민인증서 만들기" onPrimary={next} />,
            }
          : {
              body: (
                <>
                  <StepBadge icon="message">2단계 · 문자 확인</StepBadge>
                  <PageTitle>{'문자로 받은 숫자\n6자리를 입력해주세요'}</PageTitle>
                  <GuideText>
                    {state.otpSendCount > 1
                      ? '새로 보낸 문자에서 숫자를 확인해주세요.'
                      : '방금 받은 문자에서 숫자를 확인해주세요.'}
                  </GuideText>
                  <ScreenHelpBar {...helpBarProps} />
                  <SeniorTextInput
                    label="인증번호"
                    value={state.otp}
                    onChangeText={(t) => state.setOtp(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="숫자 6자리"
                    inputMode="numeric"
                    maxLength={6}
                    error={state.otpError}
                    support="인증번호 6자리를 모두 입력해주세요."
                  />
                  <GuideBox
                    title="프로토타입 인증번호"
                    description={`${MOCK_OTP}를 입력하면 본인 확인이 끝나요.`}
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
              <GuideText>로그인하거나 송금할 때 고객님을 안전하게 확인해요.</GuideText>
              <FeatureList
                rows={[
                  ['id', '신분증 확인', '신분증을 촬영해 정보를 확인해요'],
                  ['face', '얼굴 확인', '신분증 사진과 비교해요'],
                  ['bank', '계좌 확인', '내 계좌인지 확인해요'],
                  ['lock', '비밀번호 설정', '나만의 번호를 만들어요'],
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
              <GuideText>신분증에서 읽은 세 가지 정보를 확인해주세요.</GuideText>
              <ReadResult
                idType={state.idType ?? ''}
                rows={[
                  ['이름', MOCK_ID_NAME],
                  ['주민등록번호', MOCK_ID_NUMBER],
                  ['발급일자', MOCK_ID_ISSUED_DATE],
                ]}
              />
              <GuideBox
                title="정보가 다르면 다시 촬영해주세요."
                description="주민등록번호 뒷자리는 안전하게 가려서 보여드려요."
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
              <GuideText>
                {failed
                  ? '조금 더 밝은 곳에서 다시 해볼게요.'
                  : success
                    ? '안전하게 본인임을 확인했어요.'
                    : '화면 안에 얼굴이 잘 보이게 해주세요.'}
              </GuideText>
              <ScreenHelpBar {...helpBarProps} />
              {!checking && !success ? (
                <OnboardingTipList
                  items={['밝은 곳에서 진행해주세요.', '안경이나 모자는 잠시 벗어주세요.', '얼굴을 원 가운데에 맞춰주세요.']}
                />
              ) : null}
              <FaceCheckCircle status={state.faceStatus} />
              {checking ? (
                <AppText size={18} weight={850} align="center" style={st.mt4}>
                  움직이지 말고 잠시 기다려주세요.
                </AppText>
              ) : null}
              {failed ? (
                <GuideBox
                  tone="error"
                  title="괜찮아요. 다시 확인할 수 있어요."
                  description="얼굴을 원 가운데에 맞춰주세요."
                />
              ) : null}
              {success ? (
                <GuideBox
                  tone="success"
                  title="얼굴 확인이 끝났어요."
                  description={`${state.userName}님으로 확인했어요.`}
                />
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

      case STEPS.ACCOUNT_CHECK:
        return {
          body: (
            <>
              <StepBadge icon="bank">3단계 · 계좌 확인</StepBadge>
              <PageTitle>{'본인 계좌를\n확인할게요'}</PageTitle>
              <GuideText>계좌번호 끝자리와 이름을 확인해주세요.</GuideText>
              <ScreenHelpBar {...helpBarProps} />
              <AccountCard
                badge="KB"
                title={`${state.selectedAccount.bank} ${state.selectedAccount.number}`}
                subtitle={`${state.selectedAccount.productName} · ${state.userName}님`}
              />
              <GuideBox
                title={`${state.userName}님 계좌가 맞나요?`}
                description="맞으면 이 계좌로 1원을 보내드릴게요."
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="이 계좌로 1원 받기"
              onPrimary={() => {
                state.sendAccountVerification();
                next();
              }}
              primaryDisabled={!state.faceVerified || !state.userName}
            />
          ),
        };

      case STEPS.ACCOUNT_CODE:
        return {
          body: (
            <>
              <StepBadge icon="bank">3단계 · 1원 인증</StepBadge>
              <PageTitle>{'입금자명 숫자\n4자리를 입력해주세요'}</PageTitle>
              <GuideText>통장 입금 내역에서 ‘KB’ 뒤의 숫자를 확인해주세요.</GuideText>
              <ScreenHelpBar {...helpBarProps} />
              {state.accountVerificationSent ? (
                <GuideBox
                  tone="success"
                  title="1원이 입금됐어요."
                  description={`프로토타입 입금자명은 KB ${MOCK_ACCOUNT_CODE}예요.`}
                />
              ) : null}
              <SeniorTextInput
                label="숫자 4자리"
                value={state.accountCode}
                onChangeText={(t) => state.setAccountCode(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                error={state.accountError}
                support="입금자명에 표시된 숫자만 입력해주세요."
              />
            </>
          ),
          actions: (
            <BottomActionArea
              primary="계좌 확인 완료"
              onPrimary={() => {
                if (state.verifyAccountCode()) next();
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
              <StepBadge icon="lock">3단계 · 간편 비밀번호</StepBadge>
              <PageTitle>
                {success
                  ? '비밀번호를 설정했어요'
                  : confirming
                    ? '한 번 더 입력해주세요'
                    : '사용할 숫자 6자리를 정해주세요'}
              </PageTitle>
              <GuideText>
                {success
                  ? '두 번 입력한 번호가 같아요.'
                  : confirming
                    ? '처음 정한 번호를 그대로 입력해주세요.'
                    : '생일이나 전화번호처럼 알기 쉬운 번호는 피해주세요.'}
              </GuideText>
              {success ? (
                <SuccessPanel />
              ) : (
                <>
                  <PinDots filled={state.currentPin.length} />
                  <PinKeypad
                    onKey={(key) => {
                      stopReading();
                      state.enterPin(key);
                    }}
                  />
                  {confirming || state.currentPin.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        state.resetPin();
                        setNotice('');
                      }}
                      style={st.pinRestart}
                    >
                      <AppText size={18} weight={700} color="#4e4a43" style={st.underline}>
                        처음부터 다시 정하기
                      </AppText>
                    </Pressable>
                  ) : null}
                </>
              )}
              {state.pinError ? (
                <GuideBox
                  tone="error"
                  title="번호가 서로 달라요."
                  description="괜찮아요. 처음 정한 번호를 다시 입력해주세요."
                />
              ) : null}
              {!success && !state.pinError ? (
                <GuideBox
                  title="비밀번호는 누구에게도 알려주지 마세요."
                  description={`${6 - state.currentPin.length}자리를 더 입력해주세요.`}
                />
              ) : null}
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
              <View style={st.successMark}>
                <OnboardingIcon name="check" size={42} color="#302600" />
              </View>
              <StepBadge icon="sparkle">가입 완료</StepBadge>
              <PageTitle>가입이 끝났어요!</PageTitle>
              <GuideText>이제 단비와 함께 천천히 은행 업무를 시작해볼 수 있어요.</GuideText>
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
// step 전용 소형 컴포넌트 (danbi_jj onboarding.css 대응)
// ──────────────────────────────────────────────────────────
function StageList({ rows }: { rows: [string, string, string][] }) {
  return (
    <View style={st.stageList}>
      {rows.map(([num, label, detail]) => (
        <View key={num} style={st.stageRow}>
          <View style={st.stageNum}>
            <AppText size={17} weight={900} color="#302600">
              {num}
            </AppText>
          </View>
          <View style={st.flex1}>
            <AppText size={21} weight={700}>
              {label}
            </AppText>
            <AppText size={17} lineHeight={24} color="#646057" style={st.mt5}>
              {detail}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function FeatureList({ rows }: { rows: [string, string, string][] }) {
  return (
    <View style={st.featureList}>
      {rows.map(([icon, label, detail], i) => (
        <View key={label} style={st.featureRow}>
          <View style={st.featureNum}>
            <AppText size={15} weight={900} color="#302600">
              {i + 1}
            </AppText>
          </View>
          <OnboardingIcon name={icon} size={25} color="#4d473d" />
          <View style={st.flex1}>
            <AppText size={20} weight={700}>
              {label}
            </AppText>
            <AppText size={17} lineHeight={24} color="#646057" style={st.mt4}>
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
        <AppText size={16} weight={800} color={colors.accentText}>
          {idType}
        </AppText>
      </View>
      <View>
        {rows.map(([label, value], i) => (
          <View key={label} style={[st.readRow, i > 0 && st.readRowBorder]}>
            <AppText size={17} weight={700} color="#6b665d" style={st.readLabel}>
              {label}
            </AppText>
            <AppText size={22} weight={900} lineHeight={29} style={st.flex1}>
              {value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function AccountCard({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <View style={st.accountCard}>
      <View style={st.accountBadge}>
        <AppText size={17} weight={900} color="#302600">
          {badge}
        </AppText>
      </View>
      <View style={st.flex1}>
        <AppText size={22} weight={700}>
          {title}
        </AppText>
        <AppText size={18} color="#625e55" style={st.mt6}>
          {subtitle}
        </AppText>
      </View>
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
      <OnboardingIcon
        name={success ? 'check' : 'user'}
        size={42}
        color={success ? '#26704c' : failure ? '#9d392e' : '#5c574f'}
      />
      {checking ? <ScanLine travel={55} inset={24} /> : null}
    </View>
  );
}

function SuccessPanel() {
  return (
    <View style={st.successPanel}>
      <OnboardingIcon name="check" size={44} color="#302600" />
    </View>
  );
}

function PinDots({ filled }: { filled: number }) {
  return (
    <View style={st.pinDots} accessibilityLabel={`비밀번호 ${filled}자리 입력됨`}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={[st.pinDot, i < filled && st.pinDotFilled]} />
      ))}
    </View>
  );
}

function PinKeypad({ onKey }: { onKey: (key: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View style={st.keypad} accessibilityLabel="간편 비밀번호 숫자 키패드">
      {keys.map((key, i) => (
        <Pressable
          key={`${key}-${i}`}
          disabled={!key}
          accessibilityRole="button"
          accessibilityLabel={key === '⌫' ? '한 자리 지우기' : key || undefined}
          onPress={() => key && onKey(key)}
          style={({ pressed }) => [st.keypadBtn, pressed && key ? st.keypadBtnPressed : null]}
        >
          <AppText size={25} weight={850}>
            {key}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function InlineError({ text }: { text: string }) {
  return (
    <AppText size={17} weight={800} lineHeight={25} color="#92372d" style={st.inlineError}>
      {text}
    </AppText>
  );
}

const st = StyleSheet.create({
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  mt5: { marginTop: 5 },
  mt6: { marginTop: 6 },
  underline: { textDecorationLine: 'underline' },

  page: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  fullBleed: { flex: 1 },

  list: { gap: 14, marginTop: 28 },
  agreeList: { gap: 16, marginTop: 14 },

  inlineError: { marginTop: 14, marginHorizontal: 3 },

  helpExit: { gap: 10, marginTop: 18 },
  helpExitBtn: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c8c2b4',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  quietInline: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  devSkip: { marginTop: 20, alignSelf: 'center', padding: 10 },

  stageList: { gap: 14, marginTop: 28 },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 88,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0ddd5',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  stageNum: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.yellow,
  },

  featureList: { gap: 14, marginTop: 28 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 88,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0ddd5',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  featureNum: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.yellow,
  },

  readResult: {
    marginTop: 27,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  idTypeChip: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: colors.yellowSoft,
    marginBottom: 14,
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 61,
  },
  readRowBorder: { borderTopWidth: 1, borderTopColor: '#e8e4da' },
  readLabel: { width: 118 },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 108,
    marginTop: 28,
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  accountBadge: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.yellow,
  },

  faceCircle: {
    width: 204,
    height: 204,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#cfcac0',
    borderRadius: 102,
    backgroundColor: '#f1efe9',
  },
  faceCircleActive: { borderColor: colors.accentBorder },
  faceCircleSuccess: { borderColor: '#2f8b5d', backgroundColor: '#eaf7ef' },
  faceCircleFailure: { borderColor: '#c85f50', backgroundColor: '#fff0ed' },

  successPanel: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 22,
    borderRadius: 48,
    backgroundColor: colors.yellow,
  },

  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 25,
    marginBottom: 15,
  },
  pinDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#d5d1c8' },
  pinDotFilled: { backgroundColor: '#302b24' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 5,
  },
  keypadBtn: {
    width: '30%',
    flexGrow: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  keypadBtnPressed: { backgroundColor: colors.yellowSoft },
  pinRestart: { width: '100%', marginTop: 10, alignItems: 'center', paddingVertical: 8 },

  complete: { alignItems: 'center', paddingTop: 24 },
  successMark: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderRadius: 46,
    backgroundColor: colors.yellow,
  },

  exitBody: { marginTop: 12, marginBottom: 16 },
  exitPrimary: {
    width: '100%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md + 1,
    backgroundColor: colors.yellow,
  },
  exitQuiet: { width: '100%', marginTop: 10, alignItems: 'center', paddingVertical: 10 },
});
