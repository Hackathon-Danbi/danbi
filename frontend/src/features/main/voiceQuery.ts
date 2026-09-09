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

/**
 * 홈 질문이 송금 요청인지 판별한다.
 * 실제 수취인/금액 파싱과 검증은 송금 플로우(TransferFlow)가 담당하고,
 * 여기서는 "잔액 조회"가 아닌 발화를 송금 퍼널로 넘길지만 결정한다.
 */
export function isTransferVoiceQuery(query: string): boolean {
  const normalized = query.replace(/[\s?!.]/g, '');
  const hasSendVerb = /(?:보내|보낼|부쳐|부칠|부치|송금|이체|이체해)/.test(normalized);
  const hasTarget = /(?:에게|한테|께)/.test(normalized);
  const hasAmount = /\d+(?:만)?원|만원/.test(normalized);
  return hasSendVerb && (hasTarget || hasAmount);
}

/** 서버 연결 여부와 무관하게 앱의 최신 선택 통장 잔액으로 답변한다. */
export function createBalanceVoiceAnswer(account: Account): VoiceQueryResult {
  return {
    answerText: `${account.bankName} ${account.accountName}에 ${formatWon(account.balance)} 있어요.`,
    audioUrl: null,
    relatedAccountId: account.accountId,
  };
}
