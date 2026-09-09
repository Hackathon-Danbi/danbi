import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';
import type { RiskScenario } from './types';

type Props = {
  scenario: RiskScenario;
  detectedRisk: boolean;
  onComplete: () => void;
};

export function ScenarioFeedbackScreen({ scenario, detectedRisk, onComplete }: Props) {
  const [practiceResponse, setPracticeResponse] = useState(false);

  if (practiceResponse) {
    return (
      <View style={styles.actionPage}>
        <View style={styles.actionMark}><AppText size={36}>✋</AppText></View>
        <AppText size={29} weight={900} color={colors.ink} align="center" lineHeight={38}>
          이런 상황에서는{`\n`}어떻게 해야 할까요?
        </AppText>
        <AppText size={17} color={colors.muted} align="center" lineHeight={26}>
          먼저 돈을 보내지 말고{`\n`}연락을 끊은 뒤 공식 번호로 확인해요.
        </AppText>
        <Pressable accessibilityRole="button" onPress={onComplete} style={styles.actionButton}>
          <AppText size={20} weight={900} color="#fff">
            {scenario.contactType === 'call' ? '전화 끊고 송금 멈추기' : '메시지 닫고 송금 멈추기'}
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.mark, detectedRisk ? styles.markGood : styles.markLearn]}>
        <AppText size={42}>{detectedRisk ? '✓' : '!'}</AppText>
      </View>
      <AppText size={30} weight={900} color={colors.ink} align="center" lineHeight={39}>
        {detectedRisk ? '잘하셨어요!\n송금을 멈췄어요.' : '괜찮아요.\n연습이라 안전해요.'}
      </AppText>
      <AppText size={17} color={colors.muted} align="center" lineHeight={26}>
        {detectedRisk
          ? '이상한 점을 발견하고 스스로 멈춘 것이 가장 중요한 안전 행동이에요.'
          : '방금 상황은 보이스피싱을 연습하기 위한 상황이었어요.'}
      </AppText>

      <View style={styles.signalCard}>
        <AppText size={21} weight={900} color={colors.ink}>어떤 점이 위험했을까요?</AppText>
        {scenario.riskSignals.map((signal) => (
          <View key={signal} style={styles.signalRow}>
            <AppText size={17} weight={900} color="#31824d">✓</AppText>
            <AppText size={17} weight={650} color={colors.ink} lineHeight={25} style={styles.flex1}>{signal}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.learningCard}>
        <AppText size={16} weight={900} color="#7a5500" lineHeight={24}>{scenario.learningMessage}</AppText>
      </View>

      <Pressable accessibilityRole="button" onPress={() => setPracticeResponse(true)} style={styles.primary}>
        <AppText size={18} weight={900} color="#fff">안전한 행동 연습하기</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', padding: 22, paddingVertical: 30, gap: 16, backgroundColor: colors.paper },
  mark: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  markGood: { backgroundColor: '#e8f9f0' },
  markLearn: { backgroundColor: '#fff0ed' },
  signalCard: { alignSelf: 'stretch', padding: 18, gap: 14, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff' },
  signalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  learningCard: { alignSelf: 'stretch', padding: 16, borderRadius: 16, backgroundColor: colors.yellowSoft },
  primary: { alignSelf: 'stretch', minHeight: 62, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: colors.yellow },
  actionPage: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 18, backgroundColor: colors.paper },
  actionMark: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.yellowSoft },
  actionButton: { alignSelf: 'stretch', minHeight: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24, backgroundColor: '#31824d' },
});
