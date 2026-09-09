package com.danbi.domain.onboarding.exception;

import lombok.Getter;

@Getter
public class AccountPasswordVerificationLockedException extends RuntimeException {
	private static final String ERROR_CODE = "ACCOUNT_PASSWORD_VERIFICATION_LOCKED";

	private final int failureCount;

	public AccountPasswordVerificationLockedException(int failureCount) {
		super("계좌 비밀번호 확인 횟수를 초과했습니다.");
		this.failureCount = failureCount;
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
