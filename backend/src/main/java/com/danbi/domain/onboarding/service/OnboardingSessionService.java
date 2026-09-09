package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.CreateOnboardingSessionResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameRequest;
import com.danbi.domain.onboarding.dto.SaveOnboardingNameResponse;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.exception.PhoneVerificationAlreadyCompletedException;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.onboarding.repository.PhoneVerificationSessionRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OnboardingSessionService {

	private static final String SESSION_ID_PREFIX = "ob_";
	private static final int ESTIMATED_MINUTES = 15;

	private final OnboardingSessionRepository onboardingSessionRepository;
	private final PhoneVerificationSessionRepository phoneVerificationSessionRepository;

	@Transactional
	public CreateOnboardingSessionResponse createSession() {
		OnboardingSession session = OnboardingSession.start(generateSessionId());
		onboardingSessionRepository.save(session);

		return new CreateOnboardingSessionResponse(
			session.getOnboardingSessionId(),
			OnboardingStep.NAME_INPUT,
			ESTIMATED_MINUTES
		);
	}

	@Transactional
	public SaveOnboardingNameResponse saveName(SaveOnboardingNameRequest request) {
		OnboardingSession session = onboardingSessionRepository.findById(request.onboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(request.onboardingSessionId()));
		phoneVerificationSessionRepository
			.findByOnboardingSessionId(session.getOnboardingSessionId())
			.ifPresent(verificationSession -> {
				if (verificationSession.isVerified()) {
					throw new PhoneVerificationAlreadyCompletedException();
				}
			});
		OnboardingSession updatedSession = session.saveName(request.name());
		phoneVerificationSessionRepository.deleteByOnboardingSessionId(
			session.getOnboardingSessionId()
		);
		onboardingSessionRepository.save(updatedSession);

		return new SaveOnboardingNameResponse(
			updatedSession.getOnboardingSessionId(),
			updatedSession.getName(),
			OnboardingStep.PHONE_OWNERSHIP
		);
	}

	private String generateSessionId() {
		return SESSION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
