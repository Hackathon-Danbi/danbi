package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
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

	@Test
	void savesNormalizedNameAndMovesToPhoneOwnershipStep() {
		InMemoryOnboardingSessionRepository repository = new InMemoryOnboardingSessionRepository();
		OnboardingSessionService service = new OnboardingSessionService(repository);
		CreateOnboardingSessionResponse created = service.createSession();

		SaveOnboardingNameResponse response = service.saveName(
			new SaveOnboardingNameRequest(created.onboardingSessionId(), "  홍길동  ")
		);

		assertThat(response.name()).isEqualTo("홍길동");
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PHONE_OWNERSHIP);
		OnboardingSession storedSession = repository.findById(created.onboardingSessionId()).orElseThrow();
		assertThat(storedSession.name()).isEqualTo("홍길동");
		assertThat(storedSession.step()).isEqualTo(OnboardingStep.PHONE_OWNERSHIP);
	}

	@Test
	void rejectsUnknownSessionWhenSavingName() {
		OnboardingSessionService service = new OnboardingSessionService(
			new InMemoryOnboardingSessionRepository()
		);

		assertThatThrownBy(() -> service.saveName(new SaveOnboardingNameRequest("ob_missing", "홍길동")))
			.isInstanceOf(OnboardingSessionNotFoundException.class);
	}
}
