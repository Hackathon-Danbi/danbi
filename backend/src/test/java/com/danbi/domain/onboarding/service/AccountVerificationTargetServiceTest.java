package com.danbi.domain.onboarding.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.danbi.domain.onboarding.dto.OnboardingStep;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetRequest;
import com.danbi.domain.onboarding.dto.SaveAccountVerificationTargetResponse;
import com.danbi.domain.onboarding.entity.AccountVerificationMethod;
import com.danbi.domain.onboarding.entity.AccountVerificationStatus;
import com.danbi.domain.onboarding.entity.AccountVerificationTarget;
import com.danbi.domain.onboarding.entity.CertificateIssuance;
import com.danbi.domain.onboarding.entity.FaceVerification;
import com.danbi.domain.onboarding.exception.AccountVerificationConflictException;
import com.danbi.domain.onboarding.exception.CertificateIssuanceNotFoundException;
import com.danbi.domain.onboarding.exception.UnsupportedBankException;
import com.danbi.domain.onboarding.repository.AccountVerificationTargetRepository;
import com.danbi.domain.onboarding.repository.CertificateIssuanceRepository;
import com.danbi.domain.onboarding.repository.FaceVerificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AccountVerificationTargetServiceTest {

	private static final String ISSUANCE_ID = "ci_0123456789abcdef0123456789abcdef";
	private static final Instant NOW = Instant.parse("2026-09-08T13:00:00Z");

	private CertificateIssuanceRepository certificateIssuanceRepository;
	private FaceVerificationRepository faceVerificationRepository;
	private AccountVerificationTargetRepository accountVerificationTargetRepository;
	private AccountVerificationTargetService service;
	private AtomicReference<AccountVerificationTarget> storedTarget;

	@BeforeEach
	void setUp() {
		certificateIssuanceRepository = mock(CertificateIssuanceRepository.class);
		faceVerificationRepository = mock(FaceVerificationRepository.class);
		accountVerificationTargetRepository = mock(AccountVerificationTargetRepository.class);
		service = new AccountVerificationTargetService(
			certificateIssuanceRepository,
			faceVerificationRepository,
			accountVerificationTargetRepository,
			Clock.fixed(NOW, ZoneOffset.UTC)
		);

		storedTarget = new AtomicReference<>();
		when(certificateIssuanceRepository.findById(ISSUANCE_ID)).thenReturn(Optional.of(
			CertificateIssuance.start(ISSUANCE_ID, "ob_01", NOW)
		));
		when(faceVerificationRepository.findByIssuanceId(ISSUANCE_ID))
			.thenReturn(Optional.of(verifiedFaceVerification()));
		when(accountVerificationTargetRepository.findByIssuanceId(ISSUANCE_ID))
			.thenAnswer(invocation -> Optional.ofNullable(storedTarget.get()));
		when(accountVerificationTargetRepository.save(any(AccountVerificationTarget.class)))
			.thenAnswer(invocation -> {
				AccountVerificationTarget target = invocation.getArgument(0);
				storedTarget.set(target);
				return target;
			});
	}

	@Test
	void routesKbAccountToPasswordVerification() {
		SaveAccountVerificationTargetResponse response = service.save(
			request("004", "12345678901234")
		);

		assertThat(response.accountVerificationTargetId()).startsWith("at_");
		assertThat(response.bankName()).isEqualTo("KB국민은행");
		assertThat(response.maskedAccountNumber()).isEqualTo("**********1234");
		assertThat(response.verificationMethod())
			.isEqualTo(AccountVerificationMethod.ACCOUNT_PASSWORD);
		assertThat(response.onboardingStep())
			.isEqualTo(OnboardingStep.ACCOUNT_PASSWORD_VERIFICATION);
		assertThat(storedTarget.get().getVerificationStatus())
			.isEqualTo(AccountVerificationStatus.PENDING);
	}

	@Test
	void routesOtherBankAccountToOneWonVerification() {
		SaveAccountVerificationTargetResponse response = service.save(
			request("020", "1234567890")
		);

		assertThat(response.bankName()).isEqualTo("우리은행");
		assertThat(response.maskedAccountNumber()).isEqualTo("******7890");
		assertThat(response.verificationMethod()).isEqualTo(AccountVerificationMethod.ONE_WON);
		assertThat(response.onboardingStep()).isEqualTo(OnboardingStep.ONE_WON_VERIFICATION);
	}

	@Test
	void replacesPendingTargetAndResetsFailureCount() {
		SaveAccountVerificationTargetResponse first = service.save(
			request("004", "12345678901234")
		);
		storedTarget.get().recordFailure(NOW);

		SaveAccountVerificationTargetResponse replaced = service.save(
			request("088", "9876543210")
		);

		assertThat(replaced.accountVerificationTargetId())
			.isEqualTo(first.accountVerificationTargetId());
		assertThat(replaced.bankCode()).isEqualTo("088");
		assertThat(replaced.verificationMethod()).isEqualTo(AccountVerificationMethod.ONE_WON);
		assertThat(storedTarget.get().getVerificationFailureCount()).isZero();
	}

	@Test
	void rejectsChangingVerifiedTarget() {
		service.save(request("004", "12345678901234"));
		storedTarget.get().markVerified(NOW);

		assertThatThrownBy(() -> service.save(request("020", "1234567890")))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsAccountInputBeforeFaceVerificationCompletes() {
		when(faceVerificationRepository.findByIssuanceId(ISSUANCE_ID))
			.thenReturn(Optional.of(FaceVerification.start(
				"fv_01",
				ISSUANCE_ID,
				"scan_01",
				NOW
			)));

		assertThatThrownBy(() -> service.save(request("004", "1234567890")))
			.isInstanceOf(AccountVerificationConflictException.class);
	}

	@Test
	void rejectsUnsupportedBank() {
		assertThatThrownBy(() -> service.save(request("999", "1234567890")))
			.isInstanceOf(UnsupportedBankException.class);
		assertThat(storedTarget.get()).isNull();
	}

	@Test
	void rejectsUnknownCertificateIssuance() {
		assertThatThrownBy(() -> service.save(
			new SaveAccountVerificationTargetRequest(
				"ci_missing",
				"004",
				"1234567890"
			)
		)).isInstanceOf(CertificateIssuanceNotFoundException.class);
	}

	private SaveAccountVerificationTargetRequest request(
		String bankCode,
		String accountNumber
	) {
		return new SaveAccountVerificationTargetRequest(
			ISSUANCE_ID,
			bankCode,
			accountNumber
		);
	}

	private FaceVerification verifiedFaceVerification() {
		return FaceVerification.start(
			"fv_0123456789abcdef0123456789abcdef",
			ISSUANCE_ID,
			"scan_0123456789abcdef0123456789abcdef",
			NOW
		).complete(NOW);
	}
}
