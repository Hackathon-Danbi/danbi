package com.danbi.domain.onboarding.dto;

public record StartCertificateIssuanceResponse(
	String onboardingSessionId,
	String issuanceId,
	OnboardingStep onboardingStep
) {
}
