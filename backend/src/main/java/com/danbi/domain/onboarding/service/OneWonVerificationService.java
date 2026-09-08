package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationRequest;
import com.danbi.domain.onboarding.dto.RequestOneWonVerificationResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.OneWonVerification;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.AccountVerificationTargetNotFoundException;
import com.danbi.domain.onboarding.exception.OneWonVerificationRequestLimitExceededException;
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

	private String generateVerificationId() {
		return VERIFICATION_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
