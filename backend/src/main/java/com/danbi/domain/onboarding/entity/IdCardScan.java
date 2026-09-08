package com.danbi.domain.onboarding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "id_card_scans")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class IdCardScan {

	@Id
	@Column(name = "scan_id", length = 37, nullable = false, updatable = false)
	private String scanId;

	@Column(name = "issuance_id", length = 35, nullable = false, updatable = false)
	private String issuanceId;

	@Enumerated(EnumType.STRING)
	@Column(name = "id_card_type", length = 20, nullable = false, updatable = false)
	private IdCardType idCardType;

	@Column(name = "recognized_name", length = 50, nullable = false, updatable = false)
	private String recognizedName;

	@Column(name = "masked_id_number", length = 20, nullable = false, updatable = false)
	private String maskedIdNumber;

	@Column(name = "issue_date", nullable = false, updatable = false)
	private LocalDate issueDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "confirmation_status", length = 10, nullable = false)
	private IdCardConfirmationStatus confirmationStatus;

	@Column(name = "confirmation_decided_at")
	private Instant confirmationDecidedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	private IdCardScan(
		String scanId,
		String issuanceId,
		IdCardType idCardType,
		String recognizedName,
		String maskedIdNumber,
		LocalDate issueDate,
		IdCardConfirmationStatus confirmationStatus,
		Instant confirmationDecidedAt,
		Instant createdAt
	) {
		this.scanId = scanId;
		this.issuanceId = issuanceId;
		this.idCardType = idCardType;
		this.recognizedName = recognizedName;
		this.maskedIdNumber = maskedIdNumber;
		this.issueDate = issueDate;
		this.confirmationStatus = confirmationStatus;
		this.confirmationDecidedAt = confirmationDecidedAt;
		this.createdAt = createdAt;
	}

	public static IdCardScan recognized(
		String scanId,
		String issuanceId,
		IdCardType idCardType,
		String recognizedName,
		String maskedIdNumber,
		LocalDate issueDate,
		Instant createdAt
	) {
		return new IdCardScan(
			scanId,
			issuanceId,
			idCardType,
			recognizedName,
			maskedIdNumber,
			issueDate,
			IdCardConfirmationStatus.PENDING,
			null,
			createdAt
		);
	}

	public boolean hasConfirmationDecision() {
		return confirmationStatus != IdCardConfirmationStatus.PENDING;
	}

	public boolean hasConfirmationDecision(boolean confirmed) {
		return confirmationStatus == statusOf(confirmed);
	}

	public IdCardScan decideConfirmation(boolean confirmed, Instant decidedAt) {
		this.confirmationStatus = statusOf(confirmed);
		this.confirmationDecidedAt = decidedAt;
		return this;
	}

	private IdCardConfirmationStatus statusOf(boolean confirmed) {
		return confirmed
			? IdCardConfirmationStatus.CONFIRMED
			: IdCardConfirmationStatus.REJECTED;
	}
}
