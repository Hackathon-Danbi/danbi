package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequiredException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@ActiveProfiles("dev")
class CertificateIssuanceServiceTest {

	@Autowired
	private CertificateIssuanceRepository certificateIssuanceRepository;

	@Autowired
	private OnboardingSessionService onboardingSessionService;

	@Autowired
	private PhoneVerificationService phoneVerificationService;

	@Autowired
	private CertificateIssuanceService certificateIssuanceService;

	@Test
	void createsIssuanceAndMovesOnboardingStep() {
		String onboardingSessionId = createPhoneVerifiedSession();

		CertificateIssuanceStartResult result = start(onboardingSessionId);

		assertThat(result.created()).isTrue();
		assertThat(result.response().onboardingSessionId()).isEqualTo(onboardingSessionId);
		assertThat(result.response().issuanceId()).startsWith("ci_");
		assertThat(result.response().onboardingStep()).isEqualTo(OnboardingStep.CERTIFICATE_TERMS);
		CertificateIssuance stored = certificateIssuanceRepository
			.findById(result.response().issuanceId())
			.orElseThrow();
		assertThat(stored.getOnboardingSessionId()).isEqualTo(onboardingSessionId);
		assertThat(stored.getCreatedAt()).isNotNull();
	}

	@Test
	void returnsSameIssuanceWhenRequestIsRepeated() {
		String onboardingSessionId = createPhoneVerifiedSession();
		CertificateIssuanceStartResult first = start(onboardingSessionId);

		CertificateIssuanceStartResult second = start(onboardingSessionId);

		assertThat(second.created()).isFalse();
		assertThat(second.response().issuanceId()).isEqualTo(first.response().issuanceId());
		assertThat(certificateIssuanceRepository.count()).isEqualTo(1);
	}

	@Test
	void rejectsStartWhenPhoneVerificationIsIncomplete() {
		String onboardingSessionId = createNamedSession();

		assertThatThrownBy(() -> start(onboardingSessionId))
			.isInstanceOf(PhoneVerificationRequiredException.class);
		assertThat(certificateIssuanceRepository.count()).isZero();
	}

	private String createPhoneVerifiedSession() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested =
			phoneVerificationService.requestVerification(
				new RequestPhoneVerificationRequest(
					onboardingSessionId,
					PhoneCarrier.KT,
					"01012345678"
				)
			);
		phoneVerificationService.confirmVerification(
			new ConfirmPhoneVerificationRequest(
				onboardingSessionId,
				requested.verificationSessionId(),
				"381529"
			)
		);
		return onboardingSessionId;
	}

	private String createNamedSession() {
		String onboardingSessionId = onboardingSessionService.createSession().onboardingSessionId();
		onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, "홍길동")
		);
		return onboardingSessionId;
	}

	private CertificateIssuanceStartResult start(String onboardingSessionId) {
		return certificateIssuanceService.start(
			new StartCertificateIssuanceRequest(onboardingSessionId)
		);
	}
}
