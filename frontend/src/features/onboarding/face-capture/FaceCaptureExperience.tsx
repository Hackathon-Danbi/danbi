import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { CameraView } from 'expo-camera';

import { AppText } from '@/components/ui/AppText';
import { ScanLine } from '@/components/anim/ScanLine';
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
  CameraPermissionGate,
  LiveCameraPreview,
  useCameraCapture,
  useOnboardingCamera,
} from '../camera/LiveCameraPreview';

type Props = {
  checking: boolean;
  failed: boolean;
  success: boolean;
  userName: string;
  onCaptured: () => void;
  onRetry: () => void;
  onContinue: () => void;
};

export function FaceCaptureExperience({
  checking,
  failed,
  success,
  userName,
  onCaptured,
  onRetry,
  onContinue,
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const takePhoto = useCameraCapture(cameraRef);
  const camera = useOnboardingCamera();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (checking || success || failed || !camera.granted) return;
    ttsSpeak('화면을 정면으로 바라보고 얼굴을 찍어주세요.');
    return () => ttsStop();
  }, [camera.granted, checking, failed, success]);

  const capture = useCallback(async () => {
    ttsStop();
    setCaptureError('');
    setBusy(true);
    const uri = await takePhoto();
    setBusy(false);
    if (!uri) {
      setCaptureError('얼굴을 찍지 못했어요. 다시 눌러주세요.');
      return;
    }
    setPhotoUri(uri);
    onCaptured();
  }, [onCaptured, takePhoto]);

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

  return (
    <View style={styles.sheet}>
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
      <BottomActionArea
        primary={primary}
        onPrimary={() => {
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  sheetBody: { flex: 1, minHeight: 0, paddingHorizontal: 18, paddingTop: 14 },
  heading: { flexShrink: 0 },
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
});
