package com.danbi.domain.onboarding.exception;

public class PhoneVerificationCodeMismatchException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_CODE_MISMATCH";

	private final int remainingAttemptCount;

	public PhoneVerificationCodeMismatchException(int remainingAttemptCount) {
		super("인증번호가 일치하지 않습니다.");
		this.remainingAttemptCount = remainingAttemptCount;
	}

	public String getCode() {
		return ERROR_CODE;
	}

	public int getRemainingAttemptCount() {
		return remainingAttemptCount;
	}
}
