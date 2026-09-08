package com.danbi.domain.onboarding.exception;

public class PhoneVerificationExpiredException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_EXPIRED";

	public PhoneVerificationExpiredException() {
		super("인증번호 유효시간이 만료되었습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
