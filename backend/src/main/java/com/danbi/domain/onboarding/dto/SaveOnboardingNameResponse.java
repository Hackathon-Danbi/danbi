package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.OnboardingStep;

public record SaveOnboardingNameResponse(
	String onboardingSessionId,
	String name,
	OnboardingStep onboardingStep
) {
}
