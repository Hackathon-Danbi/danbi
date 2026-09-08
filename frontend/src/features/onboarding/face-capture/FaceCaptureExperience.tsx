import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { CameraView } from 'expo-camera';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { ScanLine } from '@/components/anim/ScanLine';
import { AppText } from '@/components/ui/AppText';
import { Sheet } from '@/components/ui/Sheet';
import { BORDER, CREAM, INK } from '@/features/main/theme';
import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import {
  BottomActionArea,
  CertProgress,
  GuideText,
  HeroMark,
  PageTitle,
  StepBadge,
} from '../components/OnboardingComponents';
import {
  FACE_CAPTURE_HELP,
  FACE_COACH_STEPS,
  FACE_HELP_OPTIONS,
  useStagedIdle,
  type FaceHelpKind,
} from '../help/captureHelp';
import {
  CameraPermissionGate,
  LiveCameraPreview,
  useCameraCapture,
  useOnboardingCamera,
} from '../camera/LiveCameraPreview';

type Coach = { kind: FaceHelpKind; step: number } | null;

type Props = {
  checking: boolean;
  failed: boolean;
  success: boolean;
  userName: string;
  matchFailCount?: number;
  onCaptured: () => void;
  onRetry: () => void;
  onContinue: () => void;
  onNeedEscalation?: () => void;
};

export function FaceCaptureExperience({
  checking,
  failed,
  success,
  userName,
  matchFailCount = 0,
  onCaptured,
  onRetry,
  onContinue,
  onNeedEscalation,
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const takePhoto = useCameraCapture(cameraRef);
  const camera = useOnboardingCamera();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [coach, setCoach] = useState<Coach>(null);
  const [coachCompleted, setCoachCompleted] = useState(false);
  const [forcePulse, setForcePulse] = useState(false);
  const escalatedRef = useRef(false);
  const prevIdleStage = useRef(0);
  const permissionSpokenRef = useRef(false);
  const openedForFailRef = useRef(0);

  const waiting = !checking && !failed && !success;
  const permissionDenied = !camera.loading && !camera.granted;
  const permissionBlocked = permissionDenied && !camera.canAskAgain;
  const coachingText = coach ? FACE_COACH_STEPS[coach.kind][coach.step] : '';

  const idleActive = !busy && !checking && !coach && !showHelp;
  const { stage, bump } = useStagedIdle(idleActive);

  const escalate = useCallback(() => {
    if (escalatedRef.current) return;
    escalatedRef.current = true;
    onNeedEscalation?.();
  }, [onNeedEscalation]);

  const openHelp = useCallback((spoken: boolean) => {
    setShowHelp(true);
    if (spoken) ttsSpeak(FACE_CAPTURE_HELP.openCoach);
  }, []);

  useEffect(() => {
    if (!waiting || !camera.granted || coach) return;
    ttsSpeak(FACE_CAPTURE_HELP.entry);
    return () => ttsStop();
  }, [camera.granted, coach, waiting]);

  useEffect(() => {
    if (!permissionDenied || !waiting || permissionSpokenRef.current) return;
    permissionSpokenRef.current = true;
    ttsSpeak(permissionBlocked ? FACE_CAPTURE_HELP.permissionBlocked : FACE_CAPTURE_HELP.permission);
    if (permissionBlocked) escalate();
  }, [escalate, permissionBlocked, permissionDenied, waiting]);

  useEffect(() => {
    if (!failed || matchFailCount < 2) return;
    if (openedForFailRef.current === matchFailCount) return;
    openedForFailRef.current = matchFailCount;
    openHelp(true);
  }, [failed, matchFailCount, openHelp]);

  useEffect(() => {
    if (failed) setForcePulse(true);
  }, [failed]);

  useEffect(() => {
    if (!coach) return;
    ttsStop();
    const text = FACE_COACH_STEPS[coach.kind][coach.step];
    const speakTimer = setTimeout(() => ttsSpeak(text), 350);
    const lastStep = FACE_COACH_STEPS[coach.kind].length - 1;
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
    if (checking) return;
    if (success) {
      if (stage === 1) ttsSpeak(FACE_CAPTURE_HELP.successIdle);
      return;
    }
    if (failed) {
      ttsSpeak(FACE_CAPTURE_HELP.retryIdle);
      if (stage >= 2) openHelp(true);
      if (stage >= 3) escalate();
      return;
    }
    if (!camera.granted) return;
    if (coachCompleted) {
      escalate();
      return;
    }
    if (stage === 1) ttsSpeak(FACE_CAPTURE_HELP.idle);
    if (stage === 2) openHelp(true);
    if (stage >= 3) escalate();
  }, [camera.granted, checking, coachCompleted, escalate, failed, openHelp, stage, success]);

  const capture = useCallback(async () => {
    ttsStop();
    setCaptureError('');
    setForcePulse(false);
    bump();
    setBusy(true);
    const uri = await takePhoto();
    setBusy(false);
    if (!uri) {
      setCaptureError('얼굴을 찍지 못했어요. 다시 눌러주세요.');
      setForcePulse(true);
      ttsSpeak(FACE_CAPTURE_HELP.captureFail);
      return;
    }
    setPhotoUri(uri);
    setCoachCompleted(false);
    onCaptured();
  }, [bump, onCaptured, takePhoto]);

  const startCoach = (kind: FaceHelpKind) => {
    setShowHelp(false);
    setCoachCompleted(false);
    setForcePulse(false);
    bump();
    ttsStop();
    setCoach({ kind, step: 0 });
  };

  const title = checking
    ? '얼굴을 확인하고 있어요'
    : failed
      ? '얼굴이 잘 보이지 않았어요'
      : success
        ? '얼굴을 확인했어요'
        : '얼굴을 찍어주세요';
  const guide = failed
    ? '밝은 곳에서 다시 맞춰주세요.'
    : success
      ? `${userName || '고객'}님으로 확인했어요.`
      : coach
        ? coachingText
        : '화면 안에 얼굴이 잘 보이게 해주세요.';

  const showPhoto = Boolean(photoUri) && (checking || success || failed);
  const primary = success
    ? '계좌 확인으로 갈게요'
    : checking || busy
      ? '확인하고 있어요'
      : failed
        ? '다시 찍을게요'
        : camera.granted
          ? '얼굴 찍기'
          : '카메라 허용하기';

  const pulsePrimary =
    !busy &&
    !checking &&
    (forcePulse ||
      permissionDenied ||
      (waiting && camera.granted && cameraReady && stage >= 1) ||
      (failed && stage >= 1) ||
      (success && stage >= 1));

  const showSecondary = !checking && !success;

  return (
    <View style={styles.sheet} onTouchStart={bump}>
      <View style={styles.sheetBody}>
        <View style={styles.heading}>
          <CertProgress current={2} />
          <StepBadge icon="face">2/4 얼굴</StepBadge>
          <PageTitle>{title}</PageTitle>
          <GuideText>{guide}</GuideText>
        </View>
        <View style={styles.frame} accessibilityLabel="얼굴 촬영 영역" collapsable={false}>
          {showPhoto && photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel="찍은 얼굴 사진" />
              {checking ? (
                <View style={styles.scanWrap} pointerEvents="none">
                  <ScanLine travel={48} inset={16} />
                </View>
              ) : null}
              {success ? (
                <View style={styles.successMark}>
                  <HeroMark icon="check" />
                </View>
              ) : null}
            </>
          ) : camera.granted ? (
            <LiveCameraPreview
              facing="front"
              cameraRef={cameraRef}
              onReady={() => setCameraReady(true)}
            />
          ) : (
            <CameraPermissionGate
              granted={camera.granted}
              loading={camera.loading}
              canAskAgain={camera.canAskAgain}
              onAsk={camera.requestPermission}
              message="얼굴을 찍으려면 카메라가 필요해요."
            />
          )}
        </View>
        {captureError ? (
          <AppText size={13} weight={700} color="#E05050" style={styles.error}>
            {captureError}
          </AppText>
        ) : (
          <AppText size={15} weight={800} color={INK} align="center" style={styles.hint}>
            {checking
              ? '움직이지 말고 기다려주세요'
              : failed
                ? '다시 확인할 수 있어요'
                : success
                  ? '확인이 끝났어요'
                  : '정면을 바라봐 주세요'}
          </AppText>
        )}
      </View>
      <PulseHighlight active={pulsePrimary} borderRadius={16}>
        <BottomActionArea
          primary={primary}
          onPrimary={() => {
            bump();
            setForcePulse(false);
            if (success) {
              onContinue();
              return;
            }
            if (checking || busy) return;
            if (!camera.granted) {
              void camera.requestPermission();
              return;
            }
            if (failed) {
              setPhotoUri(null);
              setCaptureError('');
              setCameraReady(false);
              onRetry();
              return;
            }
            void capture();
          }}
          primaryDisabled={checking || busy || (camera.granted && !failed && !success && !cameraReady)}
          secondary={showSecondary ? '촬영이 어려우신가요?' : undefined}
          onSecondary={
            showSecondary
              ? () => {
                  ttsStop();
                  bump();
                  setShowHelp(true);
                }
              : undefined
          }
        />
      </PulseHighlight>

      <Sheet visible={showHelp} onClose={() => setShowHelp(false)} title="촬영이 조금 어려우신가요?">
        <AppText size={14} lineHeight={21} color="#888" style={styles.sheetGuide}>
          괜찮아요. 단비가 하나씩 알려드릴게요.
        </AppText>
        {FACE_HELP_OPTIONS.map(([kind, label]) => (
          <Pressable key={kind} accessibilityRole="button" onPress={() => startCoach(kind)} style={styles.helpRow}>
            <AppText size={15} weight={800} color={INK} style={styles.flex1}>
              {label}
            </AppText>
            <AppText size={16} color="#888">
              ›
            </AppText>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  sheetBody: { flex: 1, minHeight: 0, paddingHorizontal: 18, paddingTop: 14 },
  heading: { flexShrink: 0 },
  flex1: { flex: 1 },
  frame: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  scanWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  successMark: { position: 'absolute', bottom: 16, alignSelf: 'center' },
  error: { marginTop: 10 },
  hint: { marginTop: 12, marginBottom: 8, flexShrink: 0 },
  sheetGuide: { marginTop: 8, marginBottom: 12 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});
