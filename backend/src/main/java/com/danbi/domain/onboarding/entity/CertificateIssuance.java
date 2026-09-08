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
@Table(name = "certificate_issuances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificateIssuance {

	@Id
	@Column(name = "issuance_id", length = 35, nullable = false, updatable = false)
	private String issuanceId;

	@Column(name = "onboarding_session_id", length = 35, nullable = false, unique = true)
	private String onboardingSessionId;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	private CertificateIssuance(
		String issuanceId,
		String onboardingSessionId,
		Instant createdAt
	) {
		this.issuanceId = issuanceId;
		this.onboardingSessionId = onboardingSessionId;
		this.createdAt = createdAt;
	}

	public static CertificateIssuance start(
		String issuanceId,
		String onboardingSessionId,
		Instant createdAt
	) {
		return new CertificateIssuance(issuanceId, onboardingSessionId, createdAt);
	}
}
