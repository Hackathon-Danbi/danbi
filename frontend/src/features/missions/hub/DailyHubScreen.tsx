import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speak, stop as ttsStop } from '@/lib/speech/tts';
import { savedRecipients } from '@/features/practice/data/recipients.mock';
import { colors } from '@/theme/tokens';
import { MAX_SCORE } from '../data/missions';
import type { MissionId } from '../data/missions';
import {
  getQuizQuestionById,
  getTodayQuestion,
  isQuizAnswerCorrect,
} from '../data/quiz';
import type { QuizQuestion } from '../data/quiz';
import { selectFinancialIndependenceState } from '../state';
import type { DailyMission, DailyPracticeRecord, QuizRecord } from '../types';
import {
  isReviewableTransferStep,
  TRANSFER_DIFFICULTY_COPY,
} from '../transferDifficulty';
import type { TransferDifficulty } from '../transferDifficulty';
import type { QuizAnswerResult, TodayDailyActivity } from '@/api';

/**
 * "금융 연습" 화면 전용 강조색. 전역 노란색 토큰(colors.yellow 계열) 대신
 * 이 화면만 파란색(#5379EE)으로 쓴다.
 */
const ACCENT = '#5379EE';
const ACCENT_TEXT = '#2C40A8';
const ACCENT_BORDER = '#3A5AD4';
const ACCENT_SOFT = '#E7EDFD';
const ACCENT_SURFACE = '#F4F7FF';

/** 오늘의 송금 연습 카드 문구. 기존 practice flow 에 전달할 값(받는 사람·금액·방식)만 사용한다. */
function describeTodayMission(mission: DailyMission): { title: string; description: string } {
  const recipientName = mission.recipientType === 'saved'
    ? savedRecipients.find((recipient) => recipient.id === mission.recipientId)?.name ?? '이영희'
    : '박지영';
  const amountLabel = `${mission.amount.toLocaleString('ko-KR')}원`;
  if (mission.inputMethod === 'voice') {
    return {
      title: `${recipientName}님에게 ${amountLabel}을 말로 보내보세요.`,
      description: '받는 사람과 금액을 말해서 보내요.',
    };
  }
  if (mission.assistanceMode === 'guided') {
    return {
      title: `${recipientName}님에게 ${amountLabel}을 차근차근 보내보세요.`,
      description: '화면 안내를 따라 한 단계씩 보내요.',
    };
  }
  return {
    title: `${recipientName}님에게 ${amountLabel}을 혼자 보내보세요.`,
    description: '안내 없이 실제처럼 보내요.',
  };
}

interface Props {
  completedMissionIds: Set<MissionId>;
  dailyPracticeRecord: DailyPracticeRecord;
  quizRecord: QuizRecord;
  todayMission: DailyMission;
  transferDifficulties: TransferDifficulty[];
  apiDailyActivity?: TodayDailyActivity | null;
  apiError?: string;
  onQuizComplete: (question: QuizQuestion, answeredIndex: number) => Promise<QuizAnswerResult | void>;
  onStartDailyMission: (mission: DailyMission) => void;
  onOpenPracticePicker: () => void;
  onStartDifficultyReview: (difficulty: TransferDifficulty) => void;
  onExit: () => void;
}

/** danbi_jj missions/hub/DailyHubScreen.tsx 이식. */
export function DailyHubScreen({
  completedMissionIds,
  dailyPracticeRecord,
  quizRecord,
  todayMission,
  transferDifficulties,
  onQuizComplete,
  onStartDailyMission,
  onOpenPracticePicker,
  onStartDifficultyReview,
  onExit,
  apiDailyActivity,
  apiError,
}: Props) {
  const referenceDate = new Date();
  const summary = selectFinancialIndependenceState({
    completedMissionIds,
    dailyPracticeRecord,
    quizRecord,
  }, referenceDate);
  const localTodayQuestion = getTodayQuestion(referenceDate);
  const todayQuestion: QuizQuestion = apiDailyActivity ? {
    id: apiDailyActivity.question.questionId,
    type: 'ox',
    question: apiDailyActivity.question.questionText,
    choices: ['O', 'X'],
    // 실제 정답과 해설은 답안 제출 응답으로 교체한다.
    correctIndex: 0,
    explanation: '',
    category: '금융 상식',
  } : localTodayQuestion;
  const {
    score,
    achieved,
    todayActivity,
    weeklyActivity,
    completedWeekdayCount,
  } = summary;
  const todayQuizDone = apiDailyActivity
    ? apiDailyActivity.question.selectedAnswer !== null
    : todayActivity.quizCompleted;
  const todayPracticeDone = apiDailyActivity?.practiceCompleted ?? todayActivity.practiceCompleted;
  const completedQuizAnswer = quizRecord[summary.todayKey];
  // 우선순위: 미완료 → 최근 occurredAt → 같은 조건이면 가장 최근에 전달된 항목.
  // reverse() 로 안정 정렬의 동점 처리 순서를 "나중에 전달된 항목이 먼저"로 맞춘다.
  const reviewDifficulty = [...transferDifficulties]
    .reverse()
    .filter((difficulty) => isReviewableTransferStep(difficulty.step))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || b.occurredAt.localeCompare(a.occurredAt))[0];

  const [quizResult, setQuizResult] = useState<{
    question: QuizQuestion;
    answeredIndex: number;
  } | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState('');
  const quizResultIsCorrect = quizResult
    ? isQuizAnswerCorrect(quizResult.question, quizResult.answeredIndex)
    : false;

  // 🔊 음성 재생 중 화면을 떠나면(뷰 전환 / MissionMode 언마운트) 즉시 멈춘다.
  useEffect(() => () => ttsStop(), []);

  const handleAnswer = async (idx: number) => {
    if (todayQuizDone) return;
    ttsStop();
    setQuizSubmitting(true);
    setQuizError('');
    try {
      const apiResult = await onQuizComplete(todayQuestion, idx);
      const resolvedQuestion = apiResult ? {
        ...todayQuestion,
        correctIndex: (apiResult.correctAnswer ? 0 : 1) as 0 | 1,
        explanation: apiResult.explanation,
      } : todayQuestion;
      setQuizResult({ question: resolvedQuestion, answeredIndex: idx });
    } catch (cause) {
      setQuizError(cause instanceof Error ? cause.message : '답안을 제출하지 못했어요. 다시 시도해주세요.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const closeQuizResult = () => {
    ttsStop();
    setQuizResult(null);
  };

  const completeQuiz = () => {
    closeQuizResult();
  };

  const reviewCompletedQuiz = () => {
    if (!completedQuizAnswer) return;
    ttsStop();
    const question = getQuizQuestionById(completedQuizAnswer.qId) ?? todayQuestion;
    setQuizResult({
      question,
      answeredIndex: completedQuizAnswer.answeredIndex,
    });
  };

  const pct = achieved ? 100 : Math.round((score / MAX_SCORE) * 100);
  const todayPractice = describeTodayMission(todayMission);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText size={20} weight={900} color={colors.ink}>
          금융 연습
        </AppText>
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.exitBtn}>
          <AppText size={15} weight={700} color={colors.muted}>
            연습 그만하기
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {apiError || quizError ? (
          <View style={styles.apiError}>
            <AppText size={15} weight={700} color="#a7372b" lineHeight={21}>
              {quizError || apiError}
            </AppText>
          </View>
        ) : null}
        {/* 1. 점수 카드 */}
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <AppText size={14} weight={700} color={colors.muted}>
              금융 연습 점수
            </AppText>
            {achieved ? (
              <AppText size={16} weight={900} color={ACCENT}>
                100점 달성!
              </AppText>
            ) : (
              <AppText size={18} weight={700} color={colors.ink}>
                <AppText size={22} weight={900} color={ACCENT}>
                  {score}
                </AppText>
                /{MAX_SCORE}점
              </AppText>
            )}
          </View>
          <ProgressBar value={pct} height={8} />
          <AppText size={14} color={colors.muted} lineHeight={20} style={styles.scoreNote}>
            금융 연습을 완료할 때마다 쌓여요 · 실제 신용점수와는 무관해요.
          </AppText>

          <View style={styles.stampsSection}>
            <View style={styles.stampsHeader}>
              <AppText size={14} weight={700} color={colors.muted}>
                이번 주 안심 도장
              </AppText>
              <AppText size={14} weight={800} color={ACCENT}>
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
                      color={isToday ? ACCENT : earned ? colors.muted : '#bbb'}
                    >
                      {label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2. 맞춤 복습 카드 */}
        {reviewDifficulty ? (
          <DifficultyReviewCard
            difficulty={reviewDifficulty}
            onStart={() => onStartDifficultyReview(reviewDifficulty)}
          />
        ) : null}

        {/* 3. 퀴즈 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText size={15} weight={800} color={ACCENT}>
              오늘의 금융 O/X 퀴즈
            </AppText>
            {!todayQuizDone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="문제 듣기"
                onPress={() => speak(todayQuestion.question)}
                style={styles.voiceBtn}
              >
                <AppText size={14} weight={700} color={ACCENT_TEXT}>
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
              {completedQuizAnswer ? <Pressable
                accessibilityRole="button"
                onPress={reviewCompletedQuiz}
                style={styles.reviewQuizBtn}
              >
                <AppText size={15} weight={800} color={ACCENT_TEXT}>
                  오늘 문제 다시 보기
                </AppText>
              </Pressable> : null}
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
                    accessibilityLabel={idx === 0 ? 'O 맞아요' : 'X 아니에요'}
                    disabled={quizSubmitting}
                    onPress={() => void handleAnswer(idx)}
                    style={[
                      styles.quizBtn,
                      styles.quizBtnOx,
                      quizSubmitting && styles.quizBtnDisabled,
                    ]}
                  >
                    <AppText size={32} weight={900} color={colors.ink}>
                      {choice}
                    </AppText>
                    <AppText size={15} weight={800} color={colors.muted}>
                      {idx === 0 ? '맞아요' : '아니에요'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* 4. 오늘의 송금 연습 — 기존 practice flow 를 조합한 하루 1개 미션. */}
        <View style={styles.card}>
          <AppText size={15} weight={800} color={ACCENT}>
            오늘의 송금 연습
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
                  오늘의 송금 연습 완료
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onStartDailyMission(todayMission)}
                style={styles.reviewQuizBtn}
              >
                <AppText size={15} weight={800} color={ACCENT_TEXT}>
                  오늘 연습 다시 보기
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              <AppText size={17} weight={800} color={colors.ink} lineHeight={24} style={styles.mt6}>
                {apiDailyActivity?.mission.title ?? todayPractice.title}
              </AppText>
              <AppText size={14} color={colors.muted} lineHeight={20} style={styles.mt3}>
                {apiDailyActivity?.mission.description ?? todayPractice.description}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => onStartDailyMission(todayMission)}
                style={styles.todayStartBtn}
              >
                <AppText size={17} weight={800} color="#fff">
                  오늘의 연습 시작
                </AppText>
              </Pressable>
            </>
          )}
        </View>

        {/* 5. 다른 연습 선택 */}
        <Pressable
          accessibilityRole="button"
          onPress={onOpenPracticePicker}
          style={styles.pickerButton}
        >
          <View style={styles.flex1}>
            <AppText size={15} weight={800} color={ACCENT}>다른 연습도 해보기</AppText>
            <AppText size={18} weight={900} color={colors.ink} style={styles.mt3}>
              원하는 연습 골라보기
            </AppText>
          </View>
          <AppText size={24} weight={900} color={colors.muted}>›</AppText>
        </Pressable>
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
                      {quizResultIsCorrect ? '✓ 정답이에요!' : '✕ 다시 알아볼까요?'}
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
                    <AppText size={14} weight={800} color={ACCENT_TEXT}>
                      🔊 문제 듣기
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="해설 듣기"
                    onPress={() => speak(quizResult.question.explanation)}
                    style={styles.resultVoiceBtn}
                  >
                    <AppText size={14} weight={800} color={ACCENT_TEXT}>
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
                    확인했어요
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

function DifficultyReviewCard({
  difficulty,
  onStart,
}: {
  difficulty: TransferDifficulty;
  onStart: () => void;
}) {
  const copy = TRANSFER_DIFFICULTY_COPY[difficulty.step];
  return (
    <View style={[styles.card, styles.difficultyCard]}>
      <AppText size={15} weight={800} color={ACCENT}>내가 어려웠던 부분 다시하기</AppText>
      <AppText size={14} color={colors.muted} lineHeight={21} style={styles.difficultyLead}>
        지난 송금에서 ‘{copy.title}’ 단계가 어려웠어요.
      </AppText>
      <View style={styles.difficultyBody}>
        <View style={styles.flex1}>
          <AppText size={19} weight={900} color={colors.ink}>{copy.title}</AppText>
          {difficulty.completed ? (
            <AppText size={14} weight={850} color={ACCENT_TEXT} style={styles.difficultyDone}>
              연습 완료 ✓
            </AppText>
          ) : (
            <AppText size={14} color={colors.muted} lineHeight={21} style={styles.mt6}>
              {copy.description}
            </AppText>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={[styles.reviewStartBtn, difficulty.completed && styles.reviewStartBtnDone]}
        >
          <AppText size={14} weight={850} color={difficulty.completed ? ACCENT_TEXT : '#fff'}>
            다시 연습하기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  flex1: { flex: 1 },
  mt3: { marginTop: 3 },
  mt6: { marginTop: 6 },
  scoreNote: { marginTop: 6, marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  exitBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 8 },
  apiError: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff0ed',
  },
  card: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  stampDotEarned: { backgroundColor: ACCENT, borderColor: ACCENT },
  stampDotToday: { borderColor: ACCENT },
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
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizQ: { marginBottom: 10 },
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
  quizBtnOx: { minHeight: 84, gap: 2 },
  quizBtnDisabled: { opacity: 0.45 },
  reviewQuizBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  todayStartBtn: {
    marginTop: 14,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: ACCENT,
  },
  difficultyCard: { backgroundColor: ACCENT_SURFACE },
  difficultyLead: { marginTop: 6 },
  difficultyBody: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  difficultyDone: { marginTop: 10 },
  reviewStartBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ACCENT,
  },
  reviewStartBtnDone: {
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    backgroundColor: ACCENT_SOFT,
  },
  pickerButton: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fffdf8',
  },
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
    backgroundColor: ACCENT,
    alignItems: 'center',
  },
});
