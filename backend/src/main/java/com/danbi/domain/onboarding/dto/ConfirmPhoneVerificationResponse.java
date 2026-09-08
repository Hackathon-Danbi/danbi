package com.danbi.domain.onboarding.dto;

public record ConfirmPhoneVerificationResponse(
	String onboardingSessionId,
	String verificationSessionId,
	boolean identityVerified,
	OnboardingStep onboardingStep
) {
}
