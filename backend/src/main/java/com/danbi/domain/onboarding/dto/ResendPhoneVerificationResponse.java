package com.danbi.domain.onboarding.dto;

public record ResendPhoneVerificationResponse(
	String onboardingSessionId,
	String verificationSessionId,
	int expiresInSeconds,
	int remainingRequestCount
) {
}
