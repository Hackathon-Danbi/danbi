package com.danbi.domain.onboarding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
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

	@Column(name = "user_id", unique = true)
	private Long userId;

	@Column(name = "completed_at")
	private Instant completedAt;

	private OnboardingSession(
		String onboardingSessionId,
		String name,
		Long userId,
		Instant completedAt
	) {
		this.onboardingSessionId = onboardingSessionId;
		this.name = name;
		this.userId = userId;
		this.completedAt = completedAt;
	}

	public static OnboardingSession start(String onboardingSessionId) {
		return new OnboardingSession(onboardingSessionId, null, null, null);
	}

	public OnboardingSession saveName(String name) {
		this.name = name.strip();
		return this;
	}

	public boolean isCompleted() {
		return completedAt != null;
	}

	public OnboardingSession complete(Long userId, Instant completedAt) {
		this.userId = userId;
		this.completedAt = completedAt;
		return this;
	}
}
