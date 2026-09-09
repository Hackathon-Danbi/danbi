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
@Table(name = "face_verifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FaceVerification {

	@Id
	@Column(name = "face_verification_id", length = 35, nullable = false, updatable = false)
	private String faceVerificationId;

	@Column(name = "issuance_id", length = 35, nullable = false, unique = true, updatable = false)
	private String issuanceId;

	@Column(name = "scan_id", length = 37, nullable = false, updatable = false)
	private String scanId;

	@Enumerated(EnumType.STRING)
	@Column(name = "expected_stage", length = 20, nullable = false)
	private FaceCaptureStage expectedStage;

	@Enumerated(EnumType.STRING)
	@Column(name = "verification_status", length = 15, nullable = false)
	private FaceVerificationStatus verificationStatus;

	@Column(name = "comparison_failure_count", nullable = false)
	private int comparisonFailureCount;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	private FaceVerification(
		String faceVerificationId,
		String issuanceId,
		String scanId,
		FaceCaptureStage expectedStage,
		FaceVerificationStatus verificationStatus,
		int comparisonFailureCount,
		Instant createdAt,
		Instant updatedAt
	) {
		this.faceVerificationId = faceVerificationId;
		this.issuanceId = issuanceId;
		this.scanId = scanId;
		this.expectedStage = expectedStage;
		this.verificationStatus = verificationStatus;
		this.comparisonFailureCount = comparisonFailureCount;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public static FaceVerification start(
		String faceVerificationId,
		String issuanceId,
		String scanId,
		Instant now
	) {
		return new FaceVerification(
			faceVerificationId,
			issuanceId,
			scanId,
			FaceCaptureStage.FRONT_INITIAL,
			FaceVerificationStatus.IN_PROGRESS,
			0,
			now,
			now
		);
	}

	public boolean belongsTo(String scanId) {
		return this.scanId.equals(scanId);
	}

	public boolean expects(FaceCaptureStage captureStage) {
		return expectedStage == captureStage;
	}

	public boolean isVerified() {
		return verificationStatus == FaceVerificationStatus.VERIFIED;
	}

	public FaceVerification advance(Instant now) {
		this.expectedStage = expectedStage.next();
		this.updatedAt = now;
		return this;
	}

	public FaceVerification complete(Instant now) {
		this.verificationStatus = FaceVerificationStatus.VERIFIED;
		this.updatedAt = now;
		return this;
	}

	public FaceVerification resetAfterComparisonFailure(Instant now) {
		this.comparisonFailureCount += 1;
		this.expectedStage = FaceCaptureStage.FRONT_INITIAL;
		this.updatedAt = now;
		return this;
	}
}
