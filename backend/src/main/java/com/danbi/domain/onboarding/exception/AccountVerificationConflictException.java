package com.danbi.domain.onboarding.exception;

public class AccountVerificationConflictException extends RuntimeException {
	private static final String ERROR_CODE = "ACCOUNT_VERIFICATION_CONFLICT";

	public AccountVerificationConflictException(String message) {
		super(message);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
