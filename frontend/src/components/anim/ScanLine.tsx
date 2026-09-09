import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

/**
 * danbi_jj onboarding.css @keyframes id-scan / face-scan 대응.
 * 수평선이 위아래로 왕복하는 스캔 애니메이션.
 */
export function ScanLine({ travel = 55, inset = 24 }: { travel?: number; inset?: number }) {
  const t = useSharedValue(-1);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(t);
  }, [t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: t.value * travel }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.line, { left: inset, right: inset, backgroundColor: colors.yellow }, style]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    top: '50%',
    height: 3,
    borderRadius: 99,
  },
});
