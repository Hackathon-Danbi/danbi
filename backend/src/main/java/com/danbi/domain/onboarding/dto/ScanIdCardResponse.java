package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.IdCardType;
import java.time.LocalDate;

public record ScanIdCardResponse(
	String issuanceId,
	String scanId,
	IdCardType idCardType,
	String recognizedName,
	String maskedIdNumber,
	LocalDate issueDate,
	OnboardingStep onboardingStep
) {
}
