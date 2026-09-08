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
@Table(name = "one_won_verifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OneWonVerification {

	@Id
	@Column(name = "account_verification_target_id", length = 35, nullable = false, updatable = false)
	private String accountVerificationTargetId;

	@Column(name = "issuance_id", length = 35, nullable = false, updatable = false)
	private String issuanceId;

	@Column(name = "verification_id", length = 35, nullable = false, unique = true)
	private String verificationId;

	@Column(name = "verification_code", length = 4, nullable = false)
	private String verificationCode;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "request_count", nullable = false)
	private int requestCount;

	@Column(name = "verification_attempt_count", nullable = false)
	private int verificationAttemptCount;

	@Column(name = "verified_at")
	private Instant verifiedAt;

	private OneWonVerification(
		String accountVerificationTargetId,
		String issuanceId,
		String verificationId,
		String verificationCode,
		Instant expiresAt
	) {
		this.accountVerificationTargetId = accountVerificationTargetId;
		this.issuanceId = issuanceId;
		this.verificationId = verificationId;
		this.verificationCode = verificationCode;
		this.expiresAt = expiresAt;
		this.requestCount = 1;
		this.verificationAttemptCount = 0;
		this.verifiedAt = null;
	}

	public static OneWonVerification start(
		String accountVerificationTargetId,
		String issuanceId,
		String verificationId,
		String verificationCode,
		Instant expiresAt
	) {
		return new OneWonVerification(
			accountVerificationTargetId,
			issuanceId,
			verificationId,
			verificationCode,
			expiresAt
		);
	}

	public OneWonVerification requestAgain(
		String verificationId,
		String verificationCode,
		Instant expiresAt
	) {
		this.verificationId = verificationId;
		this.verificationCode = verificationCode;
		this.expiresAt = expiresAt;
		this.requestCount += 1;
		this.verificationAttemptCount = 0;
		this.verifiedAt = null;
		return this;
	}

	public boolean isVerified() {
		return verifiedAt != null;
	}
}
