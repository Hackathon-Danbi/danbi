import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '../../theme';
import type { TxRecord } from '../../types';

/** danbi_jj main/screens/history.tsx <TxDetailPopup> 이식 (RN Modal). */
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
  return (
    <Modal visible={visible && !!tx} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {tx ? (
            <>
              <AppText size={22} weight={900} color={INK} align="center" style={styles.mb10}>
                {tx.reviewStatus === 'unknown' ? '모르는 거래로 표시했어요' : '이 거래를 알고 계신가요?'}
              </AppText>
              <AppText size={14} color="#AAA" align="center" style={styles.mb24}>
                카드 결제 : {tx.date} {tx.time}
              </AppText>

              <View style={styles.center}>
                <AppText size={26} weight={900} color={INK} align="center" style={styles.mb8}>
                  {tx.name}
                </AppText>
                <AppText size={38} weight={900} color={INK} align="center" letterSpacing={-1}>
                  {Math.abs(tx.amount).toLocaleString()}원
                </AppText>
              </View>

              <View style={styles.actions}>
                {tx.reviewStatus === 'unknown' ? (
                  <Pressable accessibilityRole="button" onPress={onReport} style={styles.danger}>
                    <AppText size={17} weight={900} color="#fff">
                      고객센터 전화하기
                    </AppText>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" onPress={onKnown} style={styles.primary}>
                  <AppText size={17} weight={900} color={INK}>
                    {tx.reviewStatus === 'unknown' ? '알고 있는 거래로 변경' : '알고 있는 거래에요'}
                  </AppText>
                </Pressable>
                {tx.reviewStatus !== 'unknown' ? (
                  <Pressable accessibilityRole="button" onPress={onUnknown} style={styles.quiet}>
                    <AppText size={15} weight={700} color="#888">
                      모르는 거래에요
                    </AppText>
                  </Pressable>
                ) : null}
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
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb24: { marginBottom: 24 },
  center: { alignItems: 'center', marginBottom: 28 },
  actions: { gap: 10 },
  primary: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: YELLOW,
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
