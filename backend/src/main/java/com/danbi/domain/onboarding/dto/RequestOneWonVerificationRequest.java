package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestOneWonVerificationRequest(
	@NotBlank
	String issuanceId
) {
}
