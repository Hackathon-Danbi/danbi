import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../theme';
import { MoneyBag } from './_shared';

/** danbi_jj app/imports/06DepositDetail2 (예금 상세) 정보 구조 이식. */
export function DepositDetailBody() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.top}>
          <MoneyBag />
          <View style={styles.flex1}>
            <AppText size={22} weight={900} color={INK}>
              KB 국민수퍼정기예금
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText size={12} weight={700} color="#66625b">
              정기예금
            </AppText>
          </View>
        </View>

        <AppText size={15} color="#77736c" style={styles.mt16}>
          현재 맡긴 금액
        </AppText>
        <AppText size={36} weight={900} color={INK} letterSpacing={-1} style={styles.mb14}>
          10,000,000원
        </AppText>

        <View style={styles.divider} />

        <AppText size={14} weight={700} color="#725600" style={styles.mt10}>
          세전 예상 수령액
        </AppText>
        <AppText size={31} weight={900} color={INK} letterSpacing={-0.5} style={styles.mt6}>
          약 10,134,000원
        </AppText>
        <AppText size={12} color="#725600" style={styles.mt6}>
          가입 금리 연 3.20% 기준
        </AppText>
      </View>

      <AppText size={19} weight={900} color={INK} style={styles.sectionTitle}>
        예금 정보를 확인해보세요
      </AppText>

      {[
        ['📅', '2025년 3월 12일에 가입했어요'],
        ['⏳', '12개월 만기예요'],
        ['🏁', '2026년 3월 12일에 만기예요'],
      ].map(([icon, text]) => (
        <View key={text} style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <AppText size={14}>{icon}</AppText>
          </View>
          <AppText size={16} weight={900} color={INK} style={styles.flex1}>
            {text}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  mt6: { marginTop: 6 },
  mt10: { marginTop: 10 },
  mt16: { marginTop: 16 },
  mb14: { marginBottom: 14 },
  wrap: { gap: 10 },
  card: {
    borderWidth: 1.5,
    borderColor: '#E3DFD6',
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 18,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { backgroundColor: '#F1EFE9', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  divider: { height: 1.5, backgroundColor: '#E3DFD6', marginVertical: 4 },
  sectionTitle: { marginTop: 8, marginBottom: 2 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.2,
    borderColor: '#E3DFD6',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
