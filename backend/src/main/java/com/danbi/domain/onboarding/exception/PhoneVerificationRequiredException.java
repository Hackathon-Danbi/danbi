package com.danbi.domain.onboarding.exception;

public class PhoneVerificationRequiredException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_REQUIRED";

	public PhoneVerificationRequiredException() {
		super("휴대폰 본인인증을 먼저 완료해야 합니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
