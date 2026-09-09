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

// MVP: 오늘의 송금 연습에서는 위험 상황 시나리오를 생성하지 않는다.
// 시나리오 관련 코드/타입은 추후 확장을 위해 그대로 유지한다.
const DAILY_MISSION_SCENARIOS_ENABLED = false;

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
  // MVP에서는 비활성화하되, random() 소비 순서는 유지해 조합 규칙을 그대로 둔다.
  const rolledScenario = random() < 0.45;
  const scenarioId =
    DAILY_MISSION_SCENARIOS_ENABLED && rolledScenario ? pick(SCENARIO_IDS, random) : null;
  const assistanceMode: AssistanceMode = scenarioId ? 'solo' : pick(ASSISTANCE_MODES, random);
  const candidateInputMethod = pick(INPUT_METHODS, random);
  const candidateRecipientType: DailyRecipientType = assistanceMode === 'guided'
    ? 'saved'
    : pick(['saved', 'new'] as const, random);
  // 이름만으로 계좌를 찾을 수 없는 신규 수취인은 반드시 계좌번호를 직접 입력한다.
  // 위험 시나리오의 송금 요청도 모두 처음 보는 계좌로 취급한다.
  const recipientType: DailyRecipientType = scenarioId ? 'new' : candidateRecipientType;
  const inputMethod: DailyInputMethod = recipientType === 'new'
    ? 'manual'
    : candidateInputMethod;
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
  const validRecipientMethod = mission.recipientType !== 'new' || mission.inputMethod === 'manual';
  const validScenarioCombination = !mission.scenarioId || (
    mission.assistanceMode === 'solo' &&
    mission.recipientType === 'new' &&
    mission.inputMethod === 'manual'
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
    validRecipientMethod &&
    validScenarioCombination
  );
}

export function getDailyMissionStorageKey(date: string): string {
  return `danbi.daily.mission.${date}`;
}
