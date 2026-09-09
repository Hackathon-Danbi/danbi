import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { BackHeader } from '../components/BackHeader';
import { SafetyNote } from './shared';

/** danbi_jj practice/screens/PracticeMethodScreen.tsx 이식. */
export function PracticeMethodScreen() {
  const { practiceStyle, practiceTarget, beginPractice, back } = usePracticeApp();
  const solo = practiceStyle === 'solo';

  return (
    <View style={styles.root}>
      <BackHeader title="연습 방법 선택" onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.missionCard}>
          <AppText size={15} weight={700} color={P.accentText}>
            {solo ? '오늘의 송금 미션' : '이번 연습 미션'}
          </AppText>
          <AppText size={18} weight={900} color={P.ink} style={styles.mt4}>
            {practiceTarget.recipient.name}님에게 {practiceTarget.amountLabel} 보내기
          </AppText>
        </View>

        <AppText size={30} weight={900} color={P.ink} lineHeight={38} style={styles.title}>
          {'어떤 방법으로\n연습해볼까요?'}
        </AppText>

        <View style={styles.list}>
          <Method icon="🎤" title="음성으로 송금하기" sub={'말로 받는 사람과\n금액을 알려줘요'} onPress={() => beginPractice('voice')} />
          <Method icon="⌨️" title="직접 입력하기" sub={'받는 사람과 금액을\n직접 눌러요'} onPress={() => beginPractice('manual')} />
        </View>

        <SafetyNote text="연습 중에는 실제 돈이 움직이지 않아요." />
      </ScrollView>
    </View>
  );
}

function Method({ icon, title, sub, onPress }: { icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <AppText size={20}>{icon}</AppText>
      </View>
      <View style={styles.flex1}>
        <AppText size={19} weight={900} color={P.ink}>
          {title}
        </AppText>
        <AppText size={14} color={P.muted} lineHeight={20} style={styles.mt4}>
          {sub}
        </AppText>
      </View>
      <AppText size={20} weight={900} color="#bbb">
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, gap: 12 },
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  missionCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: P.accentSurface,
    borderWidth: 1,
    borderColor: P.accentBorder,
  },
  title: { marginTop: 6, marginBottom: 8 },
  list: { gap: 14, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    minHeight: 88,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dedbd2',
    backgroundColor: '#fff',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
