import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speak, stop as ttsStop } from '@/lib/speech/tts';
import { colors } from '@/theme/tokens';
import { MAX_SCORE, MISSIONS, calcScore } from '../data/missions';
import type { Mission, MissionId } from '../data/missions';
import { getTodayQuestion, getTodayString } from '../data/quiz';
import type { QuizQuestion } from '../data/quiz';

export type DailyPracticeRecord = Record<string, MissionId>;
export type QuizRecord = Record<string, { qId: number; answeredIndex: number }>;

function getWeekdays() {
  const today = new Date();
  const todayStr = getTodayString();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date, label: ['월', '화', '수', '목', '금', '토', '일'][i], isToday: date === todayStr };
  });
}

function getTodayMission(completedIds: Set<MissionId>, achieved: boolean): Mission {
  if (achieved) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const epoch = new Date('2024-01-01');
    const idx = Math.floor((today.getTime() - epoch.getTime()) / 86400000);
    return MISSIONS[((idx % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
  }
  return MISSIONS.find((m) => !completedIds.has(m.id)) ?? MISSIONS[MISSIONS.length - 1];
}

interface Props {
  completedMissionIds: Set<MissionId>;
  dailyPracticeRecord: DailyPracticeRecord;
  quizRecord: QuizRecord;
  onQuizAnswer: (question: QuizQuestion, answeredIndex: number) => void;
  onStartMission: (mission: Mission) => void;
  onExit: () => void;
}

/** danbi_jj missions/hub/DailyHubScreen.tsx 이식. */
export function DailyHubScreen({
  completedMissionIds,
  dailyPracticeRecord,
  quizRecord,
  onQuizAnswer,
  onStartMission,
  onExit,
}: Props) {
  const today = getTodayString();
  const score = calcScore(completedMissionIds);
  const achieved = score >= MAX_SCORE;
  const todayMission = getTodayMission(completedMissionIds, achieved);
  const todayQuestion = getTodayQuestion();
  const todayQuizDone = today in quizRecord;
  const todayPracticeDone = today in dailyPracticeRecord;
  const weekdays = getWeekdays();
  const hasStamp = (date: string) => date in quizRecord && date in dailyPracticeRecord;
  const earnedCount = weekdays.filter(({ date }) => hasStamp(date)).length;

  const [pendingAnswer, setPendingAnswer] = useState<{ answeredIndex: number; isCorrect: boolean } | null>(null);

  // 🔊 음성 재생 중 화면을 떠나면(뷰 전환 / MissionMode 언마운트) 즉시 멈춘다.
  useEffect(() => () => ttsStop(), []);

  const handleAnswer = (idx: number) => {
    if (todayQuizDone) return;
    setPendingAnswer({ answeredIndex: idx, isCorrect: idx === todayQuestion.correctIndex });
    onQuizAnswer(todayQuestion, idx);
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
                {earnedCount}/{weekdays.length}
              </AppText>
            </View>
            <View style={styles.stamps}>
              {weekdays.map(({ date, label, isToday }) => {
                const earned = hasStamp(date);
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
                accessibilityLabel="음성으로 듣기"
                onPress={() => speak(todayQuestion.question)}
                style={styles.voiceBtn}
              >
                <AppText size={12} weight={700} color={colors.accentText}>
                  🔊 음성
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {todayQuizDone ? (
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

        {/* 3. 연습 카드 */}
        <View style={styles.card}>
          <AppText size={13} weight={800} color={colors.yellow}>
            {achieved ? '오늘의 안전 복습' : '오늘의 금융 연습'}
          </AppText>
          {todayPracticeDone ? (
            <View style={styles.doneState}>
              <View style={styles.doneCheck}>
                <AppText size={14} weight={900} color="#fff">
                  ✓
                </AppText>
              </View>
              <AppText size={15} weight={700} color={colors.muted}>
                오늘의 연습 완료
              </AppText>
            </View>
          ) : (
            <View style={styles.practiceBody}>
              <View style={styles.flex1}>
                <AppText size={16} weight={800} color={colors.ink} lineHeight={21}>
                  {todayMission.title}
                </AppText>
                <AppText size={13} color={colors.muted} lineHeight={18} style={styles.mt3}>
                  {todayMission.description}
                </AppText>
              </View>
              <View style={styles.practiceMeta}>
                <AppText size={14} weight={800} color={colors.yellow}>
                  +{todayMission.points}점
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onStartMission(todayMission)}
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
      </ScrollView>

      {/* 퀴즈 결과 시트 */}
      <Modal
        visible={!!pendingAnswer}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingAnswer(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setPendingAnswer(null)}>
          <Pressable style={styles.resultSheet} onPress={(e) => e.stopPropagation()}>
            {pendingAnswer ? (
              <>
                <View style={styles.verdictRow}>
                  <View
                    style={[
                      styles.verdictBadge,
                      pendingAnswer.isCorrect ? styles.verdictCorrect : styles.verdictWrong,
                    ]}
                  >
                    <AppText
                      size={15}
                      weight={900}
                      color={pendingAnswer.isCorrect ? '#2e7d32' : '#c62828'}
                    >
                      {pendingAnswer.isCorrect ? '정답!' : '오답'}
                    </AppText>
                  </View>
                  <AppText size={14} color={colors.muted}>
                    내 답:{' '}
                    <AppText size={14} weight={800} color={colors.ink}>
                      {todayQuestion.choices[pendingAnswer.answeredIndex]}
                    </AppText>
                  </AppText>
                </View>
                <AppText size={16} weight={500} color={colors.ink} lineHeight={26} style={styles.explanation}>
                  {todayQuestion.explanation}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPendingAnswer(null)}
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
  practiceBody: { marginTop: 8, flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  practiceMeta: { alignItems: 'flex-end', gap: 6 },
  startBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.yellow,
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
  explanation: {
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f7f8fc',
    borderRadius: 12,
  },
  resultCloseBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
  },
});
