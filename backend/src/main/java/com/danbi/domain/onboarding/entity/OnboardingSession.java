package com.danbi.domain.onboarding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "onboarding_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OnboardingSession {

	@Id
	@Column(name = "onboarding_session_id", length = 35, nullable = false, updatable = false)
	private String onboardingSessionId;

	@Column(name = "name", length = 50)
	private String name;

	private OnboardingSession(String onboardingSessionId, String name) {
		this.onboardingSessionId = onboardingSessionId;
		this.name = name;
	}

	public static OnboardingSession start(String onboardingSessionId) {
		return new OnboardingSession(onboardingSessionId, null);
	}

	public OnboardingSession saveName(String name) {
		this.name = name.strip();
		return this;
	}
}
