package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordRequest;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationStatus;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.exception.AccountPasswordVerificationLockedException;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AccountPasswordVerificationServiceTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String TARGET_ID = "at_0123456789abcdef0123456789abcdef";
	private static final Instant NOW = Instant.parse("2026-09-08T14:00:00Z");

	private AccountVerificationTargetRepository accountVerificationTargetRepository;
	private AccountPasswordVerifier accountPasswordVerifier;
	private AccountPasswordVerificationService service;
	private AccountVerificationTarget target;

	@BeforeEach
	void setUp() {
		accountVerificationTargetRepository = mock(AccountVerificationTargetRepository.class);
		accountPasswordVerifier = mock(AccountPasswordVerifier.class);
		service = new AccountPasswordVerificationService(
			accountVerificationTargetRepository,
			accountPasswordVerifier,
			Clock.fixed(NOW, ZoneOffset.UTC)
		);
		target = target(AccountVerificationMethod.ACCOUNT_PASSWORD);
		when(accountVerificationTargetRepository.findById(TARGET_ID))
			.thenReturn(Optional.of(target));
	}

	@Test
	void verifiesMatchingPasswordAndMovesToPasswordSetup() {
		when(accountPasswordVerifier.matches(target, "1234")).thenReturn(true);

		VerifyAccountPasswordResponse response = service.verify(
			TARGET_ID,
			request("1234")
		);

		assertThat(response.verified()).isTrue();
		assertThat(response.failureCount()).isZero();
		assertThat(response.remainingAttempts()).isEqualTo(5);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PASSWORD_SETUP);
		assertThat(target.getVerificationStatus()).isEqualTo(AccountVerificationStatus.VERIFIED);
	}

	@Test
	void returnsFailureAndRemainingAttemptsForWrongPassword() {
		when(accountPasswordVerifier.matches(target, "0000")).thenReturn(false);

		VerifyAccountPasswordResponse response = service.verify(
			TARGET_ID,
			request("0000")
		);

		assertThat(response.verified()).isFalse();
		assertThat(response.failureCount()).isEqualTo(1);
		assertThat(response.remainingAttempts()).isEqualTo(4);
		assertThat(response.onboardingStep())
			.isEqualTo(OnboardingStep.ACCOUNT_PASSWORD_VERIFICATION);
	}

	@Test
	void fourthFailureStillAllowsOneMoreAttempt() {
		recordFailures(3);
		when(accountPasswordVerifier.matches(target, "0000")).thenReturn(false);

		VerifyAccountPasswordResponse response = service.verify(
			TARGET_ID,
			request("0000")
		);

		assertThat(response.failureCount()).isEqualTo(4);
		assertThat(response.remainingAttempts()).isEqualTo(1);
	}

	@Test
	void locksOnFifthFailure() {
		recordFailures(4);
		when(accountPasswordVerifier.matches(target, "0000")).thenReturn(false);

		assertThatThrownBy(() -> service.verify(TARGET_ID, request("0000")))
			.isInstanceOfSatisfying(
				AccountPasswordVerificationLockedException.class,
				exception -> assertThat(exception.getFailureCount()).isEqualTo(5)
			);
		assertThat(target.getVerificationFailureCount()).isEqualTo(5);
	}

	@Test
	void rejectsAlreadyLockedTargetWithoutCheckingPassword() {
		recordFailures(5);

		assertThatThrownBy(() -> service.verify(TARGET_ID, request("1234")))
			.isInstanceOf(AccountPasswordVerificationLockedException.class);
		verify(accountPasswordVerifier, never()).matches(target, "1234");
	}

	@Test
	void returnsCompletedResultForAlreadyVerifiedTarget() {
		target.markVerified(NOW);

		VerifyAccountPasswordResponse response = service.verify(
			TARGET_ID,
			request("0000")
		);

		assertThat(response.verified()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PASSWORD_SETUP);
		verify(accountPasswordVerifier, never()).matches(target, "0000");
	}

	@Test
	void rejectsIssuanceMismatch() {
		assertThatThrownBy(() -> service.verify(
			TARGET_ID,
			new VerifyAccountPasswordRequest("ci_other", "1234")
		)).isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsOneWonVerificationTarget() {
		target = target(AccountVerificationMethod.ONE_WON);
		when(accountVerificationTargetRepository.findById(TARGET_ID))
			.thenReturn(Optional.of(target));

		assertThatThrownBy(() -> service.verify(TARGET_ID, request("1234")))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsUnknownTarget() {
		when(accountVerificationTargetRepository.findById("at_missing"))
			.thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.verify("at_missing", request("1234")))
			.isInstanceOf(AccountVerificationTargetNotFoundException.class);
	}

	private VerifyAccountPasswordRequest request(String password) {
		return new VerifyAccountPasswordRequest(ISSUANCE_ID, password);
	}

	private AccountVerificationTarget target(AccountVerificationMethod method) {
		return AccountVerificationTarget.create(
			TARGET_ID,
			ISSUANCE_ID,
			method == AccountVerificationMethod.ACCOUNT_PASSWORD ? "004" : "020",
			"**********1234",
			method,
			NOW
		);
	}

	private void recordFailures(int count) {
		for (int index = 0; index < count; index += 1) {
			target.recordFailure(NOW);
		}
	}
}
