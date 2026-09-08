import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { speak } from '@/lib/speech/tts';
import { INK, YELLOW } from '../../theme';
import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { DepositOverviewCard } from '../../imports/DepositOverview';
import { SavingsOverviewCard } from '../../imports/SavingsOverview';

/** danbi_jj main/screens/savings.tsx <SavingsOverviewScreen> 이식 (적금 ↔ 예금 carousel). */
export function SavingsOverviewScreen({
  onBack,
  onSavingsDetail,
  onDepositDetail,
  onHome,
}: {
  onBack: () => void;
  onSavingsDetail: () => void;
  onDepositDetail: () => void;
  onHome: () => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const isSavings = cardIndex === 0;

  return (
    <View style={styles.root}>
      <SavingsHeader title="나의 예금 · 적금" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.body}>
        {isSavings ? <SavingsOverviewCard /> : <DepositOverviewCard />}

        <Pressable
          accessibilityRole="button"
          onPress={isSavings ? onSavingsDetail : onDepositDetail}
          style={styles.detailBtn}
        >
          <AppText size={17} weight={900} color={INK}>
            자세히 보기
          </AppText>
        </Pressable>

        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            disabled={isSavings}
            onPress={() => setCardIndex(0)}
            style={[styles.navBtn, isSavings && styles.navBtnOff]}
          >
            <AppText size={18} weight={900} color={isSavings ? '#a8a39b' : '#2d2926'}>
              ‹ 이전
            </AppText>
          </Pressable>
          <View style={styles.dots}>
            <View style={[styles.dot, isSavings && styles.dotOn]} />
            <View style={[styles.dot, !isSavings && styles.dotOn]} />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!isSavings}
            onPress={() => setCardIndex(1)}
            style={[styles.navBtn, !isSavings && styles.navBtnOff]}
          >
            <AppText size={18} weight={900} color={!isSavings ? '#a8a39b' : '#2d2926'}>
              다음 ›
            </AppText>
          </Pressable>
        </View>

        <AppText size={18} weight={900} color={INK} align="center" style={styles.ask}>
          궁금한 점이 있으신가요?
        </AppText>
        <AskDanbiButton
          onPress={() => speak(
            isSavings
              ? '적금은 매달 일정한 금액을 모으는 상품이에요. 자세히 보기를 누르면 납입 정보와 만기 금액을 확인할 수 있어요.'
              : '예금은 목돈을 일정 기간 맡기는 상품이에요. 자세히 보기를 누르면 금리와 만기 정보를 확인할 수 있어요.',
          )}
        />
      </ScrollView>

      <HomeBar onHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF7' },
  body: { padding: 18, gap: 14 },
  detailBtn: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    borderWidth: 1.5,
    borderColor: '#D8D3C9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  navBtnOff: { backgroundColor: '#F7F4ED', borderColor: '#E3DFD6' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDD9D1' },
  dotOn: { backgroundColor: YELLOW },
  ask: { marginTop: 6 },
});
