package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.exception.InvalidOnboardingStepException;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.entity.PhoneVerificationSession;
import com.danbi.domain.onboarding.repository.PhoneVerificationSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@ActiveProfiles("dev")
class PhoneVerificationServiceTest {

	@Autowired
	private PhoneVerificationSessionRepository verificationRepository;

	@Autowired
	private OnboardingSessionService onboardingSessionService;

	@Autowired
	private PhoneVerificationService phoneVerificationService;

	@Test
	void createsVerificationSessionAndMovesOnboardingStep() {
		String onboardingSessionId = createNamedSession();

		RequestPhoneVerificationResponse response = request(onboardingSessionId);

		assertThat(response.verificationSessionId()).startsWith("pv_");
		assertThat(response.expiresInSeconds()).isEqualTo(420);
		assertThat(response.remainingRequestCount()).isEqualTo(4);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PHONE_VERIFICATION);
		PhoneVerificationSession stored = verificationRepository
			.findById(response.verificationSessionId())
			.orElseThrow();
		assertThat(stored.getOnboardingSessionId()).isEqualTo(onboardingSessionId);
		assertThat(stored.getCarrier()).isEqualTo(PhoneCarrier.KT);
		assertThat(stored.getPhoneNumber()).isEqualTo("01012345678");
		assertThat(stored.getVerificationCode()).isEqualTo("381529");
		assertThat(stored.getRequestCount()).isEqualTo(1);
	}

	@Test
	void allowsFiveRequestsAndRejectsTheSixth() {
		String onboardingSessionId = createNamedSession();

		RequestPhoneVerificationResponse response = null;
		for (int requestCount = 1; requestCount <= 5; requestCount++) {
			response = request(onboardingSessionId);
		}

		assertThat(response).isNotNull();
		assertThat(response.remainingRequestCount()).isZero();
		assertThatThrownBy(() -> request(onboardingSessionId))
			.isInstanceOf(PhoneVerificationRequestLimitExceededException.class);
	}

	@Test
	void rejectsRequestBeforeNameIsSaved() {
		String onboardingSessionId = onboardingSessionService.createSession().onboardingSessionId();

		assertThatThrownBy(() -> request(onboardingSessionId))
			.isInstanceOf(InvalidOnboardingStepException.class);
	}

	@Test
	void changingNameInvalidatesExistingVerificationSession() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse response = request(onboardingSessionId);

		onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, "김단비")
		);

		assertThat(verificationRepository.existsById(response.verificationSessionId())).isFalse();
	}

	private String createNamedSession() {
		String onboardingSessionId = onboardingSessionService.createSession().onboardingSessionId();
		onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, "홍길동")
		);
		return onboardingSessionId;
	}

	private RequestPhoneVerificationResponse request(String onboardingSessionId) {
		return phoneVerificationService.requestVerification(
			new RequestPhoneVerificationRequest(
				onboardingSessionId,
				PhoneCarrier.KT,
				"01012345678"
			)
		);
	}
}
