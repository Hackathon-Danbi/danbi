package com.danbi.domain.onboarding.dto;

public record RequestOneWonVerificationResponse(
	String issuanceId,
	String accountVerificationTargetId,
	String verificationId,
	int expiresInSeconds,
	OnboardingStep onboardingStep
) {
}
