package com.danbi.domain.onboarding.dto;

public record RequestPhoneVerificationResponse(
	String onboardingSessionId,
	String verificationSessionId,
	int expiresInSeconds,
	int remainingRequestCount,
	OnboardingStep onboardingStep
) {
}
