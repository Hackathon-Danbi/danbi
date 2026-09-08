import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, Vibration } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '@/features/main/theme';
import { colors, radius } from '@/theme/tokens';
import { OnboardingIcon } from '../../components/OnboardingComponents';
import { CAPTURE_GUIDANCE } from '../constants';
import type { IdCaptureObservation, IdCaptureStatus } from '../types';
import { resolvePrimaryStatus } from '../utils';
import { useCaptureGuidance } from '../hooks/useCaptureGuidance';

const ABS_FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

type Phase = 'prepare' | 'camera' | 'review';
type HelpKind = 'fit' | 'blur' | 'glare' | 'full';
type Coach = { kind: HelpKind; step: number } | null;

const MOCK_STATUS_OPTIONS: { status: IdCaptureStatus; label: string }[] = [
  { status: 'TOO_CLOSE', label: '너무 가까움' },
  { status: 'TOO_FAR', label: '너무 멂' },
  { status: 'CROPPED', label: '일부 잘림' },
  { status: 'BLURRY', label: '흐림' },
  { status: 'GLARE', label: '빛 반사' },
  { status: 'GOOD_POSITION', label: '좋은 위치' },
];

const COACH_STEPS: Record<HelpKind, string[]> = {
  fit: [
    '먼저 신분증을 책상 위에 놓아주세요.',
    '휴대폰을 신분증 바로 위에 들어주세요.',
    '신분증 네 모서리가 모두 보이도록 휴대폰을 조금 멀리해주세요.',
    '좋아요. 신분증이 모두 들어왔어요.',
  ],
  blur: [
    '휴대폰을 두 손으로 잡아주세요.',
    '신분증을 화면 가운데에 맞춰주세요.',
    '좋아요. 이제 잠시 움직이지 말아주세요.',
    '좋아요. 그대로 계세요. 제가 촬영할게요.',
  ],
  glare: [
    '신분증에 빛이 비치고 있어요.',
    '휴대폰을 오른쪽으로 살짝 기울여주세요.',
    '이번에는 왼쪽으로 조금 기울여주세요.',
    '좋아요. 이제 잘 보여요.',
  ],
  full: [
    '먼저 신분증을 책상 위에 놓아주세요.',
    '휴대폰을 신분증 바로 위에 들어주세요.',
    '신분증 네 모서리가 보이도록 거리를 맞춰주세요.',
    '좋아요. 신분증 전체가 보여요.',
    '빛이 반사되지 않는지 확인할게요.',
    '휴대폰을 두 손으로 잡고 잠시 움직이지 말아주세요.',
    '좋아요. 그대로 계세요. 제가 촬영할게요.',
  ],
};

function arrowFor(observation: IdCaptureObservation, status: IdCaptureStatus) {
  if (status === 'CROPPED') {
    return { left: '←', right: '→', up: '↑', down: '↓' }[observation.cropDirection ?? 'right'];
  }
  if (status === 'GLARE') return observation.glareDirection === 'left' ? '←' : '→';
  return '';
}

function coachArrow(coach: Coach) {
  if (!coach || coach.kind !== 'glare') return '';
  if (coach.step === 1) return '→';
  if (coach.step === 2) return '←';
  return '';
}

function MockIdCard() {
  return (
    <View style={s.mockCard} accessibilityLabel="촬영된 신분증 예시">
      <AppText size={20} weight={900} color="#403821" letterSpacing={1.6}>
        주민등록증
      </AppText>
      <View style={s.mockBody}>
        <View style={s.mockPhoto}>
          <OnboardingIcon name="user" size={40} color="#676255" />
        </View>
        <View style={s.flex1}>
          <AppText size={20} weight={700} color="#403821" letterSpacing={2.8}>
            홍 길 동
          </AppText>
          <AppText size={13} color="#403821" style={s.mt5}>
            900101-1******
          </AppText>
          <AppText size={13} color="#403821">
            서울특별시
          </AppText>
        </View>
      </View>
      <AppText size={12} weight={850} color="#403821" align="right">
        대한민국
      </AppText>
    </View>
  );
}

function PulseArrow({ char }: { char: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(t);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.72 + t.value * 0.28,
    transform: [{ translateX: -5 + t.value * 10 }],
  }));
  return (
    <Animated.View style={style} pointerEvents="none">
      <AppText size={78} weight={900} color={YELLOW}>
        {char}
      </AppText>
    </Animated.View>
  );
}

function HoldIndicator() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 2100, easing: Easing.linear });
    return () => cancelAnimation(t);
  }, [t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: t.value }] }));
  return (
    <View style={s.holdTrack} pointerEvents="none">
      <Animated.View style={[s.holdFill, style]} />
    </View>
  );
}

export function IdCaptureExperience({
  initiallyCaptured,
  onCaptured,
  onAccepted,
  onRetake,
}: {
  initiallyCaptured: boolean;
  onCaptured: () => void;
  onAccepted: () => void;
  onRetake: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(initiallyCaptured ? 'review' : 'prepare');
  const [observation, setObservation] = useState<IdCaptureObservation>({
    issues: ['TOO_FAR'],
    cropDirection: 'right',
    glareDirection: 'right',
  });
  const [showHelp, setShowHelp] = useState(false);
  const [showStuckHelp, setShowStuckHelp] = useState(false);
  const [coach, setCoach] = useState<Coach>(null);
  const [mockOpen, setMockOpen] = useState(false);
  const [mockManuallyChanged, setMockManuallyChanged] = useState(false);
  const [issueCount, setIssueCount] = useState(0);
  const previousIssueRef = useRef<IdCaptureStatus | null>(null);

  // RN 에는 카메라를 붙이지 않는다. 원본의 mock/시뮬레이션 흐름을 그대로 유지한다.
  const cameraUnavailable = true;

  const captureFrame = useCallback(() => {
    setPhase('review');
    onCaptured();
  }, [onCaptured]);

  const { stableStatus, speak, stopSpeaking, resetCapture } = useCaptureGuidance({
    active: phase === 'camera' && !showHelp && !showStuckHelp && !coach,
    observation,
    onAutoCapture: captureFrame,
  });

  const primaryStatus = stableStatus;
  const primaryGuidance = CAPTURE_GUIDANCE[primaryStatus];
  const directionArrow = arrowFor(observation, primaryStatus);
  const coachingText = coach ? COACH_STEPS[coach.kind][coach.step] : '';

  // 목 분석기는 처음 한 번 거리 조절을 안내한 뒤 좋은 위치로 전환합니다.
  useEffect(() => {
    if (phase !== 'camera' || mockManuallyChanged || coach) return;
    const timer = setTimeout(() => setObservation({ issues: ['GOOD_POSITION'] }), 3200);
    return () => clearTimeout(timer);
  }, [coach, mockManuallyChanged, phase]);

  // 같은 문제가 해결되지 않고 되풀이될 때만 실패 횟수로 계산합니다.
  useEffect(() => {
    if (phase !== 'camera') return;
    if (primaryStatus === 'GOOD_POSITION' || primaryStatus === 'CAPTURED') {
      previousIssueRef.current = primaryStatus;
      return;
    }
    if (previousIssueRef.current && previousIssueRef.current !== primaryStatus) {
      setIssueCount((count) => count + 1);
    }
    previousIssueRef.current = primaryStatus;
  }, [phase, primaryStatus]);

  useEffect(() => {
    if (phase !== 'camera' || showHelp || showStuckHelp || coach) return;
    const timer = setTimeout(() => setShowStuckHelp(true), 20000);
    return () => clearTimeout(timer);
  }, [coach, phase, primaryStatus, showHelp, showStuckHelp]);

  // 도움 흐름은 프로토타입에서 단계별 감지 결과를 모사합니다.
  useEffect(() => {
    if (!coach) return;
    stopSpeaking();
    const text = COACH_STEPS[coach.kind][coach.step];
    const speakTimer = setTimeout(() => speak(text, true), 350);
    const lastStep = COACH_STEPS[coach.kind].length - 1;
    const nextTimer = setTimeout(
      () => {
        if (coach.step < lastStep) {
          setCoach({ ...coach, step: coach.step + 1 });
          return;
        }
        setObservation({ issues: ['GOOD_POSITION'] });
        setCoach(null);
      },
      coach.kind === 'full' ? 1900 : 2200,
    );
    return () => {
      clearTimeout(speakTimer);
      clearTimeout(nextTimer);
    };
  }, [coach, speak, stopSpeaking]);

  useEffect(() => {
    if (primaryStatus === 'CAPTURED') Vibration.vibrate(55);
  }, [primaryStatus]);

  const startCamera = () => {
    setPhase('camera');
    setObservation({ issues: ['TOO_FAR'] });
    setMockManuallyChanged(false);
    setIssueCount(0);
  };

  const chooseMockStatus = (status: IdCaptureStatus) => {
    stopSpeaking();
    resetCapture();
    setMockManuallyChanged(true);
    setObservation({
      issues: [status],
      cropDirection: status === 'CROPPED' ? 'right' : undefined,
      glareDirection: status === 'GLARE' ? 'right' : undefined,
    });
  };

  const startCoach = (kind: HelpKind) => {
    setShowHelp(false);
    setShowStuckHelp(false);
    setMockManuallyChanged(true);
    stopSpeaking();
    setCoach({ kind, step: 0 });
  };

  const retake = () => {
    onRetake();
    resetCapture();
    startCamera();
  };

  const multipleIssueLabel = useMemo(() => {
    if (observation.issues.length < 2) return '';
    return `${observation.issues.length}개 상태 중 가장 먼저 해결할 문제를 안내하고 있어요.`;
  }, [observation.issues.length]);

  const good = primaryStatus === 'GOOD_POSITION' || primaryStatus === 'CAPTURED';

  if (phase === 'prepare') {
    return (
      <View style={s.sheet}>
        <View style={s.sheetBody}>
          <AppText size={24} weight={900} color={INK} lineHeight={33}>
            {'신분증을\n준비해주세요'}
          </AppText>
          <AppText size={15} color="#888" lineHeight={22} style={s.mt8}>
            주민등록증이나 운전면허증을 준비해주세요.
          </AppText>
          <View style={s.prepareList}>
            {[
              '신분증을 평평한 곳에 놓아주세요.',
              '밝은 곳에서 촬영해주세요.',
              '신분증을 가리는 것이 없는지 확인해주세요.',
            ].map((text, i) => (
              <View key={text} style={s.prepareRow}>
                <View style={s.prepareNum}>
                  <AppText size={13} weight={900} color={INK}>
                    {i + 1}
                  </AppText>
                </View>
                <AppText size={15} weight={700} lineHeight={21} color={INK} style={s.flex1}>
                  {text}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <View style={s.sheetActions}>
          <Pressable accessibilityRole="button" onPress={startCamera} style={s.primaryBtn}>
            <AppText size={17} weight={900} color={INK}>
              신분증 촬영하기
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'review') {
    return (
      <View style={s.sheet}>
        <View style={s.sheetBody}>
          <View style={s.capturedBadge}>
            <OnboardingIcon name="check" size={15} color={INK} />
            <AppText size={12} weight={700} color={INK}>
              잘 찍혔어요!
            </AppText>
          </View>
          <AppText size={24} weight={900} color={INK} lineHeight={33} style={s.mt12}>
            {'신분증이\n잘 보이나요?'}
          </AppText>
          <AppText size={15} color="#888" lineHeight={22} style={s.mt8}>
            글자와 사진이 선명하게 보이면 계속 진행해주세요.
          </AppText>
          <View style={s.reviewPhoto}>
            <MockIdCard />
          </View>
        </View>
        <View style={s.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onAccepted} style={s.primaryBtn}>
            <AppText size={17} weight={900} color={INK}>
              네, 잘 보여요
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={retake} style={s.secondaryBtn}>
            <AppText size={17} weight={900} color={INK}>
              다시 찍을게요
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // phase === 'camera'
  return (
    <View style={s.stage}>
      <View style={s.shade} pointerEvents="none" />

      <View style={s.liveMessage} accessibilityLiveRegion="polite">
        <View style={[s.liveDot, good && s.liveDotGood]} />
        <AppText size={21} weight={900} lineHeight={28} color={colors.white} align="center">
          {primaryStatus === 'CAPTURED' ? '잘 찍혔어요!' : primaryGuidance.screen.replace('\n', ' ')}
        </AppText>
      </View>

      <View style={[s.guideFrame, good && s.guideFrameGood]} accessibilityLabel="신분증을 맞출 촬영 영역">
        <View style={[s.corner, s.cornerTL, good && s.cornerGood]} />
        <View style={[s.corner, s.cornerTR, good && s.cornerGood]} />
        <View style={[s.corner, s.cornerBL, good && s.cornerGood]} />
        <View style={[s.corner, s.cornerBR, good && s.cornerGood]} />
        <View style={s.frameLabel}>
          <AppText size={17} weight={900} color="#29240c">
            신분증을 네모 안에 맞춰주세요
          </AppText>
        </View>
        {directionArrow ? (
          <View style={s.directionArrow} pointerEvents="none">
            <PulseArrow char={directionArrow} />
          </View>
        ) : null}
        {primaryStatus === 'GOOD_POSITION' ? <HoldIndicator /> : null}
      </View>

      <AppText size={19} weight={850} color={colors.white} align="center" style={s.cameraSupport}>
        신분증 전체가 보이게 해주세요
      </AppText>
      {cameraUnavailable ? (
        <AppText size={14} color="#deded8" align="center" style={s.cameraFallback}>
          카메라를 사용할 수 없어 연습 화면으로 보여드려요.
        </AppText>
      ) : null}
      {multipleIssueLabel ? (
        <AppText style={s.srOnly}>{multipleIssueLabel}</AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          stopSpeaking();
          setShowHelp(true);
        }}
        style={s.helpTrigger}
      >
        <AppText size={18} weight={850} color={colors.white} style={s.underline}>
          촬영이 어려우신가요?
        </AppText>
      </Pressable>

      <View style={s.mockControls}>
        <Pressable accessibilityRole="button" onPress={() => setMockOpen((v) => !v)} style={s.mockSummary}>
          <AppText size={13} color="rgba(255,255,255,0.86)">
            프로토타입 상태 테스트 {mockOpen ? '▲' : '▼'}
          </AppText>
        </Pressable>
        {mockOpen ? (
          <View style={s.mockRow}>
            {MOCK_STATUS_OPTIONS.map(({ status, label }) => {
              const active = resolvePrimaryStatus(observation.issues) === status;
              return (
                <Pressable
                  key={status}
                  accessibilityRole="button"
                  onPress={() => chooseMockStatus(status)}
                  style={[s.mockBtn, active && s.mockBtnActive]}
                >
                  <AppText size={12} color={colors.white}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                resetCapture();
                setMockManuallyChanged(true);
                setObservation({
                  issues: ['CROPPED', 'GLARE', 'BLURRY'],
                  cropDirection: 'left',
                  glareDirection: 'right',
                });
              }}
              style={s.mockBtn}
            >
              <AppText size={12} color={colors.white}>
                여러 문제
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      {coach ? (
        <View style={s.coachCard} accessibilityLiveRegion="polite">
          <AppText size={15} weight={850} color={YELLOW} align="center">
            단비의 안내 · {coach.step + 1}/{COACH_STEPS[coach.kind].length}
          </AppText>
          {coachArrow(coach) ? (
            <AppText size={40} weight={900} color={YELLOW} align="center">
              {coachArrow(coach)}
            </AppText>
          ) : null}
          <AppText size={22} weight={900} lineHeight={31} color={colors.white} align="center" style={s.mt9}>
            {coachingText}
          </AppText>
        </View>
      ) : null}

      {showHelp ? (
        <View style={s.modalBackdrop}>
          <View style={s.helpModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="도움말 닫기"
              onPress={() => setShowHelp(false)}
              style={s.modalClose}
            >
              <AppText size={20} color="#46423a">
                ✕
              </AppText>
            </Pressable>
            <AppText size={26} weight={900} lineHeight={33} letterSpacing={-1}>
              촬영이 조금 어려우신가요?
            </AppText>
            <AppText size={19} lineHeight={27} color="#59554d" style={s.modalBody}>
              괜찮아요. 단비가 하나씩 알려드릴게요.
            </AppText>
            <View style={s.modalOptions}>
              {(
                [
                  ['fit', '신분증이 화면에 잘 안 들어가요'],
                  ['blur', '사진이 자꾸 흐리게 나와요'],
                  ['glare', '빛이 반사돼요'],
                  ['full', '처음부터 도움받기'],
                ] as [HelpKind, string][]
              ).map(([kind, label], idx, arr) => (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  onPress={() => startCoach(kind)}
                  style={[s.modalOption, idx === arr.length - 1 && s.modalOptionEmphasis]}
                >
                  <AppText size={18} weight={850} lineHeight={24} color="#302e29" style={s.flex1}>
                    {label}
                  </AppText>
                  <AppText size={24} color="#302e29">
                    ›
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {showStuckHelp || issueCount >= 3 ? (
        <View style={s.modalBackdrop}>
          <View style={s.helpModal}>
            <AppText size={26} weight={900} lineHeight={33} letterSpacing={-1}>
              촬영이 계속 어려우신가요?
            </AppText>
            <AppText size={19} lineHeight={27} color="#59554d" style={s.modalBody}>
              단비가 처음부터 천천히 같이 해드릴게요.
            </AppText>
            <View style={s.modalOptions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => startCoach('full')}
                style={[s.modalOption, s.modalOptionEmphasis, s.modalOptionCenter]}
              >
                <AppText size={18} weight={850} color="#302e29" align="center">
                  처음부터 도움받기
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIssueCount(0);
                  setShowStuckHelp(false);
                }}
                style={[s.modalOption, s.modalOptionCenter]}
              >
                <AppText size={18} weight={850} color="#302e29" align="center">
                  다시 해볼게요
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  mt5: { marginTop: 5 },
  mt8: { marginTop: 8 },
  mt9: { marginTop: 9 },
  mt12: { marginTop: 12 },
  underline: { textDecorationLine: 'underline' },
  srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  // prepare / review 공통 레이아웃 — 다른 가입 화면과 같은 규격
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetBody: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },
  sheetActions: { gap: 8, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 },
  primaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  secondaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },

  prepareList: { gap: 8, marginTop: 16 },
  prepareRow: {
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
  prepareNum: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: YELLOW,
  },

  capturedBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  reviewPhoto: {
    width: '100%',
    aspectRatio: 1.48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: '#F7F5EF',
  },

  // mock id card
  mockCard: {
    width: '92%',
    aspectRatio: 1.586,
    padding: 17,
    borderRadius: 14,
    backgroundColor: '#ecdcae',
  },
  mockBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  mockPhoto: {
    width: 64,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#c5c0ad',
  },

  // camera stage
  stage: {
    flex: 1,
    minHeight: 520,
    backgroundColor: '#22251f',
    overflow: 'hidden',
  },
  shade: {
    ...ABS_FILL,
    backgroundColor: 'rgba(11,13,12,0.35)',
  },
  liveMessage: {
    position: 'absolute',
    zIndex: 3,
    top: 18,
    left: 18,
    right: 18,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(24,26,24,0.9)',
  },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: YELLOW,
  },
  liveDotGood: { backgroundColor: '#55d78b' },

  guideFrame: {
    position: 'absolute',
    zIndex: 2,
    top: '29%',
    left: '7%',
    width: '86%',
    aspectRatio: 1.586,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.88)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrameGood: { borderColor: '#68e39b' },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: YELLOW,
  },
  cornerGood: { borderColor: '#68e39b' },
  cornerTL: { top: -4, left: -4, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 17 },
  cornerTR: { top: -4, right: -4, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 17 },
  cornerBL: { bottom: -4, left: -4, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 17 },
  cornerBR: { bottom: -4, right: -4, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 17 },
  frameLabel: {
    position: 'absolute',
    top: -44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: YELLOW,
  },
  directionArrow: {
    ...ABS_FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdTrack: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 15,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.32)',
    overflow: 'hidden',
  },
  holdFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#68e39b',
    transform: [{ scaleX: 0 }],
  },

  cameraSupport: {
    position: 'absolute',
    zIndex: 3,
    top: '64%',
    left: 18,
    right: 18,
  },
  cameraFallback: {
    position: 'absolute',
    zIndex: 3,
    left: 30,
    right: 30,
    top: '64%',
    marginTop: 34,
  },
  helpTrigger: {
    position: 'absolute',
    zIndex: 4,
    alignSelf: 'center',
    bottom: 92,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: radius.md + 1,
    backgroundColor: 'rgba(23,25,23,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockControls: {
    position: 'absolute',
    zIndex: 4,
    left: 12,
    right: 12,
    bottom: 15,
    alignItems: 'center',
  },
  mockSummary: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  mockRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
    marginTop: 7,
    padding: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(17,19,17,0.92)',
  },
  mockBtn: {
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#858984',
    borderRadius: 9,
    backgroundColor: '#343733',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockBtnActive: { borderColor: YELLOW, backgroundColor: '#665817' },

  coachCard: {
    position: 'absolute',
    zIndex: 10,
    left: 18,
    right: 18,
    bottom: 72,
    padding: 18,
    borderWidth: 2,
    borderColor: YELLOW,
    borderRadius: radius.lg + 2,
    backgroundColor: 'rgba(24,26,24,0.94)',
  },

  modalBackdrop: {
    ...ABS_FILL,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(38,39,37,0.72)',
  },
  helpModal: {
    width: '100%',
    maxHeight: '92%',
    padding: 20,
    paddingTop: 28,
    borderRadius: 26,
    backgroundColor: colors.paper,
  },
  modalBody: { marginTop: 11, marginBottom: 20 },
  modalOptions: { gap: 10 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 62,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#dedad0',
    borderRadius: radius.md + 1,
    backgroundColor: colors.white,
  },
  modalOptionEmphasis: { borderColor: colors.accentBorder, backgroundColor: colors.yellowSoft },
  modalOptionCenter: { justifyContent: 'center' },
  modalClose: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#efede7',
    zIndex: 1,
  },
});
