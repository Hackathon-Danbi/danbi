package com.danbi.domain.onboarding.dto;

import com.danbi.domain.onboarding.entity.FaceCaptureStage;

public record VerifyFaceResponse(
	String issuanceId,
	FaceCaptureStage completedStage,
	FaceCaptureStage nextStage,
	Boolean verified,
	int comparisonFailureCount,
	OnboardingStep onboardingStep
) {
}
