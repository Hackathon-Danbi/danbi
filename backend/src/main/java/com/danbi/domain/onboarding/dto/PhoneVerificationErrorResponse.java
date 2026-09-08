package com.danbi.domain.onboarding.dto;

public record PhoneVerificationErrorResponse(
	String code,
	String message,
	int remainingAttemptCount
) {
}
