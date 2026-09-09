package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.ScanIdCardResponse;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.entity.IdCardScan;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.IdCardNameMismatchException;
import com.danbi.domain.onboarding.exception.InvalidIdCardImageException;
import com.danbi.domain.onboarding.repository.IdCardScanRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@ActiveProfiles("dev")
class IdCardScanServiceTest {

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
	void scansAndStoresMaskedIdCardInformation() {
		String issuanceId = createIssuance("박 옥순");

		ScanIdCardResponse response = idCardScanService.scan(
			issuanceId,
			IdCardType.RESIDENT_CARD,
			jpegImage()
		);

		assertThat(response.issuanceId()).isEqualTo(issuanceId);
		assertThat(response.scanId()).startsWith("scan_");
		assertThat(response.recognizedName()).isEqualTo("박옥순");
		assertThat(response.maskedIdNumber()).isEqualTo("900101-1******");
		assertThat(response.issueDate()).isEqualTo(LocalDate.of(2020, 3, 12));
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.ID_CARD_CONFIRMATION);

		IdCardScan stored = idCardScanRepository.findById(response.scanId()).orElseThrow();
		assertThat(stored.getIssuanceId()).isEqualTo(issuanceId);
		assertThat(stored.getMaskedIdNumber()).isEqualTo("900101-1******");
		assertThat(stored.getCreatedAt()).isNotNull();
		assertThat(idCardScanRepository.countByIssuanceId(issuanceId)).isEqualTo(1);
	}

	@Test
	void rejectsIdCardNameThatDoesNotMatchOnboardingName() {
		String issuanceId = createIssuance("김단비");

		assertThatThrownBy(() -> idCardScanService.scan(
			issuanceId,
			IdCardType.RESIDENT_CARD,
			jpegImage()
		)).isInstanceOf(IdCardNameMismatchException.class);
		assertThat(idCardScanRepository.countByIssuanceId(issuanceId)).isZero();
	}

	@Test
	void rejectsEmptyOrUnsupportedImage() {
		String issuanceId = createIssuance("박옥순");
		MockMultipartFile emptyImage = new MockMultipartFile(
			"image",
			"empty.jpg",
			"image/jpeg",
			new byte[0]
		);
		MockMultipartFile pdfFile = new MockMultipartFile(
			"image",
			"id-card.pdf",
			"application/pdf",
			"not-an-image".getBytes()
		);

		assertThatThrownBy(() -> idCardScanService.scan(
			issuanceId,
			IdCardType.RESIDENT_CARD,
			emptyImage
		)).isInstanceOf(InvalidIdCardImageException.class);
		assertThatThrownBy(() -> idCardScanService.scan(
			issuanceId,
			IdCardType.RESIDENT_CARD,
			pdfFile
		)).isInstanceOf(InvalidIdCardImageException.class);
	}

	@Test
	void rejectsUnknownCertificateIssuance() {
		assertThatThrownBy(() -> idCardScanService.scan(
			"ci_missing",
			IdCardType.RESIDENT_CARD,
			jpegImage()
		)).isInstanceOf(CertificateIssuanceNotFoundException.class);
	}

	private String createIssuance(String name) {
		String onboardingSessionId = onboardingSessionService.createSession().onboardingSessionId();
		onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, name)
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
		return certificateIssuanceService.start(
			new StartCertificateIssuanceRequest(onboardingSessionId)
		).response().issuanceId();
	}

	private MockMultipartFile jpegImage() {
		return new MockMultipartFile(
			"image",
			"id-card.jpg",
			"image/jpeg",
			"prototype-image".getBytes()
		);
	}
}
