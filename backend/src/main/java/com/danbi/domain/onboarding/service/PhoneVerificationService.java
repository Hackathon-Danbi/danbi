package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestPhoneVerificationResponse;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.entity.PhoneVerificationSession;
import com.danbi.domain.onboarding.exception.InvalidOnboardingStepException;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.onboarding.repository.PhoneVerificationSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhoneVerificationService {

	private static final String VERIFICATION_SESSION_ID_PREFIX = "pv_";
	private static final int EXPIRES_IN_SECONDS = 420;
	private static final int MAX_REQUEST_COUNT = 5;

	private final OnboardingSessionRepository onboardingSessionRepository;
	private final PhoneVerificationSessionRepository phoneVerificationSessionRepository;
	private final VerificationCodeGenerator verificationCodeGenerator;
	private final Clock clock;

	@Transactional
	public RequestPhoneVerificationResponse requestVerification(
		RequestPhoneVerificationRequest request
	) {
		OnboardingSession onboardingSession = onboardingSessionRepository
			.findById(request.onboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(request.onboardingSessionId()));
		validateNameSaved(onboardingSession);

		PhoneVerificationSession verificationSession = phoneVerificationSessionRepository
			.findByOnboardingSessionId(onboardingSession.getOnboardingSessionId())
			.map(existing -> requestAgain(existing, request))
			.orElseGet(() -> startVerification(onboardingSession, request));

		phoneVerificationSessionRepository.save(verificationSession);
		return new RequestPhoneVerificationResponse(
			onboardingSession.getOnboardingSessionId(),
			verificationSession.getVerificationSessionId(),
			EXPIRES_IN_SECONDS,
			MAX_REQUEST_COUNT - verificationSession.getRequestCount(),
			OnboardingStep.PHONE_VERIFICATION
		);
	}

	private PhoneVerificationSession startVerification(
		OnboardingSession onboardingSession,
		RequestPhoneVerificationRequest request
	) {
		return PhoneVerificationSession.start(
			generateVerificationSessionId(),
			onboardingSession.getOnboardingSessionId(),
			request.carrier(),
			request.phoneNumber(),
			verificationCodeGenerator.generate(),
			Instant.now(clock).plusSeconds(EXPIRES_IN_SECONDS)
		);
	}

	private PhoneVerificationSession requestAgain(
		PhoneVerificationSession existing,
		RequestPhoneVerificationRequest request
	) {
		if (existing.getRequestCount() >= MAX_REQUEST_COUNT) {
			throw new PhoneVerificationRequestLimitExceededException();
		}

		return existing.requestAgain(
			request.carrier(),
			request.phoneNumber(),
			verificationCodeGenerator.generate(),
			Instant.now(clock).plusSeconds(EXPIRES_IN_SECONDS)
		);
	}

	private void validateNameSaved(OnboardingSession onboardingSession) {
		if (onboardingSession.getName() == null || onboardingSession.getName().isBlank()) {
			throw new InvalidOnboardingStepException(OnboardingStep.NAME_INPUT);
		}
	}

	private String generateVerificationSessionId() {
		return VERIFICATION_SESSION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
