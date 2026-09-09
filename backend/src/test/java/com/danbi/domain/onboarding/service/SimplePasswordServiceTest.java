package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SetSimplePasswordRequest;
import com.danbi.domain.onboarding.dto.SetSimplePasswordResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.CertificateAlreadyIssuedException;
import com.danbi.domain.onboarding.exception.SimplePasswordMismatchException;
import com.danbi.domain.onboarding.exception.WeakSimplePasswordException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.user.entity.User;
import com.danbi.domain.user.repository.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

class SimplePasswordServiceTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final String ONBOARDING_SESSION_ID = "ob_0123456789abcdef0123456789abcdef";
	private static final Instant NOW = Instant.parse("2026-09-09T00:00:00Z");

	private CertificateIssuanceRepository certificateIssuanceRepository;
	private OnboardingSessionRepository onboardingSessionRepository;
	private AccountVerificationTargetRepository accountVerificationTargetRepository;
	private UserRepository userRepository;
	private SimplePasswordEncoder simplePasswordEncoder;
	private SimplePasswordService service;
	private CertificateIssuance issuance;
	private OnboardingSession onboardingSession;
	private AccountVerificationTarget target;

	@BeforeEach
	void setUp() {
		certificateIssuanceRepository = mock(CertificateIssuanceRepository.class);
		onboardingSessionRepository = mock(OnboardingSessionRepository.class);
		accountVerificationTargetRepository = mock(AccountVerificationTargetRepository.class);
		userRepository = mock(UserRepository.class);
		simplePasswordEncoder = mock(SimplePasswordEncoder.class);
		service = new SimplePasswordService(
			certificateIssuanceRepository,
			onboardingSessionRepository,
			accountVerificationTargetRepository,
			userRepository,
			simplePasswordEncoder,
			Clock.fixed(NOW, ZoneOffset.UTC)
		);

		issuance = CertificateIssuance.start(ISSUANCE_ID, ONBOARDING_SESSION_ID, NOW);
		onboardingSession = OnboardingSession.start(ONBOARDING_SESSION_ID)
			.saveName("박옥순");
		target = AccountVerificationTarget.create(
			"at_0123456789abcdef0123456789abcdef",
			ISSUANCE_ID,
			"004",
			"**********1234",
			AccountVerificationMethod.ACCOUNT_PASSWORD,
			NOW
		).markVerified(NOW);

		when(certificateIssuanceRepository.findById(ISSUANCE_ID))
			.thenReturn(Optional.of(issuance));
		when(onboardingSessionRepository.findById(ONBOARDING_SESSION_ID))
			.thenReturn(Optional.of(onboardingSession));
		when(accountVerificationTargetRepository.findByIssuanceId(ISSUANCE_ID))
			.thenReturn(Optional.of(target));
		when(simplePasswordEncoder.encode("593817")).thenReturn("bcrypt-hash");
		User savedUser = mock(User.class);
		when(savedUser.getUserId()).thenReturn(7L);
		when(userRepository.save(any(User.class))).thenReturn(savedUser);
	}

	@Test
	void setsHashedPasswordAndCompletesRegistration() {
		SetSimplePasswordResponse response = service.set(request("593817", "593817"));

		assertThatResponseIsCompleted(response);
		assertThat(issuance.isIssued()).isTrue();
		assertThat(issuance.getIssuedAt()).isEqualTo(NOW);
		assertThat(onboardingSession.isCompleted()).isTrue();
		assertThat(onboardingSession.getUserId()).isEqualTo(7L);
		assertThat(onboardingSession.getCompletedAt()).isEqualTo(NOW);

		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		org.mockito.Mockito.verify(userRepository).save(userCaptor.capture());
		User requestedUser = userCaptor.getValue();
		assertThat(requestedUser.getName()).isEqualTo("박옥순");
		assertThat(requestedUser.getSimplePasswordHash()).isEqualTo("bcrypt-hash");
		assertThat(requestedUser.getSimplePasswordHash()).isNotEqualTo("593817");
		assertThat(requestedUser.isIdentityVerified()).isTrue();
		assertThat(requestedUser.isCertificateIssued()).isTrue();
	}

	@Test
	void rejectsPasswordConfirmationMismatch() {
		assertThatThrownBy(() -> service.set(request("593817", "593818")))
			.isInstanceOf(SimplePasswordMismatchException.class);
	}

	@ParameterizedTest
	@ValueSource(strings = {"111111", "123456", "654321", "012345", "987654"})
	void rejectsWeakPassword(String password) {
		assertThatThrownBy(() -> service.set(request(password, password)))
			.isInstanceOf(WeakSimplePasswordException.class);
	}

	@Test
	void rejectsIncompleteAccountVerification() {
		target = AccountVerificationTarget.create(
			"at_0123456789abcdef0123456789abcdef",
			ISSUANCE_ID,
			"004",
			"**********1234",
			AccountVerificationMethod.ACCOUNT_PASSWORD,
			NOW
		);
		when(accountVerificationTargetRepository.findByIssuanceId(ISSUANCE_ID))
			.thenReturn(Optional.of(target));

		assertThatThrownBy(() -> service.set(request("593817", "593817")))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void returnsCompletedResultForSamePasswordRetry() {
		issuance.issue(NOW);
		onboardingSession.complete(7L, NOW);
		User user = mock(User.class);
		when(user.getSimplePasswordHash()).thenReturn("bcrypt-hash");
		when(userRepository.findById(7L)).thenReturn(Optional.of(user));
		when(simplePasswordEncoder.matches("593817", "bcrypt-hash")).thenReturn(true);

		SetSimplePasswordResponse response = service.set(request("593817", "593817"));

		assertThatResponseIsCompleted(response);
	}

	@Test
	void rejectsChangingPasswordAfterCertificateIsIssued() {
		issuance.issue(NOW);
		onboardingSession.complete(7L, NOW);
		User user = mock(User.class);
		when(user.getSimplePasswordHash()).thenReturn("bcrypt-hash");
		when(userRepository.findById(7L)).thenReturn(Optional.of(user));
		when(simplePasswordEncoder.matches("593817", "bcrypt-hash")).thenReturn(false);

		assertThatThrownBy(() -> service.set(request("593817", "593817")))
			.isInstanceOf(CertificateAlreadyIssuedException.class);
	}

	private SetSimplePasswordRequest request(String password, String passwordConfirm) {
		return new SetSimplePasswordRequest(ISSUANCE_ID, password, passwordConfirm);
	}

	private void assertThatResponseIsCompleted(SetSimplePasswordResponse response) {
		assertThat(response.issuanceId()).isEqualTo(ISSUANCE_ID);
		assertThat(response.certificateIssued()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.COMPLETED);
	}
}
