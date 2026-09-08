package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public record StartCertificateIssuanceRequest(
	@NotBlank String onboardingSessionId
) {
}
