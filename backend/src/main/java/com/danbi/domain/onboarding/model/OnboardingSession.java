package com.danbi.domain.onboarding.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "onboarding_sessions")
public class OnboardingSession {

	@Id
	@Column(name = "onboarding_session_id", length = 35, nullable = false, updatable = false)
	private String id;

	@Column(name = "name", length = 50)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "onboarding_step", length = 40, nullable = false)
	private OnboardingStep step;

	protected OnboardingSession() {
	}

	private OnboardingSession(String id, String name, OnboardingStep step) {
		this.id = id;
		this.name = name;
		this.step = step;
	}

	public static OnboardingSession start(String id) {
		return new OnboardingSession(id, null, OnboardingStep.NAME_INPUT);
	}

	public OnboardingSession saveName(String name) {
		this.name = name.strip();
		this.step = OnboardingStep.PHONE_OWNERSHIP;
		return this;
	}

	public String id() {
		return id;
	}

	public String name() {
		return name;
	}

	public OnboardingStep step() {
		return step;
	}
}
