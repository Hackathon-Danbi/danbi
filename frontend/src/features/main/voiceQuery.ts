import type { VoiceQueryResult } from '../../api/contracts';
import { formatWon, type Account } from '../shared/data/accounts.mock';

/** 홈 질문 중 현재 선택 통장의 잔액을 묻는 표현을 판별한다. */
export function isBalanceVoiceQuery(query: string): boolean {
  const normalized = query.replace(/[\s?!.]/g, '');
  return (
    normalized.includes('잔액') ||
    normalized.includes('출금가능') ||
    /(?:통장|계좌|돈).*(?:얼마|얼만큼).*(?:있|남)/.test(normalized) ||
    /(?:얼마|얼만큼).*(?:있|남)/.test(normalized)
  );
}

/** 서버 연결 여부와 무관하게 앱의 최신 선택 통장 잔액으로 답변한다. */
export function createBalanceVoiceAnswer(account: Account): VoiceQueryResult {
  return {
    answerText: `${account.bankName} ${account.accountName}에 ${formatWon(account.balance)} 있어요.`,
    audioUrl: null,
    relatedAccountId: account.accountId,
  };
}
