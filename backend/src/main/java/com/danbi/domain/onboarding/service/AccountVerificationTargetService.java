package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetRequest;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.FaceVerification;
import com.danbi.domain.onboarding.entity.SupportedBank;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.UnsupportedBankException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.FaceVerificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountVerificationTargetService {

	private static final String TARGET_ID_PREFIX = "at_";

	private final CertificateIssuanceRepository certificateIssuanceRepository;
	private final FaceVerificationRepository faceVerificationRepository;
	private final AccountVerificationTargetRepository accountVerificationTargetRepository;
	private final Clock clock;

	@Transactional
	public SaveAccountVerificationTargetResponse save(
		SaveAccountVerificationTargetRequest request
	) {
		certificateIssuanceRepository.findById(request.issuanceId())
			.orElseThrow(() -> new CertificateIssuanceNotFoundException(request.issuanceId()));
		validateFaceVerification(request.issuanceId());

		SupportedBank bank = SupportedBank.findByCode(request.bankCode())
			.orElseThrow(() -> new UnsupportedBankException(request.bankCode()));
		Instant now = Instant.now(clock);
		String maskedAccountNumber = maskAccountNumber(request.accountNumber());

		AccountVerificationTarget target = accountVerificationTargetRepository
			.findByIssuanceId(request.issuanceId())
			.map(existing -> replace(existing, bank, maskedAccountNumber, now))
			.orElseGet(() -> accountVerificationTargetRepository.save(
				AccountVerificationTarget.create(
					generateTargetId(),
					request.issuanceId(),
					bank.getCode(),
					maskedAccountNumber,
					bank.getVerificationMethod(),
					now
				)
			));

		return response(target, bank);
	}

	private void validateFaceVerification(String issuanceId) {
		FaceVerification faceVerification = faceVerificationRepository
			.findByIssuanceId(issuanceId)
			.orElseThrow(() -> new AccountVerificationConflictException(
				"얼굴 인증을 완료해야 계좌를 입력할 수 있습니다."
			));
		if (!faceVerification.isVerified()) {
			throw new AccountVerificationConflictException(
				"얼굴 인증을 완료해야 계좌를 입력할 수 있습니다."
			);
		}
	}

	private AccountVerificationTarget replace(
		AccountVerificationTarget target,
		SupportedBank bank,
		String maskedAccountNumber,
		Instant now
	) {
		if (target.isVerified()) {
			throw new AccountVerificationConflictException(
				"이미 인증을 완료한 계좌는 변경할 수 없습니다."
			);
		}
		return target.replace(
			bank.getCode(),
			maskedAccountNumber,
			bank.getVerificationMethod(),
			now
		);
	}

	private SaveAccountVerificationTargetResponse response(
		AccountVerificationTarget target,
		SupportedBank bank
	) {
		AccountVerificationMethod method = target.getVerificationMethod();
		return new SaveAccountVerificationTargetResponse(
			target.getIssuanceId(),
			target.getAccountVerificationTargetId(),
			target.getBankCode(),
			bank.getDisplayName(),
			target.getMaskedAccountNumber(),
			method,
			method == AccountVerificationMethod.ACCOUNT_PASSWORD
				? OnboardingStep.ACCOUNT_PASSWORD_VERIFICATION
				: OnboardingStep.ONE_WON_VERIFICATION
		);
	}

	private String maskAccountNumber(String accountNumber) {
		int visibleDigits = 4;
		return "*".repeat(accountNumber.length() - visibleDigits)
			+ accountNumber.substring(accountNumber.length() - visibleDigits);
	}

	private String generateTargetId() {
		return TARGET_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
	}
}
