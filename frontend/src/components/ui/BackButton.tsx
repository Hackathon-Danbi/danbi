import { Pressable, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { colors } from '@/theme/tokens';
import { AppText } from './AppText';

/** 아이콘만 두지 않고 「뒤로가기」를 보여, 시니어가 바로 알아보게 한다. */
export function BackButton({
  onPress,
  color = colors.ink,
}: {
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      onPress={onPress}
      style={styles.btn}
      hitSlop={10}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Polyline
          points="15 18 9 12 15 6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <AppText size={15} weight={800} color={color}>
        뒤로가기
      </AppText>
    </Pressable>
  );
}

export const BACK_BUTTON_SLOT = 104;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 4,
  },
});
