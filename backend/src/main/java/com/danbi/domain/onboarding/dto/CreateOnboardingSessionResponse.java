package com.danbi.domain.onboarding.dto;

public record CreateOnboardingSessionResponse(
	String onboardingSessionId,
	OnboardingStep onboardingStep,
	int estimatedMinutes
) {
}
