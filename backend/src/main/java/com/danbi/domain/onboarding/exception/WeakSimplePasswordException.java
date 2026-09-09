package com.danbi.domain.onboarding.exception;

public class WeakSimplePasswordException extends RuntimeException {
	private static final String ERROR_CODE = "WEAK_SIMPLE_PASSWORD";

	public WeakSimplePasswordException() {
		super("반복되거나 연속된 숫자는 간편비밀번호로 사용할 수 없습니다.");
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
