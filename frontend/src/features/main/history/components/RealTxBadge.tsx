import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';

/** "● 실제 거래내역" 안내 뱃지. 연습(송금 연습하기)이 아니라 실제 계좌 데이터임을 시니어에게 알린다. */
export function RealTxBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <AppText size={12} weight={800} color="#8A6D00">
        실제 거래내역
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.4,
    borderColor: '#F0D67C',
    backgroundColor: '#FFF9E6',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F5B800',
  },
});
