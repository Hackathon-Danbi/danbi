import type { Account } from '@/features/shared/data';
import type { TxRecord } from '../types';
import { transactionsForAccount } from './data/accountTransactions.mock';

/**
 * 미확인 거래내역 흐름(UnconfirmedFlow)이 쓰는 통장별 집계.
 *
 * 홈의 '확인할 거래' 게이트는 기본(생활비) 통장만 보지만, 이 화면은 시니어가
 * 가진 모든 통장을 한 번에 훑어야 하므로 통장별로 pending 거래를 모아서 보여준다.
 */
export interface AccountUnconfirmedGroup {
  account: Account;
  /** 아직 확인하지 않은(pending) 거래. 최신순 정렬. */
  pending: TxRecord[];
  count: number;
}

/** 통장별로 '확인 필요(pending)' 거래를 모은다. 건수가 0인 통장도 포함한다(브레이크다운에서 '확인 완료'로 표시). */
export function groupUnconfirmedByAccount(
  accounts: Account[],
  contextTransactions: TxRecord[],
): AccountUnconfirmedGroup[] {
  return accounts.map((account) => {
    const pending = transactionsForAccount(account.accountId, contextTransactions)
      .filter((tx) => tx.reviewStatus === 'pending')
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return { account, pending, count: pending.length };
  });
}

export function totalUnconfirmed(groups: AccountUnconfirmedGroup[]): number {
  return groups.reduce((sum, group) => sum + group.count, 0);
}

/** "생활비 통장 2건" 형태의 통장별 요약 줄. 건수 0인 통장은 뺀다. */
export function summaryLines(groups: AccountUnconfirmedGroup[]): string[] {
  return groups
    .filter((group) => group.count > 0)
    .map((group) => `${group.account.accountName} ${group.count}건`);
}
