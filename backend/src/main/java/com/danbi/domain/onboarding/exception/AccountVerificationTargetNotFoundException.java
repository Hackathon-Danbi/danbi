package com.danbi.domain.onboarding.exception;

public class AccountVerificationTargetNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "ACCOUNT_VERIFICATION_TARGET_NOT_FOUND";

	public AccountVerificationTargetNotFoundException(String accountVerificationTargetId) {
		super("계좌 인증 대상을 찾을 수 없습니다: " + accountVerificationTargetId);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
