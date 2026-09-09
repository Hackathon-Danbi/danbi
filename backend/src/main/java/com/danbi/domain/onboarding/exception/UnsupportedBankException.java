package com.danbi.domain.onboarding.exception;

public class UnsupportedBankException extends RuntimeException {
	private static final String ERROR_CODE = "UNSUPPORTED_BANK";

	public UnsupportedBankException(String bankCode) {
		super("지원하지 않는 은행 코드입니다: " + bankCode);
	}

	public String getCode() {
		return ERROR_CODE;
	}
}
