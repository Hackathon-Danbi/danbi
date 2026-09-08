package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.GetOnboardingCompletionResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.exception.OnboardingCompletionConflictException;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.user.entity.User;
import com.danbi.domain.user.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OnboardingCompletionServiceTest {

	private static final String ONBOARDING_SESSION_ID =
		"ob_0123456789abcdef0123456789abcdef";
	private static final String ISSUANCE_ID =
		"ci_0123456789abcdef0123456789abcdef";
	private static final Instant COMPLETED_AT =
		Instant.parse("2026-09-09T00:00:00Z");

	private OnboardingSessionRepository onboardingSessionRepository;
	private CertificateIssuanceRepository certificateIssuanceRepository;
	private UserRepository userRepository;
	private OnboardingCompletionService service;

	@BeforeEach
	void setUp() {
		onboardingSessionRepository = mock(OnboardingSessionRepository.class);
		certificateIssuanceRepository = mock(CertificateIssuanceRepository.class);
		userRepository = mock(UserRepository.class);
		service = new OnboardingCompletionService(
			onboardingSessionRepository,
			certificateIssuanceRepository,
			userRepository
		);
	}

	@Test
	void returnsCompletionInformationForCompletedOnboarding() {
		OnboardingSession session = OnboardingSession.start(ONBOARDING_SESSION_ID)
			.saveName("박옥순")
			.complete(7L, COMPLETED_AT);
		CertificateIssuance issuance = CertificateIssuance.start(
			ISSUANCE_ID,
			ONBOARDING_SESSION_ID,
			COMPLETED_AT
		).issue(COMPLETED_AT);
		User user = mock(User.class);
		when(user.getUserId()).thenReturn(7L);
		when(user.getName()).thenReturn("박옥순");
		when(user.isIdentityVerified()).thenReturn(true);
		when(user.isCertificateIssued()).thenReturn(true);
		when(onboardingSessionRepository.findById(ONBOARDING_SESSION_ID))
			.thenReturn(Optional.of(session));
		when(certificateIssuanceRepository.findByOnboardingSessionId(
			ONBOARDING_SESSION_ID
		)).thenReturn(Optional.of(issuance));
		when(userRepository.findById(7L)).thenReturn(Optional.of(user));

		GetOnboardingCompletionResponse response = service.get(
			ONBOARDING_SESSION_ID
		);

		assertThat(response.onboardingSessionId()).isEqualTo(ONBOARDING_SESSION_ID);
		assertThat(response.userId()).isEqualTo(7L);
		assertThat(response.name()).isEqualTo("박옥순");
		assertThat(response.certificateIssued()).isTrue();
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.COMPLETED);
	}

	@Test
	void rejectsUnknownOnboardingSession() {
		when(onboardingSessionRepository.findById(ONBOARDING_SESSION_ID))
			.thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.get(ONBOARDING_SESSION_ID))
			.isInstanceOf(OnboardingSessionNotFoundException.class);
	}

	@Test
	void rejectsIncompleteOnboardingSession() {
		OnboardingSession session = OnboardingSession.start(ONBOARDING_SESSION_ID)
			.saveName("박옥순");
		when(onboardingSessionRepository.findById(ONBOARDING_SESSION_ID))
			.thenReturn(Optional.of(session));

		assertThatThrownBy(() -> service.get(ONBOARDING_SESSION_ID))
			.isInstanceOf(OnboardingCompletionConflictException.class);
	}

	@Test
	void rejectsInconsistentCertificateIssuance() {
		OnboardingSession session = OnboardingSession.start(ONBOARDING_SESSION_ID)
			.saveName("박옥순")
			.complete(7L, COMPLETED_AT);
		CertificateIssuance issuance = CertificateIssuance.start(
			ISSUANCE_ID,
			ONBOARDING_SESSION_ID,
			COMPLETED_AT
		);
		User user = mock(User.class);
		when(user.isIdentityVerified()).thenReturn(true);
		when(user.isCertificateIssued()).thenReturn(true);
		when(onboardingSessionRepository.findById(ONBOARDING_SESSION_ID))
			.thenReturn(Optional.of(session));
		when(certificateIssuanceRepository.findByOnboardingSessionId(
			ONBOARDING_SESSION_ID
		)).thenReturn(Optional.of(issuance));
		when(userRepository.findById(7L)).thenReturn(Optional.of(user));

		assertThatThrownBy(() -> service.get(ONBOARDING_SESSION_ID))
			.isInstanceOf(OnboardingCompletionConflictException.class);
	}
}
