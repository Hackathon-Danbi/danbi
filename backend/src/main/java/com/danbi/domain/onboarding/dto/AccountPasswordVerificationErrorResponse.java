package com.danbi.domain.onboarding.dto;

public record AccountPasswordVerificationErrorResponse(
	String code,
	String message,
	int failureCount,
	int remainingAttempts
) {
}
