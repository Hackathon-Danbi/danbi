import type { Href } from 'expo-router';

export type DisplayMode = 'danbi' | 'standard';

export type OnboardingDestination = 'practice' | 'accounts' | 'home';

export const ONBOARDING_DESTINATION_ROUTES: Record<OnboardingDestination, Href> = {
  practice: '/(app)/practice',
  accounts: '/(app)/accounts',
  home: '/(app)/home',
};

/**
 * 시연용 진입. 가입·모드 완료를 저장하지 않으므로 항상 웰컴부터 시작한다.
 */
export function resolveEntryRoute(
  _displayMode?: DisplayMode | null,
  _onboardingDone?: boolean,
  _lock?: { pinRegistered: boolean; unlocked: boolean },
): Href {
  return '/welcome';
}
