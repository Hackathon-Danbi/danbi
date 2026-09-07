package com.danbi.domain.onboarding.model;

public record OnboardingSession(
	String id,
	String name,
	OnboardingStep step
) {

	public static OnboardingSession start(String id) {
		return new OnboardingSession(id, null, OnboardingStep.NAME_INPUT);
	}

	public OnboardingSession saveName(String name) {
		return new OnboardingSession(id, name.strip(), OnboardingStep.PHONE_OWNERSHIP);
	}
}
