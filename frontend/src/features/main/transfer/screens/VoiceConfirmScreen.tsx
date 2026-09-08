import { Pressable, StyleSheet, View } from 'react-native';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { fmt } from '../../data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import type { TxInfo } from '../../types';
import { NavBar } from '../../components/NavBar';
import { WarningBar } from '../../components/WarningBar';

/** danbi_jj main/screens/transfer.tsx <VoiceConfirmScreen> 이식. */
export function VoiceConfirmScreen({
  txInfo,
  onBack,
  onConfirm,
  helpTarget,
  onActivity,
}: {
  txInfo: TxInfo;
  onBack: () => void;
  onConfirm: () => void;
  helpTarget: string;
  onActivity: () => void;
}) {
  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <NavBar title="내용을 확인해 주세요" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.card}>
          <AppText size={13} weight={700} color="#AAA" align="center" style={styles.mb14}>
            음성으로 인식한 내용
          </AppText>
          <AppText size={30} weight={900} color={INK} align="center" lineHeight={41}>
            {`${txInfo.recipient}에게\n${fmt(txInfo.amount)}원 보내기`}
          </AppText>
        </View>

        <AppText size={17} weight={800} color={INK} align="center">
          원하시는 내용이 맞나요?
        </AppText>

        <WarningBar text="실제 돈이 보내져요. 받는 분과 금액을 꼭 확인하세요." />
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onBack} style={[styles.btn, styles.secondary]}>
          <AppText size={15} weight={700} color="#555" align="center" lineHeight={21}>
            {'아니요,\n다시 말하기'}
          </AppText>
        </Pressable>
        <View style={styles.flex1}>
          <PulseHighlight active={helpTarget === 'confirmBtn'} borderRadius={14}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.btn, styles.primary, styles.confirmBtn]}
            >
              <AppText size={16} weight={900} color={INK} align="center">
                송금하기
              </AppText>
            </Pressable>
          </PulseHighlight>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  body: {
    flex: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 20,
  },
  mb14: { marginBottom: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: CREAM,
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  btn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  primary: {
    backgroundColor: YELLOW,
  },
  confirmBtn: {
    width: '100%',
    flex: 0,
  },
});
