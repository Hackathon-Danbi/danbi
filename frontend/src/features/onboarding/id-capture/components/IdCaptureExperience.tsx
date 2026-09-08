import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Sheet } from '@/components/ui/Sheet';
import { BORDER, CREAM, INK, YELLOW } from '@/features/main/theme';
import {
  BottomActionArea,
  CertProgress,
  GuideText,
  PageTitle,
  StepBadge,
} from '../../components/OnboardingComponents';
import { CAPTURE_GUIDANCE } from '../constants';
import type { IdCaptureObservation, IdCaptureStatus } from '../types';
import { resolvePrimaryStatus } from '../utils';
import { useCaptureGuidance } from '../hooks/useCaptureGuidance';

type Phase = 'camera' | 'review';
type HelpKind = 'fit' | 'blur' | 'glare' | 'full';
type Coach = { kind: HelpKind; step: number } | null;

const MOCK_STATUS_OPTIONS: { status: IdCaptureStatus; label: string }[] = [
  { status: 'TOO_CLOSE', label: '가까움' },
  { status: 'TOO_FAR', label: '멈' },
  { status: 'CROPPED', label: '잘림' },
  { status: 'BLURRY', label: '흐림' },
  { status: 'GLARE', label: '반사' },
  { status: 'GOOD_POSITION', label: '좋음' },
];

const COACH_STEPS: Record<HelpKind, string[]> = {
  fit: [
    '먼저 신분증을 책상 위에 놓아주세요.',
    '휴대폰을 신분증 바로 위에 들어주세요.',
    '네 모서리가 모두 보이도록 조금 멀리해주세요.',
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
    '네 모서리가 보이도록 거리를 맞춰주세요.',
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

function MockIdCard() {
  return (
    <View style={s.mockCard} accessibilityLabel="촬영된 신분증 예시">
      <AppText size={16} weight={900} color={INK}>
        주민등록증
      </AppText>
      <View style={s.mockBody}>
        <View style={s.mockPhoto} />
        <View style={s.flex1}>
          <AppText size={18} weight={800} color={INK}>
            홍 길 동
          </AppText>
          <AppText size={13} color="#888" style={s.mt4}>
            900101-1******
          </AppText>
        </View>
      </View>
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
    transform: [{ translateX: -4 + t.value * 8 }],
  }));
  return (
    <Animated.View style={style} pointerEvents="none">
      <AppText size={40} weight={900} color={YELLOW}>
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
  const [phase, setPhase] = useState<Phase>(initiallyCaptured ? 'review' : 'camera');
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
  const good = primaryStatus === 'GOOD_POSITION' || primaryStatus === 'CAPTURED';

  useEffect(() => {
    if (phase !== 'camera' || mockManuallyChanged || coach) return;
    const timer = setTimeout(() => setObservation({ issues: ['GOOD_POSITION'] }), 3200);
    return () => clearTimeout(timer);
  }, [coach, mockManuallyChanged, phase]);

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
      2000,
    );
    return () => {
      clearTimeout(speakTimer);
      clearTimeout(nextTimer);
    };
  }, [coach, speak, stopSpeaking]);

  useEffect(() => {
    if (primaryStatus === 'CAPTURED') Vibration.vibrate(55);
  }, [primaryStatus]);

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
    setPhase('camera');
    setObservation({ issues: ['TOO_FAR'] });
    setMockManuallyChanged(false);
    setIssueCount(0);
  };

  const heading = (
    <>
      <CertProgress current={1} />
      <StepBadge icon="id">1/4 신분증</StepBadge>
      <PageTitle>
        {phase === 'review' ? '신분증이\n잘 보이나요?' : '신분증을 네모 안에\n맞춰주세요'}
      </PageTitle>
      <GuideText>
        {phase === 'review'
          ? '글자와 사진이 선명하면 계속 진행해주세요.'
          : coach
            ? coachingText
            : primaryGuidance.screen.replace('\n', ' ')}
      </GuideText>
    </>
  );

  if (phase === 'review') {
    return (
      <View style={s.sheet}>
        <View style={s.sheetBody}>
          {heading}
          <View style={s.frame}>{<MockIdCard />}</View>
        </View>
        <BottomActionArea
          primary="네, 잘 보여요"
          onPrimary={onAccepted}
          secondary="다시 찍을게요"
          onSecondary={retake}
        />
      </View>
    );
  }

  return (
    <View style={s.sheet}>
      <View style={s.sheetBody}>
        {heading}
        <View style={[s.frame, good && s.frameGood]} accessibilityLabel="신분증을 맞출 촬영 영역">
          <View style={[s.corner, s.cornerTL, good && s.cornerGood]} />
          <View style={[s.corner, s.cornerTR, good && s.cornerGood]} />
          <View style={[s.corner, s.cornerBL, good && s.cornerGood]} />
          <View style={[s.corner, s.cornerBR, good && s.cornerGood]} />
          <MockIdCard />
          {directionArrow ? (
            <View style={s.arrow} pointerEvents="none">
              <PulseArrow char={directionArrow} />
            </View>
          ) : null}
          {primaryStatus === 'GOOD_POSITION' ? <HoldIndicator /> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={() => setMockOpen((v) => !v)} style={s.mockToggle}>
          <AppText size={12} color="#BBB">
            프로토타입 상태 {mockOpen ? '닫기' : '열기'}
          </AppText>
        </Pressable>
        {mockOpen ? (
          <View style={s.mockRow}>
            {MOCK_STATUS_OPTIONS.map(({ status, label }) => (
              <Pressable
                key={status}
                accessibilityRole="button"
                onPress={() => chooseMockStatus(status)}
                style={[s.mockBtn, resolvePrimaryStatus(observation.issues) === status && s.mockBtnOn]}
              >
                <AppText size={12} weight={700} color={INK}>
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <BottomActionArea
        primary="촬영하기"
        onPrimary={() => {
          stopSpeaking();
          captureFrame();
        }}
        secondary="촬영이 어려우신가요?"
        onSecondary={() => {
          stopSpeaking();
          setShowHelp(true);
        }}
      />

      <Sheet visible={showHelp} onClose={() => setShowHelp(false)} title="촬영이 조금 어려우신가요?">
        <AppText size={14} lineHeight={21} color="#888" style={s.sheetGuide}>
          괜찮아요. 단비가 하나씩 알려드릴게요.
        </AppText>
        {(
          [
            ['fit', '신분증이 화면에 잘 안 들어가요'],
            ['blur', '사진이 자꾸 흐리게 나와요'],
            ['glare', '빛이 반사돼요'],
            ['full', '처음부터 도움받기'],
          ] as [HelpKind, string][]
        ).map(([kind, label]) => (
          <Pressable key={kind} accessibilityRole="button" onPress={() => startCoach(kind)} style={s.helpRow}>
            <AppText size={15} weight={800} color={INK} style={s.flex1}>
              {label}
            </AppText>
            <AppText size={16} color="#888">
              ›
            </AppText>
          </Pressable>
        ))}
      </Sheet>

      <Sheet
        visible={showStuckHelp || issueCount >= 3}
        onClose={() => {
          setIssueCount(0);
          setShowStuckHelp(false);
        }}
        title="촬영이 계속 어려우신가요?"
      >
        <AppText size={14} lineHeight={21} color="#888" style={s.sheetGuide}>
          단비가 처음부터 천천히 같이 해드릴게요.
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => startCoach('full')} style={s.helpPrimary}>
          <AppText size={17} weight={900} color={INK}>
            처음부터 도움받기
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIssueCount(0);
            setShowStuckHelp(false);
          }}
          style={s.helpQuiet}
        >
          <AppText size={14} weight={700} color="#888">
            다시 해볼게요
          </AppText>
        </Pressable>
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  sheet: { flex: 1, backgroundColor: '#fff' },
  sheetBody: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },
  sheetGuide: { marginTop: 8, marginBottom: 12 },

  frame: {
    position: 'relative',
    marginTop: 16,
    padding: 14,
    aspectRatio: 1.48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
    overflow: 'hidden',
  },
  frameGood: { borderColor: YELLOW },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: YELLOW,
  },
  cornerGood: { borderColor: '#2F8B5D' },
  cornerTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  arrow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  holdTrack: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 12,
    height: 6,
    overflow: 'hidden',
    borderRadius: 99,
    backgroundColor: '#F0E6C4',
  },
  holdFill: { height: '100%', borderRadius: 99, backgroundColor: YELLOW, transform: [{ scaleX: 0 }] },

  mockCard: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  mockBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  mockPhoto: { width: 48, height: 58, borderRadius: 8, backgroundColor: '#EEE8D8' },

  mockToggle: { alignSelf: 'center', paddingVertical: 8 },
  mockRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  mockBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  mockBtnOn: { borderColor: YELLOW, backgroundColor: CREAM },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  helpPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  helpQuiet: { alignItems: 'center', paddingVertical: 12 },
});
