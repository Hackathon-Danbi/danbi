package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordRequest;
import com.danbi.domain.onboarding.dto.VerifyAccountPasswordResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.exception.AccountPasswordVerificationLockedException;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountPasswordVerificationService {

	private static final int MAX_ATTEMPTS = 5;

	private final AccountVerificationTargetRepository accountVerificationTargetRepository;
	private final AccountPasswordVerifier accountPasswordVerifier;
	private final Clock clock;

	@Transactional(noRollbackFor = AccountPasswordVerificationLockedException.class)
	public VerifyAccountPasswordResponse verify(
		String accountVerificationTargetId,
		VerifyAccountPasswordRequest request
	) {
		AccountVerificationTarget target = accountVerificationTargetRepository
			.findById(accountVerificationTargetId)
			.orElseThrow(() -> new AccountVerificationTargetNotFoundException(
				accountVerificationTargetId
			));
		validateTarget(target, request.issuanceId());

		if (target.isVerified()) {
			return response(target, true);
		}
		if (isLocked(target)) {
			throw new AccountPasswordVerificationLockedException(
				target.getVerificationFailureCount()
			);
		}

		Instant now = Instant.now(clock);
		if (accountPasswordVerifier.matches(target, request.accountPassword())) {
			target.markVerified(now);
			return response(target, true);
		}

		target.recordFailure(now);
		if (isLocked(target)) {
			throw new AccountPasswordVerificationLockedException(
				target.getVerificationFailureCount()
			);
		}
		return response(target, false);
	}

	private void validateTarget(AccountVerificationTarget target, String issuanceId) {
		if (!target.belongsTo(issuanceId)) {
			throw new AccountVerificationConflictException(
				"인증서 발급 요청과 계좌 인증 대상이 일치하지 않습니다."
			);
		}
		if (target.getVerificationMethod() != AccountVerificationMethod.ACCOUNT_PASSWORD) {
			throw new AccountVerificationConflictException(
				"KB국민은행 계좌만 계좌 비밀번호로 확인할 수 있습니다."
			);
		}
	}

	private boolean isLocked(AccountVerificationTarget target) {
		return target.getVerificationFailureCount() >= MAX_ATTEMPTS;
	}

	private VerifyAccountPasswordResponse response(
		AccountVerificationTarget target,
		boolean verified
	) {
		int remainingAttempts = Math.max(
			0,
			MAX_ATTEMPTS - target.getVerificationFailureCount()
		);
		return new VerifyAccountPasswordResponse(
			target.getIssuanceId(),
			target.getAccountVerificationTargetId(),
			verified,
			target.getVerificationFailureCount(),
			remainingAttempts,
			verified
				? OnboardingStep.PASSWORD_SETUP
				: OnboardingStep.ACCOUNT_PASSWORD_VERIFICATION
		);
	}
}
