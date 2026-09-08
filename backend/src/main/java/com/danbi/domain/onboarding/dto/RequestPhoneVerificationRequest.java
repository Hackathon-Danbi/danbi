package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.PhoneCarrier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RequestPhoneVerificationRequest(
	@NotBlank String onboardingSessionId,
	@NotNull PhoneCarrier carrier,
	@NotBlank
	@Pattern(regexp = "^010\\d{8}$")
	String phoneNumber
) {
}
