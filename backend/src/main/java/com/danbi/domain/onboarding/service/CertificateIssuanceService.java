package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceRequest;
import com.danbi.domain.onboarding.dto.StartCertificateIssuanceResponse;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.entity.PhoneVerificationSession;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.exception.PhoneVerificationRequiredException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
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
public class CertificateIssuanceService {

	private static final String ISSUANCE_ID_PREFIX = "ci_";

	private final OnboardingSessionRepository onboardingSessionRepository;
	private final PhoneVerificationSessionRepository phoneVerificationSessionRepository;
	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final Clock clock;

	@Transactional
	public CertificateIssuanceStartResult start(StartCertificateIssuanceRequest request) {
		OnboardingSession onboardingSession = onboardingSessionRepository
			.findById(request.onboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(
				request.onboardingSessionId()
			));
		PhoneVerificationSession phoneVerificationSession = phoneVerificationSessionRepository
			.findByOnboardingSessionId(onboardingSession.getOnboardingSessionId())
			.orElseThrow(PhoneVerificationRequiredException::new);
		if (!phoneVerificationSession.isVerified()) {
			throw new PhoneVerificationRequiredException();
		}

		return certificateIssuanceRepository
			.findByOnboardingSessionId(onboardingSession.getOnboardingSessionId())
			.map(existing -> result(onboardingSession, existing, false))
			.orElseGet(() -> create(onboardingSession));
	}

	private CertificateIssuanceStartResult create(OnboardingSession onboardingSession) {
		CertificateIssuance issuance = CertificateIssuance.start(
			generateIssuanceId(),
			onboardingSession.getOnboardingSessionId(),
			Instant.now(clock)
		);
		certificateIssuanceRepository.save(issuance);

		return result(onboardingSession, issuance, true);
	}

	private CertificateIssuanceStartResult result(
		OnboardingSession onboardingSession,
		CertificateIssuance issuance,
		boolean created
	) {
		return new CertificateIssuanceStartResult(
			new StartCertificateIssuanceResponse(
				onboardingSession.getOnboardingSessionId(),
				issuance.getIssuanceId(),
				OnboardingStep.CERTIFICATE_TERMS
			),
			created
		);
	}

	private String generateIssuanceId() {
		return ISSUANCE_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
