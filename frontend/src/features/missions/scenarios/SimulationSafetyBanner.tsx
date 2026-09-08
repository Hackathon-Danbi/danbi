import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';

/** 위험상황 시뮬레이션 전 과정에서 실제 상황과 혼동하지 않도록 고정 표시한다. */
export function SimulationSafetyBanner() {
  return (
    <View
      accessible
      accessibilityLabel="모의 연습 화면입니다. 실제 전화, 메시지, 송금이 아닙니다."
      style={styles.banner}
    >
      <View style={styles.mark}>
        <AppText size={17} weight={900} color="#8a1f18">!</AppText>
      </View>
      <View style={styles.copy}>
        <AppText size={15} weight={900} color="#fff">
          모의 연습 화면
        </AppText>
        <AppText size={13} weight={800} color="#ffe9e6" lineHeight={18}>
          실제 전화·메시지·송금이 아닙니다
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#8a1f18',
    borderBottomWidth: 3,
    borderBottomColor: '#5f100c',
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  copy: { flex: 1, gap: 1 },
});
