import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';
import { MoneyBag } from './_shared';
import type { SavingsProductSummary } from '@/api';

/** danbi_jj app/imports/01SavingsOverview4 (적금 개요 카드) 정보 구조 이식. */
export function SavingsOverviewCard({ product }: { product: SavingsProductSummary }) {
  const payment = product.currentMonthPayment;
  const paymentAmount = payment?.amount || payment?.scheduledAmount || 0;
  const paymentLabel = payment?.status === 'PAID'
    ? `✓ ${paymentAmount.toLocaleString('ko-KR')}원 완료`
    : payment?.status === 'UNPAID'
      ? `${paymentAmount.toLocaleString('ko-KR')}원 미납`
      : `${paymentAmount.toLocaleString('ko-KR')}원 예정`;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <MoneyBag />
        <View style={styles.flex1}>
          <AppText size={20} weight={900} color={INK}>
            {product.productName}
          </AppText>
        </View>
      </View>

      <AppText size={20} color="#77736c" style={styles.mt16}>
        현재 모은 금액
      </AppText>
      <AppText size={34} weight={900} color={INK} letterSpacing={-1} style={styles.amount}>
        {product.balance.toLocaleString('ko-KR')}원
      </AppText>

      <View style={styles.row}>
        <View style={[styles.stat, styles.statGreen]}>
          <AppText size={16} color="#77736c" style={styles.mb4}>
            이번 달 납입
          </AppText>
          <AppText size={20} weight={900} color="#13855f">
            {payment ? paymentLabel : '납입 정보 없음'}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={16} color="#77736c" style={styles.mb4}>
            만기까지
          </AppText>
          <AppText size={20} weight={900} color={INK}>
            약 {product.remainingMonths}개월
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
  statGreen: { backgroundColor: '#DDF5E9' },
});
