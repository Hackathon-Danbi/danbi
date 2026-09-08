import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import type { TxRecord } from '../../types';
import { AccountCard } from '../../components/AccountCard';
import { IconCalendar } from '../../components/icons';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import type { HistoryHelpTarget } from '../historyHelp';

/** danbi_jj main/screens/history.tsx <TransactionsScreen> 이식. */
export function TransactionsScreen({
  reviewOnly,
  needCheckCount,
  unknownCount,
  transactions,
  month,
  canGoNext,
  helpTarget = '',
  onActivity,
  onPrevMonth,
  onNextMonth,
  onSelectTx,
  onReview,
  onReviewUnknown,
  onHome,
}: {
  reviewOnly: boolean;
  needCheckCount: number;
  unknownCount: number;
  transactions: TxRecord[];
  month: string;
  canGoNext: boolean;
  helpTarget?: HistoryHelpTarget;
  onActivity?: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectTx: (tx: TxRecord) => void;
  onReview: () => void;
  onReviewUnknown: () => void;
  onHome: () => void;
}) {
  const grouped: Record<string, TxRecord[]> = {};
  transactions.forEach((tx) => {
    (grouped[tx.date] ??= []).push(tx);
  });
  const dates = Object.keys(grouped);

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <View style={styles.header}>
        <AppText size={26} weight={900} color={INK}>
          {reviewOnly ? '확인할 거래' : '거래내역'}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <AccountCard />

        <View style={styles.section}>
          {unknownCount > 0 ? (
            <View style={styles.dangerCard}>
              <AppText size={16} weight={900} color="#9B1C1C" style={styles.mb4}>
                모르는 거래 {unknownCount}건을 확인해주세요
              </AppText>
              <AppText size={13} color="#8A3D3D" lineHeight={20}>
                실제 모르는 거래라면 은행이나 카드사에 바로 신고해주세요.
              </AppText>
              <PulseHighlight active={helpTarget === 'reportBtn'} borderRadius={12}>
                <Pressable accessibilityRole="button" onPress={onReviewUnknown} style={styles.dangerBtn}>
                  <AppText size={15} weight={900} color="#fff">
                    신고 안내 보기
                  </AppText>
                </Pressable>
              </PulseHighlight>
            </View>
          ) : null}

          {needCheckCount > 0 ? (
            <View style={styles.warnCard}>
              <View style={styles.warnHead}>
                <AppText size={16}>●</AppText>
                <View style={styles.flex1}>
                  <AppText size={16} weight={900} color={INK} style={styles.mb4}>
                    확인하지 않은 거래 {needCheckCount}건이 있어요
                  </AppText>
                  <AppText size={13} color="#888" lineHeight={20}>
                    아직 확인하지 않은 거래를 하나씩 확인해주세요.
                  </AppText>
                </View>
              </View>
              <PulseHighlight active={helpTarget === 'reviewBtn'} borderRadius={12}>
                <Pressable accessibilityRole="button" onPress={onReview} style={styles.warnBtn}>
                  <AppText size={15} weight={900} color={INK}>
                    확인하기
                  </AppText>
                </Pressable>
              </PulseHighlight>
            </View>
          ) : null}

          <View style={styles.monthNav}>
            <PulseHighlight active={helpTarget === 'prevMonth'} borderRadius={14}>
              <Pressable accessibilityRole="button" onPress={onPrevMonth} style={styles.monthBtn}>
                <IconCalendar size={20} />
                <AppText size={13} weight={800} color={INK}>
                  이전 달
                </AppText>
              </Pressable>
            </PulseHighlight>

            <View style={styles.monthNow}>
              <IconCalendar size={22} />
              <AppText size={17} weight={900} color={INK}>
                {month}
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canGoNext}
              onPress={onNextMonth}
              style={[styles.monthBtn, !canGoNext && styles.monthBtnDisabled]}
            >
              <AppText size={13} weight={800} color={canGoNext ? INK : '#AAA'}>
                다음 달
              </AppText>
              <IconCalendar size={20} />
            </Pressable>
          </View>

          {dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <AppText size={14} weight={800} color="#888" style={styles.dateLabel}>
                {date}
              </AppText>
              <View style={styles.list}>
                {grouped[date].map((tx, i) => (
                  <Pressable
                    key={tx.id}
                    accessibilityRole="button"
                    onPress={() => onSelectTx(tx)}
                    style={[styles.item, i > 0 && styles.itemBorder]}
                  >
                    <View style={[styles.txIcon, { backgroundColor: tx.amount < 0 ? '#FFF3F3' : '#F0FFF6' }]}>
                      <AppText size={20}>{tx.amount < 0 ? '💳' : '💰'}</AppText>
                    </View>
                    <View style={styles.flex1}>
                      <View style={styles.txNameRow}>
                        <AppText size={15} weight={900} color={INK}>
                          {tx.name}
                        </AppText>
                        {tx.reviewStatus === 'pending' ? (
                          <View style={styles.checkPill}>
                            <AppText size={11} weight={700} color="#9A7200">
                              확인 필요
                            </AppText>
                          </View>
                        ) : tx.reviewStatus === 'unknown' ? (
                          <View style={styles.dangerPill}>
                            <AppText size={11} weight={700} color="#9B1C1C">
                              신고 필요
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText size={12} color="#AAA">
                        {tx.time} · {tx.type}
                      </AppText>
                    </View>
                    <AppText size={16} weight={900} color={tx.amount < 0 ? '#D94040' : '#2E8B57'}>
                      {tx.amount < 0 ? '-' : '+'}
                      {Math.abs(tx.amount).toLocaleString()}원
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          {dates.length === 0 ? (
            <View style={styles.empty}>
              <AppText size={16} weight={700} color="#888" align="center">
                {reviewOnly ? '확인할 거래가 없어요.' : '이 달에는 거래내역이 없어요.'}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.spacer} />
      </ScrollView>

      <FloatingHomeButton onGoHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  mb4: { marginBottom: 4 },
  header: { paddingTop: 20, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff' },
  body: { paddingBottom: 12 },
  section: { paddingHorizontal: 18 },
  warnCard: {
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: YELLOW,
    backgroundColor: '#FFFBEA',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  dangerCard: {
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#D9534F',
    backgroundColor: '#FFF5F5',
    padding: 16,
    marginBottom: 14,
  },
  dangerBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 12,
  },
  warnHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  warnBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  monthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  monthBtnDisabled: { opacity: 0.45 },
  monthNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dateGroup: { marginBottom: 8 },
  dateLabel: { marginBottom: 10 },
  list: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#fff' },
  itemBorder: { borderTopWidth: 1, borderTopColor: '#F3F3F3' },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  checkPill: {
    backgroundColor: '#FFF3C4',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  dangerPill: {
    backgroundColor: '#FEE4E2',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  spacer: { height: 12 },
  empty: { paddingVertical: 48, alignItems: 'center' },
});
