import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { YELLOW } from '@/features/main/theme';

import type { FaceGuideFocus } from './faceStages';

/**
 * 카메라는 타원 안에만 두고, 귀·턱 안내는 타원 바깥에 둔다.
 * CameraView 위에 겹치면 네이티브 미리보기가 덮어서 가이드가 안 보인다.
 */
export function FaceGuideOverlay({
  focus,
  children,
}: {
  focus: FaceGuideFocus;
  children: ReactNode;
}) {
  const front = focus === 'front';
  const leftOn = front || focus === 'left';
  const rightOn = front || focus === 'right';

  return (
    <View collapsable={false} style={styles.host}>
      <View style={styles.topRow}>
        {focus === 'left' ? <AppText size={22} weight={900} color={YELLOW}>←</AppText> : <View style={styles.arrowSlot} />}
        <Chip label="왼쪽 귀" active={leftOn} />
        <Chip label="오른쪽 귀" active={rightOn} />
        {focus === 'right' ? <AppText size={22} weight={900} color={YELLOW}>→</AppText> : <View style={styles.arrowSlot} />}
      </View>

      <View style={styles.mid}>
        <View style={[styles.earTick, leftOn ? styles.tickOn : styles.tickOff]} />
        <View collapsable={false} style={styles.oval}>
          {children}
        </View>
        <View style={[styles.earTick, rightOn ? styles.tickOn : styles.tickOff]} />
      </View>

      <View style={[styles.chinTick, front ? styles.tickOn : styles.tickOff]} />
      <Chip label="턱선" active={front} />
    </View>
  );
}

function Chip({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.chip, active ? styles.chipOn : styles.chipOff]}>
      <AppText size={16} weight={800} color={active ? '#111' : '#fff'}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    flexShrink: 0,
  },
  arrowSlot: {
    width: 22,
  },
  mid: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  oval: {
    height: '100%',
    aspectRatio: 0.78,
    maxWidth: '72%',
    borderRadius: 999,
    borderWidth: 5,
    borderColor: YELLOW,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  earTick: {
    width: 14,
    height: 56,
    borderWidth: 3,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  chinTick: {
    width: 88,
    height: 10,
    marginTop: 8,
    borderBottomWidth: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  tickOn: {
    borderColor: YELLOW,
  },
  tickOff: {
    borderColor: 'rgba(255,255,255,0.45)',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexShrink: 0,
  },
  chipOn: {
    backgroundColor: YELLOW,
  },
  chipOff: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
