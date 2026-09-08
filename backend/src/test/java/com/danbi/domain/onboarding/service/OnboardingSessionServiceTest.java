package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class OnboardingSessionServiceTest {

	@Autowired
	private OnboardingSessionService service;

	@Autowired
	private OnboardingSessionRepository repository;

	@Test
	void createsAndStoresOnboardingSession() {
		CreateOnboardingSessionResponse response = service.createSession();

		assertThat(response.onboardingSessionId()).startsWith("ob_");
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.NAME_INPUT);
		assertThat(response.estimatedMinutes()).isEqualTo(15);

		OnboardingSession storedSession = repository.findById(response.onboardingSessionId()).orElseThrow();
		assertThat(storedSession.name()).isNull();
	}

	@Test
	void createsUniqueSessionIds() {
		CreateOnboardingSessionResponse first = service.createSession();
		CreateOnboardingSessionResponse second = service.createSession();

		assertThat(first.onboardingSessionId()).isNotEqualTo(second.onboardingSessionId());
	}

	@Test
	void savesNormalizedNameAndMovesToPhoneOwnershipStep() {
		CreateOnboardingSessionResponse created = service.createSession();

		SaveOnboardingNameResponse response = service.saveName(
			new SaveOnboardingNameRequest(created.onboardingSessionId(), "  홍길동  ")
		);

		assertThat(response.name()).isEqualTo("홍길동");
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.PHONE_OWNERSHIP);
		OnboardingSession storedSession = repository.findById(created.onboardingSessionId()).orElseThrow();
		assertThat(storedSession.name()).isEqualTo("홍길동");
	}

	@Test
	void rejectsUnknownSessionWhenSavingName() {
		assertThatThrownBy(() -> service.saveName(new SaveOnboardingNameRequest("ob_missing", "홍길동")))
			.isInstanceOf(OnboardingSessionNotFoundException.class);
	}
}
