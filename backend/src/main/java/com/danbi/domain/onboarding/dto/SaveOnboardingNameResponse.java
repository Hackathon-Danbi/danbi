package com.danbi.domain.onboarding.dto;

public record SaveOnboardingNameResponse(
	String onboardingSessionId,
	String name,
	OnboardingStep onboardingStep
) {
}
