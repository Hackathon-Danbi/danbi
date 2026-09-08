package com.danbi.domain.onboarding.exception;

public class PhoneVerificationSessionMismatchException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_SESSION_MISMATCH";

	public PhoneVerificationSessionMismatchException() {
		super("가입 세션과 휴대폰 인증 세션이 일치하지 않습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
