package com.danbi.domain.onboarding.exception;

public class OnboardingCompletionConflictException extends RuntimeException {
	private static final String ERROR_CODE = "ONBOARDING_NOT_COMPLETED";

	public OnboardingCompletionConflictException(String message) {
		super(message);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
