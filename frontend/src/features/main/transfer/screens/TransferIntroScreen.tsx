import { Pressable, StyleSheet, View } from 'react-native';

import { PulseHighlight } from '@/components/anim/PulseHighlight';
import { AppText } from '@/components/ui/AppText';
import { AccountSwitcher } from '@/features/shared/components';
import type { Account } from '@/features/shared/data';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { MicButton } from '../../components/MicButton';
import { IconCard } from '../../components/icons';

/** danbi_jj main/screens/transfer.tsx <TransferScreen> (송금 진입 화면) 이식. */
export function TransferIntroScreen({
  accounts,
  selectedAccount,
  onChangeAccount,
  onMic,
  onGoHome,
  onDirect,
  onSavedAccounts,
  helpTarget,
  onActivity,
}: {
  accounts: Account[];
  selectedAccount: Account;
  onChangeAccount: (account: Account) => void;
  onMic: () => void;
  onGoHome: () => void;
  onDirect: () => void;
  onSavedAccounts: () => void;
  helpTarget: string;
  onActivity: () => void;
}) {
  return (
    <View style={styles.root} onTouchStart={onActivity}>
      <View style={styles.top}>
        <View style={styles.header}>
          <AppText size={18} weight={800} color={INK}>
            안녕하세요, 박옥순님
          </AppText>
          <Pressable accessibilityRole="button" onPress={onSavedAccounts} style={styles.savedButton}>
            <IconCard />
            <AppText size={14} weight={800} color={INK}>
              저장된 계좌 ›
            </AppText>
          </Pressable>
        </View>
        <AccountSwitcher
          selectedAccount={selectedAccount}
          accounts={accounts}
          onChangeAccount={onChangeAccount}
          title="보낼 통장"
        />
      </View>

      <View style={styles.center}>
        <AppText size={24} weight={900} color={INK} align="center" lineHeight={31} style={styles.title}>
          {'누구에게 얼마를\n보내시겠어요?'}
        </AppText>
        <PulseHighlight active={helpTarget === 'micButton'} borderRadius={44}>
          <MicButton onClick={onMic} size={88} />
        </PulseHighlight>
        <AppText size={14} weight={800} color={INK} style={styles.mt16}>
          마이크를 눌러 말씀해주세요
        </AppText>
      </View>

      <View style={styles.examples}>
        {['"엄마에게 10만원 보내줘"', '"친구에게 2만원 보내줘"', '"내 계좌로 5만원 보내줘"'].map((t) => (
          <Pressable key={t} accessibilityRole="button" onPress={onMic} style={styles.example}>
            <AppText size={14} weight={600} color={INK} align="center">
              {t}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.directWrap}>
        <Pressable accessibilityRole="button" onPress={onDirect} style={styles.direct}>
          <AppText size={16} weight={900} color={INK} align="center">
            직접 입력하기
          </AppText>
        </Pressable>
      </View>

      <FloatingHomeButton onGoHome={onGoHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
  top: { flexShrink: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 11,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: CREAM,
  },
  center: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: { marginBottom: 16 },
  mt16: { marginTop: 12 },
  examples: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 6,
  },
  example: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  directWrap: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  direct: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
});
