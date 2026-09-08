import type { TxRecord } from '../types';

/** 확인할 거래 선제 도움. 목록 위 안내 줄 대신 버튼 강조·음성·상담 시트를 쓴다. */
export const HISTORY_HELP = {
  gateEntry: (count: number) =>
    `확인하지 않은 거래 ${count}건이 있어요. 아래 자세히 보기를 눌러 하나씩 확인해주세요.`,
  gateIdle: '아래 「자세히 보기」를 눌러주세요.',
  reportEntry: (count: number) =>
    `모르는 거래 ${count}건을 확인해주세요. 아래 신고 안내 보기를 눌러주세요.`,
  reviewEntry: (count: number) =>
    `아직 확인하지 않은 거래 ${count}건이 있어요. 확인하기를 눌러주세요.`,
  emptyOtherMonth: '다른 달에 확인할 거래가 있을 수 있어요. 이전 달을 눌러 찾아주세요.',
  unknownHint: '모르면 아래 「모르는 거래에요」를 눌러주세요. 잘 모르겠으면 상담원에게 물어볼 수 있어요.',
  unknownCall: '모르는 거래로 표시했어요. 고객센터에 전화하려면 아래 빨간 버튼을 눌러주세요.',
  markedUnknown: '모르는 거래로 표시했어요. 아래 신고 안내 보기를 눌러주세요.',
};

export type HistoryHelpTarget =
  | 'detailBtn'
  | 'reportBtn'
  | 'reviewBtn'
  | 'prevMonth'
  | 'knownBtn'
  | 'unknownBtn'
  | 'pendingIdle'
  | 'callBtn'
  | '';

export function formatWonVoice(amount: number): string {
  const abs = Math.abs(amount);
  const man = Math.floor(abs / 10000);
  const rest = abs % 10000;
  if (man > 0 && rest === 0) return `${man}만 원`;
  if (man > 0) return `${man}만 ${rest.toLocaleString()}원`;
  return `${abs.toLocaleString()}원`;
}

export function reviewDetailVoice(tx: TxRecord): string {
  const place = tx.merchant || tx.name;
  const money = formatWonVoice(tx.amount);
  const dir = tx.amount < 0 ? '나갔어요' : '들어왔어요';
  const summary = `${tx.date}, ${place}에서 ${money} ${dir}.`;
  if (tx.reviewStatus === 'pending') {
    return `${summary} 알고 있는 거래면 아래 노란 버튼을 눌러주세요.`;
  }
  return summary;
}

export function listHelpTarget(opts: {
  unknownCount: number;
  needCheckCount: number;
  empty: boolean;
  hasReviewElsewhere: boolean;
}): HistoryHelpTarget {
  if (opts.unknownCount > 0) return 'reportBtn';
  if (opts.empty && opts.hasReviewElsewhere) return 'prevMonth';
  if (opts.needCheckCount > 0) return 'reviewBtn';
  return '';
}
