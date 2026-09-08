import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { fmt } from '../../data';
import { INK, YELLOW } from '../../theme';
import type { TransferDraft } from '../../types';

/**
 * danbi_jj main/screens/transfer.tsx <ConfirmPopup> 이식.
 * 신규 계좌 / 100만원 이상 고액 송금 경고 (원본 조건 그대로).
 */
export function ConfirmPopup({
  visible,
  transferDraft,
  isNewAccount,
  isLargeAmount,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  transferDraft: TransferDraft;
  isNewAccount: boolean;
  isLargeAmount: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title =
    isNewAccount && isLargeAmount
      ? '처음 보내는 계좌이고,\n큰 금액이에요.'
      : isNewAccount
        ? '처음 보내는 계좌예요.'
        : '큰 금액을 보내려고 해요.';
  const subtitle = isNewAccount
    ? '받는 사람과 계좌번호를 직접 확인하셨나요?'
    : '금액을 한 번 더 확인해 주세요.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <AppText
            size={22}
            weight={900}
            color={INK}
            align="center"
            lineHeight={30}
            style={styles.mb8}
          >
            {title}
          </AppText>
          <AppText size={14} color="#888" align="center" lineHeight={21} style={styles.mb22}>
            {subtitle}
          </AppText>

          <View style={[styles.info, { marginBottom: isLargeAmount ? 14 : 22 }]}>
            <AppText size={13} weight={700} color="#AAA" style={styles.mb4}>
              받는 사람
            </AppText>
            <AppText size={22} weight={900} color={INK} style={styles.mb4}>
              {transferDraft.recipientName || '수취인'}
            </AppText>
            <AppText size={14} color="#999" style={styles.mb16}>
              {transferDraft.bankName}
            </AppText>
            <AppText size={13} weight={700} color="#AAA" style={styles.mb4}>
              보낼 금액
            </AppText>
            <AppText size={28} weight={900} color={INK}>
              {fmt(transferDraft.amount)}원
            </AppText>
          </View>

          {isLargeAmount ? (
            <AppText
              size={15}
              weight={800}
              color="#D94040"
              align="center"
              lineHeight={24}
              style={styles.mb18}
            >
              {'평소보다 큰 금액이에요.\n금액도 꼭 확인해주세요.'}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirm}>
              <AppText size={17} weight={900} color={INK}>
                네, 확인했어요
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}>
              <AppText size={15} weight={700} color="#666">
                다시 확인할게요
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb18: { marginBottom: 18 },
  mb22: { marginBottom: 22 },
  info: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: YELLOW,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#FFFDF8',
  },
  actions: { gap: 10 },
  confirm: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  cancel: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
});
