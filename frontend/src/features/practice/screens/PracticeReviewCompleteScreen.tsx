import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { TRANSFER_DIFFICULTY_COPY } from '@/features/missions/transferDifficulty';
import { usePracticeApp } from '../PracticeContext';
import { P } from '../theme';
import { OutlineButton, PrimaryButton, SafetyNote } from './shared';

export function PracticeReviewCompleteScreen() {
  const { reviewStep, exitReview, restartReview } = usePracticeApp();
  if (!reviewStep) return null;
  const copy = TRANSFER_DIFFICULTY_COPY[reviewStep];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.seal}>
        <AppText size={14} weight={900} color={P.accentText}>복습 완료</AppText>
      </View>
      <View style={styles.mark}>
        <AppText size={44} weight={900} color="#fff">✓</AppText>
      </View>
      <AppText size={31} weight={900} color={P.ink} align="center">잘하셨어요!</AppText>
      <AppText size={18} weight={650} color={P.muted} align="center" lineHeight={27}>
        {copy.title} 연습을 완료했어요.
      </AppText>
      <SafetyNote text="맞춤 복습은 금융 독립 점수에 영향을 주지 않아요." />
      <View style={styles.actions}>
        <PrimaryButton label="금융독립으로 돌아가기" onPress={exitReview} />
        <OutlineButton label="다시 연습하기" onPress={restartReview} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 16,
    backgroundColor: P.paper,
  },
  seal: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: P.accentSoft },
  mark: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  actions: { width: '100%', gap: 10, marginTop: 16 },
});
