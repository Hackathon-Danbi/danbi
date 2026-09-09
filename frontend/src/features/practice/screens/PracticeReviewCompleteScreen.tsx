import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TRANSFER_DIFFICULTY_COPY } from '@/features/missions/transferDifficulty';
import { usePracticeApp } from '../PracticeContext';
import { P } from '../theme';
import { OutlineButton, PrimaryButton, SafetyNote } from './shared';

export function PracticeReviewCompleteScreen() {
  const { reviewStep, reviewScore, exitReview, restartReview } = usePracticeApp();
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
      <AppText size={31} weight={900} color={P.ink} align="center" lineHeight={40}>
        {reviewScore?.earnedPoints ? (
          <>
            금융 독립 점수가{`\n`}
            <AppText size={31} weight={900} color={P.accent}>{reviewScore.earnedPoints}점</AppText> 올랐어요!
          </>
        ) : '복습을 다시 마쳤어요!'}
      </AppText>
      <AppText size={18} weight={650} color={P.muted} align="center" lineHeight={27}>
        {copy.title} 연습을 완료했어요.
      </AppText>
      {reviewScore ? (
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <AppText size={15} weight={700} color={P.muted}>현재 점수</AppText>
            <AppText size={25} weight={900} color={P.accent}>
              {reviewScore.newScore}
              <AppText size={15} weight={700} color={P.muted}> / {reviewScore.maxScore}점</AppText>
            </AppText>
          </View>
          <ProgressBar value={Math.round((reviewScore.newScore / reviewScore.maxScore) * 100)} height={10} />
        </View>
      ) : null}
      <SafetyNote text="연습 진행도를 나타내는 점수이며 실제 신용점수가 아니에요." />
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
  scoreCard: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.accentBorder,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
