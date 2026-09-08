package com.danbi.domain.onboarding.service;

import java.time.LocalDate;

public record IdCardOcrResult(
	String recognizedName,
	String maskedIdNumber,
	LocalDate issueDate
) {
}
