import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { getJSON, setJSON, StorageKeys } from '@/lib/storage';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { PracticeMode } from '@/features/practice/PracticeMode';
import type { PracticeInitialState, PracticeTarget } from '@/features/practice/types';
import { MISSION_PRACTICE_PRESETS, SOLO_MANUAL_RETRY_PRESET } from '@/features/practice/missionPresets';
import { savedRecipients } from '@/features/practice/data/recipients.mock';
import { MAX_SCORE, MISSIONS } from './data/missions';
import type { Mission, MissionId } from './data/missions';
import type { QuizQuestion } from './data/quiz';
import { DailyHubScreen } from './hub/DailyHubScreen';
import { PracticePickerScreen } from './hub/PracticePickerScreen';
import { MissionCompleteScreen } from './MissionCompleteScreen';
import { PhishingLearnScreen } from './phishing/PhishingLearnScreen';
import { generateDailyMission, getDailyMissionStorageKey, isDailyMission } from './dailyMission';
import { SCENARIO_BY_ID } from './scenarios/scenarios';
import { ScenarioFeedbackScreen } from './scenarios/ScenarioFeedbackScreen';
import { ScenarioSimulationScreen } from './scenarios/ScenarioSimulationScreen';
import { SimulationSafetyBanner } from './scenarios/SimulationSafetyBanner';
import type { RiskScenario } from './scenarios/types';
import {
  calculateFinancialScore,
  completeMission,
  completePracticeForDate,
  completeQuizForDate,
  getLocalDateKey,
} from './state';
import type {
  DailyMission,
  DailyMissionRecord,
  DailyMissionRecords,
  DailyMissionResult,
  DailyPracticeRecord,
  ExperiencedScenarios,
  QuizRecord,
  RiskScenarioId,
} from './types';
import {
  difficultyFromReviewStep,
  isReviewableTransferStep,
  mergeTransferDifficultyCompletion,
  MOCK_TRANSFER_DIFFICULTIES,
  sanitizeTransferDifficulties,
} from './transferDifficulty';
import type { ReviewableTransferStep, TransferDifficulty } from './transferDifficulty';
import {
  financialIndependenceApi,
  isApiConfigured,
  practiceApi,
} from '@/api';
import type { QuizAnswerResult, TodayDailyActivity } from '@/api';

type ScenarioRun = {
  dailyMission: DailyMission;
  scenario: RiskScenario;
  isDailyMission: boolean;
};

type View =
  | { tag: 'hub' }
  | { tag: 'practice-picker' }
  | { tag: 'review'; difficulty: TransferDifficulty }
  | {
      tag: 'practice';
      mission: Mission;
      initialState?: PracticeInitialState;
      dailyMission?: DailyMission;
      isDailyMission?: boolean;
      scenarioRun?: ScenarioRun;
    }
  | { tag: 'scenario'; run: ScenarioRun }
  | { tag: 'scenario-feedback'; run: ScenarioRun; detectedRisk: boolean; attemptedTransfer: boolean }
  | { tag: 'phishing-learn'; missionId: MissionId; mission: Mission }
  | {
      tag: 'complete';
      mission: Mission;
      earnedPoints: number;
      practiceInitialState?: PracticeInitialState;
      dailyMission?: DailyMission;
      isDailyMission?: boolean;
    };

const NEW_RECIPIENT_TARGET: PracticeTarget['recipient'] = {
  id: 'new',
  name: '박지영',
  bank: '단비연습은행',
  account: '555666777888',
};

function missionForDaily(dailyMission: DailyMission): Mission {
  const missionId: MissionId = dailyMission.scenarioId
    ? 'phishing-simulation'
    : dailyMission.assistanceMode === 'guided'
      ? 'guided-transfer'
      : dailyMission.inputMethod === 'voice'
        ? 'voice-transfer'
        : 'solo-transfer';
  return MISSIONS.find((mission) => mission.id === missionId) ?? MISSIONS[0];
}

function targetForDaily(dailyMission: DailyMission, scenario?: RiskScenario): PracticeTarget {
  if (scenario) {
    return {
      recipient: {
        id: 'new',
        name: scenario.transferRequest.recipientName,
        bank: scenario.transferRequest.bank,
        account: scenario.transferRequest.account,
      },
      amount: String(scenario.transferRequest.amount),
      amountLabel: `${scenario.transferRequest.amount.toLocaleString('ko-KR')}원`,
    };
  }

  const saved = savedRecipients.find((recipient) => recipient.id === dailyMission.recipientId);
  const recipient = dailyMission.recipientType === 'saved' && saved ? saved : NEW_RECIPIENT_TARGET;
  return {
    recipient,
    amount: String(dailyMission.amount),
    amountLabel: `${dailyMission.amount.toLocaleString('ko-KR')}원`,
  };
}

function practiceStateForDaily(dailyMission: DailyMission, scenario?: RiskScenario): PracticeInitialState {
  return {
    screen: scenario
      ? dailyMission.inputMethod === 'voice' ? 'practiceVoice' : 'practiceRecipient'
      : 'practiceMissionIntro',
    practiceStyle: dailyMission.assistanceMode,
    transferMethod: dailyMission.inputMethod,
    target: targetForDaily(dailyMission, scenario),
  };
}

function createMissionRecord(mission: DailyMission, result: DailyMissionResult): DailyMissionRecord {
  return {
    date: mission.date,
    mission: {
      assistanceMode: mission.assistanceMode,
      inputMethod: mission.inputMethod,
      scenarioId: mission.scenarioId,
    },
    result,
  };
}

/** 날짜별 미션은 새 키로 확장하고, 기존 3개 완료/점수 키는 그대로 유지한다. */
export function MissionMode({
  onExit,
  transferDifficulties: suppliedTransferDifficulties,
  startReviewStep,
}: {
  onExit?: () => void;
  /** 백엔드 연결 후 외부 difficulty 응답을 그대로 주입할 수 있는 경계. */
  transferDifficulties?: TransferDifficulty[];
  /** 실제 송금에서 막힌 단계로 맞춤 복습을 바로 연다. */
  startReviewStep?: ReviewableTransferStep;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(() =>
    startReviewStep
      ? { tag: 'review', difficulty: difficultyFromReviewStep(startReviewStep) }
      : { tag: 'hub' },
  );
  const [hydrated, setHydrated] = useState(false);
  const [todayMission, setTodayMission] = useState<DailyMission | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<MissionId>>(new Set());
  const [dailyPracticeRecord, setDailyPracticeRecord] = useState<DailyPracticeRecord>({});
  const [quizRecord, setQuizRecord] = useState<QuizRecord>({});
  const [dailyMissionRecords, setDailyMissionRecords] = useState<DailyMissionRecords>({});
  const [experiencedScenarios, setExperiencedScenarios] = useState<Set<RiskScenarioId>>(new Set());
  const [transferDifficulties, setTransferDifficulties] = useState<TransferDifficulty[]>([]);
  const [apiDailyActivity, setApiDailyActivity] = useState<TodayDailyActivity | null>(null);
  const [apiPracticeMissionId, setApiPracticeMissionId] = useState<number | null>(null);
  const [apiError, setApiError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    if (!isApiConfigured()) return;
    let active = true;
    void Promise.allSettled([
      financialIndependenceApi.getToday(),
      practiceApi.getMissions(),
    ]).then(([dailyResult, missionResult]) => {
      if (!active) return;
      const errors: string[] = [];
      if (dailyResult.status === 'fulfilled') {
        setApiDailyActivity(dailyResult.value);
      } else {
        errors.push(dailyResult.reason instanceof Error ? dailyResult.reason.message : '오늘의 금융 활동을 불러오지 못했어요.');
      }
      if (missionResult.status === 'fulfilled') {
        setApiPracticeMissionId(missionResult.value.find((mission) => mission.missionType === 'TRANSFER')?.missionId ?? null);
      } else {
        errors.push(missionResult.reason instanceof Error ? missionResult.reason.message : '송금 연습 목록을 불러오지 못했어요.');
      }
      setApiError(errors.join('\n'));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const dateKey = getLocalDateKey();
      const missionKey = getDailyMissionStorageKey(dateKey);
      const [completed, daily, quiz, storedTodayMission, records, experienced, storedDifficulties] = await Promise.all([
        getJSON<MissionId[]>(StorageKeys.missionsCompleted),
        getJSON<DailyPracticeRecord>(StorageKeys.dailyPractice),
        getJSON<QuizRecord>(StorageKeys.quizRecord),
        getJSON<unknown>(missionKey),
        getJSON<DailyMissionRecords>(StorageKeys.dailyMissionRecords),
        getJSON<ExperiencedScenarios>(StorageKeys.experiencedScenarios),
        getJSON<unknown>(StorageKeys.transferDifficulties),
      ]);
      if (!mounted.current) return;

      const resolvedTodayMission = isDailyMission(storedTodayMission, dateKey)
        ? storedTodayMission
        : generateDailyMission(dateKey);
      if (!isDailyMission(storedTodayMission, dateKey)) void setJSON(missionKey, resolvedTodayMission);

      if (Array.isArray(completed)) setCompletedMissionIds(new Set(completed));
      if (daily && typeof daily === 'object') setDailyPracticeRecord(daily);
      if (quiz && typeof quiz === 'object') setQuizRecord(quiz);
      if (records && typeof records === 'object') setDailyMissionRecords(records);
      if (Array.isArray(experienced)) {
        setExperiencedScenarios(new Set(experienced.filter((id) => id in SCENARIO_BY_ID)));
      }
      const sanitizedStoredDifficulties = sanitizeTransferDifficulties(storedDifficulties);
      const resolvedDifficulties = suppliedTransferDifficulties !== undefined
        ? mergeTransferDifficultyCompletion(
            sanitizeTransferDifficulties(suppliedTransferDifficulties),
            sanitizedStoredDifficulties,
          )
        : storedDifficulties === null
          ? MOCK_TRANSFER_DIFFICULTIES
          : sanitizedStoredDifficulties;
      setTransferDifficulties(resolvedDifficulties);
      if (storedDifficulties === null && suppliedTransferDifficulties === undefined) {
        void setJSON(StorageKeys.transferDifficulties, resolvedDifficulties);
      }
      setTodayMission(resolvedTodayMission);
      setHydrated(true);
    })();
    return () => {
      mounted.current = false;
    };
  }, [suppliedTransferDifficulties]);

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
  const persistDailyMissionRecord = (mission: DailyMission, result: DailyMissionResult) => {
    if (mission.date in dailyMissionRecords) return;
    const next = { ...dailyMissionRecords, [mission.date]: createMissionRecord(mission, result) };
    setDailyMissionRecords(next);
    void setJSON(StorageKeys.dailyMissionRecords, next);
  };
  const persistScenarioExperience = (scenarioId: RiskScenarioId) => {
    if (experiencedScenarios.has(scenarioId)) return;
    const next = new Set([...experiencedScenarios, scenarioId]);
    setExperiencedScenarios(next);
    void setJSON(StorageKeys.experiencedScenarios, [...next]);
  };

  const completeDifficulty = (difficultyId: string) => {
    const next = transferDifficulties.map((difficulty) =>
      difficulty.id === difficultyId ? { ...difficulty, completed: true } : difficulty,
    );
    setTransferDifficulties(next);
    void setJSON(StorageKeys.transferDifficulties, next);
  };

  const startDifficultyReview = (difficulty: TransferDifficulty) => {
    if (!isReviewableTransferStep(difficulty.step)) return;
    setView({ tag: 'review', difficulty });
  };

  const handleComplete = ({
      mission,
      practiceInitialState,
      dailyMission,
      isDailyMission: completingDailyMission = false,
      result = { completed: true },
    }: {
      mission: Mission;
      practiceInitialState?: PracticeInitialState;
      dailyMission?: DailyMission;
      isDailyMission?: boolean;
      result?: DailyMissionResult;
    }) => {
      const missionCompletion = completeMission(completedMissionIds, mission);
      if (missionCompletion.completedMissionIds !== completedMissionIds) {
        persistCompleted(missionCompletion.completedMissionIds);
      }

      if (completingDailyMission && dailyMission) {
        const nextDailyRecord = completePracticeForDate(dailyPracticeRecord, dailyMission.date, mission.id);
        if (nextDailyRecord !== dailyPracticeRecord) persistDaily(nextDailyRecord);
        persistDailyMissionRecord(dailyMission, result);
      }

      setView({
        tag: 'complete',
        mission,
        earnedPoints: missionCompletion.earnedPoints,
        practiceInitialState,
        dailyMission,
        isDailyMission: completingDailyMission,
      });
    };

  const startDailyMission = (dailyMission: DailyMission) => {
    const mission = missionForDaily(dailyMission);
    if (dailyMission.scenarioId) {
      setView({
        tag: 'scenario',
        run: { dailyMission, scenario: SCENARIO_BY_ID[dailyMission.scenarioId], isDailyMission: true },
      });
      return;
    }
    setView({
      tag: 'practice',
      mission,
      initialState: practiceStateForDaily(dailyMission),
      dailyMission,
      isDailyMission: true,
    });
  };

  const startLegacyMission = (mission: Mission, initialState?: PracticeInitialState) => {
    if (mission.type === 'transfer') setView({ tag: 'practice', mission, initialState });
    else setView({ tag: 'phishing-learn', missionId: mission.id, mission });
  };

  const startScenarioReplay = (scenarioId: RiskScenarioId) => {
    const scenario = SCENARIO_BY_ID[scenarioId];
    const replayMission: DailyMission = {
      date: getLocalDateKey(),
      assistanceMode: 'solo',
      inputMethod: 'manual',
      recipientType: 'new',
      amount: scenario.transferRequest.amount,
      scenarioId,
    };
    setView({ tag: 'scenario', run: { dailyMission: replayMission, scenario, isDailyMission: false } });
  };

  const startScenarioTransfer = (run: ScenarioRun) => {
    setView({
      tag: 'practice',
      mission: missionForDaily(run.dailyMission),
      initialState: practiceStateForDaily(run.dailyMission, run.scenario),
      dailyMission: run.dailyMission,
      isDailyMission: run.isDailyMission,
      scenarioRun: run,
    });
  };

  const showScenarioFeedback = (run: ScenarioRun, detectedRisk: boolean, attemptedTransfer: boolean) => {
    persistScenarioExperience(run.scenario.id);
    setView({ tag: 'scenario-feedback', run, detectedRisk, attemptedTransfer });
  };

  const handleQuizComplete = async (
    question: QuizQuestion,
    answeredIndex: number,
  ): Promise<QuizAnswerResult | void> => {
    let apiResult: QuizAnswerResult | undefined;
    if (apiDailyActivity && isApiConfigured()) {
      apiResult = await financialIndependenceApi.answerQuiz(
        apiDailyActivity.dailyActivityId,
        answeredIndex === 0,
      );
      setApiDailyActivity((current) => current ? {
        ...current,
        question: { ...current.question, selectedAnswer: apiResult!.selectedAnswer },
        earnedScore: apiResult!.earnedScore,
      } : current);
      setApiError('');
    }
    const nextQuizRecord = completeQuizForDate(quizRecord, getLocalDateKey(), {
      qId: question.id,
      answeredIndex,
    });
    if (nextQuizRecord !== quizRecord) persistQuiz(nextQuizRecord);
    return apiResult;
  };

  const completePracticeRun = async (args: Parameters<typeof handleComplete>[0]) => {
    if (args.isDailyMission && apiDailyActivity && isApiConfigured()) {
      try {
        const result = await financialIndependenceApi.completePractice(
          apiDailyActivity.dailyActivityId,
          apiDailyActivity.mission.missionId,
        );
        setApiDailyActivity((current) => current ? {
          ...current,
          practiceCompleted: result.practiceCompleted,
          earnedScore: result.earnedScore,
        } : current);
        setApiError('');
      } catch (cause) {
        setApiError(cause instanceof Error ? cause.message : '오늘의 미션 완료를 서버에 저장하지 못했어요.');
      }
    }
    handleComplete(args);
  };

  const exitToHome = () => {
    if (onExit) onExit();
    else router.dismissTo('/(app)/home');
  };

  useAndroidBack(() => {
    if (view.tag === 'practice') return false;
    if (view.tag === 'review' && startReviewStep) {
      exitToHome();
      return true;
    }
    if (view.tag !== 'hub') {
      setView({ tag: 'hub' });
      return true;
    }
    return false;
  });

  if (!hydrated || !todayMission) {
    return <Screen background="#fffef9" edges={['top', 'bottom']}>{null}</Screen>;
  }

  if (view.tag === 'practice-picker') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <ScreenIn>
          <PracticePickerScreen
            experiencedScenarios={experiencedScenarios}
            onStartPractice={startLegacyMission}
            onReplayScenario={startScenarioReplay}
            onBack={() => setView({ tag: 'hub' })}
          />
        </ScreenIn>
      </Screen>
    );
  }

  if (view.tag === 'review' && isReviewableTransferStep(view.difficulty.step)) {
    return (
      <Screen background="#eef2ff" edges={['top', 'bottom']}>
        <PracticeMode
          mode="review"
          startStep={view.difficulty.step}
          onExit={() => (startReviewStep ? exitToHome() : setView({ tag: 'hub' }))}
          onComplete={() => completeDifficulty(view.difficulty.id)}
        />
      </Screen>
    );
  }

  if (view.tag === 'scenario') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <ScenarioSimulationScreen
          scenario={view.run.scenario}
          onRequestTransfer={() => startScenarioTransfer(view.run)}
          onStop={() => showScenarioFeedback(view.run, true, false)}
        />
      </Screen>
    );
  }

  if (view.tag === 'scenario-feedback') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <ScenarioFeedbackScreen
          scenario={view.run.scenario}
          detectedRisk={view.detectedRisk}
          onComplete={() => handleComplete({
            mission: missionForDaily(view.run.dailyMission),
            dailyMission: view.run.dailyMission,
            isDailyMission: view.run.isDailyMission,
            result: {
              completed: true,
              detectedRisk: view.detectedRisk,
              attemptedTransfer: view.attemptedTransfer,
              stoppedTransfer: view.detectedRisk,
            },
          })}
        />
      </Screen>
    );
  }

  if (view.tag === 'practice') {
    return (
      <Screen background="#eef2ff" edges={['top', 'bottom']}>
        {view.scenarioRun ? <SimulationSafetyBanner /> : null}
        <PracticeMode
          missionId={view.mission.id}
          initialState={view.initialState}
          apiMissionId={view.scenarioRun
            ? undefined
            : view.isDailyMission
              ? apiDailyActivity?.mission.missionId
              : apiPracticeMissionId ?? undefined}
          onExit={() => {
            if (view.scenarioRun) showScenarioFeedback(view.scenarioRun, true, false);
            else setView({ tag: 'hub' });
          }}
          onTransferAttempt={view.scenarioRun
            ? () => showScenarioFeedback(view.scenarioRun!, false, true)
            : undefined}
          onComplete={() => void completePracticeRun({
            mission: view.mission,
            practiceInitialState: view.initialState,
            dailyMission: view.dailyMission,
            isDailyMission: view.isDailyMission,
          })}
        />
      </Screen>
    );
  }

  if (view.tag === 'phishing-learn') {
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <PhishingLearnScreen
          missionId={view.missionId}
          onComplete={() => handleComplete({ mission: view.mission })}
          onExit={() => setView({ tag: 'hub' })}
        />
      </Screen>
    );
  }

  if (view.tag === 'complete') {
    const currentScore = calculateFinancialScore(completedMissionIds);
    const completedPracticeStyle = view.practiceInitialState?.practiceStyle
      ?? MISSION_PRACTICE_PRESETS[view.mission.id]?.practiceStyle;
    const completedSoloFromGuided = view.mission.id === 'guided-transfer' && completedPracticeStyle === 'solo';
    return (
      <Screen background="#fffef9" edges={['top', 'bottom']}>
        <MissionCompleteScreen
          missionTitle={completedSoloFromGuided ? '혼자 송금해보기' : view.mission.title}
          earnedPoints={view.earnedPoints}
          newScore={currentScore}
          maxScore={MAX_SCORE}
          dailyMission={view.isDailyMission}
          onBack={() => setView({ tag: 'hub' })}
          onRetry={view.mission.type === 'transfer' && !view.dailyMission
            ? () => setView({ tag: 'practice', mission: view.mission, initialState: view.practiceInitialState })
            : undefined}
          onSoloRetry={view.mission.id === 'guided-transfer' && completedPracticeStyle === 'guided' && !view.dailyMission
            ? () => setView({ tag: 'practice', mission: view.mission, initialState: SOLO_MANUAL_RETRY_PRESET })
            : undefined}
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
          todayMission={todayMission}
          transferDifficulties={transferDifficulties}
          apiDailyActivity={apiDailyActivity}
          apiError={apiError}
          onQuizComplete={handleQuizComplete}
          onStartDailyMission={startDailyMission}
          onOpenPracticePicker={() => setView({ tag: 'practice-picker' })}
          onStartDifficultyReview={startDifficultyReview}
          onExit={exitToHome}
        />
      </ScreenIn>
    </Screen>
  );
}

export { MISSIONS };
