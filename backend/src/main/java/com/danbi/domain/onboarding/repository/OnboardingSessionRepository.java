package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.model.OnboardingSession;
import java.util.Optional;

public interface OnboardingSessionRepository {

	OnboardingSession save(OnboardingSession session);

	Optional<OnboardingSession> findById(String id);
}
