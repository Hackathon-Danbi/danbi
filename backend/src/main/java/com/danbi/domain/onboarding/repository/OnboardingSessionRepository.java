package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.model.OnboardingSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingSessionRepository extends JpaRepository<OnboardingSession, String> {
}
