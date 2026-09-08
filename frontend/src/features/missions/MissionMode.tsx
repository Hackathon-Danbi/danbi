import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { getJSON, setJSON, StorageKeys } from '@/lib/storage';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { PracticeMode } from '@/features/practice/PracticeMode';
import { MAX_SCORE, MISSIONS, calcScore } from './data/missions';
import type { Mission, MissionId } from './data/missions';
import { getTodayString } from './data/quiz';
import type { QuizQuestion } from './data/quiz';
import { DailyHubScreen } from './hub/DailyHubScreen';
import type { DailyPracticeRecord, QuizRecord } from './hub/DailyHubScreen';
import { MissionCompleteScreen } from './MissionCompleteScreen';
import { PhishingLearnScreen } from './phishing/PhishingLearnScreen';
import { PhishingSimulationScreen } from './phishing/PhishingSimulationScreen';

type View =
  | { tag: 'hub' }
  | { tag: 'practice'; mission: Mission }
  | { tag: 'phishing-learn'; missionId: MissionId; mission: Mission }
  | { tag: 'phishing-sim'; mission: Mission }
  | { tag: 'complete'; mission: Mission; earnedPoints: number };

/** danbi_jj missions/MissionMode.tsx 이식. AsyncStorage 3키 hydrate 후 렌더. */
export function MissionMode({ onExit }: { onExit?: () => void }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ tag: 'hub' });

  const [hydrated, setHydrated] = useState(false);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<MissionId>>(new Set());
  const [dailyPracticeRecord, setDailyPracticeRecord] = useState<DailyPracticeRecord>({});
  const [quizRecord, setQuizRecord] = useState<QuizRecord>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [completed, daily, quiz] = await Promise.all([
        getJSON<MissionId[]>(StorageKeys.missionsCompleted),
        getJSON<DailyPracticeRecord>(StorageKeys.dailyPractice),
        getJSON<QuizRecord>(StorageKeys.quizRecord),
      ]);
      if (!mounted.current) return;
      if (completed) setCompletedMissionIds(new Set(completed));
      if (daily) setDailyPracticeRecord(daily);
      if (quiz) setQuizRecord(quiz);
      setHydrated(true);
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const persistCompleted = (next: Set<MissionId>) => {
    setCompletedMissionIds(next);
    void setJSON(StorageKeys.missionsCompleted, [...next]);
  };
  const persistDaily = (next: DailyPracticeRecord) => {
    setDailyPracticeRecord(next);
    void setJSON(StorageKeys.dailyPractice, next);
  };
  const persistQuiz = (next: QuizRecord) => {
    setQuizRecord(next);
    void setJSON(StorageKeys.quizRecord, next);
  };

  const handleComplete = useCallback(
    (mission: Mission) => {
      const today = getTodayString();
      const alreadyDone = completedMissionIds.has(mission.id);
      const earned = alreadyDone ? 0 : mission.points;

      if (!alreadyDone) persistCompleted(new Set([...completedMissionIds, mission.id]));
      // 오늘의 연습 기록 (idempotent — 같은 날 재획득 방지)
      if (!(today in dailyPracticeRecord)) {
        persistDaily({ ...dailyPracticeRecord, [today]: mission.id });
      }
      setView({ tag: 'complete', mission, earnedPoints: earned });
    },
    [completedMissionIds, dailyPracticeRecord],
  );

  const startMission = (mission: Mission) => {
    if (mission.type === 'transfer') {
      setView({ tag: 'practice', mission });
    } else if (mission.type === 'phishing-learn') {
      setView({ tag: 'phishing-learn', missionId: mission.id, mission });
    } else {
      setView({ tag: 'phishing-sim', mission });
    }
  };

  const handleQuizAnswer = (question: QuizQuestion, answeredIndex: number) => {
    const today = getTodayString();
    if (today in quizRecord) return; // 같은 날 재획득 불가
    persistQuiz({ ...quizRecord, [today]: { qId: question.id, answeredIndex } });
  };

  const exitToHome = () => {
    if (onExit) onExit();
    else router.dismissTo('/(app)/home');
  };

  useAndroidBack(() => {
    if (view.tag !== 'hub') {
      setView({ tag: 'hub' });
      return true;
    }
    return false;
  });

  if (!hydrated) return <Screen background="#fffef9" edges={['top', 'bottom']}>{null}</Screen>;

  if (view.tag === 'practice') {
    return (
      <Screen background="#eef2ff" edges={['top', 'bottom']}>
        <PracticeMode
          missionId={view.mission.id}
          onExit={() => setView({ tag: 'hub' })}
          onComplete={() => handleComplete(view.mission)}
        />
      </Screen>
    );
  }

  if (view.tag === 'phishing-learn') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <PhishingLearnScreen
          missionId={view.missionId}
          onComplete={() => handleComplete(view.mission)}
          onExit={() => setView({ tag: 'hub' })}
        />
      </Screen>
    );
  }

  if (view.tag === 'phishing-sim') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <PhishingSimulationScreen
          onComplete={() => handleComplete(view.mission)}
          onExit={() => setView({ tag: 'hub' })}
        />
      </Screen>
    );
  }

  if (view.tag === 'complete') {
    const currentScore = calcScore(completedMissionIds);
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <MissionCompleteScreen
          missionTitle={view.mission.title}
          earnedPoints={view.earnedPoints}
          newScore={currentScore}
          maxScore={MAX_SCORE}
          onBack={() => setView({ tag: 'hub' })}
          achieved={currentScore >= MAX_SCORE}
        />
      </Screen>
    );
  }

  return (
    <Screen background="#fffef9" edges={['top', 'bottom']}>
      <ScreenIn>
        <DailyHubScreen
          completedMissionIds={completedMissionIds}
          dailyPracticeRecord={dailyPracticeRecord}
          quizRecord={quizRecord}
          onQuizAnswer={handleQuizAnswer}
          onStartMission={startMission}
          onExit={exitToHome}
        />
      </ScreenIn>
    </Screen>
  );
}

export { MISSIONS };
