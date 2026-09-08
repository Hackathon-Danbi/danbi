package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.entity.PhoneVerificationSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhoneVerificationSessionRepository
	extends JpaRepository<PhoneVerificationSession, String> {

	Optional<PhoneVerificationSession> findByOnboardingSessionId(String onboardingSessionId);

	void deleteByOnboardingSessionId(String onboardingSessionId);
}
