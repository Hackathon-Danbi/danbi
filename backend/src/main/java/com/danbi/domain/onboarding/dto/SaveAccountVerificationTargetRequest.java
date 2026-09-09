package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SaveAccountVerificationTargetRequest(
	@NotBlank String issuanceId,
	@NotBlank
	@Pattern(regexp = "^\\d{3}$")
	String bankCode,
	@NotBlank
	@Pattern(regexp = "^\\d{10,14}$")
	String accountNumber
) {
}
