package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendPhoneVerificationRequest(
	@NotBlank String onboardingSessionId,
	@NotBlank String verificationSessionId
) {
}
