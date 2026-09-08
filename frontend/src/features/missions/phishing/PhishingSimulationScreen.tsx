import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

type Props = {
  onComplete: () => void;
  onExit: () => void;
};

type Choice = { label: string; correct: boolean; feedback: string };
type Scenario = { tag: string; situation: string; question: string; choices: Choice[] };

const SCENARIOS: Scenario[] = [
  {
    tag: '상황 1 / 3',
    situation:
      '낯선 번호로 전화가 왔습니다. "저는 서울중앙지검 수사관 박준호입니다. 고객님 명의 계좌가 보이스피싱에 사용된 것으로 확인됐습니다. 지금 당장 돈을 안전 계좌로 이체해야 합니다."',
    question: '어떻게 하시겠어요?',
    choices: [
      {
        label: '바로 전화를 끊고 112에 신고한다',
        correct: true,
        feedback:
          '잘하셨어요! 수사기관은 절대 전화로 계좌 이체를 요구하지 않아요. 모르는 번호에서 이런 말이 나오면 즉시 끊고 신고하세요.',
      },
      {
        label: '조금 더 이야기를 들어본다',
        correct: false,
        feedback: '위험해요. 대화가 길어질수록 피해 가능성이 높아져요. 이런 전화는 즉시 끊는 것이 정답이에요.',
      },
      {
        label: '"무슨 계좌로 보내면 되나요?"라고 묻는다',
        correct: false,
        feedback: '100% 보이스피싱이에요. 계좌 정보를 알려주거나 이체하면 돈을 되찾기 어려워요. 절대 하지 마세요.',
      },
    ],
  },
  {
    tag: '상황 2 / 3',
    situation:
      '카카오톡 메시지가 왔습니다. 모르는 번호에서 "엄마, 나야. 폰 액정 깨져서 임시 번호로 연락해. 지금 급하게 50만 원 필요한데 이 계좌로 보내줘."',
    question: '어떻게 하시겠어요?',
    choices: [
      {
        label: '우선 자녀의 원래 번호로 직접 전화해 확인한다',
        correct: true,
        feedback:
          '정확해요! 자녀를 사칭한 문자 피해가 많아요. 돈을 보내기 전에 반드시 원래 번호로 전화해 본인 맞는지 확인하세요.',
      },
      {
        label: '자녀가 맞는 것 같으니 바로 이체한다',
        correct: false,
        feedback: '위험해요. 자녀를 사칭한 메시지는 매우 흔한 보이스피싱 수법이에요. 반드시 전화로 먼저 확인하세요.',
      },
      {
        label: '"어느 은행 계좌야?"라고 물어본다',
        correct: false,
        feedback: '답장을 하면 대화가 계속돼요. 먼저 원래 번호로 전화해서 자녀 본인인지 확인하는 것이 우선이에요.',
      },
    ],
  },
  {
    tag: '상황 3 / 3',
    situation:
      '문자가 왔습니다. "현재 연 15% 대출을 2%로 전환해드립니다. 상담을 위해 아래 앱을 설치하고 신청하세요." 아래에 링크가 있습니다.',
    question: '어떻게 하시겠어요?',
    choices: [
      {
        label: '링크를 클릭하지 않고 문자를 삭제한다',
        correct: true,
        feedback:
          '완벽해요! 문자 링크로 유도하는 대출 광고는 피싱 사이트이거나 악성 앱 설치로 이어질 수 있어요. 클릭하지 말고 삭제하세요.',
      },
      {
        label: '금리가 낮으니 링크를 눌러 상담 신청한다',
        correct: false,
        feedback: '위험해요. 문자 링크로 유도하는 저금리 대출은 대부분 사기예요. 개인정보 탈취나 악성 앱 설치로 이어질 수 있어요.',
      },
      {
        label: '앱을 설치해서 어떤 내용인지 확인한다',
        correct: false,
        feedback: '앱을 설치하는 순간 스마트폰 정보가 모두 노출될 수 있어요. 출처가 불분명한 앱은 절대 설치하지 마세요.',
      },
    ],
  },
];

/** danbi_jj missions/phishing/PhishingSimulationScreen.tsx 이식. */
export function PhishingSimulationScreen({ onComplete, onExit }: Props) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const scenario = SCENARIOS[step];
  const isLast = step === SCENARIOS.length - 1;

  const handleChoice = (index: number) => {
    if (showFeedback) return;
    setSelected(index);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
    setSelected(null);
    setShowFeedback(false);
  };

  const choice = selected !== null ? scenario.choices[selected] : null;

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={onExit} style={styles.exit}>
        <AppText size={14} weight={700} color={colors.muted}>
          연습 그만하기
        </AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.eyebrow}>
          <AppText size={13} weight={900} color={colors.accentText}>
            {scenario.tag}
          </AppText>
        </View>
        <AppText size={24} weight={900} color={colors.ink} lineHeight={30} letterSpacing={-1} style={styles.title}>
          {'이런 상황이라면\n어떻게 할까요?'}
        </AppText>

        <View style={styles.situationCard}>
          <View style={styles.situationTag}>
            <AppText size={12} weight={900} color="#fff">
              상황
            </AppText>
          </View>
          <AppText size={15} color={colors.ink} lineHeight={25}>
            {scenario.situation}
          </AppText>
        </View>

        <AppText size={17} weight={900} color={colors.ink} style={styles.question}>
          {scenario.question}
        </AppText>

        <View style={styles.choiceList}>
          {scenario.choices.map((c, i) => {
            const isSel = showFeedback && selected === i;
            const isDim = showFeedback && !c.correct && selected !== i;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                disabled={showFeedback}
                onPress={() => handleChoice(i)}
                style={[
                  styles.choiceBtn,
                  isSel && c.correct && styles.choiceCorrect,
                  isSel && !c.correct && styles.choiceWrong,
                  isDim && styles.choiceDim,
                ]}
              >
                <AppText
                  size={15}
                  weight={isSel ? 900 : 750}
                  lineHeight={21}
                  color={isSel && c.correct ? '#1a5c38' : isSel && !c.correct ? '#7a1c1c' : colors.ink}
                >
                  {c.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {showFeedback && choice ? (
          <View style={[styles.feedback, choice.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={[styles.feedbackIcon, { backgroundColor: choice.correct ? '#4caf7a' : '#d9534f' }]}>
              <AppText size={14} weight={900} color="#fff">
                {choice.correct ? '✓' : '!'}
              </AppText>
            </View>
            <AppText size={14} color={colors.ink} lineHeight={22} style={styles.flex1}>
              {choice.feedback}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {showFeedback ? (
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={handleNext} style={styles.cta}>
            <AppText size={18} weight={850} color="#241d08">
              {isLast ? '상황 연습 완료하기' : '다음 상황 보기'}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  flex1: { flex: 1 },
  exit: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.yellowSoft,
    marginBottom: 8,
  },
  title: { marginTop: 8, marginBottom: 14 },
  situationCard: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
    borderRadius: 18,
    backgroundColor: colors.accentSurface,
    marginBottom: 16,
  },
  situationTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.yellow,
    marginBottom: 8,
  },
  question: { marginBottom: 12, marginHorizontal: 4 },
  choiceList: { gap: 9, marginBottom: 14 },
  choiceBtn: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  choiceCorrect: { borderColor: '#4caf7a', backgroundColor: '#e8f9f0' },
  choiceWrong: { borderColor: '#d9534f', backgroundColor: '#fff5f5' },
  choiceDim: { opacity: 0.42 },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  feedbackCorrect: { backgroundColor: '#e8f9f0', borderWidth: 1.5, borderColor: '#4caf7a' },
  feedbackWrong: { backgroundColor: '#fff5f5', borderWidth: 1.5, borderColor: '#d9534f' },
  feedbackIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.97)',
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
