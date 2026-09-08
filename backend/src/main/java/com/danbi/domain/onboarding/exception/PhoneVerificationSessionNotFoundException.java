package com.danbi.domain.onboarding.exception;

public class PhoneVerificationSessionNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_SESSION_NOT_FOUND";

	public PhoneVerificationSessionNotFoundException(String verificationSessionId) {
		super("휴대폰 인증 세션을 찾을 수 없습니다: " + verificationSessionId);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
