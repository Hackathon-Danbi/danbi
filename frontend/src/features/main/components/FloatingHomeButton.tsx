import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';

/** danbi_jj main/components.tsx <FloatingHomeButton> 이식. */
export function FloatingHomeButton({ onGoHome, bg = '#fff' }: { onGoHome: () => void; bg?: string }) {
  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="홈" onPress={onGoHome} style={styles.btn}>
        <Svg width={22} height={25} viewBox="0 0 22 25" fill="none">
          <Path d="M0 9L11 0L22 9V25H15V16H7V25H0V9Z" fill="#FFCC00" />
        </Svg>
        <AppText size={14} weight={700} color="#7A6000">
          홈
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: '#E9E6DF',
  },
  btn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
