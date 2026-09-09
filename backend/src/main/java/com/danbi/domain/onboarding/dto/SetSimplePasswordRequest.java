package com.danbi.domain.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SetSimplePasswordRequest(
	@NotBlank
	String issuanceId,

	@NotBlank
	@Pattern(regexp = "\\d{6}", message = "간편비밀번호는 숫자 6자리여야 합니다.")
	String password,

	@NotBlank
	@Pattern(regexp = "\\d{6}", message = "간편비밀번호 확인은 숫자 6자리여야 합니다.")
	String passwordConfirm
) {
}
