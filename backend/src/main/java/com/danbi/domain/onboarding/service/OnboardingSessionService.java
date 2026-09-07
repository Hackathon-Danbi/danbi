package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.model.OnboardingSession;
import com.danbi.domain.onboarding.model.OnboardingStep;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class OnboardingSessionService {

	private static final String SESSION_ID_PREFIX = "ob_";
	private static final int ESTIMATED_MINUTES = 15;

	private final OnboardingSessionRepository onboardingSessionRepository;

	public OnboardingSessionService(OnboardingSessionRepository onboardingSessionRepository) {
		this.onboardingSessionRepository = onboardingSessionRepository;
	}

	public CreateOnboardingSessionResponse createSession() {
		OnboardingSession session = new OnboardingSession(
			generateSessionId(),
			OnboardingStep.NAME_INPUT
		);
		onboardingSessionRepository.save(session);

		return new CreateOnboardingSessionResponse(
			session.id(),
			session.step(),
			ESTIMATED_MINUTES
		);
	}

	private String generateSessionId() {
		return SESSION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
