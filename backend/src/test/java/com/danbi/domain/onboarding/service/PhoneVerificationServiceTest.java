package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.ConfirmPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.ResendPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.ResendPhoneVerificationResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.entity.PhoneCarrier;
import com.danbi.domain.onboarding.entity.PhoneVerificationSession;
import com.danbi.domain.onboarding.exception.InvalidOnboardingStepException;
import com.danbi.domain.onboarding.exception.PhoneVerificationAlreadyCompletedException;
import com.danbi.domain.onboarding.exception.PhoneVerificationAttemptLimitExceededException;
import com.danbi.domain.onboarding.exception.PhoneVerificationCodeMismatchException;
import com.danbi.domain.onboarding.exception.PhoneVerificationExpiredException;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.exception.PhoneVerificationSessionMismatchException;
import com.danbi.domain.onboarding.exception.PhoneVerificationSessionNotFoundException;
import com.danbi.domain.onboarding.repository.PhoneVerificationSessionRepository;
import java.time.Clock;
import java.time.Instant;
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

	@Autowired
	private Clock clock;

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

	@Test
	void resendsCodeWithSameVerificationSessionAndNewExpiration() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);
		PhoneVerificationSession beforeResend = verificationRepository
			.findById(requested.verificationSessionId())
			.orElseThrow();
		var previousExpiration = beforeResend.getExpiresAt();

		ResendPhoneVerificationResponse response = resend(
			onboardingSessionId,
			requested.verificationSessionId()
		);

		assertThat(response.onboardingSessionId()).isEqualTo(onboardingSessionId);
		assertThat(response.verificationSessionId()).isEqualTo(requested.verificationSessionId());
		assertThat(response.expiresInSeconds()).isEqualTo(420);
		assertThat(response.remainingRequestCount()).isEqualTo(3);
		PhoneVerificationSession stored = verificationRepository
			.findById(requested.verificationSessionId())
			.orElseThrow();
		assertThat(stored.getRequestCount()).isEqualTo(2);
		assertThat(stored.getExpiresAt()).isAfterOrEqualTo(previousExpiration);
	}

	@Test
	void sharesFiveRequestLimitBetweenInitialRequestAndResends() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);

		ResendPhoneVerificationResponse response = null;
		for (int resendCount = 1; resendCount <= 4; resendCount++) {
			response = resend(onboardingSessionId, requested.verificationSessionId());
		}

		assertThat(response).isNotNull();
		assertThat(response.remainingRequestCount()).isZero();
		assertThatThrownBy(() -> resend(onboardingSessionId, requested.verificationSessionId()))
			.isInstanceOf(PhoneVerificationRequestLimitExceededException.class);
	}

	@Test
	void rejectsUnknownVerificationSessionWhenResending() {
		String onboardingSessionId = createNamedSession();
		request(onboardingSessionId);

		assertThatThrownBy(() -> resend(onboardingSessionId, "pv_missing"))
			.isInstanceOf(PhoneVerificationSessionNotFoundException.class);
	}

	@Test
	void rejectsVerificationSessionOwnedByAnotherOnboardingSession() {
		String firstOnboardingSessionId = createNamedSession();
		String secondOnboardingSessionId = createNamedSession();
		request(firstOnboardingSessionId);
		RequestPhoneVerificationResponse secondVerification = request(secondOnboardingSessionId);

		assertThatThrownBy(() -> resend(
			firstOnboardingSessionId,
			secondVerification.verificationSessionId()
		)).isInstanceOf(PhoneVerificationSessionMismatchException.class);
	}

	@Test
	void confirmsCodeAndMovesToCertificateIssuanceStep() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);

		ConfirmPhoneVerificationResponse response = confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"381529"
		);

		assertThat(response.identityVerified()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.CERTIFICATE_ISSUANCE);
		PhoneVerificationSession stored = verificationRepository
			.findById(requested.verificationSessionId())
			.orElseThrow();
		assertThat(stored.getVerifiedAt()).isNotNull();
		assertThat(stored.getVerificationAttemptCount()).isZero();
	}

	@Test
	void returnsSuccessWhenAlreadyVerifiedRequestIsRepeated() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);
		confirm(onboardingSessionId, requested.verificationSessionId(), "381529");

		ConfirmPhoneVerificationResponse response = confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"381529"
		);

		assertThat(response.identityVerified()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.CERTIFICATE_ISSUANCE);
	}

	@Test
	void recordsFailedVerificationAttempt() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);

		assertThatThrownBy(() -> confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"654321"
		))
			.isInstanceOf(PhoneVerificationCodeMismatchException.class)
			.hasMessage("인증번호가 일치하지 않습니다.");

		PhoneVerificationSession stored = verificationRepository
			.findById(requested.verificationSessionId())
			.orElseThrow();
		assertThat(stored.getVerificationAttemptCount()).isEqualTo(1);
	}

	@Test
	void allowsFiveFailedAttemptsAndRejectsTheSixth() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);

		for (int attemptCount = 1; attemptCount <= 5; attemptCount++) {
			assertThatThrownBy(() -> confirm(
				onboardingSessionId,
				requested.verificationSessionId(),
				"654321"
			)).isInstanceOf(PhoneVerificationCodeMismatchException.class);
		}

		assertThatThrownBy(() -> confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"654321"
		)).isInstanceOf(PhoneVerificationAttemptLimitExceededException.class);
	}

	@Test
	void returnsOneRemainingAttemptAfterFourthFailure() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);

		for (int attemptCount = 1; attemptCount <= 3; attemptCount++) {
			assertThatThrownBy(() -> confirm(
				onboardingSessionId,
				requested.verificationSessionId(),
				"654321"
			)).isInstanceOf(PhoneVerificationCodeMismatchException.class);
		}

		assertThatThrownBy(() -> confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"654321"
		))
			.isInstanceOfSatisfying(
				PhoneVerificationCodeMismatchException.class,
				exception -> assertThat(exception.getRemainingAttemptCount()).isEqualTo(1)
			);
	}

	@Test
	void rejectsExpiredVerificationCodeWithoutIncreasingAttemptCount() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);
		PhoneVerificationSession verificationSession = verificationRepository
			.findById(requested.verificationSessionId())
			.orElseThrow();
		verificationSession.resend("381529", Instant.now(clock).minusSeconds(1));

		assertThatThrownBy(() -> confirm(
			onboardingSessionId,
			requested.verificationSessionId(),
			"381529"
		)).isInstanceOf(PhoneVerificationExpiredException.class);
		assertThat(verificationSession.getVerificationAttemptCount()).isZero();
	}

	@Test
	void blocksNameChangeAfterVerificationIsCompleted() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);
		confirm(onboardingSessionId, requested.verificationSessionId(), "381529");

		assertThatThrownBy(() -> onboardingSessionService.saveName(
			new SaveOnboardingNameRequest(onboardingSessionId, "김단비")
		)).isInstanceOf(PhoneVerificationAlreadyCompletedException.class);
	}

	@Test
	void blocksNewRequestAndResendAfterVerificationIsCompleted() {
		String onboardingSessionId = createNamedSession();
		RequestPhoneVerificationResponse requested = request(onboardingSessionId);
		confirm(onboardingSessionId, requested.verificationSessionId(), "381529");

		assertThatThrownBy(() -> request(onboardingSessionId))
			.isInstanceOf(PhoneVerificationAlreadyCompletedException.class);
		assertThatThrownBy(() -> resend(
			onboardingSessionId,
			requested.verificationSessionId()
		)).isInstanceOf(PhoneVerificationAlreadyCompletedException.class);
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

	private ResendPhoneVerificationResponse resend(
		String onboardingSessionId,
		String verificationSessionId
	) {
		return phoneVerificationService.resendVerification(
			new ResendPhoneVerificationRequest(
				onboardingSessionId,
				verificationSessionId
			)
		);
	}

	private ConfirmPhoneVerificationResponse confirm(
		String onboardingSessionId,
		String verificationSessionId,
		String verificationCode
	) {
		return phoneVerificationService.confirmVerification(
			new ConfirmPhoneVerificationRequest(
				onboardingSessionId,
				verificationSessionId,
				verificationCode
			)
		);
	}
}
