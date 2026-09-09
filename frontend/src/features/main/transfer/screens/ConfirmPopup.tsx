import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { fmt } from '../../data';
import { INK, YELLOW } from '../../theme';
import type { TxInfo } from '../../types';

/** 백엔드 RiskReason(SAFETY) 과 1:1. 알 수 없는 값은 무시한다. */
type RiskReasonCode =
  | 'NEW_RECIPIENT'
  | 'HIGH_AMOUNT'
  | 'REPEATED_TRANSFER'
  | 'IN_CALL'
  | 'RUSHED'
  | 'PHISHING_KEYWORD_DETECTED';

type PopupCopy = { title: string; subtitle: string };

const REASON_COPY: Record<RiskReasonCode, PopupCopy> = {
  PHISHING_KEYWORD_DETECTED: {
    title: '보이스피싱이 의심돼요.',
    subtitle: '잠깐 멈추고, 정말 보내도 되는지 확인해 주세요.',
  },
  IN_CALL: {
    title: '통화하면서 송금하고 있어요.',
    subtitle: '전화를 끊고 다시 한 번 확인해 주세요.',
  },
  RUSHED: {
    title: '누가 송금을 재촉하고 있나요?',
    subtitle: '천천히 받는 사람과 금액을 확인해 주세요.',
  },
  HIGH_AMOUNT: {
    title: '큰 금액을 보내려고 해요.',
    subtitle: '금액을 한 번 더 확인해 주세요.',
  },
  NEW_RECIPIENT: {
    title: '처음 보내는 계좌예요.',
    subtitle: '받는 사람과 계좌번호를 직접 확인하셨나요?',
  },
  REPEATED_TRANSFER: {
    title: '같은 계좌로 여러 번 보내고 있어요.',
    subtitle: '방금 보낸 곳이 맞는지 다시 확인해 주세요.',
  },
};

// 여러 사유가 겹치면 이 순서로 가장 위의 것을 제목으로 쓴다.
const REASON_PRIORITY: RiskReasonCode[] = [
  'PHISHING_KEYWORD_DETECTED',
  'IN_CALL',
  'RUSHED',
  'HIGH_AMOUNT',
  'NEW_RECIPIENT',
  'REPEATED_TRANSFER',
];

function resolveCopy(
  reasons: readonly string[],
  isNewAccount: boolean,
  isLargeAmount: boolean,
): PopupCopy {
  const codes = new Set<string>(reasons);
  // 서버 사유가 없으면(오프라인 폴백) 기존 불리언으로 판단한다.
  if (codes.size === 0) {
    if (isNewAccount) codes.add('NEW_RECIPIENT');
    if (isLargeAmount) codes.add('HIGH_AMOUNT');
  }
  if (codes.has('NEW_RECIPIENT') && codes.has('HIGH_AMOUNT')) {
    return {
      title: '처음 보내는 계좌이고,\n큰 금액이에요.',
      subtitle: '받는 사람과 금액을 모두 확인해 주세요.',
    };
  }
  for (const code of REASON_PRIORITY) {
    if (codes.has(code)) return REASON_COPY[code];
  }
  return {
    title: '보내기 전에 한 번 더 확인해 주세요.',
    subtitle: '받는 사람과 금액이 맞는지 확인해 주세요.',
  };
}

/**
 * danbi_jj main/screens/transfer.tsx <ConfirmPopup> 이식 + 안심확인 사유별 문구.
 * 제목/부제목은 백엔드가 준 risk 사유(reasons)에 맞춰 고른다. 사유가 없으면
 * isNewAccount / isLargeAmount 불리언으로 폴백한다.
 */
export function ConfirmPopup({
  visible,
  txInfo,
  isNewAccount,
  isLargeAmount,
  reasons = [],
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  txInfo: TxInfo;
  isNewAccount: boolean;
  isLargeAmount: boolean;
  reasons?: readonly string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { title, subtitle } = resolveCopy(reasons, isNewAccount, isLargeAmount);
  const showAmountWarning = isLargeAmount || reasons.includes('HIGH_AMOUNT');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <AppText size={22} weight={900} color={INK} align="center" lineHeight={30} style={styles.mb8}>
            {title}
          </AppText>
          <AppText size={15} color="#888" align="center" lineHeight={22} style={styles.mb22}>
            {subtitle}
          </AppText>

          <View style={[styles.info, { marginBottom: showAmountWarning ? 14 : 22 }]}>
            <AppText size={15} weight={700} color="#AAA" style={styles.mb4}>
              받는 사람
            </AppText>
            <AppText size={22} weight={900} color={INK} style={styles.mb4}>
              {txInfo.recipient || '수취인'}
            </AppText>
            <AppText size={15} color="#999" style={styles.mb16}>
              {txInfo.bank}
            </AppText>
            <AppText size={15} weight={700} color="#AAA" style={styles.mb4}>
              보낼 금액
            </AppText>
            <AppText size={28} weight={900} color={INK}>
              {fmt(txInfo.amount)}원
            </AppText>
          </View>

          {showAmountWarning ? (
            <AppText size={15} weight={800} color="#D94040" align="center" lineHeight={24} style={styles.mb18}>
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
