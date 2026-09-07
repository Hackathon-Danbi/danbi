package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.model.OnboardingStep;

public record SaveOnboardingNameResponse(
	String onboardingSessionId,
	String name,
	OnboardingStep onboardingStep
) {
}
