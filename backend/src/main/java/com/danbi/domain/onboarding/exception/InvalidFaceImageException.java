package com.danbi.domain.onboarding.exception;

public class InvalidFaceImageException extends RuntimeException {
	private static final String ERROR_CODE = "INVALID_FACE_IMAGE";

	public InvalidFaceImageException(String message) {
		super(message);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
