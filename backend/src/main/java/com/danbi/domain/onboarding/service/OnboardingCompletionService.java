package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.GetOnboardingCompletionResponse;
import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.exception.OnboardingCompletionConflictException;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.user.entity.User;
import com.danbi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OnboardingCompletionService {

	private final OnboardingSessionRepository onboardingSessionRepository;
	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final UserRepository userRepository;

	public GetOnboardingCompletionResponse get(String onboardingSessionId) {
		OnboardingSession session = onboardingSessionRepository
			.findById(onboardingSessionId)
			.orElseThrow(() -> new OnboardingSessionNotFoundException(
				onboardingSessionId
			));
		if (!session.isCompleted() || session.getUserId() == null) {
			throw notCompleted();
		}

		CertificateIssuance issuance = certificateIssuanceRepository
			.findByOnboardingSessionId(onboardingSessionId)
			.orElseThrow(this::notCompleted);
		User user = userRepository.findById(session.getUserId())
			.orElseThrow(this::notCompleted);
		if (!issuance.isIssued()
			|| !user.isIdentityVerified()
			|| !user.isCertificateIssued()) {
			throw notCompleted();
		}

		return new GetOnboardingCompletionResponse(
			session.getOnboardingSessionId(),
			user.getUserId(),
			user.getName(),
			true,
			OnboardingStep.COMPLETED
		);
	}

	private OnboardingCompletionConflictException notCompleted() {
		return new OnboardingCompletionConflictException(
			"가입 또는 국민인증서 발급이 완료되지 않았습니다."
		);
	}
}
