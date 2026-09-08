export type TransferDifficultyStep =
  | 'recipient'
  | 'bank'
  | 'account'
  | 'amount'
  | 'review'
  | 'password'
  | 'voice';

export type TransferDifficultyReason =
  | 'inactivity'
  | 'inputError'
  | 'wrongClick'
  | 'voiceFailure'
  | 'reentry';

const TRANSFER_DIFFICULTY_REASONS: TransferDifficultyReason[] = [
  'inactivity',
  'inputError',
  'wrongClick',
  'voiceFailure',
  'reentry',
];

/** 실제 송금에서 전달받는 읽기 전용 복습 신호. 실제 송금 플로우에서는 생성하지 않는다. */
export interface TransferDifficulty {
  id: string;
  step: TransferDifficultyStep;
  reason?: TransferDifficultyReason;
  occurredAt: string;
  completed: boolean;
}

export const TRANSFER_DIFFICULTY_COPY: Record<
  TransferDifficultyStep,
  { title: string; description: string; intro: string; instruction: string }
> = {
  recipient: {
    title: '받는 사람 선택하기',
    description: '송금할 사람을 선택하는 방법을 다시 연습해보세요.',
    intro: '받는 사람 선택을 다시 연습해볼게요.',
    instruction: '목록에서 김민수님을 직접 선택해보세요.',
  },
  bank: {
    title: '은행 선택하기',
    description: '상대방 계좌의 은행을 선택하는 방법을 연습해보세요.',
    intro: '은행 선택을 다시 연습해볼게요.',
    instruction: '상대방 계좌의 은행을 확인해보세요.',
  },
  account: {
    title: '계좌번호 입력하기',
    description: '계좌번호를 정확하게 입력하는 방법을 다시 연습해보세요.',
    intro: '계좌번호 입력을 다시 연습해볼게요.',
    instruction: '아래 계좌번호를 보고 직접 입력해보세요.',
  },
  amount: {
    title: '금액 입력하기',
    description: '보낼 금액을 입력하고 확인하는 방법을 연습해보세요.',
    intro: '금액 입력을 다시 연습해볼게요.',
    instruction: '안내된 금액을 직접 입력해보세요.',
  },
  review: {
    title: '송금 내용 확인하기',
    description: '보내기 전 상대방과 금액을 확인하는 방법을 연습해보세요.',
    intro: '송금 내용 확인을 다시 연습해볼게요.',
    instruction: '받는 사람과 금액을 차례로 확인해보세요.',
  },
  password: {
    title: '비밀번호 입력하기',
    description: '안전하게 비밀번호를 입력하는 방법을 연습해보세요.',
    intro: '비밀번호 입력을 다시 연습해볼게요.',
    instruction: '실제 비밀번호가 아닌 연습용 숫자 4개를 입력해보세요.',
  },
  voice: {
    title: '말로 송금하기',
    description: '음성으로 받는 사람과 금액을 말하는 연습을 해보세요.',
    intro: '말로 송금하기를 다시 연습해볼게요.',
    instruction: '“김민수에게 3만원 보내줘”라고 말해보세요.',
  },
};

export const REVIEWABLE_TRANSFER_STEPS = ['recipient', 'account', 'amount', 'voice'] as const;
export type ReviewableTransferStep = (typeof REVIEWABLE_TRANSFER_STEPS)[number];

export function isReviewableTransferStep(step: TransferDifficultyStep): step is ReviewableTransferStep {
  return REVIEWABLE_TRANSFER_STEPS.some((candidate) => candidate === step);
}

function isTransferDifficulty(value: unknown): value is TransferDifficulty {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<TransferDifficulty>;
  return typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.occurredAt === 'string'
    && typeof item.completed === 'boolean'
    && typeof item.step === 'string'
    && item.step in TRANSFER_DIFFICULTY_COPY
    && (item.reason === undefined || TRANSFER_DIFFICULTY_REASONS.includes(item.reason));
}

export function sanitizeTransferDifficulties(value: unknown): TransferDifficulty[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTransferDifficulty);
}

export function mergeTransferDifficultyCompletion(
  incoming: TransferDifficulty[],
  stored: TransferDifficulty[],
): TransferDifficulty[] {
  const completedIds = new Set(stored.filter((item) => item.completed).map((item) => item.id));
  return incoming.map((item) => ({ ...item, completed: item.completed || completedIds.has(item.id) }));
}

/** 백엔드 연결 전, 외부 difficulty 응답을 대신하는 임시 데이터. */
export const MOCK_TRANSFER_DIFFICULTIES: TransferDifficulty[] = [
  {
    id: 'difficulty-1',
    step: 'account',
    reason: 'inputError',
    occurredAt: '2026-09-08',
    completed: false,
  },
];
