import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { fmt } from '../../data';
import { INK, YELLOW } from '../../theme';
import type { TransferDraft } from '../../types';

/** danbi_jj main/screens/transfer.tsx <TransferDoneScreen> 이식. */
export function TransferDoneScreen({
  transferDraft,
  onHome,
}: {
  transferDraft: TransferDraft;
  onHome: () => void;
}) {
  const rows = [
    { label: '받는 분', value: transferDraft.recipientName },
    { label: '보낸 금액', value: `${fmt(transferDraft.amount)}원` },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
            <Polyline
              points="20 6 9 17 4 12"
              stroke="#fff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <AppText
          size={32}
          weight={900}
          color={INK}
          align="center"
          lineHeight={39}
          style={styles.mb10}
        >
          {'송금이\n완료되었습니다'}
        </AppText>
        <AppText size={16} color="#666" align="center" style={styles.mb36}>
          <AppText size={16} weight={900} color={INK}>
            {transferDraft.recipientName}님
          </AppText>
          에게{' '}
          <AppText size={16} weight={900} color={INK}>
            {fmt(transferDraft.amount)}원
          </AppText>
          을 보냈어요.
        </AppText>

        <View style={styles.summary}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
              <AppText size={14} weight={600} color="#999">
                {row.label}
              </AppText>
              <AppText size={17} weight={900} color={INK}>
                {row.value}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={onHome} style={styles.homeBtn}>
          <AppText size={17} weight={900} color={INK}>
            홈으로 가기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  center: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mb10: { marginBottom: 10 },
  mb36: { marginBottom: 36 },
  mark: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  summary: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
});
