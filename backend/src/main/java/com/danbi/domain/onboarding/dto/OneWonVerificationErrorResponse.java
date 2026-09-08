package com.danbi.domain.onboarding.dto;

public record OneWonVerificationErrorResponse(
	String code,
	String message,
	int failureCount,
	int remainingAttempts
) {
}
