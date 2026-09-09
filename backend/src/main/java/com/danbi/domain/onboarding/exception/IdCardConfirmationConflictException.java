package com.danbi.domain.onboarding.exception;

public class IdCardConfirmationConflictException extends RuntimeException {
	private static final String ERROR_CODE = "ID_CARD_CONFIRMATION_CONFLICT";

	public IdCardConfirmationConflictException() {
		super("이미 결정된 신분증 확인 결과와 요청이 충돌합니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
