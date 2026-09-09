import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

type MicWaveRingsProps = {
  /** 가운데 자식(마이크 버튼)의 지름. 링은 이 값의 배수로 커진다. */
  size: number;
  active?: boolean;
  children: ReactNode;
};

const RING_SCALE = [1.7, 1.44, 1.19];
const DURATION = 2600;

/**
 * danbi_jj main/components.tsx <MicButton> 의 3중 링 + @keyframes mic-wave 대응.
 * 노란 원이 커지면서 옅어지는 것을 stagger 로 반복.
 */
export function MicWaveRings({ size, active = true, children }: MicWaveRingsProps) {
  const box = size * 1.82;
  return (
    <View style={[styles.wrap, { width: box, height: box }]}>
      {RING_SCALE.map((mult, i) => (
        <Ring key={i} diameter={size * mult} delay={(-i * DURATION) / 3} active={active} />
      ))}
      {children}
    </View>
  );
}

function Ring({ diameter, delay, active }: { diameter: number; delay: number; active: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // 음수 delay(원본의 stagger)를 양수로 환산
      const positiveDelay = ((delay % DURATION) + DURATION) % DURATION;
      t.value = withDelay(
        positiveDelay,
        withRepeat(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.ease) }), -1, false),
      );
    } else {
      cancelAnimation(t);
      t.value = 0;
    }
    return () => cancelAnimation(t);
  }, [active, delay, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.72 + t.value * 0.34 }],
    opacity: (1 - t.value) * 0.26,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: colors.mainYellow },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
});
