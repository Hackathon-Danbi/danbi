import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';
import { MoneyBag } from './_shared';

/** danbi_jj app/imports/01SavingsOverview4 (적금 개요 카드) 정보 구조 이식. */
export function SavingsOverviewCard() {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <MoneyBag />
        <View style={styles.flex1}>
          <AppText size={20} weight={900} color={INK}>
            KB 국민행복적금
          </AppText>
        </View>
        <View style={styles.badge}>
          <AppText size={13} weight={700} color="#66625b">
            자유적금
          </AppText>
        </View>
      </View>

      <AppText size={15} color="#77736c" style={styles.mt16}>
        현재 모은 금액
      </AppText>
      <AppText size={36} weight={900} color={INK} letterSpacing={-1} style={styles.amount}>
        3,600,000원
      </AppText>

      <View style={styles.row}>
        <View style={[styles.stat, styles.statGreen]}>
          <AppText size={13} color="#77736c" style={styles.mb4}>
            이번 달 납입
          </AppText>
          <AppText size={16} weight={900} color="#13855f">
            ✓ 30만원 완료
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={13} color="#77736c" style={styles.mb4}>
            만기까지
          </AppText>
          <AppText size={18} weight={900} color={INK}>
            약 11개월
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
  badge: {
    backgroundColor: '#F1EFE9',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  amount: { marginTop: 4, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#F7F4ED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  statGreen: { backgroundColor: '#DDF5E9' },
});
