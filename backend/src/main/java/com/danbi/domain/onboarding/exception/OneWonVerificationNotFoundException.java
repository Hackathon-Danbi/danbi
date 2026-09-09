package com.danbi.domain.onboarding.exception;

public class OneWonVerificationNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "ONE_WON_VERIFICATION_NOT_FOUND";

	public OneWonVerificationNotFoundException(String accountVerificationTargetId) {
		super("1원 인증 요청을 찾을 수 없습니다: " + accountVerificationTargetId);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
