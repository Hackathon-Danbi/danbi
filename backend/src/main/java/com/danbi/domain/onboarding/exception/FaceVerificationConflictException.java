package com.danbi.domain.onboarding.exception;

public class FaceVerificationConflictException extends RuntimeException {
	private static final String ERROR_CODE = "FACE_VERIFICATION_CONFLICT";

	public FaceVerificationConflictException(String message) {
		super(message);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
