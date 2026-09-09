import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors, radius } from '@/theme/tokens';

type PulseHighlightProps = {
  active: boolean;
  children: ReactNode;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * danbi_jj globals.css @keyframes help-pulse 대응.
 * 웹은 box-shadow 를 펄스했지만 RN 에서는 자식 위에 노란 링(테두리)의 두께/투명도를
 * 반복 애니메이션해 "여기를 누르세요" 강조를 만든다.
 */
export function PulseHighlight({
  active,
  children,
  borderRadius = radius.lg,
  style,
}: PulseHighlightProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (active) {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(t);
      t.value = 0;
    }
    return () => cancelAnimation(t);
  }, [active, t]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.35 + t.value * 0.55 : 0,
    borderWidth: 3 + t.value * 4,
  }));

  return (
    <Animated.View style={[{ borderRadius }, style]}>
      {children}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, borderColor: colors.mainYellow },
            ringStyle,
          ]}
        />
      ) : null}
    </Animated.View>
  );
}
