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

/**
 * 홈 질문이 "모르는/미확인 거래"를 확인해 달라는 요청인지 판별한다.
 * 미확인 거래 검토 화면(/(app)/history?view=review)으로 보낸다.
 */
export function isReviewTxVoiceQuery(query: string): boolean {
  const n = query.replace(/[\s?!.]/g, '');
  return (
    n.includes('미확인거래') ||
    /(?:모르는|모를|낯선|이상한|수상한|처음보는)(?:거래|결제|출금|입금|내역)/.test(n) ||
    /확인(?:안|하지않)(?:은|한|된)?(?:거래|결제)/.test(n)
  );
}

/**
 * 홈 질문이 거래내역 조회 요청인지 판별한다.
 * 실제 데이터는 거래내역 화면(/(app)/history)이 백엔드에서 가져온다.
 * 송금 발화가 우선이므로 그쪽이면 false.
 */
export function isHistoryVoiceQuery(query: string): boolean {
  const n = query.replace(/[\s?!.]/g, '');
  if (isTransferVoiceQuery(query)) return false;
  return (
    n.includes('거래내역') ||
    n.includes('이용내역') ||
    n.includes('사용내역') ||
    n.includes('입출금내역') ||
    /(?:거래|입금|출금|이체)(?:내역|목록|기록)/.test(n) ||
    /(?:얼마|얼만큼|몇)(?:나|를|나를)?(?:썼|쓴|사용|지출)/.test(n) ||
    /(?:지난달|저번달|이번달|한달|요즘|최근|얼마전)(?:에|동안)?.*(?:썼|쓴|지출|사용|나갔)/.test(n) ||
    /(?:거래|내역).*(?:보여|알려|조회|확인|볼래|볼까)/.test(n)
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
