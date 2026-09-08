package com.danbi.domain.onboarding.exception;

public class OneWonVerificationRequestLimitExceededException extends RuntimeException {
	private static final String ERROR_CODE = "ONE_WON_VERIFICATION_REQUEST_LIMIT_EXCEEDED";

	public OneWonVerificationRequestLimitExceededException() {
		super("1원 인증 요청 가능 횟수를 초과했습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
