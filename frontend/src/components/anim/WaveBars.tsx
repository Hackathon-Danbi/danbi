import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

const HEIGHTS = [22, 38, 54, 40, 26];

/**
 * danbi_jj main/components.tsx <Waveform> + @keyframes bar-wave 대응.
 * active 이면 5개 막대가 서로 다른 주기로 위아래로 늘었다 줄었다 한다.
 */
export function WaveBars({ active }: { active: boolean }) {
  return (
    <View style={styles.row}>
      {HEIGHTS.map((h, i) => (
        <Bar key={i} baseHeight={h} index={i} active={active} />
      ))}
    </View>
  );
}

function Bar({ baseHeight, index, active }: { baseHeight: number; index: number; active: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const duration = Math.round((0.55 + index * 0.1) * 1000);
      t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(t);
      t.value = 0;
    }
    return () => cancelAnimation(t);
  }, [active, index, t]);

  const style = useAnimatedStyle(() => {
    const scale = active ? 0.5 + t.value * 0.95 : 0.55;
    return { height: baseHeight * scale };
  });

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: active ? colors.mainYellow : '#F5C84A' }, style]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 60,
  },
  bar: {
    width: 9,
    borderRadius: 6,
  },
});
