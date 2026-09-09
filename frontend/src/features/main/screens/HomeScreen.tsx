import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK } from '../theme';
import { AccountCard } from '../components/AccountCard';
import { HomeHeader } from '../components/HomeHeader';
import { MicButton } from '../components/MicButton';
import { IconHistory, IconPractice, IconSavings, IconSend } from '../components/icons';

/** danbi_jj main/screens/transfer.tsx <HomeScreen> 이식. */
export function HomeScreen({
  onMic,
  onHistory,
  onReviewTransactions,
  onTransfer,
  onFinancialIndependence,
  onSavings,
  needCheckCount,
  unknownCount,
}: {
  onMic: () => void;
  onHistory: () => void;
  onReviewTransactions: () => void;
  onTransfer: () => void;
  onFinancialIndependence: () => void;
  onSavings: () => void;
  needCheckCount: number;
  unknownCount: number;
}) {
  const tiles: { label: string; icon: ReactNode; action: () => void }[] = [
    { label: '거래 내역', icon: <IconHistory />, action: onHistory },
    { label: '돈 보내기', icon: <IconSend />, action: onTransfer },
    { label: '금융 연습', icon: <IconPractice />, action: onFinancialIndependence },
    { label: '예적금', icon: <IconSavings />, action: onSavings },
  ];

  return (
    <View style={styles.root}>
      <HomeHeader
        onHistory={onReviewTransactions}
        needCheckCount={needCheckCount}
        unknownCount={unknownCount}
      />
      <AccountCard />

      <View style={styles.center}>
        <AppText
          size={30}
          weight={900}
          color={INK}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.mainAsk}
        >
          어떤 업무를 도와드릴까요?
        </AppText>
        <MicButton onClick={onMic} size={132} />
        <AppText size={20} weight={800} color={INK} style={styles.mt20}>
          마이크를 눌러 말씀해주세요
        </AppText>
      </View>

      <View style={styles.tiles}>
        {tiles.map(({ label, icon, action }) => (
          <Pressable key={label} accessibilityRole="button" onPress={action} style={styles.tile}>
            <AppText size={18} weight={900} color={INK}>
              {label}
            </AppText>
            <View style={styles.tileIcon}>{icon}</View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 한 줄 유지: 폭을 채우고 좁은 기기에서는 자동으로 축소(adjustsFontSizeToFit).
  mainAsk: { marginBottom: 16, alignSelf: 'stretch', paddingHorizontal: 16 },
  mt20: { marginTop: 12 },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minHeight: 102,
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 11,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  tileIcon: {
    alignItems: 'flex-end',
  },
});
