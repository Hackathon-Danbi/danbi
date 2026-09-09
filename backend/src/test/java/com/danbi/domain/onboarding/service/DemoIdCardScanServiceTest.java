package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.onboarding.controller.IdCardScanController;
import com.danbi.domain.onboarding.dto.ConfirmIdCardRequest;
import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.entity.IdCardConfirmationStatus;
import com.danbi.domain.onboarding.entity.IdCardType;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.repository.IdCardScanRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "danbi.onboarding.demo-id-card-pass=true")
@Transactional
class DemoIdCardScanServiceTest {

	@Autowired private OnboardingSessionService onboardingSessions;
	@Autowired private PhoneVerificationService phoneVerification;
	@Autowired private CertificateIssuanceService certificateIssuance;
	@Autowired private IdCardScanService scans;
	@Autowired private IdCardScanRepository repository;
	@MockitoBean private IdCardOcrClient ocr;

	@Test
	void usesTheSignupNameAndAllowsConfirmationWithoutOcr() {
		String issuanceId = createIssuance();
		var response = scans.scan(issuanceId, IdCardType.RESIDENT_CARD, null);
		assertThat(response.recognizedName()).isEqualTo("김단비");
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.ID_CARD_CONFIRMATION);
		var confirmed = scans.confirm(new ConfirmIdCardRequest(issuanceId, response.scanId(), true));
		assertThat(confirmed.onboardingStep()).isEqualTo(OnboardingStep.FACE_VERIFICATION);
		assertThat(repository.findById(response.scanId()).orElseThrow().getConfirmationStatus())
			.isEqualTo(IdCardConfirmationStatus.CONFIRMED);
		verifyNoInteractions(ocr);
	}

	@Test
	void acceptsAnyImageContentAndFormat() {
		String issuanceId = createIssuance();
		for (var image : new MockMultipartFile[] {
			new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]),
			new MockMultipartFile("image", "landscape.jpg", "image/jpeg", new byte[] {1}),
			new MockMultipartFile("image", "demo.png", "image/png", new byte[] {1}),
			new MockMultipartFile("image", "demo.heic", "image/heic", new byte[] {1}),
			new MockMultipartFile("image", "demo.webp", "image/webp", new byte[] {1}),
			new MockMultipartFile("image", "demo.gif", "image/gif", new byte[] {1}),
			new MockMultipartFile("image", "demo.bin", "application/octet-stream", new byte[] {1})
		}) {
			assertThat(scans.scan(issuanceId, IdCardType.RESIDENT_CARD, image).recognizedName())
				.isEqualTo("김단비");
		}
		verifyNoInteractions(ocr);
	}

	@Test
	void acceptsMultipartRequestWithoutAnImagePart() throws Exception {
		String issuanceId = createIssuance();
		MockMvcBuilders.standaloneSetup(new IdCardScanController(scans)).build()
			.perform(multipart("/api/onboarding/certificate/id-card/scan")
				.param("issuanceId", issuanceId).param("idCardType", "RESIDENT_CARD"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.recognizedName").value("김단비"));
	}

	@Test
	void stillRequiresAnExistingIssuance() {
		assertThatThrownBy(() -> scans.scan("ci_missing", IdCardType.RESIDENT_CARD, null))
			.isInstanceOf(CertificateIssuanceNotFoundException.class);
	}

	private String createIssuance() {
		String sessionId = onboardingSessions.createSession().onboardingSessionId();
		onboardingSessions.saveName(new SaveOnboardingNameRequest(sessionId, "김 단비"));
		var phone = phoneVerification.requestVerification(
			new RequestPhoneVerificationRequest(sessionId, PhoneCarrier.KT, "01012345678"));
		phoneVerification.confirmVerification(
			new ConfirmPhoneVerificationRequest(sessionId, phone.verificationSessionId(), "381529"));
		return certificateIssuance.start(new StartCertificateIssuanceRequest(sessionId))
			.response().issuanceId();
	}
}
