import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { colors } from '@/theme/tokens';
import { MISSIONS } from '../data/missions';
import type { Mission } from '../data/missions';
import type { PracticeInitialState } from '@/features/practice/types';

interface Props {
  onStartPractice: (mission: Mission, initialState?: PracticeInitialState) => void;
  onBack: () => void;
}

/**
 * "원하는 연습 골라보기" — 나의 금융독립 메인에서 분리한 자유 연습 선택 화면.
 * MVP에서는 아래 3가지만 노출한다.
 *   🌱 차근차근 따라하기 (guided + 직접 입력)
 *   🎤 말로 송금해보기   (voice / STT)
 *   💪 혼자 송금해보기   (solo + 직접 입력)
 * "직접 입력하기"는 별도 카드로 두지 않고 위 연습들의 입력 방식으로 흡수한다.
 * 위험 상황(보이스피싱) 연습은 코드는 유지하되 이 화면에서는 노출하지 않는다.
 */
export function PracticePickerScreen({ onStartPractice, onBack }: Props) {
  const options: Mission[] = ['guided-transfer', 'voice-transfer', 'solo-transfer']
    .map((id) => MISSIONS.find((item) => item.id === id))
    .filter((item): item is Mission => Boolean(item));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText size={22} weight={900} color={colors.ink}>원하는 연습 골라보기</AppText>
        <AppText size={16} color={colors.muted} lineHeight={23}>
          연습하고 싶은 방법을 골라 눌러보세요.
        </AppText>

        <View style={styles.list}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => onStartPractice(option)}
              style={styles.optionCard}
            >
              <AppText size={26} style={styles.optionIcon}>
                {option.icon}
              </AppText>
              <View style={styles.optionText}>
                <AppText size={18} weight={800} color={colors.ink}>
                  {option.title}
                </AppText>
                <AppText size={15} color={colors.muted} lineHeight={21} style={styles.mt3}>
                  {option.description}
                </AppText>
              </View>
              <AppText size={24} weight={900} color={colors.muted}>›</AppText>
            </Pressable>
          ))}
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
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28, gap: 8 },
  list: { gap: 12, marginTop: 10 },
  optionCard: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fffdf8',
  },
  optionIcon: { width: 30, textAlign: 'center' },
  optionText: { flex: 1 },
});
