package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.model.OnboardingSession;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingSessionService {

	private static final String SESSION_ID_PREFIX = "ob_";
	private static final int ESTIMATED_MINUTES = 15;

	private final OnboardingSessionRepository onboardingSessionRepository;

	public OnboardingSessionService(OnboardingSessionRepository onboardingSessionRepository) {
		this.onboardingSessionRepository = onboardingSessionRepository;
	}

	@Transactional
	public CreateOnboardingSessionResponse createSession() {
		OnboardingSession session = OnboardingSession.start(generateSessionId());
		onboardingSessionRepository.save(session);

		return new CreateOnboardingSessionResponse(
			session.id(),
			session.step(),
			ESTIMATED_MINUTES
		);
	}

	@Transactional
	public SaveOnboardingNameResponse saveName(SaveOnboardingNameRequest request) {
		OnboardingSession session = onboardingSessionRepository.findById(request.onboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(request.onboardingSessionId()));
		OnboardingSession updatedSession = session.saveName(request.name());
		onboardingSessionRepository.save(updatedSession);

		return new SaveOnboardingNameResponse(
			updatedSession.id(),
			updatedSession.name(),
			updatedSession.step()
		);
	}

	private String generateSessionId() {
		return SESSION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
