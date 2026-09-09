package com.danbi.domain.onboarding.exception;

public class SimplePasswordMismatchException extends RuntimeException {
	private static final String ERROR_CODE = "SIMPLE_PASSWORD_MISMATCH";

	public SimplePasswordMismatchException() {
		super("간편비밀번호와 확인 값이 일치하지 않습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
