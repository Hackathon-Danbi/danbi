import type { Screen } from './types';

/**
 * 주소(URL) ↔ 주요 화면 매핑. danbi_jj app/features/main/routes.ts 이식.
 *
 * RN 에서는 expo-router 가 주요 화면(home/transfer/history/accounts/practice)을 담당하고,
 * 송금 퍼널 세부 단계(recipient, bankselect, password …)는 의도적으로 URL 에 넣지 않는다
 * (TransferFlow 내부 상태 머신). 이 표는 라벨/딥링크 참고용으로 유지한다.
 */
export const PATH_TO_SCREEN: Record<string, Screen> = {
  '/': 'home',
  '/home': 'home',
  '/transfer': 'transfer',
  '/history': 'transactions',
  '/practice': 'financialIndependence',
  '/accounts': 'savings',
};

export const SCREEN_TO_PATH: Partial<Record<Screen, string>> = {
  home: '/home',
  transfer: '/transfer',
  transactions: '/history',
  financialIndependence: '/practice',
  savings: '/accounts',
};

export const screenForPath = (pathname: string): Screen | null => PATH_TO_SCREEN[pathname] ?? null;
