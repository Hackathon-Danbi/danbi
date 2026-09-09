import { MAX_SCORE, MISSIONS } from './data/missions';
import type { Mission, MissionId } from './data/missions';
import type {
  DailyPracticeRecord,
  FinancialIndependenceState,
  QuizAnswerRecord,
  QuizRecord,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;
const ROTATION_EPOCH = new Date(2024, 0, 1);

export type DailyActivityStatus = {
  quizCompleted: boolean;
  practiceCompleted: boolean;
  completed: boolean;
};

export type WeeklyActivityDay = {
  date: string;
  label: (typeof WEEKDAY_LABELS)[number];
  isToday: boolean;
  completed: boolean;
};

/** 기기의 현지 달력 날짜를 AsyncStorage에서 사용하는 YYYY-MM-DD 키로 변환한다. */
export function getLocalDateKey(date: Date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** DST와 시각 차이를 배제하고 두 현지 달력 날짜 사이의 일수만 계산한다. */
export function getLocalCalendarDayIndex(date: Date, epoch: Date = ROTATION_EPOCH): number {
  const utcDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcEpoch = Date.UTC(epoch.getFullYear(), epoch.getMonth(), epoch.getDate());
  return Math.floor((utcDay - utcEpoch) / DAY_MS);
}

export function getDailyActivityStatus(
  quizRecord: QuizRecord,
  practiceRecord: DailyPracticeRecord,
  dateKey: string = getLocalDateKey(),
): DailyActivityStatus {
  const quizCompleted = dateKey in quizRecord;
  const practiceCompleted = dateKey in practiceRecord;
  return {
    quizCompleted,
    practiceCompleted,
    completed: quizCompleted && practiceCompleted,
  };
}

export function getWeeklyActivity(
  quizRecord: QuizRecord,
  practiceRecord: DailyPracticeRecord,
  referenceDate: Date = new Date(),
): WeeklyActivityDay[] {
  const todayKey = getLocalDateKey(referenceDate);
  const dayOfWeek = referenceDate.getDay();
  const mondayOffset = -(dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + mondayOffset,
  );

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const dateKey = getLocalDateKey(date);
    return {
      date: dateKey,
      label,
      isToday: dateKey === todayKey,
      completed: getDailyActivityStatus(quizRecord, practiceRecord, dateKey).completed,
    };
  });
}

/** 완료 미션 ID만 점수 원본으로 사용하며, 중복 ID와 최대 점수 초과를 방지한다. */
export function calculateFinancialScore(completedMissionIds: Iterable<MissionId>, reviewBonus = 0): number {
  const completed = new Set(completedMissionIds);
  const score = MISSIONS
    .filter((mission) => completed.has(mission.id))
    .reduce((sum, mission) => sum + mission.points, 0);
  return Math.min(score + Math.max(0, reviewBonus), MAX_SCORE);
}

export function completeMission(
  completedMissionIds: Set<MissionId>,
  mission: Mission,
): { completedMissionIds: Set<MissionId>; earnedPoints: number } {
  if (completedMissionIds.has(mission.id)) {
    return { completedMissionIds, earnedPoints: 0 };
  }
  return {
    completedMissionIds: new Set([...completedMissionIds, mission.id]),
    earnedPoints: mission.points,
  };
}

export function completeQuizForDate(
  record: QuizRecord,
  dateKey: string,
  answer: QuizAnswerRecord,
): QuizRecord {
  if (dateKey in record) return record;
  return { ...record, [dateKey]: answer };
}

export function completePracticeForDate(
  record: DailyPracticeRecord,
  dateKey: string,
  missionId: MissionId,
): DailyPracticeRecord {
  if (dateKey in record) return record;
  return { ...record, [dateKey]: missionId };
}

function getTodayMission(
  completedMissionIds: ReadonlySet<MissionId>,
  achieved: boolean,
  referenceDate: Date,
): Mission {
  if (!achieved) {
    return MISSIONS.find((mission) => !completedMissionIds.has(mission.id))
      ?? MISSIONS[MISSIONS.length - 1];
  }

  const index = getLocalCalendarDayIndex(referenceDate);
  return MISSIONS[((index % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
}

export function selectFinancialIndependenceState(
  state: FinancialIndependenceState,
  referenceDate: Date = new Date(),
) {
  const score = calculateFinancialScore(state.completedMissionIds, state.reviewBonus);
  const achieved = score >= MAX_SCORE;
  const todayKey = getLocalDateKey(referenceDate);
  const weeklyActivity = getWeeklyActivity(
    state.quizRecord,
    state.dailyPracticeRecord,
    referenceDate,
  );

  return {
    score,
    achieved,
    todayKey,
    todayMission: getTodayMission(state.completedMissionIds, achieved, referenceDate),
    todayActivity: getDailyActivityStatus(
      state.quizRecord,
      state.dailyPracticeRecord,
      todayKey,
    ),
    weeklyActivity,
    completedWeekdayCount: weeklyActivity.filter((day) => day.completed).length,
  };
}
