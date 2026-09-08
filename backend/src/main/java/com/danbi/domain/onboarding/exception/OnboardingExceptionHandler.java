package com.danbi.domain.onboarding.exception;

import com.danbi.domain.onboarding.controller.CertificateIssuanceController;
import com.danbi.domain.onboarding.controller.AccountVerificationTargetController;
import com.danbi.domain.onboarding.controller.FaceVerificationController;
import com.danbi.domain.onboarding.controller.IdCardScanController;
import com.danbi.domain.onboarding.controller.OnboardingCompletionController;
import com.danbi.domain.onboarding.controller.OnboardingNameController;
import com.danbi.domain.onboarding.controller.OnboardingSessionController;
import com.danbi.domain.onboarding.controller.OneWonVerificationController;
import com.danbi.domain.onboarding.controller.PhoneVerificationController;
import com.danbi.domain.onboarding.controller.SimplePasswordController;
import com.danbi.domain.onboarding.dto.AccountPasswordVerificationErrorResponse;
import com.danbi.domain.onboarding.dto.OnboardingErrorResponse;
import com.danbi.domain.onboarding.dto.OneWonVerificationErrorResponse;
import com.danbi.domain.onboarding.dto.PhoneVerificationErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = {
	CertificateIssuanceController.class,
	AccountVerificationTargetController.class,
	FaceVerificationController.class,
	IdCardScanController.class,
	OnboardingSessionController.class,
	OnboardingCompletionController.class,
	OnboardingNameController.class,
	OneWonVerificationController.class,
	PhoneVerificationController.class,
	SimplePasswordController.class
})
public class OnboardingExceptionHandler {

	@ExceptionHandler(OnboardingCompletionConflictException.class)
	public ResponseEntity<OnboardingErrorResponse> handleOnboardingCompletionConflict(
		OnboardingCompletionConflictException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(OnboardingSessionNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleSessionNotFound(OnboardingSessionNotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(InvalidOnboardingStepException.class)
	public ResponseEntity<OnboardingErrorResponse> handleInvalidStep(InvalidOnboardingStepException e) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationRequestLimitExceededException.class)
	public ResponseEntity<OnboardingErrorResponse> handleRequestLimitExceeded(
		PhoneVerificationRequestLimitExceededException e
	) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationSessionNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleVerificationSessionNotFound(
		PhoneVerificationSessionNotFoundException e
	) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationSessionMismatchException.class)
	public ResponseEntity<OnboardingErrorResponse> handleVerificationSessionMismatch(
		PhoneVerificationSessionMismatchException e
	) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationCodeMismatchException.class)
	public ResponseEntity<PhoneVerificationErrorResponse> handleVerificationCodeMismatch(
		PhoneVerificationCodeMismatchException e
	) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new PhoneVerificationErrorResponse(
				e.getCode(),
				e.getMessage(),
				e.getRemainingAttemptCount()
			));
	}

	@ExceptionHandler(PhoneVerificationAttemptLimitExceededException.class)
	public ResponseEntity<PhoneVerificationErrorResponse> handleVerificationAttemptLimitExceeded(
		PhoneVerificationAttemptLimitExceededException e
	) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.body(new PhoneVerificationErrorResponse(e.getCode(), e.getMessage(), 0));
	}

	@ExceptionHandler(PhoneVerificationExpiredException.class)
	public ResponseEntity<OnboardingErrorResponse> handleVerificationExpired(
		PhoneVerificationExpiredException e
	) {
		return ResponseEntity.status(HttpStatus.GONE)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationAlreadyCompletedException.class)
	public ResponseEntity<OnboardingErrorResponse> handleVerificationAlreadyCompleted(
		PhoneVerificationAlreadyCompletedException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(PhoneVerificationRequiredException.class)
	public ResponseEntity<OnboardingErrorResponse> handlePhoneVerificationRequired(
		PhoneVerificationRequiredException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(CertificateIssuanceNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleCertificateIssuanceNotFound(
		CertificateIssuanceNotFoundException e
	) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(InvalidIdCardImageException.class)
	public ResponseEntity<OnboardingErrorResponse> handleInvalidIdCardImage(
		InvalidIdCardImageException e
	) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(IdCardRecognitionFailedException.class)
	public ResponseEntity<OnboardingErrorResponse> handleIdCardRecognitionFailed(
		IdCardRecognitionFailedException e
	) {
		return ResponseEntity.unprocessableContent()
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(IdCardNameMismatchException.class)
	public ResponseEntity<OnboardingErrorResponse> handleIdCardNameMismatch(
		IdCardNameMismatchException e
	) {
		return ResponseEntity.unprocessableContent()
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(IdCardScanNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleIdCardScanNotFound(
		IdCardScanNotFoundException e
	) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(IdCardConfirmationConflictException.class)
	public ResponseEntity<OnboardingErrorResponse> handleIdCardConfirmationConflict(
		IdCardConfirmationConflictException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(InvalidFaceImageException.class)
	public ResponseEntity<OnboardingErrorResponse> handleInvalidFaceImage(
		InvalidFaceImageException e
	) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(FaceVerificationConflictException.class)
	public ResponseEntity<OnboardingErrorResponse> handleFaceVerificationConflict(
		FaceVerificationConflictException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(FaceQualityCheckFailedException.class)
	public ResponseEntity<OnboardingErrorResponse> handleFaceQualityCheckFailed(
		FaceQualityCheckFailedException e
	) {
		return ResponseEntity.unprocessableContent()
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(UnsupportedBankException.class)
	public ResponseEntity<OnboardingErrorResponse> handleUnsupportedBank(
		UnsupportedBankException e
	) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(AccountVerificationConflictException.class)
	public ResponseEntity<OnboardingErrorResponse> handleAccountVerificationConflict(
		AccountVerificationConflictException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(AccountVerificationTargetNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleAccountVerificationTargetNotFound(
		AccountVerificationTargetNotFoundException e
	) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(AccountPasswordVerificationLockedException.class)
	public ResponseEntity<AccountPasswordVerificationErrorResponse> handleAccountPasswordVerificationLocked(
		AccountPasswordVerificationLockedException e
	) {
		return ResponseEntity.status(HttpStatus.LOCKED)
			.body(new AccountPasswordVerificationErrorResponse(
				e.getCode(),
				e.getMessage(),
				e.getFailureCount(),
				0
			));
	}

	@ExceptionHandler(OneWonVerificationRequestLimitExceededException.class)
	public ResponseEntity<OnboardingErrorResponse> handleOneWonVerificationRequestLimitExceeded(
		OneWonVerificationRequestLimitExceededException e
	) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(OneWonVerificationNotFoundException.class)
	public ResponseEntity<OnboardingErrorResponse> handleOneWonVerificationNotFound(
		OneWonVerificationNotFoundException e
	) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(OneWonVerificationExpiredException.class)
	public ResponseEntity<OnboardingErrorResponse> handleOneWonVerificationExpired(
		OneWonVerificationExpiredException e
	) {
		return ResponseEntity.status(HttpStatus.GONE)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}

	@ExceptionHandler(OneWonVerificationAttemptLimitExceededException.class)
	public ResponseEntity<OneWonVerificationErrorResponse> handleOneWonVerificationAttemptLimitExceeded(
		OneWonVerificationAttemptLimitExceededException e
	) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.body(new OneWonVerificationErrorResponse(
				e.getCode(),
				e.getMessage(),
				e.getFailureCount(),
				0
			));
	}

	@ExceptionHandler({
		SimplePasswordMismatchException.class,
		WeakSimplePasswordException.class
	})
	public ResponseEntity<OnboardingErrorResponse> handleInvalidSimplePassword(
		RuntimeException e
	) {
		String code = e instanceof SimplePasswordMismatchException mismatch
			? mismatch.getCode()
			: ((WeakSimplePasswordException) e).getCode();
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(new OnboardingErrorResponse(code, e.getMessage()));
	}

	@ExceptionHandler(CertificateAlreadyIssuedException.class)
	public ResponseEntity<OnboardingErrorResponse> handleCertificateAlreadyIssued(
		CertificateAlreadyIssuedException e
	) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(new OnboardingErrorResponse(e.getCode(), e.getMessage()));
	}
}
