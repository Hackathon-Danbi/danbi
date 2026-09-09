import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
};

/** danbi_jj onboarding.css .onboarding-progress 대응. */
export function ProgressBar({
  value,
  height = 6,
  trackColor = colors.line,
  fillColor = colors.yellow,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.track, { height, backgroundColor: trackColor }]}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderTopRightRadius: radius.pill,
          borderBottomRightRadius: radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
