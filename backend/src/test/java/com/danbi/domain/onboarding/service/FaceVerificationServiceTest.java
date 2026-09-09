package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyFaceResponse;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.FaceCaptureStage;
import com.danbi.domain.onboarding.entity.FaceVerification;
import com.danbi.domain.onboarding.entity.FaceVerificationStatus;
import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.entity.IdCardType;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class FaceVerificationServiceTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String SCAN_ID = "scan_0123456789abcdef0123456789abcdef";
	private static final Instant NOW = Instant.parse("2026-09-08T12:00:00Z");

	private CertificateIssuanceRepository certificateIssuanceRepository;
	private IdCardScanRepository idCardScanRepository;
	private FaceVerificationRepository faceVerificationRepository;
	private FaceVerificationClient faceVerificationClient;
	private FaceVerificationService faceVerificationService;
	private AtomicReference<FaceVerification> storedVerification;
	private IdCardScan idCardScan;

	@BeforeEach
	void setUp() {
		certificateIssuanceRepository = mock(CertificateIssuanceRepository.class);
		idCardScanRepository = mock(IdCardScanRepository.class);
		faceVerificationRepository = mock(FaceVerificationRepository.class);
		faceVerificationClient = mock(FaceVerificationClient.class);
		Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
		faceVerificationService = new FaceVerificationService(
			certificateIssuanceRepository,
			idCardScanRepository,
			faceVerificationRepository,
			faceVerificationClient,
			clock
		);

		storedVerification = new AtomicReference<>();
		idCardScan = confirmedIdCardScan();
		when(certificateIssuanceRepository.findById(ISSUANCE_ID)).thenReturn(Optional.of(
			CertificateIssuance.start(ISSUANCE_ID, "ob_01", NOW)
		));
		when(idCardScanRepository.findByScanIdAndIssuanceId(SCAN_ID, ISSUANCE_ID))
			.thenReturn(Optional.of(idCardScan));
		when(faceVerificationRepository.findByIssuanceId(ISSUANCE_ID))
			.thenAnswer(invocation -> Optional.ofNullable(storedVerification.get()));
		when(faceVerificationRepository.save(any(FaceVerification.class)))
			.thenAnswer(invocation -> {
				FaceVerification verification = invocation.getArgument(0);
				storedVerification.set(verification);
				return verification;
			});
		when(faceVerificationClient.passesQuality(any(), any())).thenReturn(true);
		when(faceVerificationClient.matchesIdCard(any(), any())).thenReturn(true);
	}

	@Test
	void verifiesFourActualCaptureStagesInOrder() {
		VerifyFaceResponse initial = verify(FaceCaptureStage.FRONT_INITIAL);
		VerifyFaceResponse right = verify(FaceCaptureStage.RIGHT);
		VerifyFaceResponse left = verify(FaceCaptureStage.LEFT);
		VerifyFaceResponse finalFront = verify(FaceCaptureStage.FRONT_FINAL);

		assertThat(initial.nextStage()).isEqualTo(FaceCaptureStage.RIGHT);
		assertThat(right.nextStage()).isEqualTo(FaceCaptureStage.LEFT);
		assertThat(left.nextStage()).isEqualTo(FaceCaptureStage.FRONT_FINAL);
		assertThat(initial.verified()).isNull();
		assertThat(finalFront.completedStage()).isEqualTo(FaceCaptureStage.FRONT_FINAL);
		assertThat(finalFront.nextStage()).isNull();
		assertThat(finalFront.verified()).isTrue();
		assertThat(finalFront.comparisonFailureCount()).isZero();
		assertThat(finalFront.onboardingStep()).isEqualTo(OnboardingStep.ACCOUNT_VERIFICATION);
		assertThat(storedVerification.get().getVerificationStatus())
			.isEqualTo(FaceVerificationStatus.VERIFIED);
	}

	@Test
	void rejectsStartingFromAStageOtherThanInitialFront() {
		assertThatThrownBy(() -> verify(FaceCaptureStage.RIGHT))
			.isInstanceOf(FaceVerificationConflictException.class);
	}

	@Test
	void rejectsOutOfOrderCapture() {
		verify(FaceCaptureStage.FRONT_INITIAL);

		assertThatThrownBy(() -> verify(FaceCaptureStage.LEFT))
			.isInstanceOf(FaceVerificationConflictException.class);
		assertThat(storedVerification.get().getExpectedStage())
			.isEqualTo(FaceCaptureStage.RIGHT);
	}

	@Test
	void rejectsUnconfirmedIdCard() {
		idCardScan = recognizedIdCardScan();
		when(idCardScanRepository.findByScanIdAndIssuanceId(SCAN_ID, ISSUANCE_ID))
			.thenReturn(Optional.of(idCardScan));

		assertThatThrownBy(() -> verify(FaceCaptureStage.FRONT_INITIAL))
			.isInstanceOf(FaceVerificationConflictException.class);
	}

	@Test
	void leavesCurrentStageWhenQualityCheckFails() {
		when(faceVerificationClient.passesQuality(any(), any())).thenReturn(false);

		assertThatThrownBy(() -> verify(FaceCaptureStage.FRONT_INITIAL))
			.isInstanceOf(FaceQualityCheckFailedException.class);
		assertThat(storedVerification.get().getExpectedStage())
			.isEqualTo(FaceCaptureStage.FRONT_INITIAL);
		assertThat(storedVerification.get().getComparisonFailureCount()).isZero();
	}

	@Test
	void countsOnlyFinalComparisonFailureAndRestartsFromInitialFront() {
		verify(FaceCaptureStage.FRONT_INITIAL);
		verify(FaceCaptureStage.RIGHT);
		verify(FaceCaptureStage.LEFT);
		when(faceVerificationClient.matchesIdCard(any(), any())).thenReturn(false);

		VerifyFaceResponse response = verify(FaceCaptureStage.FRONT_FINAL);

		assertThat(response.verified()).isFalse();
		assertThat(response.nextStage()).isEqualTo(FaceCaptureStage.FRONT_INITIAL);
		assertThat(response.comparisonFailureCount()).isEqualTo(1);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.FACE_VERIFICATION);
		assertThat(storedVerification.get().getExpectedStage())
			.isEqualTo(FaceCaptureStage.FRONT_INITIAL);
	}

	@Test
	void rejectsAnotherCaptureAfterVerificationCompletes() {
		verify(FaceCaptureStage.FRONT_INITIAL);
		verify(FaceCaptureStage.RIGHT);
		verify(FaceCaptureStage.LEFT);
		verify(FaceCaptureStage.FRONT_FINAL);

		assertThatThrownBy(() -> verify(FaceCaptureStage.FRONT_INITIAL))
			.isInstanceOf(FaceVerificationConflictException.class);
	}

	@Test
	void rejectsEmptyOrUnsupportedImage() {
		MockMultipartFile empty = new MockMultipartFile(
			"faceImage",
			"empty.jpg",
			"image/jpeg",
			new byte[0]
		);
		MockMultipartFile pdf = new MockMultipartFile(
			"faceImage",
			"face.pdf",
			"application/pdf",
			"not-an-image".getBytes()
		);

		assertThatThrownBy(() -> faceVerificationService.verify(
			ISSUANCE_ID,
			SCAN_ID,
			FaceCaptureStage.FRONT_INITIAL,
			empty
		)).isInstanceOf(InvalidFaceImageException.class);
		assertThatThrownBy(() -> faceVerificationService.verify(
			ISSUANCE_ID,
			SCAN_ID,
			FaceCaptureStage.FRONT_INITIAL,
			pdf
		)).isInstanceOf(InvalidFaceImageException.class);
	}

	@Test
	void rejectsUnknownIssuanceOrScan() {
		assertThatThrownBy(() -> faceVerificationService.verify(
			"ci_missing",
			SCAN_ID,
			FaceCaptureStage.FRONT_INITIAL,
			jpegImage()
		)).isInstanceOf(CertificateIssuanceNotFoundException.class);

		when(idCardScanRepository.findByScanIdAndIssuanceId(SCAN_ID, ISSUANCE_ID))
			.thenReturn(Optional.empty());
		assertThatThrownBy(() -> verify(FaceCaptureStage.FRONT_INITIAL))
			.isInstanceOf(IdCardScanNotFoundException.class);
	}

	private VerifyFaceResponse verify(FaceCaptureStage captureStage) {
		return faceVerificationService.verify(
			ISSUANCE_ID,
			SCAN_ID,
			captureStage,
			jpegImage()
		);
	}

	private IdCardScan confirmedIdCardScan() {
		return recognizedIdCardScan().decideConfirmation(true, NOW);
	}

	private IdCardScan recognizedIdCardScan() {
		return IdCardScan.recognized(
			SCAN_ID,
			ISSUANCE_ID,
			IdCardType.RESIDENT_CARD,
			"박옥순",
			"900101-1******",
			LocalDate.of(2020, 3, 12),
			NOW
		);
	}

	private MockMultipartFile jpegImage() {
		return new MockMultipartFile(
			"faceImage",
			"face.jpg",
			"image/jpeg",
			"actual-camera-image".getBytes()
		);
	}
}
