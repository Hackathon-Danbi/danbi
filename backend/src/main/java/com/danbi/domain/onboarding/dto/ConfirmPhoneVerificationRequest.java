package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConfirmPhoneVerificationRequest(
	@NotBlank String onboardingSessionId,
	@NotBlank String verificationSessionId,
	@NotBlank
	@Pattern(regexp = "^\\d{6}$")
	String verificationCode
) {
}
