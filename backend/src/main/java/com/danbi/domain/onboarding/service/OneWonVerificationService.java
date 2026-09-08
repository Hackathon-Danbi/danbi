package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.ConfirmOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.ConfirmOneWonVerificationResponse;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.OneWonVerification;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.exception.OneWonVerificationRequestLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationAttemptLimitExceededException;
import com.danbi.domain.onboarding.exception.OneWonVerificationExpiredException;
import com.danbi.domain.onboarding.exception.OneWonVerificationNotFoundException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.OneWonVerificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OneWonVerificationService {

	private static final String VERIFICATION_ID_PREFIX = "av_";
	private static final int EXPIRES_IN_SECONDS = 300;
	private static final int MAX_REQUEST_COUNT = 5;
	private static final int MAX_VERIFICATION_ATTEMPT_COUNT = 5;

	private final AccountVerificationTargetRepository accountVerificationTargetRepository;
	private final OneWonVerificationRepository oneWonVerificationRepository;
	private final OneWonVerificationCodeGenerator verificationCodeGenerator;
	private final Clock clock;

	@Transactional
	public RequestOneWonVerificationResponse request(
		String accountVerificationTargetId,
		RequestOneWonVerificationRequest request
	) {
		AccountVerificationTarget target = accountVerificationTargetRepository
			.findById(accountVerificationTargetId)
			.orElseThrow(() -> new AccountVerificationTargetNotFoundException(
				accountVerificationTargetId
			));
		validateTarget(target, request.issuanceId());

		Instant expiresAt = Instant.now(clock).plusSeconds(EXPIRES_IN_SECONDS);
		OneWonVerification verification = oneWonVerificationRepository
			.findById(accountVerificationTargetId)
			.map(existing -> requestAgain(existing, expiresAt))
			.orElseGet(() -> OneWonVerification.start(
				accountVerificationTargetId,
				request.issuanceId(),
				generateVerificationId(),
				verificationCodeGenerator.generate(),
				expiresAt
			));
		oneWonVerificationRepository.save(verification);

		return new RequestOneWonVerificationResponse(
			verification.getIssuanceId(),
			verification.getAccountVerificationTargetId(),
			verification.getVerificationId(),
			EXPIRES_IN_SECONDS,
			OnboardingStep.ONE_WON_VERIFICATION
		);
	}

	@Transactional(noRollbackFor = OneWonVerificationAttemptLimitExceededException.class)
	public ConfirmOneWonVerificationResponse confirm(
		String accountVerificationTargetId,
		ConfirmOneWonVerificationRequest request
	) {
		AccountVerificationTarget target = accountVerificationTargetRepository
			.findById(accountVerificationTargetId)
			.orElseThrow(() -> new AccountVerificationTargetNotFoundException(
				accountVerificationTargetId
			));
		validateConfirmationTarget(target, request.issuanceId());

		OneWonVerification verification = oneWonVerificationRepository
			.findById(accountVerificationTargetId)
			.orElseThrow(() -> new OneWonVerificationNotFoundException(
				accountVerificationTargetId
			));
		validateVerification(verification, request);

		if (verification.isVerified() && target.isVerified()) {
			return confirmationResponse(target, verification, true);
		}
		if (verification.isVerified() || target.isVerified()) {
			throw new AccountVerificationConflictException(
				"1원 인증 완료 상태가 일치하지 않습니다."
			);
		}

		Instant now = Instant.now(clock);
		if (verification.isExpired(now)) {
			throw new OneWonVerificationExpiredException();
		}
		if (verification.getVerificationAttemptCount()
			>= MAX_VERIFICATION_ATTEMPT_COUNT) {
			throw new OneWonVerificationAttemptLimitExceededException(
				verification.getVerificationAttemptCount()
			);
		}

		if (!verification.matchesCode(request.verificationCode())) {
			int failureCount = verification.recordFailedAttempt();
			if (failureCount >= MAX_VERIFICATION_ATTEMPT_COUNT) {
				throw new OneWonVerificationAttemptLimitExceededException(failureCount);
			}
			return confirmationResponse(target, verification, false);
		}

		verification.verify(now);
		target.markVerified(now);
		oneWonVerificationRepository.save(verification);
		accountVerificationTargetRepository.save(target);
		return confirmationResponse(target, verification, true);
	}

	private OneWonVerification requestAgain(
		OneWonVerification existing,
		Instant expiresAt
	) {
		if (existing.isVerified()) {
			throw new AccountVerificationConflictException(
				"이미 1원 인증을 완료했습니다."
			);
		}
		if (existing.getRequestCount() >= MAX_REQUEST_COUNT) {
			throw new OneWonVerificationRequestLimitExceededException();
		}
		return existing.requestAgain(
			generateVerificationId(),
			verificationCodeGenerator.generate(),
			expiresAt
		);
	}

	private void validateTarget(AccountVerificationTarget target, String issuanceId) {
		if (!target.belongsTo(issuanceId)) {
			throw new AccountVerificationConflictException(
				"인증서 발급 요청과 계좌 인증 대상이 일치하지 않습니다."
			);
		}
		if (target.isVerified()) {
			throw new AccountVerificationConflictException(
				"이미 인증을 완료한 계좌입니다."
			);
		}
		if (target.getVerificationMethod() != AccountVerificationMethod.ONE_WON) {
			throw new AccountVerificationConflictException(
				"타행 계좌만 1원 인증을 요청할 수 있습니다."
			);
		}
	}

	private void validateConfirmationTarget(
		AccountVerificationTarget target,
		String issuanceId
	) {
		if (!target.belongsTo(issuanceId)) {
			throw new AccountVerificationConflictException(
				"인증서 발급 요청과 계좌 인증 대상이 일치하지 않습니다."
			);
		}
		if (target.getVerificationMethod() != AccountVerificationMethod.ONE_WON) {
			throw new AccountVerificationConflictException(
				"타행 계좌만 1원 인증번호를 확인할 수 있습니다."
			);
		}
	}

	private void validateVerification(
		OneWonVerification verification,
		ConfirmOneWonVerificationRequest request
	) {
		if (!verification.belongsTo(request.issuanceId())) {
			throw new AccountVerificationConflictException(
				"인증서 발급 요청과 1원 인증이 일치하지 않습니다."
			);
		}
		if (!verification.hasVerificationId(request.verificationId())) {
			throw new AccountVerificationConflictException(
				"재요청으로 만료된 1원 인증 ID입니다."
			);
		}
	}

	private ConfirmOneWonVerificationResponse confirmationResponse(
		AccountVerificationTarget target,
		OneWonVerification verification,
		boolean verified
	) {
		int failureCount = verification.getVerificationAttemptCount();
		return new ConfirmOneWonVerificationResponse(
			target.getIssuanceId(),
			target.getAccountVerificationTargetId(),
			verification.getVerificationId(),
			verified,
			failureCount,
			Math.max(0, MAX_VERIFICATION_ATTEMPT_COUNT - failureCount),
			verified
				? OnboardingStep.PASSWORD_SETUP
				: OnboardingStep.ONE_WON_VERIFICATION
		);
	}

	private String generateVerificationId() {
		return VERIFICATION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
