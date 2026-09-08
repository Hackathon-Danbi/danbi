package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SetSimplePasswordRequest;
import com.danbi.domain.onboarding.dto.SetSimplePasswordResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.OnboardingSession;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.CertificateAlreadyIssuedException;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.OnboardingSessionNotFoundException;
import com.danbi.domain.onboarding.exception.SimplePasswordMismatchException;
import com.danbi.domain.onboarding.exception.WeakSimplePasswordException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.OnboardingSessionRepository;
import com.danbi.domain.user.entity.User;
import com.danbi.domain.user.repository.UserRepository;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SimplePasswordService {

	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final OnboardingSessionRepository onboardingSessionRepository;
	private final AccountVerificationTargetRepository accountVerificationTargetRepository;
	private final UserRepository userRepository;
	private final SimplePasswordEncoder simplePasswordEncoder;
	private final Clock clock;

	@Transactional
	public SetSimplePasswordResponse set(SetSimplePasswordRequest request) {
		validatePassword(request.password(), request.passwordConfirm());

		CertificateIssuance issuance = certificateIssuanceRepository
			.findById(request.issuanceId())
			.orElseThrow(() -> new CertificateIssuanceNotFoundException(
				request.issuanceId()
			));
		OnboardingSession onboardingSession = onboardingSessionRepository
			.findById(issuance.getOnboardingSessionId())
			.orElseThrow(() -> new OnboardingSessionNotFoundException(
				issuance.getOnboardingSessionId()
			));
		validateAccountVerification(issuance.getIssuanceId());

		if (issuance.isIssued() || onboardingSession.isCompleted()) {
			return completedResponseOrThrow(
				issuance,
				onboardingSession,
				request.password()
			);
		}
		if (onboardingSession.getName() == null
			|| onboardingSession.getName().isBlank()) {
			throw new AccountVerificationConflictException(
				"가입자 이름이 저장되지 않았습니다."
			);
		}

		Instant now = Instant.now(clock);
		User user = userRepository.save(User.completeRegistration(
			onboardingSession.getName(),
			simplePasswordEncoder.encode(request.password()),
			now
		));
		onboardingSession.complete(user.getUserId(), now);
		issuance.issue(now);
		onboardingSessionRepository.save(onboardingSession);
		certificateIssuanceRepository.save(issuance);

		return response(issuance);
	}

	private void validatePassword(String password, String passwordConfirm) {
		if (!password.equals(passwordConfirm)) {
			throw new SimplePasswordMismatchException();
		}
		if (hasSingleRepeatedDigit(password) || hasSequentialDigits(password)) {
			throw new WeakSimplePasswordException();
		}
	}

	private boolean hasSingleRepeatedDigit(String password) {
		return password.chars().distinct().count() == 1;
	}

	private boolean hasSequentialDigits(String password) {
		boolean ascending = true;
		boolean descending = true;
		for (int index = 1; index < password.length(); index += 1) {
			int difference = password.charAt(index) - password.charAt(index - 1);
			ascending &= difference == 1;
			descending &= difference == -1;
		}
		return ascending || descending;
	}

	private void validateAccountVerification(String issuanceId) {
		AccountVerificationTarget target = accountVerificationTargetRepository
			.findByIssuanceId(issuanceId)
			.orElseThrow(() -> new AccountVerificationConflictException(
				"계좌 인증을 먼저 완료해야 합니다."
			));
		if (!target.isVerified()) {
			throw new AccountVerificationConflictException(
				"계좌 인증을 먼저 완료해야 합니다."
			);
		}
	}

	private SetSimplePasswordResponse completedResponseOrThrow(
		CertificateIssuance issuance,
		OnboardingSession onboardingSession,
		String rawPassword
	) {
		if (!issuance.isIssued()
			|| !onboardingSession.isCompleted()
			|| onboardingSession.getUserId() == null) {
			throw new AccountVerificationConflictException(
				"가입 완료 상태가 일치하지 않습니다."
			);
		}
		User user = userRepository.findById(onboardingSession.getUserId())
			.orElseThrow(() -> new AccountVerificationConflictException(
				"가입 완료 사용자를 찾을 수 없습니다."
			));
		if (!simplePasswordEncoder.matches(rawPassword, user.getSimplePasswordHash())) {
			throw new CertificateAlreadyIssuedException();
		}
		return response(issuance);
	}

	private SetSimplePasswordResponse response(CertificateIssuance issuance) {
		return new SetSimplePasswordResponse(
			issuance.getIssuanceId(),
			true,
			OnboardingStep.COMPLETED
		);
	}
}
