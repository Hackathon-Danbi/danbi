package com.danbi.domain.onboarding.dto;

public record OnboardingErrorResponse(
	String code,
	String message
) {
}
