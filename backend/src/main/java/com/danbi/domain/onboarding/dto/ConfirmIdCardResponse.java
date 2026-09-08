package com.danbi.domain.onboarding.dto;

public record ConfirmIdCardResponse(
	String issuanceId,
	String scanId,
	boolean confirmed,
	OnboardingStep onboardingStep
) {
}
