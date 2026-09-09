package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ConfirmOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.ConfirmOneWonVerificationResponse;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.OneWonVerification;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.exception.OneWonVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationAttemptLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationExpiredException;
import com.danbi.domain.onboarding.exception.OneWonVerificationNotFoundException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.OneWonVerificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OneWonVerificationServiceTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String TARGET_ID = "at_0123456789abcdef0123456789abcdef";
	private static final Instant NOW = Instant.parse("2026-09-08T15:00:00Z");

	private AccountVerificationTargetRepository accountVerificationTargetRepository;
	private OneWonVerificationRepository oneWonVerificationRepository;
	private OneWonVerificationService service;
	private AtomicReference<OneWonVerification> storedVerification;
	private AccountVerificationTarget target;

	@BeforeEach
	void setUp() {
		accountVerificationTargetRepository = mock(AccountVerificationTargetRepository.class);
		oneWonVerificationRepository = mock(OneWonVerificationRepository.class);
		OneWonVerificationCodeGenerator codeGenerator = () -> "4821";
		service = new OneWonVerificationService(
			accountVerificationTargetRepository,
			oneWonVerificationRepository,
			codeGenerator,
			Clock.fixed(NOW, ZoneOffset.UTC)
		);

		target = target(AccountVerificationMethod.ONE_WON);
		storedVerification = new AtomicReference<>();
		when(accountVerificationTargetRepository.findById(TARGET_ID))
			.thenReturn(Optional.of(target));
		when(oneWonVerificationRepository.findById(TARGET_ID))
			.thenAnswer(invocation -> Optional.ofNullable(storedVerification.get()));
		when(oneWonVerificationRepository.save(any(OneWonVerification.class)))
			.thenAnswer(invocation -> {
				OneWonVerification verification = invocation.getArgument(0);
				storedVerification.set(verification);
				return verification;
			});
	}

	@Test
	void startsOneWonVerificationForOtherBankAccount() {
		RequestOneWonVerificationResponse response = service.request(TARGET_ID, request());

		assertThat(response.issuanceId()).isEqualTo(ISSUANCE_ID);
		assertThat(response.accountVerificationTargetId()).isEqualTo(TARGET_ID);
		assertThat(response.verificationId()).startsWith("av_");
		assertThat(response.expiresInSeconds()).isEqualTo(300);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.ONE_WON_VERIFICATION);
		assertThat(storedVerification.get().getVerificationCode()).isEqualTo("4821");
		assertThat(storedVerification.get().getExpiresAt()).isEqualTo(NOW.plusSeconds(300));
		assertThat(storedVerification.get().getRequestCount()).isEqualTo(1);
	}

	@Test
	void reissuesWithNewVerificationId() {
		RequestOneWonVerificationResponse first = service.request(TARGET_ID, request());
		RequestOneWonVerificationResponse second = service.request(TARGET_ID, request());

		assertThat(second.verificationId()).isNotEqualTo(first.verificationId());
		assertThat(storedVerification.get().getRequestCount()).isEqualTo(2);
	}

	@Test
	void rejectsSixthRequest() {
		for (int requestNumber = 0; requestNumber < 5; requestNumber += 1) {
			service.request(TARGET_ID, request());
		}

		assertThatThrownBy(() -> service.request(TARGET_ID, request()))
			.isInstanceOf(OneWonVerificationRequestLimitExceededException.class);
		assertThat(storedVerification.get().getRequestCount()).isEqualTo(5);
	}

	@Test
	void rejectsUnknownTarget() {
		when(accountVerificationTargetRepository.findById("at_missing"))
			.thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.request("at_missing", request()))
			.isInstanceOf(AccountVerificationTargetNotFoundException.class);
	}

	@Test
	void rejectsIssuanceMismatch() {
		assertThatThrownBy(() -> service.request(
			TARGET_ID,
			new RequestOneWonVerificationRequest("ci_other")
		)).isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsKbAccount() {
		target = target(AccountVerificationMethod.ACCOUNT_PASSWORD);
		when(accountVerificationTargetRepository.findById(TARGET_ID))
			.thenReturn(Optional.of(target));

		assertThatThrownBy(() -> service.request(TARGET_ID, request()))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsAlreadyVerifiedAccountTarget() {
		target.markVerified(NOW);

		assertThatThrownBy(() -> service.request(TARGET_ID, request()))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void confirmsMatchingOneWonVerificationCode() {
		RequestOneWonVerificationResponse requested = service.request(TARGET_ID, request());

		ConfirmOneWonVerificationResponse response = service.confirm(
			TARGET_ID,
			confirmRequest(requested.verificationId(), "4821")
		);

		assertThat(response.verified()).isTrue();
		assertThat(response.failureCount()).isZero();
		assertThat(response.remainingAttempts()).isEqualTo(5);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PASSWORD_SETUP);
		assertThat(target.isVerified()).isTrue();
		assertThat(storedVerification.get().isVerified()).isTrue();
	}

	@Test
	void returnsFailureAndRemainingAttemptsForWrongCode() {
		RequestOneWonVerificationResponse requested = service.request(TARGET_ID, request());

		ConfirmOneWonVerificationResponse response = service.confirm(
			TARGET_ID,
			confirmRequest(requested.verificationId(), "0000")
		);

		assertThat(response.verified()).isFalse();
		assertThat(response.failureCount()).isEqualTo(1);
		assertThat(response.remainingAttempts()).isEqualTo(4);
		assertThat(response.onboardingStep())
			.isEqualTo(OnboardingStep.ONE_WON_VERIFICATION);
	}

	@Test
	void fourthFailureStillAllowsOneMoreAttempt() {
		RequestOneWonVerificationResponse requested = service.request(TARGET_ID, request());
		for (int attempt = 0; attempt < 3; attempt += 1) {
			service.confirm(
				TARGET_ID,
				confirmRequest(requested.verificationId(), "0000")
			);
		}

		ConfirmOneWonVerificationResponse response = service.confirm(
			TARGET_ID,
			confirmRequest(requested.verificationId(), "0000")
		);

		assertThat(response.failureCount()).isEqualTo(4);
		assertThat(response.remainingAttempts()).isEqualTo(1);
	}

	@Test
	void locksOnFifthWrongCode() {
		RequestOneWonVerificationResponse requested = service.request(TARGET_ID, request());
		for (int attempt = 0; attempt < 4; attempt += 1) {
			service.confirm(
				TARGET_ID,
				confirmRequest(requested.verificationId(), "0000")
			);
		}

		assertThatThrownBy(() -> service.confirm(
			TARGET_ID,
			confirmRequest(requested.verificationId(), "0000")
		)).isInstanceOfSatisfying(
			OneWonVerificationAttemptLimitExceededException.class,
			exception -> assertThat(exception.getFailureCount()).isEqualTo(5)
		);
		assertThat(storedVerification.get().getVerificationAttemptCount()).isEqualTo(5);
	}

	@Test
	void rejectsExpiredVerification() {
		OneWonVerification expired = OneWonVerification.start(
			TARGET_ID,
			ISSUANCE_ID,
			"av_expired",
			"4821",
			NOW
		);
		storedVerification.set(expired);

		assertThatThrownBy(() -> service.confirm(
			TARGET_ID,
			confirmRequest("av_expired", "4821")
		)).isInstanceOf(OneWonVerificationExpiredException.class);
	}

	@Test
	void rejectsVerificationIdInvalidatedByReissue() {
		RequestOneWonVerificationResponse first = service.request(TARGET_ID, request());
		service.request(TARGET_ID, request());

		assertThatThrownBy(() -> service.confirm(
			TARGET_ID,
			confirmRequest(first.verificationId(), "4821")
		)).isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void returnsCompletedResultForSameCompletedRequest() {
		RequestOneWonVerificationResponse requested = service.request(TARGET_ID, request());
		ConfirmOneWonVerificationRequest confirmRequest = confirmRequest(
			requested.verificationId(),
			"4821"
		);
		service.confirm(TARGET_ID, confirmRequest);

		ConfirmOneWonVerificationResponse retried = service.confirm(
			TARGET_ID,
			confirmRequest
		);

		assertThat(retried.verified()).isTrue();
		assertThat(retried.onboardingStep()).isEqualTo(OnboardingStep.PASSWORD_SETUP);
	}

	@Test
	void rejectsConfirmationBeforeRequest() {
		assertThatThrownBy(() -> service.confirm(
			TARGET_ID,
			confirmRequest("av_missing", "4821")
		)).isInstanceOf(OneWonVerificationNotFoundException.class);
	}

	private RequestOneWonVerificationRequest request() {
		return new RequestOneWonVerificationRequest(ISSUANCE_ID);
	}

	private ConfirmOneWonVerificationRequest confirmRequest(
		String verificationId,
		String verificationCode
	) {
		return new ConfirmOneWonVerificationRequest(
			ISSUANCE_ID,
			verificationId,
			verificationCode
		);
	}

	private AccountVerificationTarget target(AccountVerificationMethod method) {
		return AccountVerificationTarget.create(
			TARGET_ID,
			ISSUANCE_ID,
			method == AccountVerificationMethod.ONE_WON ? "020" : "004",
			"******7890",
			method,
			NOW
		);
	}
}
