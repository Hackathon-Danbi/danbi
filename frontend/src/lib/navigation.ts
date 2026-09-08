import type { Href } from 'expo-router';

export type DisplayMode = 'danbi' | 'standard';

export type OnboardingDestination = 'practice' | 'accounts' | 'home';

export const ONBOARDING_DESTINATION_ROUTES: Record<OnboardingDestination, Href> = {
  practice: '/(app)/practice',
  accounts: '/(app)/accounts',
  home: '/(app)/home',
};

export function resolveEntryRoute(
  displayMode: DisplayMode | null,
  onboardingDone: boolean,
): Href {
  if (!displayMode) return '/welcome';
  return onboardingDone ? '/(app)/home' : '/join';
}
