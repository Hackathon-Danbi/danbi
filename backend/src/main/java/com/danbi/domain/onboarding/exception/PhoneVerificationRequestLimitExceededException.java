package com.danbi.domain.onboarding.exception;

public class PhoneVerificationRequestLimitExceededException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_REQUEST_LIMIT_EXCEEDED";

	public PhoneVerificationRequestLimitExceededException() {
		super("인증번호 요청 가능 횟수를 초과했습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
