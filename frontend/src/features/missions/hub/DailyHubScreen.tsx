import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speak, stop as ttsStop } from '@/lib/speech/tts';
import { colors } from '@/theme/tokens';
import { MAX_SCORE, MISSIONS } from '../data/missions';
import type { Mission, MissionId } from '../data/missions';
import {
  getQuizQuestionById,
  getTodayQuestion,
  isQuizAnswerCorrect,
} from '../data/quiz';
import type { QuizQuestion } from '../data/quiz';
import type { PracticeInitialState } from '@/features/practice/types';
import { RISK_SCENARIOS } from '../scenarios/scenarios';
import { selectFinancialIndependenceState } from '../state';
import type { DailyMission, DailyPracticeRecord, QuizRecord, RiskScenarioId } from '../types';

interface Props {
  completedMissionIds: Set<MissionId>;
  dailyPracticeRecord: DailyPracticeRecord;
  quizRecord: QuizRecord;
  todayMission: DailyMission;
  experiencedScenarios: Set<RiskScenarioId>;
  onQuizComplete: (question: QuizQuestion, answeredIndex: number) => void;
  onStartDailyMission: (mission: DailyMission) => void;
  onStartFreePractice: (mission: Mission, initialState?: PracticeInitialState) => void;
  onReplayScenario: (scenarioId: RiskScenarioId) => void;
  onExit: () => void;
}

/** danbi_jj missions/hub/DailyHubScreen.tsx 이식. */
export function DailyHubScreen({
  completedMissionIds,
  dailyPracticeRecord,
  quizRecord,
  todayMission,
  experiencedScenarios,
  onQuizComplete,
  onStartDailyMission,
  onStartFreePractice,
  onReplayScenario,
  onExit,
}: Props) {
  const referenceDate = new Date();
  const summary = selectFinancialIndependenceState({
    completedMissionIds,
    dailyPracticeRecord,
    quizRecord,
  }, referenceDate);
  const todayQuestion = getTodayQuestion(referenceDate);
  const {
    score,
    achieved,
    todayActivity,
    weeklyActivity,
    completedWeekdayCount,
  } = summary;
  const todayQuizDone = todayActivity.quizCompleted;
  const todayPracticeDone = todayActivity.practiceCompleted;
  const completedQuizAnswer = quizRecord[summary.todayKey];

  const [quizResult, setQuizResult] = useState<{
    question: QuizQuestion;
    answeredIndex: number;
    shouldComplete: boolean;
  } | null>(null);
  const quizResultIsCorrect = quizResult
    ? isQuizAnswerCorrect(quizResult.question, quizResult.answeredIndex)
    : false;

  // 🔊 음성 재생 중 화면을 떠나면(뷰 전환 / MissionMode 언마운트) 즉시 멈춘다.
  useEffect(() => () => ttsStop(), []);

  const handleAnswer = (idx: number) => {
    if (todayQuizDone) return;
    ttsStop();
    setQuizResult({ question: todayQuestion, answeredIndex: idx, shouldComplete: true });
  };

  const closeQuizResult = () => {
    ttsStop();
    setQuizResult(null);
  };

  // 새로 푼 문제(shouldComplete)는 시트를 어떻게 닫든(버튼·배경 탭·뒤로가기)
  // 완료로 기록해, 결과·해설까지 본 답이 유실되지 않게 한다. 다시 보기는 그대로 닫기만 한다.
  const completeQuiz = () => {
    if (quizResult?.shouldComplete) {
      onQuizComplete(quizResult.question, quizResult.answeredIndex);
    }
    closeQuizResult();
  };

  const reviewCompletedQuiz = () => {
    if (!completedQuizAnswer) return;
    ttsStop();
    const question = getQuizQuestionById(completedQuizAnswer.qId) ?? todayQuestion;
    setQuizResult({
      question,
      answeredIndex: completedQuizAnswer.answeredIndex,
      shouldComplete: false,
    });
  };

  const pct = achieved ? 100 : Math.round((score / MAX_SCORE) * 100);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText size={20} weight={900} color={colors.ink}>
          나의 금융 독립
        </AppText>
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.exitBtn}>
          <AppText size={13} weight={700} color={colors.muted}>
            연습 그만하기
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. 점수 카드 */}
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <AppText size={14} weight={700} color={colors.muted}>
              나의 금융 독립 점수
            </AppText>
            {achieved ? (
              <AppText size={16} weight={900} color={colors.yellow}>
                100점 달성!
              </AppText>
            ) : (
              <AppText size={18} weight={700} color={colors.ink}>
                <AppText size={22} weight={900} color={colors.yellow}>
                  {score}
                </AppText>
                /{MAX_SCORE}점
              </AppText>
            )}
          </View>
          <ProgressBar value={pct} height={8} />
          <AppText size={12} color={colors.muted} lineHeight={17} style={styles.mt6}>
            금융 연습을 완료할 때마다 쌓이는 점수예요.
          </AppText>
          <AppText size={11} color="#bbb" style={styles.mb8}>
            실제 신용점수와 관련 없어요
          </AppText>

          <View style={styles.stampsSection}>
            <View style={styles.stampsHeader}>
              <AppText size={12} weight={700} color={colors.muted}>
                이번 주 안심 도장
              </AppText>
              <AppText size={12} weight={800} color={colors.yellow}>
                {completedWeekdayCount}/{weeklyActivity.length}
              </AppText>
            </View>
            <View style={styles.stamps}>
              {weeklyActivity.map(({ date, label, isToday, completed: earned }) => {
                return (
                  <View key={date} style={styles.stamp}>
                    <View
                      style={[
                        styles.stampDot,
                        earned && styles.stampDotEarned,
                        isToday && !earned && styles.stampDotToday,
                      ]}
                    >
                      {earned ? (
                        <AppText size={11} weight={700} color="#fff">
                          ✓
                        </AppText>
                      ) : null}
                    </View>
                    <AppText
                      size={11}
                      weight={700}
                      color={isToday ? colors.yellow : earned ? colors.muted : '#bbb'}
                    >
                      {label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2. 퀴즈 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText size={13} weight={800} color={colors.yellow}>
              오늘의 금융 한 문제
            </AppText>
            {!todayQuizDone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="문제 듣기"
                onPress={() => speak(todayQuestion.question)}
                style={styles.voiceBtn}
              >
                <AppText size={12} weight={700} color={colors.accentText}>
                  🔊 문제 듣기
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {todayQuizDone ? (
            <View style={styles.doneContent}>
              <View style={styles.doneState}>
                <View style={styles.doneCheck}>
                  <AppText size={14} weight={900} color="#fff">
                    ✓
                  </AppText>
                </View>
                <AppText size={15} weight={700} color={colors.muted}>
                  오늘 퀴즈 완료
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={reviewCompletedQuiz}
                style={styles.reviewQuizBtn}
              >
                <AppText size={13} weight={800} color={colors.accentText}>
                  오늘 문제 다시 보기
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              <AppText size={16} weight={700} color={colors.ink} lineHeight={24} style={styles.quizQ}>
                {todayQuestion.question}
              </AppText>
              <View style={styles.quizBtns}>
                {todayQuestion.choices.map((choice, idx) => (
                  <Pressable
                    key={idx}
                    accessibilityRole="button"
                    onPress={() => handleAnswer(idx)}
                    style={[styles.quizBtn, todayQuestion.type === 'ox' && styles.quizBtnOx]}
                  >
                    <AppText
                      size={todayQuestion.type === 'ox' ? 26 : 15}
                      weight={800}
                      color={colors.ink}
                    >
                      {choice}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* 3. 오늘의 미션 카드 — 위험 상황 종류는 시작 전 노출하지 않는다. */}
        <View style={styles.card}>
          <AppText size={13} weight={800} color={colors.yellow}>
            오늘의 미션
          </AppText>
          {todayPracticeDone ? (
            <View style={styles.doneContent}>
              <View style={styles.doneState}>
                <View style={styles.doneCheck}>
                  <AppText size={14} weight={900} color="#fff">
                    ✓
                  </AppText>
                </View>
                <AppText size={15} weight={700} color={colors.muted}>
                  오늘의 미션 완료
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onStartDailyMission(todayMission)}
                style={styles.reviewQuizBtn}
              >
                <AppText size={13} weight={800} color={colors.accentText}>
                  오늘 미션 다시 보기
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.practiceBody}>
              <View style={styles.flex1}>
                <AppText size={16} weight={800} color={colors.ink} lineHeight={21}>
                  오늘 새로운 금융 상황을 연습해요
                </AppText>
                <AppText size={13} color={colors.muted} lineHeight={18} style={styles.mt3}>
                  {todayMission.assistanceMode === 'guided' ? '따라하기' : '혼자 해보기'} ·{' '}
                  {todayMission.inputMethod === 'voice' ? '음성으로 송금' : '직접 입력'}
                </AppText>
              </View>
              <View style={styles.practiceMeta}>
                <AppText size={14} weight={800} color={colors.yellow}>
                  오늘 1회
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onStartDailyMission(todayMission)}
                  style={styles.startBtn}
                >
                  <AppText size={14} weight={800} color="#fff">
                    연습 시작하기
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {todayPracticeDone ? (
          <FreePracticeSection
            experiencedScenarios={experiencedScenarios}
            onStartPractice={onStartFreePractice}
            onReplayScenario={onReplayScenario}
          />
        ) : null}
      </ScrollView>

      {/* 퀴즈 결과 시트 */}
      <Modal
        visible={!!quizResult}
        transparent
        animationType="slide"
        onRequestClose={completeQuiz}
      >
        <Pressable style={styles.sheetBackdrop} onPress={completeQuiz}>
          <Pressable style={styles.resultSheet} onPress={(e) => e.stopPropagation()}>
            {quizResult ? (
              <>
                <View style={styles.verdictRow}>
                  <View
                    style={[
                      styles.verdictBadge,
                      quizResultIsCorrect ? styles.verdictCorrect : styles.verdictWrong,
                    ]}
                  >
                    <AppText
                      size={15}
                      weight={900}
                      color={quizResultIsCorrect ? '#2e7d32' : '#c62828'}
                    >
                      {quizResultIsCorrect ? '✓ 정답이에요!' : '✕ 아쉬워요'}
                    </AppText>
                  </View>
                  <AppText size={14} color={colors.muted}>
                    내 답:{' '}
                    <AppText size={14} weight={800} color={colors.ink}>
                      {quizResult.question.choices[quizResult.answeredIndex]}
                    </AppText>
                  </AppText>
                </View>
                <AppText
                  size={16}
                  weight={700}
                  color={colors.ink}
                  lineHeight={24}
                  style={styles.resultQuestion}
                >
                  {quizResult.question.question}
                </AppText>
                {!quizResultIsCorrect ? (
                  <AppText size={15} weight={800} color={colors.ink}>
                    정답은 {quizResult.question.choices[quizResult.question.correctIndex]}예요.
                  </AppText>
                ) : null}
                <AppText size={16} weight={500} color={colors.ink} lineHeight={26} style={styles.explanation}>
                  {quizResult.question.explanation}
                </AppText>
                <View style={styles.resultVoiceActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="문제 듣기"
                    onPress={() => speak(quizResult.question.question)}
                    style={styles.resultVoiceBtn}
                  >
                    <AppText size={14} weight={800} color={colors.accentText}>
                      🔊 문제 듣기
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="해설 듣기"
                    onPress={() => speak(quizResult.question.explanation)}
                    style={styles.resultVoiceBtn}
                  >
                    <AppText size={14} weight={800} color={colors.accentText}>
                      🔊 해설 듣기
                    </AppText>
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={completeQuiz}
                  style={styles.resultCloseBtn}
                >
                  <AppText size={17} weight={800} color="#fff">
                    {quizResult.shouldComplete ? '완료하고 돌아가기' : '확인했어요'}
                  </AppText>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FreePracticeSection({
  experiencedScenarios,
  onStartPractice,
  onReplayScenario,
}: {
  experiencedScenarios: Set<RiskScenarioId>;
  onStartPractice: (mission: Mission, initialState?: PracticeInitialState) => void;
  onReplayScenario: (scenarioId: RiskScenarioId) => void;
}) {
  const mission = (id: Mission['id']) => MISSIONS.find((item) => item.id === id)!;
  const options: { label: string; mission: Mission; initialState?: PracticeInitialState }[] = [
    { label: '따라하면서 송금하기', mission: mission('guided-transfer') },
    { label: '혼자 송금해보기', mission: mission('solo-transfer') },
    { label: '말로 송금하기', mission: mission('voice-transfer') },
    {
      label: '직접 눌러 송금하기',
      mission: mission('solo-transfer'),
      initialState: { screen: 'practiceRecipient', practiceStyle: 'solo', transferMethod: 'manual' },
    },
  ];

  return (
    <View style={styles.card}>
      <AppText size={13} weight={800} color={colors.yellow}>다른 연습도 해보기</AppText>
      <AppText size={21} weight={900} color={colors.ink} style={styles.freeTitle}>원하는 연습 골라보기</AppText>
      <View style={styles.freeList}>
        {options.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            onPress={() => onStartPractice(option.mission, option.initialState)}
            style={styles.freeButton}
          >
            <AppText size={16} weight={800} color={colors.ink}>{option.label}</AppText>
            <AppText size={22} weight={900} color={colors.muted}>›</AppText>
          </Pressable>
        ))}
      </View>

      <AppText size={17} weight={900} color={colors.ink} style={styles.riskTitle}>위험 상황 연습</AppText>
      <View style={styles.freeList}>
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
              {unlocked ? <AppText size={13} weight={800} color={colors.accentText}>다시 연습하기</AppText> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  flex1: { flex: 1 },
  mt3: { marginTop: 3 },
  mt6: { marginTop: 6 },
  mb8: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  exitBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stampsSection: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  stampsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stamps: { flexDirection: 'row', justifyContent: 'space-between' },
  stamp: { flex: 1, alignItems: 'center', gap: 3 },
  stampDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#e0e4f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampDotEarned: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  stampDotToday: { borderColor: colors.yellow },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voiceBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#d0d8ff',
    borderRadius: 999,
  },
  doneState: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  doneContent: { gap: 4 },
  doneCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizQ: { marginBottom: 12 },
  quizBtns: { flexDirection: 'row', gap: 8 },
  quizBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e4e8f4',
    borderRadius: 14,
    backgroundColor: '#f7f8fc',
  },
  quizBtnOx: { minHeight: 54 },
  reviewQuizBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  practiceBody: { marginTop: 8, flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  practiceMeta: { alignItems: 'flex-end', gap: 6 },
  startBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.yellow,
  },
  freeTitle: { marginTop: 6, marginBottom: 12 },
  freeList: { gap: 8 },
  freeButton: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fffdf8',
  },
  riskTitle: { marginTop: 20, marginBottom: 10 },
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
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  resultSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verdictBadge: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999 },
  verdictCorrect: { backgroundColor: '#e8f5e9' },
  verdictWrong: { backgroundColor: '#fce4ec' },
  resultQuestion: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f5',
  },
  explanation: {
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f7f8fc',
    borderRadius: 12,
  },
  resultVoiceActions: { flexDirection: 'row', gap: 16 },
  resultVoiceBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  resultCloseBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
  },
});
