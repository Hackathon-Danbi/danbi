package com.danbi.domain.onboarding.dto;

public record GetOnboardingCompletionResponse(
	String onboardingSessionId,
	Long userId,
	String name,
	boolean certificateIssued,
	OnboardingStep onboardingStep
) {
}
