package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyFaceResponse;
import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.entity.FaceVerification;
import com.danbi.domain.onboarding.entity.IdCardConfirmationStatus;
import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.FaceQualityCheckFailedException;
import com.danbi.domain.onboarding.exception.FaceVerificationConflictException;
import com.danbi.domain.onboarding.exception.IdCardScanNotFoundException;
import com.danbi.domain.onboarding.exception.InvalidFaceImageException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.FaceVerificationRepository;
import com.danbi.domain.onboarding.repository.IdCardScanRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaceVerificationService {

	private static final String VERIFICATION_ID_PREFIX = "fv_";
	private static final Set<String> SUPPORTED_CONTENT_TYPES = Set.of(
		MediaType.IMAGE_JPEG_VALUE,
		MediaType.IMAGE_PNG_VALUE
	);

	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final IdCardScanRepository idCardScanRepository;
	private final FaceVerificationRepository faceVerificationRepository;
	private final FaceVerificationClient faceVerificationClient;
	private final Clock clock;

	@Transactional
	public VerifyFaceResponse verify(
		String issuanceId,
		String scanId,
		FaceCaptureStage captureStage,
		MultipartFile faceImage
	) {
		validateImage(faceImage);
		certificateIssuanceRepository.findById(issuanceId)
			.orElseThrow(() -> new CertificateIssuanceNotFoundException(issuanceId));
		IdCardScan idCardScan = idCardScanRepository
			.findByScanIdAndIssuanceId(scanId, issuanceId)
			.orElseThrow(IdCardScanNotFoundException::new);
		validateConfirmedIdCard(idCardScan);

		FaceVerification verification = faceVerificationRepository.findByIssuanceId(issuanceId)
			.orElseGet(() -> startVerification(issuanceId, scanId, captureStage));
		validateCurrentState(verification, scanId, captureStage);

		if (!faceVerificationClient.passesQuality(captureStage, faceImage)) {
			throw new FaceQualityCheckFailedException();
		}

		Instant now = Instant.now(clock);
		if (!captureStage.isFinal()) {
			verification.advance(now);
			return response(verification, captureStage, null);
		}

		boolean verified = faceVerificationClient.matchesIdCard(idCardScan, faceImage);
		if (verified) {
			verification.complete(now);
		} else {
			verification.resetAfterComparisonFailure(now);
		}
		return response(verification, captureStage, verified);
	}

	private FaceVerification startVerification(
		String issuanceId,
		String scanId,
		FaceCaptureStage captureStage
	) {
		if (captureStage != FaceCaptureStage.FRONT_INITIAL) {
			throw new FaceVerificationConflictException(
				"얼굴 인증은 최초 정면 촬영부터 시작해야 합니다."
			);
		}
		return faceVerificationRepository.save(FaceVerification.start(
			generateVerificationId(),
			issuanceId,
			scanId,
			Instant.now(clock)
		));
	}

	private void validateConfirmedIdCard(IdCardScan idCardScan) {
		if (idCardScan.getConfirmationStatus() != IdCardConfirmationStatus.CONFIRMED) {
			throw new FaceVerificationConflictException(
				"확정된 신분증 정보가 있어야 얼굴 인증을 시작할 수 있습니다."
			);
		}
	}

	private void validateCurrentState(
		FaceVerification verification,
		String scanId,
		FaceCaptureStage captureStage
	) {
		if (!verification.belongsTo(scanId)) {
			throw new FaceVerificationConflictException(
				"얼굴 인증을 시작한 신분증 인식 정보와 요청이 일치하지 않습니다."
			);
		}
		if (verification.isVerified()) {
			throw new FaceVerificationConflictException("얼굴 인증이 이미 완료되었습니다.");
		}
		if (!verification.expects(captureStage)) {
			throw new FaceVerificationConflictException(
				"현재 촬영해야 하는 얼굴 단계와 요청이 일치하지 않습니다."
			);
		}
	}

	private void validateImage(MultipartFile faceImage) {
		if (faceImage == null || faceImage.isEmpty()) {
			throw new InvalidFaceImageException("얼굴 이미지가 비어 있습니다.");
		}
		if (!SUPPORTED_CONTENT_TYPES.contains(faceImage.getContentType())) {
			throw new InvalidFaceImageException("JPG 또는 PNG 이미지만 업로드할 수 있습니다.");
		}
	}

	private VerifyFaceResponse response(
		FaceVerification verification,
		FaceCaptureStage completedStage,
		Boolean verified
	) {
		return new VerifyFaceResponse(
			verification.getIssuanceId(),
			completedStage,
			verification.isVerified() ? null : verification.getExpectedStage(),
			verified,
			verification.getComparisonFailureCount(),
			verification.isVerified()
				? OnboardingStep.ACCOUNT_VERIFICATION
				: OnboardingStep.FACE_VERIFICATION
		);
	}

	private String generateVerificationId() {
		return VERIFICATION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
