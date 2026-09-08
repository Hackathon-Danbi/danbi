package com.danbi.domain.onboarding.dto;

public record ConfirmOneWonVerificationResponse(
	String issuanceId,
	String accountVerificationTargetId,
	String verificationId,
	boolean verified,
	int failureCount,
	int remainingAttempts,
	OnboardingStep onboardingStep
) {
}
