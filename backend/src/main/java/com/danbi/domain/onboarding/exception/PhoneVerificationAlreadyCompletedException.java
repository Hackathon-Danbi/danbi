package com.danbi.domain.onboarding.exception;

public class PhoneVerificationAlreadyCompletedException extends RuntimeException {
	private static final String ERROR_CODE = "PHONE_VERIFICATION_ALREADY_COMPLETED";

	public PhoneVerificationAlreadyCompletedException() {
		super("휴대폰 본인인증이 이미 완료되었습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
