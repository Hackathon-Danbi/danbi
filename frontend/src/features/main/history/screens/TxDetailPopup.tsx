import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import type { TxRecord } from '../../types';
import { formatTxOccurredAt } from '../../transactions';

/** 거래 한 건의 상세(사용처·카테고리·메모·결제수단·일시)와, 필요할 때만 확인 질문을 보여준다. */
export function TxDetailPopup({
  visible,
  tx,
  onKnown,
  onUnknown,
  onReport,
  onClose,
}: {
  visible: boolean;
  tx: TxRecord | null;
  onKnown: () => void;
  onUnknown: () => void;
  onReport: () => void;
  onClose: () => void;
}) {
  const pending = tx?.reviewStatus === 'pending';
  const unknown = tx?.reviewStatus === 'unknown';
  const rows = tx
    ? [
        { label: '사용처', value: tx.merchant || tx.name },
        { label: '카테고리', value: tx.category },
        { label: '메모', value: tx.memo.trim() ? tx.memo : '없음' },
        { label: '결제수단', value: tx.type },
        { label: '결제일시', value: formatTxOccurredAt(tx) },
      ]
    : [];

  return (
    <Modal visible={visible && !!tx} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {tx ? (
            <>
              <AppText size={22} weight={900} color={INK} align="center" style={styles.mb8}>
                거래 상세
              </AppText>
              {unknown ? (
                <AppText size={14} weight={700} color="#9B1C1C" align="center" style={styles.mb16}>
                  모르는 거래로 표시했어요
                </AppText>
              ) : pending ? (
                <AppText size={14} weight={700} color="#9A7200" align="center" style={styles.mb16}>
                  이 거래를 알고 계신가요?
                </AppText>
              ) : (
                <View style={styles.mb16} />
              )}

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollBody}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.center}>
                  <AppText size={18} weight={800} color="#888" align="center" style={styles.mb6}>
                    {tx.amount < 0 ? '출금' : '입금'}
                  </AppText>
                  <AppText size={32} weight={900} color={INK} align="center" letterSpacing={-0.5} style={styles.mb6}>
                    {tx.amount < 0 ? '-' : '+'}
                    {Math.abs(tx.amount).toLocaleString()}원
                  </AppText>
                  <AppText size={17} weight={800} color={INK} align="center">
                    {tx.merchant || tx.name}
                  </AppText>
                </View>

                <View style={styles.detailCard}>
                  {rows.map((row, i) => (
                    <View key={row.label} style={[styles.detailRow, i > 0 && styles.detailRowBorder]}>
                      <AppText size={14} weight={700} color="#888">
                        {row.label}
                      </AppText>
                      <AppText size={16} weight={900} color={INK} style={styles.detailValue}>
                        {row.value}
                      </AppText>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.actions}>
                {unknown ? (
                  <Pressable accessibilityRole="button" onPress={onReport} style={styles.danger}>
                    <AppText size={17} weight={900} color="#fff">
                      고객센터 전화하기
                    </AppText>
                  </Pressable>
                ) : null}
                {pending || unknown ? (
                  <Pressable accessibilityRole="button" onPress={onKnown} style={styles.primary}>
                    <AppText size={17} weight={900} color={INK}>
                      {unknown ? '알고 있는 거래로 변경' : '알고 있는 거래에요'}
                    </AppText>
                  </Pressable>
                ) : null}
                {pending ? (
                  <Pressable accessibilityRole="button" onPress={onUnknown} style={styles.quiet}>
                    <AppText size={15} weight={700} color="#888">
                      모르는 거래에요
                    </AppText>
                  </Pressable>
                ) : (
                  <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}>
                    <AppText size={16} weight={700} color={INK}>
                      {unknown ? '닫기' : '확인했어요'}
                    </AppText>
                  </Pressable>
                )}
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
  },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  scroll: { maxHeight: 340 },
  scrollBody: { paddingBottom: 8 },
  center: { alignItems: 'center', marginBottom: 18 },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0E6C2',
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },
  actions: { gap: 10, marginTop: 16 },
  primary: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
  },
  secondary: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
  },
  danger: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 16,
  },
  quiet: { width: '100%', paddingVertical: 15, alignItems: 'center' },
});
