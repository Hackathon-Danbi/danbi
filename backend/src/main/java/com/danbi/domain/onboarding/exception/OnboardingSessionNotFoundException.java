package com.danbi.domain.onboarding.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class OnboardingSessionNotFoundException extends RuntimeException {

	public OnboardingSessionNotFoundException(String onboardingSessionId) {
		super("가입 세션을 찾을 수 없습니다: " + onboardingSessionId);
	}
}
