package com.danbi.domain.onboarding.exception;

import com.danbi.domain.onboarding.controller.OnboardingNameController;
import com.danbi.domain.onboarding.controller.OnboardingSessionController;
import com.danbi.domain.onboarding.dto.OnboardingErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = {OnboardingSessionController.class, OnboardingNameController.class})
public class OnboardingExceptionHandler {

	@ExceptionHandler(OnboardingSessionNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleSessionNotFound(OnboardingSessionNotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}
}
