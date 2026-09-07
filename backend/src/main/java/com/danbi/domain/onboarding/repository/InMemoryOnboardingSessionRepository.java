package com.danbi.domain.onboarding.repository;

import com.danbi.domain.onboarding.model.OnboardingSession;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryOnboardingSessionRepository implements OnboardingSessionRepository {

	private final Map<String, OnboardingSession> sessions = new ConcurrentHashMap<>();

	@Override
	public OnboardingSession save(OnboardingSession session) {
		sessions.put(session.id(), session);
		return session;
	}

	@Override
	public Optional<OnboardingSession> findById(String id) {
		return Optional.ofNullable(sessions.get(id));
	}
}
