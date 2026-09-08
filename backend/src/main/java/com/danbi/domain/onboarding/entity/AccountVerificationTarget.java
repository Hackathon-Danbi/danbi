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
@Table(name = "account_verification_targets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AccountVerificationTarget {

	@Id
	@Column(name = "account_verification_target_id", length = 35, nullable = false, updatable = false)
	private String accountVerificationTargetId;

	@Column(name = "issuance_id", length = 35, nullable = false, unique = true, updatable = false)
	private String issuanceId;

	@Column(name = "bank_code", length = 3, nullable = false)
	private String bankCode;

	@Column(name = "masked_account_number", length = 14, nullable = false)
	private String maskedAccountNumber;

	@Enumerated(EnumType.STRING)
	@Column(name = "verification_method", length = 20, nullable = false)
	private AccountVerificationMethod verificationMethod;

	@Enumerated(EnumType.STRING)
	@Column(name = "verification_status", length = 10, nullable = false)
	private AccountVerificationStatus verificationStatus;

	@Column(name = "verification_failure_count", nullable = false)
	private int verificationFailureCount;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	private AccountVerificationTarget(
		String accountVerificationTargetId,
		String issuanceId,
		String bankCode,
		String maskedAccountNumber,
		AccountVerificationMethod verificationMethod,
		AccountVerificationStatus verificationStatus,
		int verificationFailureCount,
		Instant createdAt,
		Instant updatedAt
	) {
		this.accountVerificationTargetId = accountVerificationTargetId;
		this.issuanceId = issuanceId;
		this.bankCode = bankCode;
		this.maskedAccountNumber = maskedAccountNumber;
		this.verificationMethod = verificationMethod;
		this.verificationStatus = verificationStatus;
		this.verificationFailureCount = verificationFailureCount;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public static AccountVerificationTarget create(
		String accountVerificationTargetId,
		String issuanceId,
		String bankCode,
		String maskedAccountNumber,
		AccountVerificationMethod verificationMethod,
		Instant now
	) {
		return new AccountVerificationTarget(
			accountVerificationTargetId,
			issuanceId,
			bankCode,
			maskedAccountNumber,
			verificationMethod,
			AccountVerificationStatus.PENDING,
			0,
			now,
			now
		);
	}

	public boolean isVerified() {
		return verificationStatus == AccountVerificationStatus.VERIFIED;
	}

	public boolean belongsTo(String issuanceId) {
		return this.issuanceId.equals(issuanceId);
	}

	public AccountVerificationTarget replace(
		String bankCode,
		String maskedAccountNumber,
		AccountVerificationMethod verificationMethod,
		Instant now
	) {
		this.bankCode = bankCode;
		this.maskedAccountNumber = maskedAccountNumber;
		this.verificationMethod = verificationMethod;
		this.verificationFailureCount = 0;
		this.updatedAt = now;
		return this;
	}

	public AccountVerificationTarget recordFailure(Instant now) {
		this.verificationFailureCount += 1;
		this.updatedAt = now;
		return this;
	}

	public AccountVerificationTarget markVerified(Instant now) {
		this.verificationStatus = AccountVerificationStatus.VERIFIED;
		this.updatedAt = now;
		return this;
	}
}
