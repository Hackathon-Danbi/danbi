import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { CameraView } from 'expo-camera';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { Sheet } from '@/components/ui/Sheet';
import { BORDER, CREAM, INK, YELLOW } from '@/features/main/theme';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import {
  BottomActionArea,
  CertProgress,
  GuideText,
  PageTitle,
  StepBadge,
} from '../../components/OnboardingComponents';
import { ID_CAPTURE_HELP, useStagedIdle } from '../../help/captureHelp';
import {
  CameraPermissionGate,
  LiveCameraPreview,
  useCameraCapture,
  useOnboardingCamera,
} from '../../camera/LiveCameraPreview';

type Phase = 'camera' | 'review';
type HelpKind = 'fit' | 'blur' | 'glare' | 'full';
type Coach = { kind: HelpKind; step: number } | null;

/** 주민등록증 비율에 가깝게, 버튼이 밀리지 않도록 남는 칸 안에 맞춘다. */
const ID_ASPECT = 1.48;
const ID_MAX_WIDTH = 360;
const ID_FRAME_PAD = 14;

function fitIdFrame(slotWidth: number, slotHeight: number) {
  if (slotWidth <= 0 || slotHeight <= 0) return null;
  let width = Math.min(slotWidth, ID_MAX_WIDTH);
  let height = width / ID_ASPECT;
  if (height > slotHeight) {
    height = slotHeight;
    width = Math.min(height * ID_ASPECT, slotWidth);
  }
  return { width: Math.round(width), height: Math.round(height) };
}

const COACH_STEPS: Record<HelpKind, string[]> = {
  fit: [
    '먼저 신분증을 책상 위에 놓아주세요.',
    '휴대폰을 신분증 바로 위에 들어주세요.',
    '네 모서리가 모두 보이도록 조금 멀리해주세요.',
    '좋아요. 아래 촬영하기를 눌러주세요.',
  ],
  blur: [
    '휴대폰을 두 손으로 잡아주세요.',
    '신분증을 화면 가운데에 맞춰주세요.',
    '좋아요. 이제 잠시 움직이지 말아주세요.',
    '좋아요. 아래 촬영하기를 눌러주세요.',
  ],
  glare: [
    '신분증에 빛이 비치고 있어요.',
    '휴대폰을 오른쪽으로 살짝 기울여주세요.',
    '이번에는 왼쪽으로 조금 기울여주세요.',
    '좋아요. 아래 촬영하기를 눌러주세요.',
  ],
  full: [
    '먼저 신분증을 책상 위에 놓아주세요.',
    '휴대폰을 신분증 바로 위에 들어주세요.',
    '네 모서리가 보이도록 거리를 맞춰주세요.',
    '좋아요. 아래 촬영하기를 눌러주세요.',
  ],
};

export function IdCaptureExperience({
  initiallyCaptured,
  onCaptured,
  onAccepted,
  onRetake,
  onNeedEscalation,
}: {
  initiallyCaptured: boolean;
  onCaptured: (uri: string) => void;
  onAccepted: (uri?: string) => void;
  onRetake: () => void;
  onNeedEscalation?: () => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const takePhoto = useCameraCapture(cameraRef);
  const camera = useOnboardingCamera();
  const [phase, setPhase] = useState<Phase>(initiallyCaptured ? 'review' : 'camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [coach, setCoach] = useState<Coach>(null);
  const [coachCompleted, setCoachCompleted] = useState(false);
  const [forcePulse, setForcePulse] = useState(false);
  const [retakeCount, setRetakeCount] = useState(0);
  const [slot, setSlot] = useState({ width: 0, height: 0 });
  const frameBox = useMemo(() => fitIdFrame(slot.width, slot.height), [slot.height, slot.width]);
  const escalatedRef = useRef(false);
  const prevIdleStage = useRef(0);
  const permissionSpokenRef = useRef(false);

  const permissionReady = !camera.loading;
  const permissionDenied = permissionReady && !camera.granted;
  const permissionBlocked = permissionDenied && !camera.canAskAgain;
  const coachingText = coach ? COACH_STEPS[coach.kind][coach.step] : '';

  const idleActive =
    !busy &&
    !coach &&
    !showHelp &&
    (phase === 'review' || camera.granted);
  const { stage, bump } = useStagedIdle(idleActive);

  const escalate = useCallback(() => {
    if (escalatedRef.current) return;
    escalatedRef.current = true;
    onNeedEscalation?.();
  }, [onNeedEscalation]);

  const openHelp = useCallback((spoken: boolean) => {
    setShowHelp(true);
    if (spoken) ttsSpeak(ID_CAPTURE_HELP.openCoach);
  }, []);

  const renderFrame = (inner: ReactNode) => (
    <View
      style={s.frameSlot}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSlot((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      <View style={[s.frame, frameBox]} accessibilityLabel="신분증을 맞출 촬영 영역">
        <View style={s.viewport}>{inner}</View>
        <View pointerEvents="none" style={[s.corner, s.cornerTL]} />
        <View pointerEvents="none" style={[s.corner, s.cornerTR]} />
        <View pointerEvents="none" style={[s.corner, s.cornerBL]} />
        <View pointerEvents="none" style={[s.corner, s.cornerBR]} />
      </View>
    </View>
  );

  useEffect(() => {
    if (phase !== 'camera' || !camera.granted || coach) return;
    ttsSpeak(ID_CAPTURE_HELP.entry);
    return () => ttsStop();
  }, [camera.granted, coach, phase]);

  useEffect(() => {
    if (!permissionDenied || phase !== 'camera' || permissionSpokenRef.current) return;
    permissionSpokenRef.current = true;
    ttsSpeak(permissionBlocked ? ID_CAPTURE_HELP.permissionBlocked : ID_CAPTURE_HELP.permission);
    if (permissionBlocked) escalate();
  }, [escalate, permissionBlocked, permissionDenied, phase]);

  useEffect(() => {
    if (!coach) return;
    ttsStop();
    const text = COACH_STEPS[coach.kind][coach.step];
    const speakTimer = setTimeout(() => ttsSpeak(text), 350);
    const lastStep = COACH_STEPS[coach.kind].length - 1;
    const nextTimer = setTimeout(() => {
      if (coach.step < lastStep) {
        setCoach({ ...coach, step: coach.step + 1 });
        return;
      }
      setCoach(null);
      setCoachCompleted(true);
      setForcePulse(true);
    }, 2000);
    return () => {
      clearTimeout(speakTimer);
      clearTimeout(nextTimer);
    };
  }, [coach]);

  useEffect(() => {
    if (stage === prevIdleStage.current) return;
    const previous = prevIdleStage.current;
    prevIdleStage.current = stage;
    if (stage <= previous) return;
    if (phase === 'review') {
      if (stage === 1) ttsSpeak(ID_CAPTURE_HELP.reviewIdle);
      return;
    }
    if (!camera.granted) return;
    if (coachCompleted) {
      escalate();
      return;
    }
    if (stage === 1) ttsSpeak(ID_CAPTURE_HELP.idle);
    if (stage === 2) openHelp(true);
    if (stage >= 3) escalate();
  }, [camera.granted, coachCompleted, escalate, openHelp, phase, stage]);

  const captureFrame = useCallback(async () => {
    ttsStop();
    setCaptureError('');
    setForcePulse(false);
    bump();
    setBusy(true);
    const uri = await takePhoto();
    setBusy(false);
    if (!uri) {
      setCaptureError('사진을 찍지 못했어요. 다시 눌러주세요.');
      setForcePulse(true);
      ttsSpeak(ID_CAPTURE_HELP.captureFail);
      return;
    }
    setPhotoUri(uri);
    setPhase('review');
    setCoachCompleted(false);
    onCaptured(uri);
  }, [bump, onCaptured, takePhoto]);

  const startCoach = (kind: HelpKind) => {
    setShowHelp(false);
    setCoachCompleted(false);
    setForcePulse(false);
    bump();
    ttsStop();
    setCoach({ kind, step: 0 });
  };

  const retake = () => {
    const nextCount = retakeCount + 1;
    setRetakeCount(nextCount);
    onRetake();
    setPhotoUri(null);
    setCaptureError('');
    setCameraReady(false);
    setPhase('camera');
    setForcePulse(false);
    bump();
    if (nextCount >= 3) {
      escalate();
      return;
    }
    if (nextCount >= 2) openHelp(true);
  };

  const pulsePrimary =
    !busy &&
    (forcePulse ||
      permissionDenied ||
      (phase === 'camera' && camera.granted && cameraReady && stage >= 1) ||
      (phase === 'review' && stage >= 1));

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
            : '빛이 너무 강하지 않은 곳에서 원본을 맞춰주세요.'}
      </GuideText>
    </>
  );

  const helpSheet = (
    <Sheet visible={showHelp} onClose={() => setShowHelp(false)} title="촬영이 조금 어려우신가요?">
      <AppText size={17} lineHeight={25} color="#888" style={s.sheetGuide}>
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
          <AppText size={17} weight={800} color={INK} style={s.flex1}>
            {label}
          </AppText>
          <AppText size={16} color="#888">
            ›
          </AppText>
        </Pressable>
      ))}
    </Sheet>
  );

  if (phase === 'review') {
    return (
      <View style={s.sheet} onTouchStart={bump}>
        <View style={s.sheetBody}>
          <View style={s.heading}>{heading}</View>
          {renderFrame(
            photoUri ? (
              <Image source={{ uri: photoUri }} style={s.photo} accessibilityLabel="찍은 신분증 사진" />
            ) : (
              <AppText size={17} color="#888">
                사진이 없어요. 다시 찍어주세요.
              </AppText>
            ),
          )}
        </View>
        <PulseHighlight active={pulsePrimary} borderRadius={16}>
          <BottomActionArea
            primary="네, 잘 보여요"
            onPrimary={() => onAccepted(photoUri ?? undefined)}
            secondary="다시 찍을게요"
            onSecondary={retake}
          />
        </PulseHighlight>
        {helpSheet}
      </View>
    );
  }

  return (
    <View style={s.sheet} onTouchStart={bump}>
      <View style={s.sheetBody}>
        <View style={s.heading}>{heading}</View>
        {captureError ? (
          <AppText size={17} weight={700} color="#E05050" style={s.error}>
            {captureError}
          </AppText>
        ) : null}
        {renderFrame(
          camera.granted ? (
            <LiveCameraPreview
              facing="back"
              cameraRef={cameraRef}
              onReady={() => setCameraReady(true)}
            />
          ) : (
            <CameraPermissionGate
              granted={camera.granted}
              loading={camera.loading}
              canAskAgain={camera.canAskAgain}
              onAsk={camera.requestPermission}
              message="신분증을 찍으려면 카메라가 필요해요."
            />
          ),
        )}
      </View>
      <PulseHighlight active={pulsePrimary} borderRadius={16}>
        <BottomActionArea
          primary={camera.granted ? (busy ? '찍고 있어요' : '촬영하기') : '카메라 허용하기'}
          onPrimary={() => {
            bump();
            setForcePulse(false);
            if (!camera.granted) {
              void camera.requestPermission();
              return;
            }
            void captureFrame();
          }}
          primaryDisabled={busy || (camera.granted && !cameraReady)}
          secondary="촬영이 어려우신가요?"
          onSecondary={() => {
            ttsStop();
            bump();
            setShowHelp(true);
          }}
        />
      </PulseHighlight>
      {helpSheet}
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  sheet: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  sheetBody: { flex: 1, minHeight: 0, paddingHorizontal: 18, paddingTop: 14 },
  heading: { flexShrink: 0 },
  sheetGuide: { marginTop: 8, marginBottom: 12 },
  error: { marginTop: 8, flexShrink: 0 },
  frameSlot: {
    flex: 1,
    minHeight: 0,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    position: 'relative',
    width: '100%',
    maxWidth: ID_MAX_WIDTH,
    padding: ID_FRAME_PAD,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
    overflow: 'hidden',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#111',
  },
  photo: { width: '100%', height: '100%' },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: YELLOW,
    zIndex: 2,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});
