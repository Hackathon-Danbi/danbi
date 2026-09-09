package com.danbi.domain.onboarding.exception;

import com.danbi.domain.onboarding.dto.OnboardingStep;
public class InvalidOnboardingStepException extends RuntimeException {
	private static final String ERROR_CODE = "INVALID_ONBOARDING_STEP";

	public InvalidOnboardingStepException(OnboardingStep requiredStep) {
		super("선행 가입 절차를 먼저 완료해야 합니다: " + requiredStep);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
