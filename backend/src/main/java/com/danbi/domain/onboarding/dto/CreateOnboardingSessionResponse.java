package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.model.OnboardingStep;

public record CreateOnboardingSessionResponse(
	String onboardingSessionId,
	OnboardingStep onboardingStep,
	int estimatedMinutes
) {
}
