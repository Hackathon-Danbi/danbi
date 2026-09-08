package com.danbi.domain.onboarding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "phone_verification_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhoneVerificationSession {

	@Id
	@Column(name = "verification_session_id", length = 35, nullable = false, updatable = false)
	private String verificationSessionId;

	@Column(name = "onboarding_session_id", length = 35, nullable = false, unique = true)
	private String onboardingSessionId;

	@Enumerated(EnumType.STRING)
	@Column(name = "carrier", length = 20, nullable = false)
	private PhoneCarrier carrier;

	@Column(name = "phone_number", length = 11, nullable = false)
	private String phoneNumber;

	@Column(name = "verification_code", length = 6, nullable = false)
	private String verificationCode;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "request_count", nullable = false)
	private int requestCount;

	private PhoneVerificationSession(
		String verificationSessionId,
		String onboardingSessionId,
		PhoneCarrier carrier,
		String phoneNumber,
		String verificationCode,
		Instant expiresAt,
		int requestCount
	) {
		this.verificationSessionId = verificationSessionId;
		this.onboardingSessionId = onboardingSessionId;
		this.carrier = carrier;
		this.phoneNumber = phoneNumber;
		this.verificationCode = verificationCode;
		this.expiresAt = expiresAt;
		this.requestCount = requestCount;
	}

	public static PhoneVerificationSession start(
		String verificationSessionId,
		String onboardingSessionId,
		PhoneCarrier carrier,
		String phoneNumber,
		String verificationCode,
		Instant expiresAt
	) {
		return new PhoneVerificationSession(
			verificationSessionId,
			onboardingSessionId,
			carrier,
			phoneNumber,
			verificationCode,
			expiresAt,
			1
		);
	}

	public PhoneVerificationSession requestAgain(
		PhoneCarrier carrier,
		String phoneNumber,
		String verificationCode,
		Instant expiresAt
	) {
		this.carrier = carrier;
		this.phoneNumber = phoneNumber;
		this.verificationCode = verificationCode;
		this.expiresAt = expiresAt;
		this.requestCount++;
		return this;
	}

	public PhoneVerificationSession resend(
		String verificationCode,
		Instant expiresAt
	) {
		this.verificationCode = verificationCode;
		this.expiresAt = expiresAt;
		this.requestCount++;
		return this;
	}
}
