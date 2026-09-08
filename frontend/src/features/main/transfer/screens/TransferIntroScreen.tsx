import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK, YELLOW } from '../../theme';
import { AccountCard } from '../../components/AccountCard';
import { FloatingHomeButton } from '../../components/FloatingHomeButton';
import { HomeHeader } from '../../components/HomeHeader';
import { MicButton } from '../../components/MicButton';

/** danbi_jj main/screens/transfer.tsx <TransferScreen> (송금 진입 화면) 이식. */
export function TransferIntroScreen({
  onMic,
  onGoHome,
  onDirect,
  onHistory,
  needCheckCount,
  unknownCount,
}: {
  onMic: () => void;
  onGoHome: () => void;
  onDirect: () => void;
  onHistory: () => void;
  needCheckCount: number;
  unknownCount: number;
}) {
  return (
    <View style={styles.root}>
      <HomeHeader onHistory={onHistory} needCheckCount={needCheckCount} unknownCount={unknownCount} />
      <AccountCard />

      <View style={styles.center}>
        <AppText size={26} weight={900} color={INK} align="center" lineHeight={33} style={styles.title}>
          {'누구에게 얼마를\n보내시겠어요?'}
        </AppText>
        <MicButton onClick={onMic} size={96} />
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
  root: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: { marginBottom: 24 },
  mt16: { marginTop: 16 },
  examples: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  example: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  directWrap: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  direct: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
});
