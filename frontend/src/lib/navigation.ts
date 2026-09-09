import type { Href } from 'expo-router';

export type DisplayMode = 'danbi' | 'standard';

export type OnboardingDestination = 'practice' | 'accounts' | 'home';

export const ONBOARDING_DESTINATION_ROUTES: Record<OnboardingDestination, Href> = {
  practice: '/(app)/practice',
  accounts: '/(app)/accounts',
  home: '/(app)/home',
};

/**
 * 진입 라우트 판별.
 *
 *   displayMode 없음                        → /welcome
 *   온보딩 미완료                            → /join
 *   비밀번호 저장됨 + 이번 실행에서 미확인   → /login
 *   그 밖                                    → /(app)/home
 */
export function resolveEntryRoute(
  displayMode: DisplayMode | null,
  onboardingDone: boolean,
  lock?: { pinRegistered: boolean; unlocked: boolean },
): Href {
  if (!displayMode) return '/welcome';
  if (!onboardingDone) return '/join';
  if (lock && lock.pinRegistered && !lock.unlocked) return '/login';
  return '/(app)/home';
}
