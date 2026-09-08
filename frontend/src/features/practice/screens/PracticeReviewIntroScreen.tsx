import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { TRANSFER_DIFFICULTY_COPY } from '@/features/missions/transferDifficulty';
import { BackHeader } from '../components/BackHeader';
import { usePracticeApp } from '../PracticeContext';
import { P } from '../theme';
import { BottomActions, PrimaryButton, SafetyNote } from './shared';

export function PracticeReviewIntroScreen() {
  const { reviewStep, back, startReviewStep } = usePracticeApp();
  if (!reviewStep) return null;
  const copy = TRANSFER_DIFFICULTY_COPY[reviewStep];

  return (
    <View style={styles.root}>
      <BackHeader title="맞춤 복습" onBack={back} />
      <View style={styles.body}>
        <View style={styles.badge}>
          <AppText size={14} weight={900} color={P.accentText}>짧게 다시 연습해요</AppText>
        </View>
        <AppText size={30} weight={900} color={P.ink} lineHeight={39}>
          {copy.intro}
        </AppText>
        <AppText size={18} weight={600} color={P.muted} lineHeight={28}>
          {copy.instruction}
        </AppText>
        <SafetyNote text="연습이므로 실제 돈은 움직이지 않아요." />
      </View>
      <BottomActions>
        <PrimaryButton label="연습 시작하기" onPress={startReviewStep} />
      </BottomActions>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 40, gap: 18 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: P.accentSoft,
    borderWidth: 1,
    borderColor: P.accentBorder,
  },
});
