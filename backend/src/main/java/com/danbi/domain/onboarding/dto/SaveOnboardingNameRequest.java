package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveOnboardingNameRequest(
	@NotBlank String onboardingSessionId,
	@NotBlank String name
) {
}
