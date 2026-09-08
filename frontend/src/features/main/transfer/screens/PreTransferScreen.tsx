import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { fmt } from '../../data';
import { INK, YELLOW } from '../../theme';
import type { TxInfo } from '../../types';
import { NavBar } from '../../components/NavBar';
import { WarningBar } from '../../components/WarningBar';

/** danbi_jj main/screens/transfer.tsx <PreTransferScreen> (3구획 확인) 이식. */
export function PreTransferScreen({
  txInfo,
  onBack,
  onTransfer,
  onRecheck,
  helpTarget,
  onActivity,
  onSectionReview,
}: {
  txInfo: TxInfo;
  onBack: () => void;
  onTransfer: () => void;
  onRecheck: () => void;
  helpTarget: string;
  onActivity: () => void;
  onSectionReview: () => void;
}) {
  const [reviewCount, setReviewCount] = useState(0);

  const handleSectionTap = () => {
    onActivity();
    const next = Math.min(reviewCount + 1, 3);
    setReviewCount(next);
    if (next >= 3) onSectionReview();
  };

  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="송금 전 확인" onBack={onBack} />
      <View style={styles.body}>
        <AppText size={24} weight={900} color={INK} lineHeight={31}>
          {'보내기 전에\n확인해 주세요'}
        </AppText>

        <PulseHighlight active={helpTarget === 'txCard'} borderRadius={18}>
          <View style={styles.card}>
            <Pressable onPress={handleSectionTap} style={styles.sectionTop}>
              <AppText size={13} weight={700} color="#AAA" style={styles.mb8}>
                받는 사람
              </AppText>
              <View style={styles.rowBetween}>
                <AppText size={24} weight={900} color={INK}>
                  {txInfo.recipient || '수취인'}
                </AppText>
                {reviewCount >= 1 ? <AppText size={18} color="#4CAF50">✓</AppText> : null}
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={handleSectionTap} style={styles.sectionMid}>
              <AppText size={13} weight={700} color="#AAA" style={styles.mb8}>
                은행 · 계좌번호
              </AppText>
              <View style={styles.rowBetweenTop}>
                <View>
                  <AppText size={20} weight={900} color={INK} style={styles.mb4}>
                    {txInfo.bank || '—'}
                  </AppText>
                  <AppText size={16} weight={700} color="#555">
                    {txInfo.account || '—'}
                  </AppText>
                </View>
                {reviewCount >= 2 ? <AppText size={18} color="#4CAF50">✓</AppText> : null}
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={handleSectionTap} style={styles.sectionBot}>
              <AppText size={13} weight={700} color="#AAA" style={styles.mb8}>
                보낼 금액
              </AppText>
              <View style={styles.rowBetweenTop}>
                <View>
                  <AppText size={28} weight={900} color={INK} style={styles.mb6}>
                    {fmt(txInfo.amount)}원
                  </AppText>
                  <AppText size={13} weight={700} color="#E05050">
                    실제 출금 금액
                  </AppText>
                </View>
                {reviewCount >= 3 ? <AppText size={18} color="#4CAF50">✓</AppText> : null}
              </View>
            </Pressable>
          </View>
        </PulseHighlight>

        <WarningBar text="실제 돈이 보내져요. 은행과 계좌번호, 금액을 꼭 확인하세요." />
      </View>

      <View style={styles.footer}>
        <PulseHighlight active={helpTarget === 'transferButton'} borderRadius={16}>
          <Pressable accessibilityRole="button" onPress={onTransfer} style={styles.transferBtn}>
            <AppText size={17} weight={900} color={INK}>
              송금하기
            </AppText>
          </Pressable>
        </PulseHighlight>
        <Pressable accessibilityRole="button" onPress={onRecheck} style={styles.recheckBtn}>
          <AppText size={15} weight={700} color="#666">
            다시 확인할게요
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  mb4: { marginBottom: 4 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  card: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: YELLOW,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sectionTop: { paddingTop: 16, paddingBottom: 14, paddingHorizontal: 22 },
  sectionMid: { paddingVertical: 14, paddingHorizontal: 22 },
  sectionBot: { paddingTop: 14, paddingBottom: 16, paddingHorizontal: 22 },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetweenTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  transferBtn: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  recheckBtn: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
});
