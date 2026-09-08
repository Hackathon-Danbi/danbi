package com.danbi.domain.onboarding.exception;

public class IdCardNameMismatchException extends RuntimeException {
	private static final String ERROR_CODE = "ID_CARD_NAME_MISMATCH";

	public IdCardNameMismatchException() {
		super("가입자 이름과 신분증 이름이 일치하지 않습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
