import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { INK } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { RealTxBadge } from '../components/RealTxBadge';
import type { AccountUnconfirmedGroup } from '../unconfirmed';

/**
 * 통장별 미확인 거래 건수 목록. 건수가 있는 통장을 누르면 드롭다운으로 거래 항목이 펼쳐진다.
 */
export function AccountBreakdownScreen({
  groups,
  onBack,
  onHome,
}: {
  groups: AccountUnconfirmedGroup[];
  onBack: () => void;
  onHome: () => void;
}) {
  const [openId, setOpenId] = useState<number | null>(
    () => groups.find((group) => group.count > 0)?.account.accountId ?? null,
  );

  return (
    <View style={styles.root}>
      <NavBar title="통장별 거래내역" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.body}>
        <RealTxBadge />

        <AppText size={24} weight={900} color={INK} align="center" lineHeight={34} style={styles.title}>
          통장을 눌러{'\n'}자세히 확인하세요
        </AppText>
        <AppText size={14} color="#888" align="center" style={styles.sub}>
          최근 7일 동안 확인하지 않은 내역이에요.
        </AppText>

        <View style={styles.list}>
          {groups.map((group) => {
            const { account, pending, count } = group;
            const open = openId === account.accountId && count > 0;
            return (
              <View key={account.accountId} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  disabled={count === 0}
                  onPress={() =>
                    setOpenId((current) => (current === account.accountId ? null : account.accountId))
                  }
                  style={styles.row}
                >
                  <View style={[styles.swatch, { backgroundColor: account.color }]}>
                    <AppText size={15} weight={900} color="#fff">
                      ₩
                    </AppText>
                  </View>

                  <View style={styles.flex1}>
                    <AppText size={16} weight={900} color={INK}>
                      {account.accountName}
                    </AppText>
                    <AppText size={14} color="#AAA">
                      {account.bankName} · {account.maskedAccountNumber}
                    </AppText>
                  </View>

                  {count > 0 ? (
                    <>
                      <View style={styles.countPill}>
                        <AppText size={14} weight={900} color="#8A6D00">
                          {count}건
                        </AppText>
                      </View>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Polyline
                          points={open ? '6 15 12 9 18 15' : '9 6 15 12 9 18'}
                          stroke="#999"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </>
                  ) : (
                    <AppText size={15} weight={800} color="#B4B4B4">
                      확인 완료
                    </AppText>
                  )}
                </Pressable>

                {open ? (
                  <View style={styles.expand}>
                    {pending.map((tx) => (
                      <View key={tx.id} style={styles.txRow}>
                        <View style={styles.flex1}>
                          <AppText size={14} color="#AAA" style={styles.txWhen}>
                            {tx.date} · {tx.time}
                          </AppText>
                          <AppText size={15} weight={900} color={INK}>
                            {tx.name}
                          </AppText>
                          <AppText size={14} weight={700} color="#C08A00">
                            {tx.type} · 확인 필요
                          </AppText>
                        </View>
                        <AppText size={16} weight={900} color={tx.amount < 0 ? '#D94040' : '#2E8B57'}>
                          {tx.amount < 0 ? '-' : '+'}
                          {Math.abs(tx.amount).toLocaleString()}원
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <AppText size={15} color="#999" align="center" style={styles.note}>
          노란색 숫자는 아직 확인하지 않은 거래 건수예요.
        </AppText>
      </ScrollView>

      <FloatingHomeButton onGoHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  title: { marginTop: 14 },
  sub: { marginTop: 8, marginBottom: 18 },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    backgroundColor: '#FFF0BF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  expand: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    backgroundColor: '#FCFBF6',
    paddingHorizontal: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAD9',
  },
  txWhen: { marginBottom: 3 },
  note: { marginTop: 18 },
});
