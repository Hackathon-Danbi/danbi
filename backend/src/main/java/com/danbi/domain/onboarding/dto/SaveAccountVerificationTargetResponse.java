package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.AccountVerificationMethod;

public record SaveAccountVerificationTargetResponse(
	String issuanceId,
	String accountVerificationTargetId,
	String bankCode,
	String bankName,
	String maskedAccountNumber,
	AccountVerificationMethod verificationMethod,
	OnboardingStep onboardingStep
) {
}
