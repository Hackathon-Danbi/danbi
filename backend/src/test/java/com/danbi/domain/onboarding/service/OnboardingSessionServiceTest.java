package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.model.OnboardingSession;
import com.danbi.domain.onboarding.model.OnboardingStep;
import com.danbi.domain.onboarding.repository.InMemoryOnboardingSessionRepository;
import org.junit.jupiter.api.Test;

class OnboardingSessionServiceTest {

	@Test
	void createsAndStoresOnboardingSession() {
		InMemoryOnboardingSessionRepository repository = new InMemoryOnboardingSessionRepository();
		OnboardingSessionService service = new OnboardingSessionService(repository);

		CreateOnboardingSessionResponse response = service.createSession();

		assertThat(response.onboardingSessionId()).startsWith("ob_");
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.NAME_INPUT);
		assertThat(response.estimatedMinutes()).isEqualTo(15);

		OnboardingSession storedSession = repository.findById(response.onboardingSessionId()).orElseThrow();
		assertThat(storedSession.step()).isEqualTo(OnboardingStep.NAME_INPUT);
	}

	@Test
	void createsUniqueSessionIds() {
		InMemoryOnboardingSessionRepository repository = new InMemoryOnboardingSessionRepository();
		OnboardingSessionService service = new OnboardingSessionService(repository);

		CreateOnboardingSessionResponse first = service.createSession();
		CreateOnboardingSessionResponse second = service.createSession();

		assertThat(first.onboardingSessionId()).isNotEqualTo(second.onboardingSessionId());
	}
}
