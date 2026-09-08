import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';
import { MoneyBag } from './_shared';

/** danbi_jj app/imports/02DepositOverview1 (예금 개요 카드) 정보 구조 이식. */
export function DepositOverviewCard() {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <MoneyBag />
        <View style={styles.flex1}>
          <AppText size={20} weight={900} color={INK}>
            KB 국민수퍼정기예금
          </AppText>
        </View>
      </View>

      <AppText size={20} color="#77736c" style={styles.mt16}>
        현재 맡긴 금액
      </AppText>
      <AppText size={34} weight={900} color={INK} letterSpacing={-1} style={styles.amount}>
        10,000,000원
      </AppText>

      <View style={styles.row}>
        <View style={styles.stat}>
          <AppText size={16} color="#77736c" style={styles.mb4}>
            적용 금리
          </AppText>
          <AppText size={20} weight={900} color={INK}>
            연 3.20%
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={16} color="#77736c" style={styles.mb4}>
            만기까지
          </AppText>
          <AppText size={20} weight={900} color={INK}>
            약 5개월
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  mb4: { marginBottom: 4 },
  mt16: { marginTop: 16 },
  card: {
    borderWidth: 1.5,
    borderColor: '#E3DFD6',
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 18,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { marginTop: 4, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#F7F4ED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
});
