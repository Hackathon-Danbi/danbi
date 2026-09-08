import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';
import { INK, YELLOW } from '../theme';

/**
 * danbi_jj app/imports/* (Figma export) 를 react-native-svg + View 로 근사 변환한 공용 조각.
 * 픽셀 퍼펙트가 아니라 정보 구조·가독성 우선.
 */

/** 💰 돈주머니 아이콘 (Figma "돈주머니" 근사). */
export function MoneyBag({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.bag, { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Path
          d="M13 9c-1.5-1.6-1-4 1-4h12c2 0 2.5 2.4 1 4-2 2-2 4 0 5 5 2.5 8 7 8 12 0 6-5 10-15 10S5 32 5 26c0-5 3-9.5 8-12 2-1 2-3 0-5Z"
          fill="#fff"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Circle cx={20} cy={26} r={5} fill={YELLOW} stroke={INK} strokeWidth={2} />
        <Path d="M20 23v6M18 26h4" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function SavingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={onBack} style={styles.back} hitSlop={10}>
        <AppText size={30} weight={400} color={INK} lineHeight={30}>
          ‹
        </AppText>
      </Pressable>
      <AppText size={18} weight={900} color={INK}>
        {title}
      </AppText>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function AskDanbiButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.ask}>
      <View style={styles.askCircle}>
        <AppText size={16}>🔊</AppText>
      </View>
      <AppText size={17} weight={700} color="#fff">
        단비에게 물어보기
      </AppText>
    </Pressable>
  );
}

export function HomeBar({ onHome }: { onHome: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="홈으로" onPress={onHome} style={styles.homeBar}>
      <Svg width={22} height={25} viewBox="0 0 22 25" fill="none">
        <Path d="M0 9L11 0L22 9V25H15V16H7V25H0V9Z" fill="#FFCC00" />
      </Svg>
      <AppText size={12} weight={700} color="#a87900">
        홈
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bag: {
    backgroundColor: colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E6DF',
    backgroundColor: '#fff',
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44, height: 44 },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2D2926',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  askCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFCC00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9E6DF',
  },
});
