package com.danbi.domain.onboarding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

	protected OnboardingSession() {
	}

	private OnboardingSession(String id, String name) {
		this.id = id;
		this.name = name;
	}

	public static OnboardingSession start(String id) {
		return new OnboardingSession(id, null);
	}

	public OnboardingSession saveName(String name) {
		this.name = name.strip();
		return this;
	}

	public String id() {
		return id;
	}

	public String name() {
		return name;
	}
}
