package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.ConfirmIdCardRequest;
import com.danbi.domain.onboarding.dto.ConfirmIdCardResponse;
import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.ScanIdCardResponse;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.entity.IdCardConfirmationStatus;
import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.IdCardConfirmationConflictException;
import com.danbi.domain.onboarding.exception.IdCardScanNotFoundException;
import com.danbi.domain.onboarding.repository.IdCardScanRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@ActiveProfiles("dev")
class IdCardConfirmationServiceTest {

	@Autowired
	private OnboardingSessionService onboardingSessionService;

	@Autowired
	private PhoneVerificationService phoneVerificationService;

	@Autowired
	private CertificateIssuanceService certificateIssuanceService;

	@Autowired
	private IdCardScanService idCardScanService;

	@Autowired
	private IdCardScanRepository idCardScanRepository;

	@Test
	void confirmsIdCardAndMovesToFaceVerification() {
		ScannedIdCard scanned = createScannedIdCard();

		ConfirmIdCardResponse response = idCardScanService.confirm(
			request(scanned, true)
		);

		assertThat(response.confirmed()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.FACE_VERIFICATION);
		IdCardScan stored = idCardScanRepository.findById(scanned.scanId()).orElseThrow();
		assertThat(stored.getConfirmationStatus())
			.isEqualTo(IdCardConfirmationStatus.CONFIRMED);
		assertThat(stored.getConfirmationDecidedAt()).isNotNull();
	}

	@Test
	void rejectsIdCardAndRecordsRetakeCount() {
		ScannedIdCard scanned = createScannedIdCard();

		ConfirmIdCardResponse response = idCardScanService.confirm(
			request(scanned, false)
		);

		assertThat(response.confirmed()).isFalse();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.ID_CARD_SCAN);
		assertThat(idCardScanRepository.countByIssuanceIdAndConfirmationStatus(
			scanned.issuanceId(),
			IdCardConfirmationStatus.REJECTED
		)).isEqualTo(1);
	}

	@Test
	void acceptsSameConfirmationAgainIdempotently() {
		ScannedIdCard scanned = createScannedIdCard();
		ConfirmIdCardRequest request = request(scanned, true);

		ConfirmIdCardResponse first = idCardScanService.confirm(request);
		ConfirmIdCardResponse second = idCardScanService.confirm(request);

		assertThat(second).isEqualTo(first);
		assertThat(idCardScanRepository.countByIssuanceIdAndConfirmationStatus(
			scanned.issuanceId(),
			IdCardConfirmationStatus.CONFIRMED
		)).isEqualTo(1);
	}

	@Test
	void rejectsChangingAnExistingDecision() {
		ScannedIdCard scanned = createScannedIdCard();
		idCardScanService.confirm(request(scanned, false));

		assertThatThrownBy(() -> idCardScanService.confirm(request(scanned, true)))
			.isInstanceOf(IdCardConfirmationConflictException.class);
	}

	@Test
	void rejectsConfirmingAnotherScanAfterIssuanceIsConfirmed() {
		ScannedIdCard first = createScannedIdCard();
		ScanIdCardResponse second = idCardScanService.scan(
			first.issuanceId(),
			IdCardType.RESIDENT_CARD,
			jpegImage()
		);
		idCardScanService.confirm(request(first, true));

		assertThatThrownBy(() -> idCardScanService.confirm(
			new ConfirmIdCardRequest(first.issuanceId(), second.scanId(), true)
		)).isInstanceOf(IdCardConfirmationConflictException.class);
	}

	@Test
	void rejectsScanThatDoesNotBelongToIssuance() {
		ScannedIdCard first = createScannedIdCard();
		ScannedIdCard second = createScannedIdCard();

		assertThatThrownBy(() -> idCardScanService.confirm(
			new ConfirmIdCardRequest(first.issuanceId(), second.scanId(), true)
		)).isInstanceOf(IdCardScanNotFoundException.class);
	}

	@Test
	void rejectsUnknownCertificateIssuance() {
		assertThatThrownBy(() -> idCardScanService.confirm(
			new ConfirmIdCardRequest("ci_missing", "scan_missing", true)
		)).isInstanceOf(CertificateIssuanceNotFoundException.class);
	}

	private ConfirmIdCardRequest request(ScannedIdCard scanned, boolean confirmed) {
		return new ConfirmIdCardRequest(scanned.issuanceId(), scanned.scanId(), confirmed);
	}

	private ScannedIdCard createScannedIdCard() {
		String onboardingSessionId = onboardingSessionService.createSession().onboardingSessionId();
		onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, "박옥순")
		);
		RequestPhoneVerificationResponse verification = phoneVerificationService.requestVerification(
			new RequestPhoneVerificationRequest(
				onboardingSessionId,
				PhoneCarrier.KT,
				"01012345678"
			)
		);
		phoneVerificationService.confirmVerification(
			new ConfirmPhoneVerificationRequest(
				onboardingSessionId,
				verification.verificationSessionId(),
				"381529"
			)
		);
		String issuanceId = certificateIssuanceService.start(
			new StartCertificateIssuanceRequest(onboardingSessionId)
		).response().issuanceId();
		ScanIdCardResponse scan = idCardScanService.scan(
			issuanceId,
			IdCardType.RESIDENT_CARD,
			jpegImage()
		);
		return new ScannedIdCard(issuanceId, scan.scanId());
	}

	private MockMultipartFile jpegImage() {
		return new MockMultipartFile(
			"image",
			"id-card.jpg",
			"image/jpeg",
			"prototype-image".getBytes()
		);
	}

	private record ScannedIdCard(String issuanceId, String scanId) {
	}
}
