import type {
  AssistanceMode,
  DailyInputMethod,
  DailyMission,
  DailyRecipientType,
  RiskScenarioId,
} from './types';

const ASSISTANCE_MODES: readonly AssistanceMode[] = ['guided', 'solo'];
const INPUT_METHODS: readonly DailyInputMethod[] = ['voice', 'manual'];
const SCENARIO_IDS: readonly RiskScenarioId[] = [
  'prosecutor-scam',
  'family-impersonation',
  'loan-scam',
  'refund-scam',
];
const NORMAL_AMOUNTS = [10_000, 30_000, 50_000] as const;

function pick<T>(items: readonly T[], random: () => number): T {
  const safeRandom = Math.max(0, Math.min(0.999999, random()));
  return items[Math.floor(safeRandom * items.length)];
}

/** 유효한 조합만 한 번 생성한다. 같은 날짜 유지 여부는 AsyncStorage 계층이 담당한다. */
export function generateDailyMission(
  date: string,
  random: () => number = Math.random,
): DailyMission {
  // 위험 상황은 판단을 돕는 안내 없이 스스로 멈춰보는 solo 미션으로만 만든다.
  const scenarioId = random() < 0.45 ? pick(SCENARIO_IDS, random) : null;
  const assistanceMode: AssistanceMode = scenarioId ? 'solo' : pick(ASSISTANCE_MODES, random);
  const inputMethod = pick(INPUT_METHODS, random);
  const recipientType: DailyRecipientType = assistanceMode === 'guided'
    ? 'saved'
    : pick(['saved', 'new'] as const, random);
  const recipientId = recipientType === 'saved'
    ? pick(['minsu', 'younghee'] as const, random)
    : undefined;

  return {
    date,
    assistanceMode,
    inputMethod,
    recipientType,
    recipientId,
    amount: pick(NORMAL_AMOUNTS, random),
    scenarioId,
  };
}

export function isDailyMission(value: unknown, expectedDate?: string): value is DailyMission {
  if (!value || typeof value !== 'object') return false;
  const mission = value as Partial<DailyMission>;
  const validDate = typeof mission.date === 'string' && (!expectedDate || mission.date === expectedDate);
  const validScenario = mission.scenarioId === null || SCENARIO_IDS.includes(mission.scenarioId as RiskScenarioId);
  const validRecipient = mission.recipientType === 'new' || (
    mission.recipientType === 'saved' &&
    (mission.recipientId === 'minsu' || mission.recipientId === 'younghee')
  );
  return !!(
    validDate &&
    ASSISTANCE_MODES.includes(mission.assistanceMode as AssistanceMode) &&
    INPUT_METHODS.includes(mission.inputMethod as DailyInputMethod) &&
    validRecipient &&
    typeof mission.amount === 'number' &&
    Number.isFinite(mission.amount) &&
    mission.amount > 0 &&
    validScenario &&
    (!mission.scenarioId || mission.assistanceMode === 'solo')
  );
}

export function getDailyMissionStorageKey(date: string): string {
  return `danbi.daily.mission.${date}`;
}
