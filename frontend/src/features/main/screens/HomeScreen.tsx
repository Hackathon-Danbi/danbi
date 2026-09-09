import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BORDER, CREAM, INK } from '../theme';
import { AccountCard } from '../components/AccountCard';
import { HomeHeader } from '../components/HomeHeader';
import { MicButton } from '../components/MicButton';
import { IconHistory, IconPractice, IconSavings, IconSend } from '../components/icons';

// 문구 + 마이크(링 포함) + 안내문을 기본 크기로 그렸을 때의 세로 높이(px).
// 제목 lineHeight 42 + 여백 16 + 마이크링박스 132*1.82 + 여백 12 + 안내문 lineHeight 28.
const CENTER_DESIGN_HEIGHT = 338;
// 아무리 좁아도 이 배율 밑으로는 줄이지 않는다.
const MIN_CENTER_SCALE = 0.45;

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
    { label: '나의 금융독립', icon: <IconPractice />, action: onFinancialIndependence },
    { label: '예적금', icon: <IconSavings />, action: onSavings },
  ];

  // 가운데 영역이 실제로 받은 높이. flex 로 정해지므로 내용 크기와 무관 → 되먹임 없음.
  const [centerHeight, setCenterHeight] = useState(0);
  // 받은 높이가 기본 높이보다 작으면 그 비율만큼 폰트/마이크를 줄여 한 화면에 담는다.
  const scale =
    centerHeight > 0
      ? Math.min(1, Math.max(MIN_CENTER_SCALE, centerHeight / CENTER_DESIGN_HEIGHT))
      : 1;

  return (
    <View style={styles.root}>
      <HomeHeader
        onHistory={onReviewTransactions}
        needCheckCount={needCheckCount}
        unknownCount={unknownCount}
      />
      <AccountCard />

      <View
        style={styles.center}
        onLayout={(e) => setCenterHeight(e.nativeEvent.layout.height)}
      >
        <AppText
          size={Math.round(30 * scale)}
          weight={900}
          color={INK}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.mainAsk, { marginBottom: Math.round(16 * scale) }]}
        >
          어떤 업무를 도와드릴까요?
        </AppText>
        <MicButton onClick={onMic} size={Math.round(132 * scale)} />
        <AppText
          size={Math.round(20 * scale)}
          weight={800}
          color={INK}
          style={{ marginTop: Math.round(12 * scale) }}
        >
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
    overflow: 'hidden',
  },
  // 한 줄 유지: 폭을 채우고 좁은 기기에서는 자동으로 축소(adjustsFontSizeToFit).
  mainAsk: { alignSelf: 'stretch', paddingHorizontal: 16 },
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
