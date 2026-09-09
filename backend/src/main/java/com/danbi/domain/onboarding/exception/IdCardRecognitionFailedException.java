package com.danbi.domain.onboarding.exception;

public class IdCardRecognitionFailedException extends RuntimeException {
	private static final String ERROR_CODE = "ID_CARD_RECOGNITION_FAILED";

	public IdCardRecognitionFailedException() {
		super("신분증 정보를 인식할 수 없습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
