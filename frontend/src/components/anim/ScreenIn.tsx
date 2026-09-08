import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * danbi_jj shell.css @keyframes screen-in 대응.
 * 화면 진입 시 살짝 슬라이드 + 페이드 인 (.22s ease-out).
 */
export function ScreenIn({ children }: { children: ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.6 + progress.value * 0.4,
    transform: [{ translateX: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[{ flex: 1, minHeight: 0 }, style]}>{children}</Animated.View>;
}
