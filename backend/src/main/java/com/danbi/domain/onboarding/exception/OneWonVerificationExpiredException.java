package com.danbi.domain.onboarding.exception;

public class OneWonVerificationExpiredException extends RuntimeException {
	private static final String ERROR_CODE = "ONE_WON_VERIFICATION_EXPIRED";

	public OneWonVerificationExpiredException() {
		super("1원 인증번호 유효시간이 만료되었습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
