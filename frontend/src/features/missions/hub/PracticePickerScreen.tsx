import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';
import { MISSIONS } from '../data/missions';
import type { Mission } from '../data/missions';
import type { PracticeInitialState } from '@/features/practice/types';
import { RISK_SCENARIOS } from '../scenarios/scenarios';
import type { RiskScenarioId } from '../types';

interface Props {
  experiencedScenarios: Set<RiskScenarioId>;
  onStartPractice: (mission: Mission, initialState?: PracticeInitialState) => void;
  onReplayScenario: (scenarioId: RiskScenarioId) => void;
  onBack: () => void;
}

type PracticeOption = {
  mission: Mission;
  label?: string;
  description?: string;
  initialState?: PracticeInitialState;
};

/**
 * "원하는 연습 골라보기" — 나의 금융독립 메인에서 분리한 자유 연습 선택 화면.
 * 표시 항목은 기존 MISSIONS / RISK_SCENARIOS 데이터를 그대로 재사용하며,
 * 카드를 누르면 기존 연습 진입 콜백(onStartPractice / onReplayScenario)을 호출한다.
 */
export function PracticePickerScreen({
  experiencedScenarios,
  onStartPractice,
  onReplayScenario,
  onBack,
}: Props) {
  const mission = (id: Mission['id']) => MISSIONS.find((item) => item.id === id)!;
  const options: PracticeOption[] = [
    { mission: mission('guided-transfer') },
    { mission: mission('solo-transfer') },
    { mission: mission('voice-transfer') },
    {
      mission: mission('solo-transfer'),
      label: '직접 눌러 송금하기',
      description: mission('solo-transfer').description,
      initialState: { screen: 'practiceRecipient', practiceStyle: 'solo', transferMethod: 'manual' },
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={onBack}
          style={styles.backBtn}
        >
          <AppText size={17} weight={800} color={colors.ink}>‹ 연습 선택</AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText size={22} weight={900} color={colors.ink}>원하는 연습 골라보기</AppText>
        <AppText size={14} color={colors.muted} lineHeight={20}>
          연습하고 싶은 단계를 골라 눌러보세요.
        </AppText>

        <View style={styles.list}>
          {options.map((option) => (
            <Pressable
              key={option.label ?? option.mission.id}
              accessibilityRole="button"
              onPress={() => onStartPractice(option.mission, option.initialState)}
              style={styles.optionCard}
            >
              <AppText size={22} weight={900} color={colors.accentText} style={styles.optionIcon}>
                {option.mission.icon}
              </AppText>
              <View style={styles.optionText}>
                <AppText size={17} weight={800} color={colors.ink}>
                  {option.label ?? option.mission.title}
                </AppText>
                {option.description ?? option.mission.description ? (
                  <AppText size={13} color={colors.muted} lineHeight={18} style={styles.mt3}>
                    {option.description ?? option.mission.description}
                  </AppText>
                ) : null}
              </View>
              <AppText size={24} weight={900} color={colors.muted}>›</AppText>
            </Pressable>
          ))}
        </View>

        <AppText size={17} weight={900} color={colors.ink} style={styles.riskTitle}>
          위험 상황 연습
        </AppText>
        <View style={styles.list}>
          {RISK_SCENARIOS.map((scenario) => {
            const unlocked = experiencedScenarios.has(scenario.id);
            return (
              <Pressable
                key={scenario.id}
                accessibilityRole={unlocked ? 'button' : undefined}
                disabled={!unlocked}
                onPress={() => onReplayScenario(scenario.id)}
                style={[styles.riskButton, !unlocked && styles.lockedButton]}
              >
                <AppText size={16} weight={800} color={unlocked ? colors.ink : colors.muted}>
                  {unlocked ? `🔓 ${scenario.replayTitle}` : '🔒 새로운 상황'}
                </AppText>
                {unlocked ? (
                  <AppText size={13} weight={800} color={colors.accentText}>다시 연습하기</AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  mt3: { marginTop: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  backBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28, gap: 8 },
  list: { gap: 10, marginTop: 6 },
  optionCard: {
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fffdf8',
  },
  optionIcon: { width: 26, textAlign: 'center' },
  optionText: { flex: 1 },
  riskTitle: { marginTop: 22 },
  riskButton: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSurface,
  },
  lockedButton: { borderColor: colors.line, backgroundColor: '#f5f3ee' },
});
