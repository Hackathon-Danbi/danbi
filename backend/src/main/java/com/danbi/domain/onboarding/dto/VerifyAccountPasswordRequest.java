package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyAccountPasswordRequest(
	@NotBlank
	String issuanceId,

	@NotBlank
	@Pattern(regexp = "\\d{4}", message = "계좌 비밀번호는 숫자 4자리여야 합니다.")
	String accountPassword
) {
}
