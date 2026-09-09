package com.danbi.domain.onboarding.dto;

public record SetSimplePasswordResponse(
	String issuanceId,
	boolean certificateIssued,
	OnboardingStep onboardingStep
) {
}
