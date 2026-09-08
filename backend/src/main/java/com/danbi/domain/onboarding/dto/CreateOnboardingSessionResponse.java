package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.OnboardingStep;

public record CreateOnboardingSessionResponse(
	String onboardingSessionId,
	OnboardingStep onboardingStep,
	int estimatedMinutes
) {
}
