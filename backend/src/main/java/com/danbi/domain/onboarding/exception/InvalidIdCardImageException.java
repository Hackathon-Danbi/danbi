package com.danbi.domain.onboarding.exception;

public class InvalidIdCardImageException extends RuntimeException {
	private static final String ERROR_CODE = "INVALID_ID_CARD_IMAGE";

	public InvalidIdCardImageException(String message) {
		super(message);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
