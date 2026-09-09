package com.danbi.domain.onboarding.exception;

import lombok.Getter;

@Getter
public class OneWonVerificationAttemptLimitExceededException extends RuntimeException {
	private static final String ERROR_CODE = "ONE_WON_VERIFICATION_ATTEMPT_LIMIT_EXCEEDED";

	private final int failureCount;

	public OneWonVerificationAttemptLimitExceededException(int failureCount) {
		super("1원 인증번호 입력 가능 횟수를 초과했습니다.");
		this.failureCount = failureCount;
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
