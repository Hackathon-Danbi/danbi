package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmIdCardRequest(
	@NotBlank String issuanceId,
	@NotBlank String scanId,
	@NotNull Boolean confirmed
) {
}
