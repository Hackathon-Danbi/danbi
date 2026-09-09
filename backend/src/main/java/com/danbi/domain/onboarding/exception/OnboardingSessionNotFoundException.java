package com.danbi.domain.onboarding.exception;

public class OnboardingSessionNotFoundException extends RuntimeException {
	private static final String ERROR_CODE = "ONBOARDING_SESSION_NOT_FOUND";

	public OnboardingSessionNotFoundException(String onboardingSessionId) {
		super("가입 세션을 찾을 수 없습니다: " + onboardingSessionId);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
