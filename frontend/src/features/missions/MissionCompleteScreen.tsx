import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/theme/tokens';

type Props = {
  missionTitle: string;
  earnedPoints: number;
  newScore: number;
  maxScore: number;
  onBack: () => void;
  onRetry?: () => void;
  onSoloRetry?: () => void;
  achieved?: boolean;
  dailyMission?: boolean;
};

/** danbi_jj missions/MissionCompleteScreen.tsx 이식. */
export function MissionCompleteScreen({
  missionTitle,
  earnedPoints,
  newScore,
  maxScore,
  onBack,
  onRetry,
  onSoloRetry,
  achieved,
  dailyMission,
}: Props) {
  const pct = Math.round((newScore / maxScore) * 100);
  const repeated = earnedPoints === 0 && !achieved;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {achieved ? (
        <>
          <View style={[styles.seal, styles.sealGold]}>
            <AppText size={14} weight={900} color="#7a5500">
              ★ 100점 달성!
            </AppText>
          </View>
          <View style={[styles.mark, styles.markGold]}>
            <AppText size={40} weight={900} color="#fff">
              ★
            </AppText>
          </View>
          <AppText size={30} weight={900} color={colors.ink} align="center" lineHeight={38} style={styles.heading}>
            금융 독립{'\n'}
            <AppText size={30} weight={900} color={colors.yellow}>
              100점 달성!
            </AppText>
          </AppText>
          <AppText size={15} color={colors.muted} align="center" lineHeight={23} style={styles.name}>
            혼자 금융 업무를 처리하는 기본 연습을 모두 마쳤어요.
          </AppText>
        </>
      ) : (
        <>
          <View style={styles.seal}>
            <AppText size={14} weight={900} color={colors.accentText}>
              미션 완료
            </AppText>
          </View>
          <View style={styles.mark}>
            <AppText size={48} weight={900} color="#fff">
              ✓
            </AppText>
          </View>
          {dailyMission ? (
            <AppText size={30} weight={900} color={colors.ink} align="center" lineHeight={38} style={styles.heading}>
              오늘의 미션 완료!
            </AppText>
          ) : repeated ? (
            <AppText size={30} weight={900} color={colors.ink} align="center" lineHeight={38} style={styles.heading}>
              오늘의 연습을{'\n'}다시 마쳤어요!
            </AppText>
          ) : (
            <AppText size={30} weight={900} color={colors.ink} align="center" lineHeight={38} style={styles.heading}>
              금융 독립 점수가{'\n'}
              <AppText size={30} weight={900} color={colors.yellow}>
                {earnedPoints}점
              </AppText>{' '}
              올랐어요!
            </AppText>
          )}
          <AppText size={15} color={colors.muted} align="center" lineHeight={23} style={styles.name}>
            {dailyMission ? '오늘 새로운 금융 상황을 끝까지 연습했어요.' : missionTitle}
          </AppText>
        </>
      )}

      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <AppText size={15} weight={700} color={colors.muted}>
            현재 점수
          </AppText>
          <View style={styles.scoreValue}>
            <AppText size={28} weight={900} color={colors.yellow}>
              {newScore}
            </AppText>
            <AppText size={15} weight={700} color={colors.muted}>
              {' '}
              / {maxScore}점
            </AppText>
          </View>
        </View>
        <ProgressBar value={pct} height={10} />
      </View>

      <AppText size={14} color={colors.muted} align="center" style={styles.disclaimer}>
        연습 진행도를 나타내는 점수이며 실제 신용점수가 아니에요.
      </AppText>

      <View style={styles.actions}>
        {onSoloRetry ? (
          <Pressable accessibilityRole="button" onPress={onSoloRetry} style={styles.retry}>
            <AppText size={18} weight={850} color={colors.accentText}>
              혼자 해보기
            </AppText>
          </Pressable>
        ) : null}
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <AppText size={18} weight={850} color={colors.accentText}>
              {onSoloRetry ? '한 번 더 따라하기' : '다시 연습하기'}
            </AppText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.cta}>
          <AppText size={18} weight={850} color="#241d08">
            {dailyMission ? '다른 연습도 보기' : achieved ? '금융 독립 화면으로 가기' : '점수판으로 돌아가기'}
          </AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
    backgroundColor: colors.paper,
  },
  seal: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.yellowSoft,
  },
  sealGold: { backgroundColor: '#fff3cd' },
  mark: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: colors.yellow,
  },
  markGold: { backgroundColor: '#e07800' },
  heading: { marginBottom: 8 },
  name: { marginBottom: 22 },
  scoreCard: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.accentSurface,
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
    marginBottom: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreValue: { flexDirection: 'row', alignItems: 'baseline' },
  disclaimer: { marginBottom: 24 },
  actions: { marginTop: 'auto', width: '100%', gap: 10 },
  retry: {
    width: '100%',
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSurface,
  },
  cta: {
    width: '100%',
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.yellow,
  },
});
