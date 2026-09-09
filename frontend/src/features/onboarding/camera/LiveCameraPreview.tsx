import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '@/features/main/theme';

type Props = {
  facing: CameraType;
  /** 전면 카메라는 거울처럼 보이게 한다. */
  mirror?: boolean;
  children?: ReactNode;
  onReady?: () => void;
};

export function useOnboardingCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  return {
    granted: permission?.granted === true,
    loading: permission == null,
    canAskAgain: permission?.canAskAgain !== false,
    requestPermission,
  };
}

export function LiveCameraPreview({
  facing,
  mirror = facing === 'front',
  cameraRef,
  children,
  onReady,
}: Props & { cameraRef: RefObject<CameraView | null> }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      collapsable={false}
      style={styles.host}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        const next = { width: Math.round(width), height: Math.round(height) };
        setSize((current) =>
          current.width === next.width && current.height === next.height ? current : next,
        );
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <CameraView
          ref={cameraRef}
          facing={facing}
          mirror={mirror}
          style={StyleSheet.absoluteFill}
          mode="picture"
          animateShutter={false}
          onCameraReady={onReady}
        />
      ) : null}
      {children ? (
        <View pointerEvents="none" style={styles.overlay}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

export function CameraPermissionGate({
  granted,
  loading,
  canAskAgain,
  onAsk,
  message,
}: {
  granted: boolean;
  loading: boolean;
  canAskAgain: boolean;
  onAsk: () => void | Promise<unknown>;
  message: string;
}) {
  const [busy, setBusy] = useState(false);
  if (granted) return null;
  if (loading) {
    return (
      <View style={styles.gate}>
        <AppText size={19} weight={800} color={INK} align="center" lineHeight={28}>
          카메라를 준비하고 있어요
        </AppText>
      </View>
    );
  }
  return (
    <View style={styles.gate}>
      <AppText size={19} weight={800} color={INK} align="center" lineHeight={28}>
        {message}
      </AppText>
      <AppText size={17} color="#888" align="center" lineHeight={25} style={styles.gateHint}>
        {canAskAgain
          ? '아래 버튼을 눌러 카메라를 켜주세요.'
          : '설정에서 단비의 카메라 권한을 켜주세요.'}
      </AppText>
      {canAskAgain ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setBusy(true);
            void Promise.resolve(onAsk()).finally(() => setBusy(false));
          }}
          style={styles.gateBtn}
        >
          <AppText size={20} weight={900} color={INK}>
            카메라 허용하기
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function useCameraCapture(cameraRef: RefObject<CameraView | null>) {
  const capturing = useRef(false);
  const takePhoto = async () => {
    if (capturing.current) return null;
    capturing.current = true;
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
        shutterSound: false,
      });
      return photo?.uri ?? null;
    } catch {
      return null;
    } finally {
      capturing.current = false;
    }
  };
  return takePhoto;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  gateHint: { marginTop: 4 },
  gateBtn: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
});
