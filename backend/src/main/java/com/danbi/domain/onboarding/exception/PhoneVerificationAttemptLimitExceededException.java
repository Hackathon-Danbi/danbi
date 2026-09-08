package com.danbi.domain.onboarding.exception;

public class PhoneVerificationAttemptLimitExceededException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_ATTEMPT_LIMIT_EXCEEDED";

	public PhoneVerificationAttemptLimitExceededException() {
		super("인증번호 입력 가능 횟수를 초과했습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
