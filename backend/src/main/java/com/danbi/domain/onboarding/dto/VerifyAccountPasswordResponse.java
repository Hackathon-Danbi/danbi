package com.danbi.domain.onboarding.dto;

public record VerifyAccountPasswordResponse(
	String issuanceId,
	String accountVerificationTargetId,
	boolean verified,
	int failureCount,
	int remainingAttempts,
	OnboardingStep onboardingStep
) {
}
