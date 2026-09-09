package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConfirmOneWonVerificationRequest(
	@NotBlank
	String issuanceId,

	@NotBlank
	String verificationId,

	@NotBlank
	@Pattern(regexp = "\\d{4}", message = "1원 인증번호는 숫자 4자리여야 합니다.")
	String verificationCode
) {
}
